package com.daesinnam.pc;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.GestureDescription;
import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PixelFormat;
import android.hardware.display.DisplayManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.DisplayMetrics;
import android.util.Log;
import android.util.SparseArray;
import android.view.Display;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import android.view.accessibility.AccessibilityWindowInfo;

import java.util.List;

/**
 * 터치패드 (접근성 서비스).
 *
 * 폰 화면(PhoneActivity)에서 손가락을 움직이면 모니터에 그린 포인터가 따라 움직이고,
 * 누르기 · 길게 누르기(오른쪽 클릭) · 끌기 · 넘기기는 그 자리에 제스처로 전달합니다(안드로이드 11 이상: 화면 지정 제스처).
 * 폰 키보드로 친 글자는 모니터에서 지금 입력 중인 칸에 넣습니다.
 * 화면 내용을 저장하거나 밖으로 보내지 않습니다.
 */
public class PointerService extends AccessibilityService implements DisplayManager.DisplayListener {
    static final String TAG = "PcPointer";
    static volatile PointerService instance;

    private final Handler main = new Handler(Looper.getMainLooper());
    private Display display;
    private WindowManager wm;
    private Arrow arrow;
    private WindowManager.LayoutParams lp;
    private float x = -1, y = -1;
    private int w, h;
    private float scale = 1f;

    // 끌기: 손가락을 누른 채로 이어 가는 제스처
    private GestureDescription.StrokeDescription dragStroke;
    private float dragFromX, dragFromY;
    private boolean dragBusy, dragEnding;

    static boolean supported() { return Build.VERSION.SDK_INT >= 30; }

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        instance = this;
        getSystemService(DisplayManager.class).registerDisplayListener(this, main);
        Log.i(TAG, "POINTER connected sdk " + Build.VERSION.SDK_INT);
    }

    @Override
    public boolean onUnbind(android.content.Intent intent) {
        cleanup();
        return super.onUnbind(intent);
    }

    @Override
    public void onDestroy() {
        cleanup();
        super.onDestroy();
    }

    private void cleanup() {
        hide();
        try { getSystemService(DisplayManager.class).unregisterDisplayListener(this); } catch (Exception ignored) { }
        if (instance == this) instance = null;
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) { }

    @Override
    public void onInterrupt() { }

    // ---------- 포인터 그리기 ----------

    /** 모니터에 포인터를 보이기. 모니터가 없으면 false */
    boolean show() {
        Display d = Monitor.find(this);
        if (d == null) { hide(); return false; }
        if (arrow != null && display != null && display.getDisplayId() == d.getDisplayId()) return true;
        hide();
        display = d;
        DisplayMetrics m = new DisplayMetrics();
        d.getRealMetrics(m);
        w = m.widthPixels;
        h = m.heightPixels;
        scale = m.density;
        if (x < 0 || x > w || y < 0 || y > h) { x = w / 2f; y = h / 2f; }
        Context dc = createDisplayContext(d);   // 접근성 서비스는 다른 화면에도 덮개 창을 띄울 수 있음 (안드로이드 11+)
        wm = dc.getSystemService(WindowManager.class);
        arrow = new Arrow(dc, scale);
        lp = new WindowManager.LayoutParams(arrow.wPx, arrow.hPx,
                WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
                WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE | WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                        | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                PixelFormat.TRANSLUCENT);
        lp.gravity = Gravity.TOP | Gravity.LEFT;
        place();
        try {
            wm.addView(arrow, lp);
        } catch (Exception e) {
            Log.w(TAG, "POINTER overlay failed " + e);
            arrow = null;
            return false;
        }
        Log.i(TAG, "POINTER shown on display " + d.getDisplayId() + " " + w + "x" + h);
        return true;
    }

    void hide() {
        if (arrow != null && wm != null) try { wm.removeView(arrow); } catch (Exception ignored) { }
        arrow = null;
    }

    private void place() {
        if (lp == null) return;
        lp.x = Math.round(x - arrow.tipX);
        lp.y = Math.round(y - arrow.tipY);
        if (arrow.isAttachedToWindow()) try { wm.updateViewLayout(arrow, lp); } catch (Exception ignored) { }
    }

    /** 포인터 옮기기 (폰 화면 손가락 움직임 × 속도) */
    void move(float dx, float dy) {
        if (arrow == null && !show()) return;
        x = Math.max(0, Math.min(w - 1, x + dx));
        y = Math.max(0, Math.min(h - 1, y + dy));
        place();
        if (dragStroke != null) dragStep(false);
    }

    float[] position() { return new float[]{x, y, w, h, display == null ? -1 : display.getDisplayId()}; }

    // ---------- 제스처 ----------

    private boolean dispatch(GestureDescription.StrokeDescription s, String what, GestureResultCallback cb) {
        if (!supported() || display == null) return false;
        GestureDescription.Builder b = new GestureDescription.Builder().addStroke(s);
        if (Build.VERSION.SDK_INT >= 30) b.setDisplayId(display.getDisplayId());
        boolean ok = dispatchGesture(b.build(), cb != null ? cb : new GestureResultCallback() {
            @Override public void onCompleted(GestureDescription g) { Log.i(TAG, "GESTURE done " + what); }
            @Override public void onCancelled(GestureDescription g) { Log.i(TAG, "GESTURE cancelled " + what); }
        }, main);
        Log.i(TAG, "GESTURE " + what + " at " + Math.round(x) + "," + Math.round(y) + " display " + display.getDisplayId() + " sent " + ok);
        return ok;
    }

    private Path point() { Path p = new Path(); p.moveTo(x, y); return p; }

    boolean click() {
        if (arrow == null && !show()) return false;
        arrow.pulse();
        return dispatch(new GestureDescription.StrokeDescription(point(), 0, 40), "click", null);
    }

    /** 오른쪽 클릭 = 길게 누르기 (안드로이드 앱은 길게 누르기로 메뉴를 엶) */
    boolean longPress() {
        if (arrow == null && !show()) return false;
        arrow.pulse();
        return dispatch(new GestureDescription.StrokeDescription(point(), 0, 650), "long-press", null);
    }

    /** 두 손가락 넘기기 → 포인터 자리에서 같은 쪽으로 밀기 */
    boolean scroll(float dx, float dy) {
        if (arrow == null && !show()) return false;
        float tx = Math.max(1, Math.min(w - 2, x + dx)), ty = Math.max(1, Math.min(h - 2, y + dy));
        if (Math.abs(tx - x) + Math.abs(ty - y) < 4) return false;
        Path p = point();
        p.lineTo(tx, ty);
        return dispatch(new GestureDescription.StrokeDescription(p, 0, 180), "scroll", null);
    }

    /** 끌기 시작: 지금 자리를 누른 채로 */
    boolean dragStart() {
        if (arrow == null && !show()) return false;
        if (!supported()) return false;
        dragStroke = new GestureDescription.StrokeDescription(point(), 0, 60, true);
        dragFromX = x; dragFromY = y;
        dragBusy = true; dragEnding = false;
        arrow.setDragging(true);
        return dispatch(dragStroke, "drag-start", dragCallback);
    }

    void dragEnd() {
        if (dragStroke == null) return;
        dragEnding = true;
        if (!dragBusy) dragStep(true);
    }

    private final GestureResultCallback dragCallback = new GestureResultCallback() {
        @Override public void onCompleted(GestureDescription g) {
            dragBusy = false;
            if (dragStroke == null) { Log.i(TAG, "GESTURE done drag-end"); return; }
            if (dragEnding || Math.abs(x - dragFromX) + Math.abs(y - dragFromY) >= 1) dragStep(dragEnding);
        }
        @Override public void onCancelled(GestureDescription g) {
            Log.i(TAG, "GESTURE drag cancelled");
            dragStroke = null; dragBusy = false;
            if (arrow != null) arrow.setDragging(false);
        }
    };

    /** 앞 조각이 끝나면 지금 포인터 자리까지 이어 감 */
    private void dragStep(boolean last) {
        if (dragStroke == null || dragBusy) return;
        Path p = new Path();
        p.moveTo(dragFromX, dragFromY);
        if (Math.abs(x - dragFromX) + Math.abs(y - dragFromY) >= 1) p.lineTo(x, y);
        dragStroke = dragStroke.continueStroke(p, 0, 40, !last);
        dragFromX = x; dragFromY = y;
        dragBusy = true;
        dispatch(dragStroke, last ? "drag-end" : "drag-move", dragCallback);
        if (last) {
            dragStroke = null;
            if (arrow != null) arrow.setDragging(false);
        }
    }

    boolean back() { return performGlobalAction(GLOBAL_ACTION_BACK); }

    // ---------- 글자 입력 ----------

    /** 모니터에서 지금 입력 중인 칸 */
    private AccessibilityNodeInfo focusedInput() {
        if (display == null) display = Monitor.find(this);
        if (Build.VERSION.SDK_INT >= 30 && display != null) {
            SparseArray<List<AccessibilityWindowInfo>> all = getWindowsOnAllDisplays();
            List<AccessibilityWindowInfo> list = all.get(display.getDisplayId());
            if (list != null) for (AccessibilityWindowInfo win : list) {
                AccessibilityNodeInfo root = win.getRoot();
                if (root == null) continue;
                AccessibilityNodeInfo f = root.findFocus(AccessibilityNodeInfo.FOCUS_INPUT);
                if (f != null && f.isEditable()) return f;
            }
        }
        AccessibilityNodeInfo f = findFocus(AccessibilityNodeInfo.FOCUS_INPUT);
        return f != null && f.isEditable() ? f : null;
    }

    private static String currentText(AccessibilityNodeInfo n) {
        if (Build.VERSION.SDK_INT >= 26 && n.isShowingHintText()) return "";
        return n.getText() == null ? "" : n.getText().toString();
    }

    private static boolean setText(AccessibilityNodeInfo n, String s) {
        Bundle a = new Bundle();
        a.putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, s);
        boolean ok = n.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, a);
        Bundle sel = new Bundle();
        sel.putInt(AccessibilityNodeInfo.ACTION_ARGUMENT_SELECTION_START_INT, s.length());
        sel.putInt(AccessibilityNodeInfo.ACTION_ARGUMENT_SELECTION_END_INT, s.length());
        n.performAction(AccessibilityNodeInfo.ACTION_SET_SELECTION, sel);
        return ok;
    }

    /** 글자 넣기. kind: text(이어 붙이기) / backspace / enter. 입력 칸이 없으면 "none" */
    String type(String kind, String text) {
        AccessibilityNodeInfo n = focusedInput();
        if (n == null) { Log.i(TAG, "TYPE none"); return "none"; }
        n.refresh();   // 접근성 기억(캐시)에 남은 예전 글자가 아니라 지금 글자를 읽음
        String cur = currentText(n);
        boolean ok;
        switch (kind) {
            case "backspace":
                ok = cur.isEmpty() || setText(n, cur.substring(0, cur.offsetByCodePoints(cur.length(), -1)));
                break;
            case "enter":
                ok = Build.VERSION.SDK_INT >= 30
                        && n.performAction(AccessibilityNodeInfo.AccessibilityAction.ACTION_IME_ENTER.getId());
                if (!ok) ok = setText(n, cur + "\n");
                break;
            default:
                ok = setText(n, cur + text);
        }
        Log.i(TAG, "TYPE " + kind + " " + ok + " now " + (n.refresh() ? currentText(n) : "?"));
        return ok ? "ok" : "fail";
    }

    // ---------- 화면 연결 ----------

    @Override
    public void onDisplayAdded(int displayId) { }

    @Override
    public void onDisplayRemoved(int displayId) {
        if (display != null && display.getDisplayId() == displayId) { hide(); display = null; }
    }

    @Override
    public void onDisplayChanged(int displayId) {
        if (arrow != null && display != null && display.getDisplayId() == displayId) { hide(); show(); }
    }

    /** 화살표 모양 포인터 (흰 바탕 · 검은 테두리, 누르면 잠깐 커짐, 끄는 중이면 파랑) */
    static final class Arrow extends View {
        final int wPx, hPx;
        final float tipX, tipY;
        private final Path path = new Path();
        private final Paint fill = new Paint(Paint.ANTI_ALIAS_FLAG), line = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final float d;

        Arrow(Context c, float density) {
            super(c);
            d = density;
            wPx = Math.round(22 * d);
            hPx = Math.round(30 * d);
            tipX = 2 * d;
            tipY = 2 * d;
            float s = d;
            path.moveTo(2 * s, 2 * s);
            path.lineTo(2 * s, 24 * s);
            path.lineTo(8 * s, 18.5f * s);
            path.lineTo(12 * s, 27.5f * s);
            path.lineTo(15.5f * s, 26 * s);
            path.lineTo(11.6f * s, 17.2f * s);
            path.lineTo(19.5f * s, 17.2f * s);
            path.close();
            fill.setColor(0xFFFFFFFF);
            line.setColor(0xFF111111);
            line.setStyle(Paint.Style.STROKE);
            line.setStrokeWidth(1.4f * s);
            line.setStrokeJoin(Paint.Join.ROUND);
            setPivotX(tipX);
            setPivotY(tipY);
        }

        void setDragging(boolean on) { fill.setColor(on ? 0xFF7AB8FF : 0xFFFFFFFF); invalidate(); }

        void pulse() {
            animate().cancel();
            setScaleX(0.8f); setScaleY(0.8f);
            animate().scaleX(1f).scaleY(1f).setDuration(140).start();
        }

        @Override
        protected void onDraw(Canvas c) {
            c.drawPath(path, fill);
            c.drawPath(path, line);
        }
    }
}
