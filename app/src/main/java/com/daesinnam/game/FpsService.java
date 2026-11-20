package com.daesinnam.game;

import android.annotation.SuppressLint;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.ServiceInfo;
import android.graphics.PixelFormat;
import android.graphics.drawable.GradientDrawable;
import android.os.BatteryManager;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.os.SystemClock;
import android.provider.Settings;
import android.util.Log;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.WindowManager;
import android.widget.TextView;


/**
 * 덜누름 FPS 표시: 게임 위에 작은 창으로 FPS · 기기 온도 · 배터리를 띄웁니다.
 *
 * FPS는 Shizuku(셸 권한)로 앞에 뜬 앱의 화면 층이 최근 1초 동안 화면에 내보낸 프레임 수를
 * 1초마다 셉니다 (dumpsys SurfaceFlinger --latency, 계산은 FpsMeter).
 * 창은 끌어서 옮기고(자리 기억), 길게 누르면 닫힙니다. 덜누름 게임으로 돌아오면 저절로 닫힙니다.
 */
public class FpsService extends Service {
    static final String TAG = "GameFps";
    static final String ACTION_START = "com.daesinnam.game.FPS_START";
    static final String ACTION_STOP = "com.daesinnam.game.FPS_STOP";
    private static final String CHANNEL = "fps";
    private static final int NOTI_ID = 8;

    static volatile boolean running;
    static volatile int lastFps = -1;

    private WindowManager wm;
    private TextView view;
    private WindowManager.LayoutParams lp;
    private SharedPreferences prefs;
    private final Handler main = new Handler(Looper.getMainLooper());
    private Thread reader;
    private volatile boolean stopping;
    private int logged;

    static void stop(Context c) {
        if (running) c.startService(new Intent(c, FpsService.class).setAction(ACTION_STOP));
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent == null ? null : intent.getAction();
        if (ACTION_STOP.equals(action)) { stopSelf(); return START_NOT_STICKY; }
        if (running) return START_NOT_STICKY;
        try {
            if (android.os.Build.VERSION.SDK_INT >= 34)
                startForeground(NOTI_ID, notification(), ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
            else startForeground(NOTI_ID, notification());
        } catch (Exception e) {
            Log.w(TAG, "FPS-FAIL foreground " + e);
            stopSelf();
            return START_NOT_STICKY;
        }
        if (!Settings.canDrawOverlays(this)) {
            Log.w(TAG, "FPS-FAIL overlay permission");
            stopSelf();
            return START_NOT_STICKY;
        }
        running = true;
        stopping = false;
        prefs = getSharedPreferences("game", MODE_PRIVATE);
        showOverlay();
        startReading();
        main.post(tick);
        Log.i(TAG, "FPS-OVERLAY shown shizuku " + Shizu.granted());
        return START_NOT_STICKY;
    }

    @Override
    public void onDestroy() {
        stopping = true;
        running = false;
        lastFps = -1;
        main.removeCallbacksAndMessages(null);
        if (reader != null) reader.interrupt();
        if (view != null) try { wm.removeView(view); } catch (Exception ignored) { }
        view = null;
        Log.i(TAG, "FPS-OVERLAY closed");
        super.onDestroy();
    }

    private Notification notification() {
        NotificationManager nm = getSystemService(NotificationManager.class);
        if (nm.getNotificationChannel(CHANNEL) == null)
            nm.createNotificationChannel(new NotificationChannel(CHANNEL, "FPS 표시", NotificationManager.IMPORTANCE_MIN));
        PendingIntent stop = PendingIntent.getService(this, 3,
            new Intent(this, FpsService.class).setAction(ACTION_STOP), PendingIntent.FLAG_IMMUTABLE);
        PendingIntent open = PendingIntent.getActivity(this, 4, new Intent(this, MainActivity.class), PendingIntent.FLAG_IMMUTABLE);
        return new Notification.Builder(this, CHANNEL)
            .setSmallIcon(R.drawable.ic_stat_fps)
            .setContentTitle("FPS 표시 중")
            .setContentText("표시 창을 길게 누르거나 'FPS 표시 끄기'로 닫아요")
            .setContentIntent(open)
            .setOngoing(true)
            .addAction(new Notification.Action.Builder(null, "FPS 표시 끄기", stop).build())
            .build();
    }

    // ---------- 표시 창 ----------

    private int dp(float v) { return Math.round(TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, getResources().getDisplayMetrics())); }

    @SuppressLint("ClickableViewAccessibility")
    private void showOverlay() {
        wm = getSystemService(WindowManager.class);
        view = new TextView(this);
        view.setTextColor(0xFFFFFFFF);
        view.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12);
        view.setTypeface(android.graphics.Typeface.MONOSPACE, android.graphics.Typeface.BOLD);
        view.setPadding(dp(9), dp(4), dp(9), dp(4));
        GradientDrawable bg = new GradientDrawable();
        bg.setColor(0xB0101426);
        bg.setCornerRadius(dp(12));
        bg.setStroke(dp(1), 0x6670E0B0);
        view.setBackground(bg);
        view.setText("FPS --");
        lp = new WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT, WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN
                | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT);
        lp.gravity = Gravity.TOP | Gravity.END;
        if (Compat.SDK >= 28) lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        lp.x = prefs.getInt("fpsX", dp(16));
        lp.y = prefs.getInt("fpsY", dp(10));
        final float[] down = new float[4];
        final boolean[] moved = {false};
        final Runnable longPress = () -> { if (!moved[0]) { Log.i(TAG, "FPS-OVERLAY long-press close"); stopSelf(); } };
        view.setOnTouchListener((v, e) -> {
            switch (e.getActionMasked()) {
                case MotionEvent.ACTION_DOWN:
                    down[0] = e.getRawX(); down[1] = e.getRawY(); down[2] = lp.x; down[3] = lp.y;
                    moved[0] = false;
                    main.postDelayed(longPress, 700);
                    return true;
                case MotionEvent.ACTION_MOVE: {
                    float dx = e.getRawX() - down[0], dy = e.getRawY() - down[1];
                    if (Math.abs(dx) + Math.abs(dy) > dp(6)) { moved[0] = true; main.removeCallbacks(longPress); }
                    if (moved[0]) {
                        lp.x = Math.max(0, Math.round(down[2] - dx));   // 오른쪽 기준이라 x는 반대로
                        lp.y = Math.max(0, Math.round(down[3] + dy));
                        try { wm.updateViewLayout(view, lp); } catch (Exception ignored) { }
                    }
                    return true;
                }
                case MotionEvent.ACTION_UP:
                case MotionEvent.ACTION_CANCEL:
                    main.removeCallbacks(longPress);
                    if (moved[0]) prefs.edit().putInt("fpsX", lp.x).putInt("fpsY", lp.y).apply();
                    return true;
                default:
                    return false;
            }
        });
        wm.addView(view, lp);
    }

    /** 1초마다 화면 글자 갱신 (FPS는 읽는 스레드가 lastFps에 넣음) */
    private final Runnable tick = new Runnable() {
        @Override
        public void run() {
            if (view == null) return;
            StringBuilder s = new StringBuilder();
            s.append("FPS ").append(lastFps >= 0 ? String.valueOf(lastFps) : "--");
            Intent bat = registerReceiver(null, new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
            if (bat != null) {
                int t = bat.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, 0);
                int level = bat.getIntExtra(BatteryManager.EXTRA_LEVEL, -1), scale = bat.getIntExtra(BatteryManager.EXTRA_SCALE, 100);
                if (t > 0) s.append("  ").append(t / 10).append('.').append(t % 10).append("°C");
                if (level >= 0) s.append("  ").append(level * 100 / Math.max(scale, 1)).append('%');
            }
            int thermal = Compat.thermal(getSystemService(PowerManager.class));
            view.setText(s);
            // 기기가 뜨거우면 테두리를 주황 → 빨강으로
            GradientDrawable bg = (GradientDrawable) view.getBackground();
            bg.setStroke(dp(1), thermal >= PowerManager.THERMAL_STATUS_SEVERE ? 0xFFFF5A5A
                : thermal >= PowerManager.THERMAL_STATUS_MODERATE ? 0xFFFFB347 : 0x6670E0B0);
            main.postDelayed(this, 1000);
        }
    };

    // ---------- FPS 읽기 (Shizuku) ----------

    private void startReading() {
        if (!Shizu.granted()) { Log.i(TAG, "FPS source none (Shizuku 연결 안 됨)"); return; }
        reader = new Thread(() -> {
            FpsMeter meter = new FpsMeter();
            String fgPkg = null;
            java.util.List<String> layers = new java.util.ArrayList<>();
            long resolvedAt = 0;
            while (!stopping) {
                long now = SystemClock.elapsedRealtime();
                try {
                    // 5초마다 앞에 뜬 앱과 그 화면 층을 다시 찾음 (게임을 바꿔도 따라감)
                    if (now - resolvedAt > 5000 || layers.isEmpty()) {
                        resolvedAt = now;
                        String pkg = FpsMeter.foregroundPackage(Shizu.run(
                            "dumpsys activity activities | grep -m3 -E 'topResumedActivity|mResumedActivity'", 3000));
                        if (pkg != null) {
                            if (!pkg.equals(fgPkg)) meter = new FpsMeter();
                            fgPkg = pkg;
                            layers = FpsMeter.layersOf(Shizu.run("dumpsys SurfaceFlinger --list", 3000), pkg);
                            if (logged < 8) { logged++; Log.i(TAG, "FPS layers " + pkg + " " + layers); }
                        }
                    }
                    if (!layers.isEmpty()) {
                        String out = Shizu.run(FpsMeter.latencyCommand(layers), 3000);
                        int fps = meter.fps(out);
                        lastFps = fps;
                        if (fps < 0) layers.clear();   // 층이 바뀌었으면 다시 찾기
                        if (logged < 12) { logged++; Log.i(TAG, "FPS " + fps); }
                    }
                } catch (Throwable t) {
                    Log.w(TAG, "FPS reader " + t);
                }
                long spent = SystemClock.elapsedRealtime() - now;
                try { Thread.sleep(Math.max(200, 1000 - spent)); } catch (InterruptedException e) { break; }
            }
        }, "fps-reader");
        reader.setDaemon(true);
        reader.start();
    }
}
