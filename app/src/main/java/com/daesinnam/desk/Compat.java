package com.daesinnam.desk;

import android.app.Activity;
import android.content.Context;
import android.graphics.Point;
import android.graphics.Rect;
import android.os.Build;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.view.Display;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;

/**
 * 안드로이드 8(API 26)부터 최신까지 같은 앱 하나로 돌게 하는 도우미.
 * 새 안드로이드에만 있는 기능은 그 버전에서만 쓰고, 그 아래에서는 예전 방법으로 같은 일을 합니다.
 */
@SuppressWarnings("deprecation")
final class Compat {
    static final int SDK = Build.VERSION.SDK_INT;
    private Compat() { }

    /** 화면(창이 놓일 수 있는) 전체 크기 */
    static Rect maxBounds(WindowManager wm) {
        if (SDK >= 30) return wm.getMaximumWindowMetrics().getBounds();
        Point p = new Point();
        wm.getDefaultDisplay().getRealSize(p);
        return new Rect(0, 0, p.x, p.y);
    }

    static Rect maxBounds(Activity a) { return maxBounds(a.getWindowManager()); }

    /** 지금 이 창의 크기 · 위치 */
    static Rect curBounds(Activity a) {
        if (SDK >= 30) return a.getWindowManager().getCurrentWindowMetrics().getBounds();
        View d = a.getWindow().getDecorView();
        if (d.getWidth() > 0) {
            int[] l = new int[2];
            d.getLocationOnScreen(l);
            return new Rect(l[0], l[1], l[0] + d.getWidth(), l[1] + d.getHeight());
        }
        return maxBounds(a);
    }

    /** 이 화면(액티비티)이 떠 있는 디스플레이 */
    static Display display(Activity a) {
        if (SDK >= 30) {
            try { return a.getDisplay(); } catch (RuntimeException ignored) { }
        }
        return a.getWindowManager().getDefaultDisplay();
    }

    /** 상태 표시줄 · 내비게이션 막대 · 카메라 구멍이 차지하는 가장자리 {왼쪽, 위, 오른쪽, 아래} */
    static int[] bars(WindowInsets in) {
        if (SDK >= 30) {
            android.graphics.Insets s = in.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
            return new int[]{s.left, s.top, s.right, s.bottom};
        }
        int[] r = {in.getSystemWindowInsetLeft(), in.getSystemWindowInsetTop(), in.getSystemWindowInsetRight(), in.getSystemWindowInsetBottom()};
        if (SDK >= 28 && in.getDisplayCutout() != null) {
            android.view.DisplayCutout c = in.getDisplayCutout();
            r[0] = Math.max(r[0], c.getSafeInsetLeft()); r[1] = Math.max(r[1], c.getSafeInsetTop());
            r[2] = Math.max(r[2], c.getSafeInsetRight()); r[3] = Math.max(r[3], c.getSafeInsetBottom());
        }
        return r;
    }

    static WindowInsets consumed(WindowInsets in) {
        return SDK >= 30 ? WindowInsets.CONSUMED : in.consumeSystemWindowInsets();
    }

    /** 앱 화면을 상태 표시줄 · 내비게이션 막대 뒤까지 넓힘 (가장자리는 bars()로 비움) */
    static void edgeToEdge(Window w) {
        if (SDK >= 30) { w.setDecorFitsSystemWindows(false); return; }
        View d = w.getDecorView();
        d.setSystemUiVisibility(d.getSystemUiVisibility() | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
    }

    /** 카메라 구멍 쪽까지 화면을 씀 (안드로이드 9+) */
    static void cutoutShortEdges(Window w) {
        if (SDK < 28) return;
        WindowManager.LayoutParams lp = w.getAttributes();
        lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        w.setAttributes(lp);
    }

    /** 상태 표시줄 · 내비게이션 막대 숨기기 (가장자리를 밀면 잠깐 나옴) */
    static void immersive(Window w, boolean on) {
        if (SDK >= 30) {
            WindowInsetsController c = w.getInsetsController();
            if (c == null) return;
            if (on) {
                c.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
                c.hide(WindowInsets.Type.systemBars());
            } else c.show(WindowInsets.Type.systemBars());
            return;
        }
        View d = w.getDecorView();
        int f = View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION;
        if (on) f |= View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY;
        d.setSystemUiVisibility(f);
    }

    /** 짧은 진동 (누름 느낌) */
    static void tick(Vibrator v, boolean click) {
        if (v == null || !v.hasVibrator()) return;
        if (SDK >= 29) v.vibrate(VibrationEffect.createPredefined(click ? VibrationEffect.EFFECT_CLICK : VibrationEffect.EFFECT_TICK));
        else v.vibrate(VibrationEffect.createOneShot(click ? 18 : 10, VibrationEffect.DEFAULT_AMPLITUDE));
    }

    /** 기기 발열 단계 (안드로이드 10+, 그 아래는 0 = 알 수 없음) */
    static int thermal(PowerManager pm) {
        return (SDK >= 29 && pm != null) ? pm.getCurrentThermalStatus() : 0;
    }

    /** 바깥에 연결한 입력 장치인지 (안드로이드 10+ 정확, 그 아래는 이름 · 종류로 짐작) */
    static boolean external(android.view.InputDevice d) {
        if (SDK >= 29) return d.isExternal();
        return !d.isVirtual() && d.getId() > 0 && (d.getSources() & android.view.InputDevice.SOURCE_TOUCHSCREEN) != android.view.InputDevice.SOURCE_TOUCHSCREEN
                && !d.getName().toLowerCase(java.util.Locale.ROOT).contains("gpio") && !d.getName().toLowerCase(java.util.Locale.ROOT).contains("qpnp");
    }

    static Context unused(Context c) { return c; }
}
