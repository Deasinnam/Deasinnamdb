package com.daesinnam.bench;

import android.app.ActivityManager;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Point;
import android.os.BatteryManager;
import android.os.Build;
import android.view.Display;
import android.view.WindowManager;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.List;

/** 기기 정보 · 설치된 덜누름 앱 · 배터리 상태. 개인 정보(계정, 기기 이름, 위치)는 읽지 않습니다. */
@SuppressWarnings("deprecation")
final class DeviceInfo {
    private DeviceInfo() { }

    /** 삼성 모델 번호 앞부분 → 알려진 이름 (모르는 모델은 모델 번호 그대로) */
    private static final String[][] NAMES = {
        {"SM-F966", "Galaxy Z Fold7"}, {"SM-F956", "Galaxy Z Fold6"}, {"SM-F946", "Galaxy Z Fold5"},
        {"SM-F936", "Galaxy Z Fold4"}, {"SM-F926", "Galaxy Z Fold3"}, {"SM-F916", "Galaxy Z Fold2"},
        {"SM-F766", "Galaxy Z Flip7"}, {"SM-F761", "Galaxy Z Flip7 FE"}, {"SM-F741", "Galaxy Z Flip6"},
        {"SM-F731", "Galaxy Z Flip5"}, {"SM-F721", "Galaxy Z Flip4"},
        {"SM-S938", "Galaxy S25 Ultra"}, {"SM-S936", "Galaxy S25+"}, {"SM-S931", "Galaxy S25"}, {"SM-S937", "Galaxy S25 Edge"},
        {"SM-S928", "Galaxy S24 Ultra"}, {"SM-S926", "Galaxy S24+"}, {"SM-S921", "Galaxy S24"},
        {"SM-S918", "Galaxy S23 Ultra"}, {"SM-S916", "Galaxy S23+"}, {"SM-S911", "Galaxy S23"},
        {"SM-X926", "Galaxy Tab S10 Ultra"}, {"SM-X920", "Galaxy Tab S10 Ultra"},
        {"SM-A566", "Galaxy A56"}, {"SM-A556", "Galaxy A55"},
    };

    static String niceName() {
        String model = Build.MODEL == null ? "" : Build.MODEL;
        for (String[] n : NAMES) if (model.startsWith(n[0])) return n[1];
        String man = Build.MANUFACTURER == null ? "" : Build.MANUFACTURER;
        if (!man.isEmpty() && !model.toLowerCase().startsWith(man.toLowerCase()))
            return Character.toUpperCase(man.charAt(0)) + man.substring(1) + " " + model;
        return model;
    }

    static JSONObject json(Context c) throws Exception {
        JSONObject o = new JSONObject();
        o.put("name", niceName());
        o.put("model", Build.MODEL);
        o.put("maker", Build.MANUFACTURER);
        String soc = Build.HARDWARE;
        if (Build.VERSION.SDK_INT >= 31) {
            String m = Build.SOC_MODEL;
            if (m != null && !m.isEmpty() && !"unknown".equalsIgnoreCase(m)) soc = (Build.SOC_MANUFACTURER + " " + m).trim();
        }
        o.put("soc", soc);
        o.put("cores", Runtime.getRuntime().availableProcessors());
        o.put("android", Build.VERSION.RELEASE);
        o.put("sdk", Build.VERSION.SDK_INT);
        ActivityManager am = c.getSystemService(ActivityManager.class);
        ActivityManager.MemoryInfo mi = new ActivityManager.MemoryInfo();
        am.getMemoryInfo(mi);
        o.put("ramGB", Math.round(mi.totalMem / 1073741824.0 * 10) / 10.0);
        o.put("availGB", Math.round(mi.availMem / 1073741824.0 * 10) / 10.0);
        WindowManager wm = c.getSystemService(WindowManager.class);
        Display d = wm.getDefaultDisplay();
        Point p = new Point();
        d.getRealSize(p);
        o.put("screen", Math.max(p.x, p.y) + "×" + Math.min(p.x, p.y));
        o.put("hz", Math.round(d.getRefreshRate()));
        float maxHz = d.getRefreshRate();
        for (Display.Mode m : d.getSupportedModes()) maxHz = Math.max(maxHz, m.getRefreshRate());
        o.put("maxHz", Math.round(maxHz));
        o.put("emulator", Build.FINGERPRINT != null && (Build.FINGERPRINT.contains("generic") || Build.FINGERPRINT.contains("emulator")
                || Build.MODEL.contains("sdk_gphone") || Build.HARDWARE.contains("ranchu")));
        return o;
    }

    /** 설치된 덜누름 앱 (com.daesinnam.* 런처 앱) — 이름과 버전 */
    static JSONArray apps(Context c) throws Exception {
        PackageManager pm = c.getPackageManager();
        Intent i = new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER);
        List<ResolveInfo> list = pm.queryIntentActivities(i, 0);
        JSONArray a = new JSONArray();
        for (ResolveInfo r : list) {
            String pkg = r.activityInfo.packageName;
            if (!pkg.startsWith("com.daesinnam.") || pkg.equals(c.getPackageName())) continue;
            JSONObject o = new JSONObject();
            o.put("pkg", pkg);
            o.put("label", String.valueOf(r.loadLabel(pm)));
            try {
                PackageInfo pi = pm.getPackageInfo(pkg, 0);
                o.put("version", pi.versionName);
            } catch (Exception ignored) { }
            a.put(o);
        }
        return a;
    }

    static JSONObject battery(Context c) throws Exception {
        Intent b = c.registerReceiver(null, new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
        JSONObject o = new JSONObject();
        if (b == null) return o;
        int level = b.getIntExtra(BatteryManager.EXTRA_LEVEL, -1), scale = b.getIntExtra(BatteryManager.EXTRA_SCALE, 100);
        int plugged = b.getIntExtra(BatteryManager.EXTRA_PLUGGED, 0);
        o.put("pct", level < 0 ? -1 : Math.round(level * 100f / Math.max(1, scale)));
        o.put("tempC", b.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, 0) / 10.0);
        o.put("charging", plugged != 0);
        return o;
    }
}
