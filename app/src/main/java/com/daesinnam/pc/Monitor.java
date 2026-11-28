package com.daesinnam.pc;

import android.app.ActivityOptions;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.hardware.display.DisplayManager;
import android.os.Build;
import android.provider.Settings;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.Display;

import org.json.JSONObject;

/**
 * 외부 모니터 찾기 · 모니터에 PC 화면(바탕화면 = MainActivity) 열기 · 데스크톱 모드 설정 확인.
 *
 * 휴대폰을 USB-C(영상 출력 지원 기기)로 모니터에 꽂으면 안드로이드는 두 번째 화면(Display)을 만듭니다.
 * 기본은 폰 화면을 그대로 비추지만(미러링), 앱이 그 화면을 지정해 열면 모니터에 따로 띄울 수 있습니다.
 *  - 개발자 옵션의 "보조 디스플레이에서 데스크톱 모드 강제 사용"이 켜져 있으면 모니터가 독립된 화면이 되고
 *    다른 앱도 모니터에서 창으로 열 수 있습니다(덜누름 데스크와 같은 창 기능).
 *  - 꺼져 있으면 기기에 따라 PC 화면은 열리지만 다른 앱은 모니터에서 전체 화면으로 열리거나 폰에서 열립니다.
 */
final class Monitor {
    static final String TAG = "PcMonitor";
    /** 숨은 Display 플래그: 이 화면에 작업 표시줄 등 시스템 장식을 그림 (데스크톱 모드가 켜진 외부 화면) */
    static final int FLAG_SYSTEM_DECORATIONS = 1 << 6;

    static final String KEY_DESKTOP = "force_desktop_mode_on_external_displays";
    static final String KEY_FREEFORM = "enable_freeform_support";
    static final String KEY_RESIZABLE = "force_resizable_activities";

    /** 자동 점검(시험용 빌드): 모니터 바탕화면이 열리면 설정 앱을 창으로 띄워 보게 */
    static volatile boolean selftestLaunch;

    private Monitor() { }

    /** 연결된 외부 모니터 (없으면 null). 발표용(presentation) 화면을 먼저, 없으면 비공개가 아닌 다른 화면 */
    static Display find(Context c) {
        DisplayManager dm = c.getSystemService(DisplayManager.class);
        for (Display d : dm.getDisplays(DisplayManager.DISPLAY_CATEGORY_PRESENTATION)) {
            if (usable(d)) return d;
        }
        for (Display d : dm.getDisplays()) {
            if (usable(d) && (d.getFlags() & Display.FLAG_PRIVATE) == 0) return d;
        }
        return null;
    }

    private static boolean usable(Display d) {
        return d != null && d.getDisplayId() != Display.DEFAULT_DISPLAY && d.isValid() && d.getState() != Display.STATE_OFF;
    }

    static boolean decorated(Display d) {
        return d != null && (d.getFlags() & FLAG_SYSTEM_DECORATIONS) != 0;
    }

    /** 설정값 읽기. 앱이 못 읽는 기기면 Shizuku로, 그것도 안 되면 -1 */
    static int setting(Context c, String key) {
        try { return Settings.Global.getInt(c.getContentResolver(), key, 0); }
        catch (Throwable t) {
            String v = Shizu.run("settings get global " + key, 1500);
            if (v == null) return -1;
            try { return Integer.parseInt(v.trim()); } catch (NumberFormatException e) { return "null".equals(v.trim()) ? 0 : -1; }
        }
    }

    /** Shizuku로 데스크톱 모드 · 자유 창 켜기 (다시 시작해야 적용). 성공하면 true */
    static boolean enableDesktopMode() {
        String out = Shizu.run("settings put global " + KEY_DESKTOP + " 1; settings put global " + KEY_FREEFORM
                + " 1; settings put global " + KEY_RESIZABLE + " 1; echo ok", 4000);
        Log.i(TAG, "enable desktop mode -> " + out);
        return out != null && out.contains("ok");
    }

    static JSONObject status(Context c) {
        JSONObject o = new JSONObject();
        try {
            Display d = find(c);
            o.put("connected", d != null);
            if (d != null) {
                DisplayMetrics m = new DisplayMetrics();
                d.getRealMetrics(m);
                o.put("id", d.getDisplayId()).put("name", d.getName())
                 .put("width", m.widthPixels).put("height", m.heightPixels).put("dpi", m.densityDpi)
                 .put("hz", Math.round(d.getRefreshRate()))
                 .put("decorated", decorated(d));
            }
            o.put("desktopSetting", setting(c, KEY_DESKTOP)).put("freeformSetting", setting(c, KEY_FREEFORM));
            o.put("sdk", Build.VERSION.SDK_INT).put("model", Build.MANUFACTURER + " " + Build.MODEL);
        } catch (Exception ignored) { }
        return o;
    }

    static Intent desktopIntent(Context c) {
        return new Intent(c, MainActivity.class)
                .setAction(Intent.ACTION_MAIN)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                .putExtra("pc.monitor", true)
                .putExtra("pc.selftestLaunch", selftestLaunch);
    }

    static android.os.Bundle optionsFor(Display d) {
        ActivityOptions o = ActivityOptions.makeBasic();
        o.setLaunchDisplayId(d.getDisplayId());
        return o.toBundle();
    }

    /** 모니터에 PC 화면 열기. 열기 요청을 보냈으면 true (안드로이드가 막으면 예외) */
    static boolean openDesktop(Context c, Display d) {
        if (d == null) return false;
        try {
            c.startActivity(desktopIntent(c), optionsFor(d));
            Log.i(TAG, "open desktop on display " + d.getDisplayId() + " " + d.getName());
            return true;
        } catch (Exception e) {
            Log.w(TAG, "open desktop failed " + e);
            return false;
        }
    }

    /** 알림에서 누르면 모니터에 PC 화면을 여는 PendingIntent */
    static PendingIntent openPending(Context c, Display d) {
        return PendingIntent.getActivity(c, 41, desktopIntent(c),
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT, optionsFor(d));
    }
}
