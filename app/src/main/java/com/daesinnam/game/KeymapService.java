package com.daesinnam.game;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.GestureDescription;
import android.annotation.SuppressLint;
import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.Path;
import android.graphics.PixelFormat;
import android.graphics.Rect;
import android.graphics.drawable.GradientDrawable;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.view.accessibility.AccessibilityEvent;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

import org.json.JSONObject;

import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

/**
 * 키 매핑: 게임패드·키보드 버튼 → 게임 화면의 정해 둔 자리 누르기.
 *
 * - 게임별로 켜 둔 경우에만 동작 (prefs "keymap": on.&lt;패키지&gt;, map.&lt;패키지&gt; = {"키코드": {x, y, mode}}).
 *   x, y는 화면 크기에 대한 비율(0~1)이라 펼침·접힘에도 같은 자리.
 * - mode "tap": 누르면 한 번 톡 / "hold": 누르고 있는 동안 계속 누름.
 * - 게임 화면 왼쪽 위의 작은 🎮 단추 → 편집 화면: 빈 곳을 눌러 자리 → 패드 버튼을 누르면 연결.
 *   표시를 끌면 옮기기, 짧게 누르면 톡/꾹 바꾸기, 길게 누르면 지우기.
 * 한계(다음 단계): 아날로그 스틱, 두 버튼 동시에 누르기(안드로이드 접근성은 한 번에 한 동작).
 */
public class KeymapService extends AccessibilityService {
    static final String TAG = "GameKeymap";
    static volatile KeymapService instance;

    private SharedPreferences prefs;
    private WindowManager wm;
    private final Handler main = new Handler(Looper.getMainLooper());
    private String fg = "";
    private View fab;
    private FrameLayout editor;
    private JSONObject editMap;
    private TextView pending;      // 편집 중 버튼을 기다리는 표시
    private final Map<Integer, Hold> holds = new HashMap<>();

    static SharedPreferences store(Context c) { return c.getSharedPreferences("keymap", MODE_PRIVATE); }

    static JSONObject mapOf(SharedPreferences p, String pkg) {
        try { return new JSONObject(p.getString("map." + pkg, "{}")); } catch (Exception e) { return new JSONObject(); }
    }

    @Override
    protected void onServiceConnected() {
        instance = this;
        prefs = store(this);
        wm = getSystemService(WindowManager.class);
        Log.i(TAG, "KEYMAP-CONNECTED");
    }

    @Override
    public boolean onUnbind(android.content.Intent intent) {
        instance = null;
        removeFab();
        closeEditor(false);
        return super.onUnbind(intent);
    }

    @Override
    public void onInterrupt() { }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent e) {
        if (e.getEventType() != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED || e.getPackageName() == null) return;
        String pkg = e.getPackageName().toString();
        // 시스템 화면·키보드·우리 앱은 앞에 뜬 게임으로 치지 않음
        if (pkg.equals("com.android.systemui") || pkg.contains("inputmethod") || pkg.contains("honeyboard")) return;
        if (pkg.equals(getPackageName())) { fg = pkg; updateFab(); return; }
        if (!pkg.equals(fg)) {
            fg = pkg;
            releaseAll();
            updateFab();
            Log.i(TAG, "KEYMAP-FG " + pkg + (enabled(pkg) ? " on" : ""));
        }
    }

    private boolean enabled(String pkg) { return prefs != null && prefs.getBoolean("on." + pkg, false); }

    // ---------- 버튼 → 화면 누르기 ----------

    @Override
    protected boolean onKeyEvent(KeyEvent e) {
        int code = e.getKeyCode();
        if (code == KeyEvent.KEYCODE_HOME || code == KeyEvent.KEYCODE_APP_SWITCH || code == KeyEvent.KEYCODE_POWER
            || code == KeyEvent.KEYCODE_VOLUME_UP || code == KeyEvent.KEYCODE_VOLUME_DOWN) return false;
        if (editor != null) {
            if (pending != null && e.getAction() == KeyEvent.ACTION_DOWN && code != KeyEvent.KEYCODE_BACK) {
                main.post(() -> bindPending(code));
                return true;
            }
            return code != KeyEvent.KEYCODE_BACK;
        }
        if (!enabled(fg)) return false;
        JSONObject m = mapOf(prefs, fg).optJSONObject(String.valueOf(code));
        if (m == null) return false;
        float[] xy = toScreen(m);
        if (e.getAction() == KeyEvent.ACTION_DOWN && e.getRepeatCount() == 0) {
            if ("hold".equals(m.optString("mode"))) startHold(code, xy[0], xy[1]);
            else tap(xy[0], xy[1]);
            Log.i(TAG, "KEYMAP-TAP " + fg + " " + code + " " + Math.round(xy[0]) + "," + Math.round(xy[1]));
        } else if (e.getAction() == KeyEvent.ACTION_UP) {
            endHold(code);
        }
        return true;
    }

    private float[] toScreen(JSONObject m) {
        Rect b = Compat.maxBounds(wm);
        return new float[]{(float) (m.optDouble("x", .5) * b.width()), (float) (m.optDouble("y", .5) * b.height())};
    }

    private static Path point(float x, float y) {
        Path p = new Path();
        p.moveTo(x, y);
        return p;
    }

    private void tap(float x, float y) {
        GestureDescription g = new GestureDescription.Builder()
            .addStroke(new GestureDescription.StrokeDescription(point(x, y), 0, 40)).build();
        dispatchGesture(g, null, null);
    }

    /** 누르고 있기: 짧은 획을 이어 붙이다가, 버튼을 떼면 마지막 획으로 끝냄 */
    private static final class Hold {
        GestureDescription.StrokeDescription stroke;
        float x, y;
        boolean released;
    }

    private void startHold(int code, float x, float y) {
        Hold h = new Hold();
        h.x = x; h.y = y;
        h.stroke = new GestureDescription.StrokeDescription(point(x, y), 0, 150, true);
        holds.put(code, h);
        sendHold(code, h);
    }

    private void sendHold(int code, Hold h) {
        GestureDescription g = new GestureDescription.Builder().addStroke(h.stroke).build();
        dispatchGesture(g, new GestureResultCallback() {
            @Override
            public void onCompleted(GestureDescription d) {
                if (holds.get(code) != h) return;
                boolean more = !h.released;
                h.stroke = h.stroke.continueStroke(point(h.x, h.y), 0, more ? 150 : 10, more);
                if (more) sendHold(code, h);
                else { holds.remove(code); dispatchGesture(new GestureDescription.Builder().addStroke(h.stroke).build(), null, null); }
            }

            @Override
            public void onCancelled(GestureDescription d) { holds.remove(code); }
        }, main);
    }

    private void endHold(int code) {
        Hold h = holds.get(code);
        if (h != null) h.released = true;
    }

    private void releaseAll() {
        for (Hold h : holds.values()) h.released = true;
    }

    // ---------- 게임 위 🎮 단추 ----------

    private int dp(float v) { return Math.round(TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, getResources().getDisplayMetrics())); }

    private WindowManager.LayoutParams overlayParams(int w, int h, boolean focusable) {
        WindowManager.LayoutParams lp = new WindowManager.LayoutParams(w, h,
            WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
            (focusable ? 0 : WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE) | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT);
        lp.gravity = Gravity.TOP | Gravity.START;
        return lp;
    }

    private void updateFab() {
        main.post(() -> {
            boolean show = editor == null && !fg.equals(getPackageName()) && enabled(fg);
            if (show && fab == null) {
                TextView t = new TextView(this);
                t.setText("🎮");
                t.setTextSize(18);
                t.setGravity(Gravity.CENTER);
                GradientDrawable bg = new GradientDrawable();
                bg.setShape(GradientDrawable.OVAL);
                bg.setColor(0xCC0B1017);
                bg.setStroke(dp(2), 0xFF1A9FFF);
                t.setBackground(bg);
                t.setOnClickListener(v -> openEditor());
                WindowManager.LayoutParams lp = overlayParams(dp(44), dp(44), false);
                lp.x = dp(8);
                lp.y = dp(120);
                try { wm.addView(t, lp); fab = t; } catch (Exception ex) { Log.w(TAG, "fab " + ex); }
            } else if (!show) {
                removeFab();
            }
        });
    }

    private void removeFab() {
        if (fab != null) { try { wm.removeView(fab); } catch (Exception ignored) { } fab = null; }
    }

    // ---------- 편집 화면 ----------

    static String keyName(int code) {
        switch (code) {
            case KeyEvent.KEYCODE_DPAD_UP: return "↑";
            case KeyEvent.KEYCODE_DPAD_DOWN: return "↓";
            case KeyEvent.KEYCODE_DPAD_LEFT: return "←";
            case KeyEvent.KEYCODE_DPAD_RIGHT: return "→";
            case KeyEvent.KEYCODE_SPACE: return "␣";
            default:
                String s = KeyEvent.keyCodeToString(code).replace("KEYCODE_", "").replace("BUTTON_", "");
                return s.length() > 6 ? s.substring(0, 6) : s;
        }
    }

    @SuppressLint("ClickableViewAccessibility")
    void openEditor() {
        if (editor != null) return;
        removeFab();
        editMap = mapOf(prefs, fg);
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(0x660B1017);

        LinearLayout bar = new LinearLayout(this);
        bar.setOrientation(LinearLayout.HORIZONTAL);
        bar.setGravity(Gravity.CENTER_VERTICAL);
        bar.setPadding(dp(12), dp(8), dp(12), dp(8));
        bar.setBackgroundColor(0xEE121A24);
        TextView help = new TextView(this);
        help.setTextColor(Color.WHITE);
        help.setTextSize(13);
        help.setText("빈 곳을 눌러 자리 → 패드 버튼을 누르면 연결 · 끌어서 옮기기 · 짧게 누르면 톡/꾹 · 길게 누르면 지우기");
        bar.addView(help, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1));
        bar.addView(barButton("모두 지우기", v -> { editMap = new JSONObject(); redrawMarkers(root); }));
        bar.addView(barButton("취소", v -> closeEditor(false)));
        bar.addView(barButton("저장", v -> closeEditor(true)));
        root.addView(bar, new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.WRAP_CONTENT, Gravity.BOTTOM));

        root.setOnTouchListener((v, ev) -> {
            if (ev.getAction() == MotionEvent.ACTION_UP) {
                if (pending != null) root.removeView(pending);
                pending = marker("?", ev.getX(), ev.getY(), false);
                Rect sb = Compat.maxBounds(wm);
                pending.setTag(new float[]{ev.getRawX() / sb.width(), ev.getRawY() / sb.height()});
                root.addView(pending);
            }
            return true;
        });
        editor = root;
        try {
            wm.addView(root, overlayParams(WindowManager.LayoutParams.MATCH_PARENT, WindowManager.LayoutParams.MATCH_PARENT, false));
        } catch (Exception ex) {
            Log.w(TAG, "editor " + ex);
            editor = null;
            return;
        }
        root.post(() -> redrawMarkers(root));
        Log.i(TAG, "KEYMAP-EDIT " + fg);
    }

    private Button barButton(String text, View.OnClickListener l) {
        Button b = new Button(this);
        b.setText(text);
        b.setAllCaps(false);
        b.setOnClickListener(l);
        return b;
    }

    private TextView marker(String label, float cx, float cy, boolean hold) {
        TextView t = new TextView(this);
        t.setText(label);
        t.setTextColor(Color.WHITE);
        t.setTextSize(14);
        t.setGravity(Gravity.CENTER);
        GradientDrawable bg = new GradientDrawable();
        bg.setShape(GradientDrawable.OVAL);
        bg.setColor(hold ? 0xCCB8860B : 0xCC1A9FFF);
        bg.setStroke(dp(2), Color.WHITE);
        t.setBackground(bg);
        int s = dp(52);
        FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(s, s);
        lp.leftMargin = Math.round(cx - s / 2f);
        lp.topMargin = Math.round(cy - s / 2f);
        t.setLayoutParams(lp);
        return t;
    }

    private void bindPending(int code) {
        if (editor == null || pending == null) return;
        float[] r = (float[]) pending.getTag();
        try {
            JSONObject o = new JSONObject();
            o.put("x", r[0]);
            o.put("y", r[1]);
            o.put("mode", "tap");
            editMap.put(String.valueOf(code), o);
        } catch (Exception ignored) { }
        editor.removeView(pending);
        pending = null;
        redrawMarkers(editor);
    }

    @SuppressLint("ClickableViewAccessibility")
    private void redrawMarkers(FrameLayout root) {
        for (int i = root.getChildCount() - 1; i >= 0; i--) {
            View c = root.getChildAt(i);
            if ("marker".equals(c.getContentDescription())) root.removeViewAt(i);
        }
        Rect sb = Compat.maxBounds(wm);
        int[] loc = new int[2];
        root.getLocationOnScreen(loc);
        int w = sb.width(), h = sb.height();
        Iterator<String> it = editMap.keys();
        while (it.hasNext()) {
            String key = it.next();
            JSONObject o = editMap.optJSONObject(key);
            if (o == null) continue;
            boolean hold = "hold".equals(o.optString("mode"));
            TextView m = marker(keyName(Integer.parseInt(key)) + (hold ? "\n꾹" : ""), (float) o.optDouble("x") * w - loc[0], (float) o.optDouble("y") * h - loc[1], hold);
            m.setContentDescription("marker");
            final float[] down = new float[4];
            final boolean[] moved = {false};
            final Runnable longPress = () -> { editMap.remove(key); redrawMarkers(root); };
            m.setOnTouchListener((v, ev) -> {
                FrameLayout.LayoutParams lp = (FrameLayout.LayoutParams) v.getLayoutParams();
                switch (ev.getActionMasked()) {
                    case MotionEvent.ACTION_DOWN:
                        down[0] = ev.getRawX(); down[1] = ev.getRawY(); down[2] = lp.leftMargin; down[3] = lp.topMargin;
                        moved[0] = false;
                        main.postDelayed(longPress, 600);
                        return true;
                    case MotionEvent.ACTION_MOVE:
                        float dx = ev.getRawX() - down[0], dy = ev.getRawY() - down[1];
                        if (Math.abs(dx) + Math.abs(dy) > dp(8)) { moved[0] = true; main.removeCallbacks(longPress); }
                        if (moved[0]) { lp.leftMargin = Math.round(down[2] + dx); lp.topMargin = Math.round(down[3] + dy); v.setLayoutParams(lp); }
                        return true;
                    case MotionEvent.ACTION_UP:
                        main.removeCallbacks(longPress);
                        try {
                            if (moved[0]) {
                                o.put("x", (loc[0] + lp.leftMargin + v.getWidth() / 2f) / w);
                                o.put("y", (loc[1] + lp.topMargin + v.getHeight() / 2f) / h);
                            } else if (editMap.has(key)) {
                                o.put("mode", "hold".equals(o.optString("mode")) ? "tap" : "hold");
                                redrawMarkers(root);
                            }
                        } catch (Exception ignored) { }
                        return true;
                    default:
                        main.removeCallbacks(longPress);
                        return true;
                }
            });
            root.addView(m);
        }
    }

    void closeEditor(boolean save) {
        if (editor == null) return;
        if (save && editMap != null) {
            prefs.edit().putString("map." + fg, editMap.toString()).apply();
            Log.i(TAG, "KEYMAP-SAVED " + fg + " " + editMap.length());
        }
        try { wm.removeView(editor); } catch (Exception ignored) { }
        editor = null;
        pending = null;
        updateFab();
    }
}
