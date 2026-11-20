package com.daesinnam.tv;

import android.app.ActivityOptions;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PixelFormat;
import android.graphics.Rect;
import android.hardware.display.DisplayManager;
import android.os.IBinder;
import android.provider.Settings;
import android.view.Display;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;

/**
 * 리모컨의 "홈" 키 같은 떠 있는 단추.
 * 덜누름 TV에서 앱을 열면 그 화면 가장자리에 작게 떠 있다가, 누르면 덜누름 TV로 돌아옵니다. 끌어서 옮길 수 있습니다.
 * "다른 앱 위에 표시" 권한이 있을 때만 뜹니다. 덜누름 TV가 다시 보이면 사라집니다.
 */
public class HomeButton extends Service {
    static final String EXTRA_DISPLAY = "display";
    private WindowManager wm;
    private View bubble;
    private WindowManager.LayoutParams lp;
    private int displayId;

    static boolean allowed(Context c) { return Settings.canDrawOverlays(c); }

    static void show(Context c, int display) {
        if (!allowed(c)) return;
        c.startService(new Intent(c, HomeButton.class).putExtra(EXTRA_DISPLAY, display));
    }

    static void hide(Context c) { c.stopService(new Intent(c, HomeButton.class)); }

    @Override
    public IBinder onBind(Intent i) { return null; }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        int d = intent == null ? Display.DEFAULT_DISPLAY : intent.getIntExtra(EXTRA_DISPLAY, Display.DEFAULT_DISPLAY);
        if (bubble != null && d == displayId) return START_NOT_STICKY;
        removeBubble();
        displayId = d;
        try { addBubble(); } catch (RuntimeException e) { stopSelf(); }
        return START_NOT_STICKY;
    }

    private void addBubble() {
        Display display = getSystemService(DisplayManager.class).getDisplay(displayId);
        if (display == null) display = getSystemService(DisplayManager.class).getDisplay(Display.DEFAULT_DISPLAY);
        Context dc = createDisplayContext(display);
        Context wc = Compat.SDK >= 30 ? dc.createWindowContext(WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY, null) : dc;
        wm = wc.getSystemService(WindowManager.class);
        float dp = wc.getResources().getDisplayMetrics().density;
        int size = Math.round(56 * dp);
        bubble = new Bubble(wc);
        lp = new WindowManager.LayoutParams(size, size, WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS, PixelFormat.TRANSLUCENT);
        lp.gravity = Gravity.TOP | Gravity.START;
        Rect b = Compat.maxBounds(wm);
        android.content.SharedPreferences sp = getSharedPreferences("tv", MODE_PRIVATE);
        lp.x = sp.getInt("homeX", b.width() - size - Math.round(20 * dp));
        lp.y = sp.getInt("homeY", Math.round(b.height() * 0.42f));
        lp.x = Math.max(0, Math.min(lp.x, b.width() - size));
        lp.y = Math.max(0, Math.min(lp.y, b.height() - size));
        wm.addView(bubble, lp);
    }

    private void goHome() {
        Intent i = new Intent(this, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
        try {
            ActivityOptions o = ActivityOptions.makeBasic();
            o.setLaunchDisplayId(displayId);
            startActivity(i, o.toBundle());
        } catch (RuntimeException e) {
            startActivity(i);
        }
        stopSelf();
    }

    private void removeBubble() {
        if (bubble != null && wm != null) try { wm.removeView(bubble); } catch (RuntimeException ignored) { }
        bubble = null;
    }

    @Override
    public void onDestroy() {
        removeBubble();
        super.onDestroy();
    }

    /** 둥근 반투명 단추 + 집 모양. 누르면 홈, 끌면 옮김(가장자리에 붙음) */
    private class Bubble extends View {
        private final Paint bg = new Paint(Paint.ANTI_ALIAS_FLAG), ring = new Paint(Paint.ANTI_ALIAS_FLAG), ic = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Path house = new Path();
        private float downX, downY; private int startX, startY; private boolean moved;

        Bubble(Context c) {
            super(c);
            bg.setColor(Color.argb(200, 20, 20, 24));
            ring.setStyle(Paint.Style.STROKE); ring.setColor(Color.argb(90, 255, 255, 255));
            ic.setStyle(Paint.Style.STROKE); ic.setColor(Color.WHITE); ic.setStrokeCap(Paint.Cap.ROUND); ic.setStrokeJoin(Paint.Join.ROUND);
            setContentDescription("덜누름 TV 홈으로");
            setElevation(8);
        }

        @Override
        protected void onDraw(Canvas c) {
            float w = getWidth(), r = w / 2f, s = w / 56f;
            c.drawCircle(r, r, r - s, bg);
            ring.setStrokeWidth(1.5f * s); c.drawCircle(r, r, r - 1.5f * s, ring);
            ic.setStrokeWidth(2.6f * s);
            house.reset();
            house.moveTo(r - 10 * s, r - 1 * s); house.lineTo(r, r - 10 * s); house.lineTo(r + 10 * s, r - 1 * s);
            house.moveTo(r - 7 * s, r - 3 * s); house.lineTo(r - 7 * s, r + 9 * s); house.lineTo(r + 7 * s, r + 9 * s); house.lineTo(r + 7 * s, r - 3 * s);
            c.drawPath(house, ic);
        }

        @Override
        public boolean onTouchEvent(MotionEvent e) {
            switch (e.getActionMasked()) {
                case MotionEvent.ACTION_DOWN:
                    downX = e.getRawX(); downY = e.getRawY(); startX = lp.x; startY = lp.y; moved = false; setAlpha(0.8f); return true;
                case MotionEvent.ACTION_MOVE:
                    float dx = e.getRawX() - downX, dy = e.getRawY() - downY;
                    if (Math.abs(dx) + Math.abs(dy) > 12 * getResources().getDisplayMetrics().density) moved = true;
                    if (moved) { lp.x = startX + Math.round(dx); lp.y = startY + Math.round(dy); try { wm.updateViewLayout(this, lp); } catch (RuntimeException ignored) { } }
                    return true;
                case MotionEvent.ACTION_UP:
                    setAlpha(1f);
                    if (!moved) { performClick(); goHome(); return true; }
                    Rect b = Compat.maxBounds(wm); // 가까운 왼쪽 · 오른쪽 가장자리에 붙이기
                    int m = Math.round(12 * getResources().getDisplayMetrics().density);
                    lp.x = lp.x + getWidth() / 2 < b.width() / 2 ? m : b.width() - getWidth() - m;
                    lp.y = Math.max(m, Math.min(lp.y, b.height() - getHeight() - m));
                    try { wm.updateViewLayout(this, lp); } catch (RuntimeException ignored) { }
                    getSharedPreferences("tv", MODE_PRIVATE).edit().putInt("homeX", lp.x).putInt("homeY", lp.y).apply();
                    return true;
                case MotionEvent.ACTION_CANCEL:
                    setAlpha(1f); return true;
            }
            return super.onTouchEvent(e);
        }

        @Override
        public boolean performClick() { return super.performClick(); }
    }
}
