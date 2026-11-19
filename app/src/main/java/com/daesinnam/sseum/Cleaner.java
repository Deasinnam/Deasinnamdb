package com.daesinnam.sseum;

import android.app.ActivityManager;
import android.app.AppOpsManager;
import android.app.usage.StorageStats;
import android.app.usage.StorageStatsManager;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.database.Cursor;
import android.net.Uri;
import android.os.BatteryManager;
import android.os.Bundle;
import android.os.Environment;
import android.os.PowerManager;
import android.os.Process;
import android.os.StatFs;
import android.os.storage.StorageManager;
import android.provider.MediaStore;
import android.provider.Settings;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 덜씀의 정리 기능. 화면(MainActivity)과 덜씀 지킴이(GuardService)가 함께 씁니다.
 * 할 수 있는 것은 권한에 따라 다릅니다:
 *  - 기본: 메모리 상태, 백그라운드 앱 정리(killBackgroundProcesses), 여유 공간
 *  - 사용 기록 접근: 오래 안 쓴 앱 찾기, 앱 캐시 크기
 *  - 시스템 설정 변경: 화면 밝기
 *  - Shizuku: 앱 완전 종료, 모든 앱 캐시 정리, 다운로드 APK 정리, 절전 모드, 애니메이션
 */
final class Cleaner {
    static final String TAG = "Sseum";
    private Cleaner() { }

    static SharedPreferences prefs(Context c) { return c.getSharedPreferences("sseum", Context.MODE_PRIVATE); }

    // ---------- 메모리 ----------
    static JSONObject mem(Context c) {
        ActivityManager am = (ActivityManager) c.getSystemService(Context.ACTIVITY_SERVICE);
        ActivityManager.MemoryInfo mi = new ActivityManager.MemoryInfo();
        am.getMemoryInfo(mi);
        JSONObject o = new JSONObject();
        try {
            double free = (double) mi.availMem / mi.totalMem;
            o.put("total", mi.totalMem).put("avail", mi.availMem).put("used", mi.totalMem - mi.availMem)
             .put("pct", Math.round((1 - free) * 100)).put("low", mi.lowMemory).put("threshold", mi.threshold)
             .put("level", level(mi));
        } catch (JSONException ignored) { }
        return o;
    }

    /** 정상 · 주의 · 위험 (남은 메모리 비율 기준, 안드로이드가 '부족'이라 하면 위험) */
    static String level(ActivityManager.MemoryInfo mi) {
        double free = (double) mi.availMem / mi.totalMem;
        if (mi.lowMemory || free < 0.12) return "위험";
        if (free < 0.22) return "주의";
        return "정상";
    }

    static String level(Context c) {
        ActivityManager am = (ActivityManager) c.getSystemService(Context.ACTIVITY_SERVICE);
        ActivityManager.MemoryInfo mi = new ActivityManager.MemoryInfo();
        am.getMemoryInfo(mi);
        return level(mi);
    }

    static long availMem(Context c) {
        ActivityManager am = (ActivityManager) c.getSystemService(Context.ACTIVITY_SERVICE);
        ActivityManager.MemoryInfo mi = new ActivityManager.MemoryInfo();
        am.getMemoryInfo(mi);
        return mi.availMem;
    }

    // ---------- 권한 ----------
    static boolean usageOk(Context c) {
        AppOpsManager ao = (AppOpsManager) c.getSystemService(Context.APP_OPS_SERVICE);
        int m = ao.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), c.getPackageName());
        return m == AppOpsManager.MODE_ALLOWED;
    }

    static boolean writeOk(Context c) { return Settings.System.canWrite(c); }

    // ---------- 오래 안 쓴 앱 ----------
    private static Set<String> launchable(Context c) {
        Set<String> s = new HashSet<>();
        Intent i = new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER);
        for (ResolveInfo r : c.getPackageManager().queryIntentActivities(i, 0)) s.add(r.activityInfo.packageName);
        return s;
    }

    /** 지켜야 하는 앱: 덜씀, 홈 화면, 키보드, 전화 · 문자, 지금 음악을 트는 앱 등은 종료하지 않음 */
    private static Set<String> keep(Context c) {
        Set<String> k = new HashSet<>();
        k.add(c.getPackageName());
        k.add("moe.shizuku.privileged.api");
        try {
            ResolveInfo home = c.getPackageManager().resolveActivity(new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME), 0);
            if (home != null) k.add(home.activityInfo.packageName);
        } catch (RuntimeException ignored) { }
        String ime = Settings.Secure.getString(c.getContentResolver(), Settings.Secure.DEFAULT_INPUT_METHOD);
        if (ime != null && ime.contains("/")) k.add(ime.substring(0, ime.indexOf('/')));
        for (String p : new String[]{"com.samsung.android.dialer", "com.samsung.android.messaging", "com.google.android.dialer",
                "com.google.android.apps.messaging", "com.android.systemui", "com.sec.android.app.launcher",
                "com.samsung.android.app.routines", "com.samsung.android.lool"}) k.add(p);
        k.addAll(new HashSet<>(prefs(c).getStringSet("keep", new HashSet<>())));
        return k;
    }

    /** 오늘 쓴 앱 가운데 minutes 분 넘게 안 쓴 앱 (메모리에 남아 있을 만한 앱). 사용 기록 접근이 없으면 빈 목록 */
    static JSONArray idleApps(Context c, int minutes) {
        JSONArray out = new JSONArray();
        if (!usageOk(c)) return out;
        UsageStatsManager um = (UsageStatsManager) c.getSystemService(Context.USAGE_STATS_SERVICE);
        long now = System.currentTimeMillis();
        Map<String, UsageStats> m = um.queryAndAggregateUsageStats(now - 24 * 3600_000L, now);
        Set<String> apps = launchable(c), keep = keep(c);
        PackageManager pm = c.getPackageManager();
        List<UsageStats> list = new ArrayList<>(m.values());
        list.sort((a, b) -> Long.compare(a.getLastTimeUsed(), b.getLastTimeUsed()));
        for (UsageStats u : list) {
            String p = u.getPackageName();
            long last = u.getLastTimeUsed();
            if (!apps.contains(p) || keep.contains(p) || last <= 0) continue;
            long ago = (now - last) / 60000;
            if (ago < minutes || ago > 24 * 60) continue;
            try {
                ApplicationInfo ai = pm.getApplicationInfo(p, 0);
                if ((ai.flags & ApplicationInfo.FLAG_STOPPED) != 0) continue; // 이미 멈춘 앱
                out.put(new JSONObject().put("pkg", p).put("label", String.valueOf(pm.getApplicationLabel(ai))).put("ago", ago));
            } catch (PackageManager.NameNotFoundException | JSONException ignored) { }
        }
        return out;
    }

    /** 앱 종료: Shizuku면 완전 종료(force-stop), 아니면 백그라운드 프로세스만 정리 */
    static int stopApps(Context c, List<String> pkgs) {
        ActivityManager am = (ActivityManager) c.getSystemService(Context.ACTIVITY_SERVICE);
        Set<String> keep = keep(c);
        int n = 0;
        StringBuilder sh = new StringBuilder();
        for (String p : pkgs) {
            if (keep.contains(p)) continue;
            if (Shizu.granted()) sh.append("am force-stop ").append(p).append(" ; ");
            else am.killBackgroundProcesses(p);
            n++;
        }
        if (sh.length() > 0) Shizu.run(sh.toString(), 8000);
        return n;
    }

    /** 화면에 없는 앱들의 캐시 프로세스 정리 (권한 없이 가능한 범위) */
    static void trimBackground(Context c) {
        ActivityManager am = (ActivityManager) c.getSystemService(Context.ACTIVITY_SERVICE);
        for (String p : launchable(c)) if (!p.equals(c.getPackageName())) am.killBackgroundProcesses(p);
    }

    // ---------- 저장공간 ----------
    static JSONObject storage(Context c) {
        JSONObject o = new JSONObject();
        try {
            StatFs fs = new StatFs(Environment.getDataDirectory().getPath());
            o.put("free", fs.getAvailableBytes()).put("total", fs.getTotalBytes());
            // 앱 캐시 크기 (사용 기록 접근 필요)
            long cache = -1;
            if (usageOk(c)) {
                StorageStatsManager ssm = (StorageStatsManager) c.getSystemService(Context.STORAGE_STATS_SERVICE);
                cache = 0;
                for (ApplicationInfo ai : c.getPackageManager().getInstalledApplications(0)) {
                    try {
                        StorageStats st = ssm.queryStatsForPackage(StorageManager.UUID_DEFAULT, ai.packageName, Process.myUserHandle());
                        cache += st.getCacheBytes();
                    } catch (Exception ignored) { }
                }
            }
            o.put("cache", cache);
            // 다운로드 폴더의 설치 파일 (Shizuku)
            JSONArray apks = new JSONArray(); long apkBytes = 0;
            if (Shizu.granted()) {
                String out = Shizu.run("find /sdcard/Download /sdcard/Downloads -maxdepth 3 -type f -iname '*.apk' -exec stat -c '%s|%n' {} \; 2>/dev/null", 8000);
                if (out != null) for (String line : out.split("\n")) {
                    int k = line.indexOf('|'); if (k <= 0) continue;
                    try { long b = Long.parseLong(line.substring(0, k).trim()); apkBytes += b; apks.put(new JSONObject().put("path", line.substring(k + 1)).put("bytes", b)); }
                    catch (NumberFormatException ignored) { }
                }
            }
            o.put("apks", apks).put("apkBytes", Shizu.granted() ? apkBytes : -1);
            // 사진 · 동영상 휴지통
            long[] t = trash(c, null);
            o.put("trashCount", t[0]).put("trashBytes", t[1]);
        } catch (JSONException ignored) { }
        return o;
    }

    /** 휴지통 항목 수 · 크기. uris 가 있으면 그 목록도 채움. 볼 권한이 없으면 -1 */
    static long[] trash(Context c, List<Uri> uris) {
        boolean can = c.checkSelfPermission(android.os.Build.VERSION.SDK_INT >= 33 ? android.Manifest.permission.READ_MEDIA_IMAGES : android.Manifest.permission.READ_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED;
        if (!can) return new long[]{-1, -1};
        long n = 0, bytes = 0;
        Uri files = MediaStore.Files.getContentUri(MediaStore.VOLUME_EXTERNAL);
        Bundle q = new Bundle();
        q.putInt(MediaStore.QUERY_ARG_MATCH_TRASHED, MediaStore.MATCH_ONLY);
        try (Cursor cur = c.getContentResolver().query(files, new String[]{MediaStore.MediaColumns._ID, MediaStore.MediaColumns.SIZE}, q, null)) {
            if (cur != null) while (cur.moveToNext()) {
                n++; bytes += cur.getLong(1);
                if (uris != null) uris.add(ContentUris.withAppendedId(files, cur.getLong(0)));
            }
        } catch (RuntimeException e) { Log.w(TAG, "trash " + e); }
        return new long[]{n, bytes};
    }

    /** 모든 앱 캐시 정리 (Shizuku). 정리한 크기(바이트) 또는 -1 */
    static long trimCaches(Context c) {
        if (!Shizu.granted()) return -1;
        long before = new StatFs(Environment.getDataDirectory().getPath()).getAvailableBytes();
        Shizu.run("pm trim-caches 9999999999999", 60000);
        long after = new StatFs(Environment.getDataDirectory().getPath()).getAvailableBytes();
        return Math.max(0, after - before);
    }

    static long deleteApks(JSONArray apks) {
        if (!Shizu.granted() || apks == null) return -1;
        long b = 0; StringBuilder sh = new StringBuilder();
        for (int i = 0; i < apks.length(); i++) {
            JSONObject a = apks.optJSONObject(i); if (a == null) continue;
            String p = a.optString("path");
            if (!p.startsWith("/sdcard/Download") || !p.toLowerCase().endsWith(".apk")) continue; // 다운로드 폴더의 APK만
            sh.append("rm -f '").append(p.replace("'", "'\\''")).append("' ; ");
            b += a.optLong("bytes");
        }
        if (sh.length() > 0) Shizu.run(sh.toString(), 10000);
        return b;
    }

    // ---------- 배터리 ----------
    static JSONObject battery(Context c) {
        JSONObject o = new JSONObject();
        Intent b = c.registerReceiver(null, new android.content.IntentFilter(Intent.ACTION_BATTERY_CHANGED));
        PowerManager pm = (PowerManager) c.getSystemService(Context.POWER_SERVICE);
        SharedPreferences p = prefs(c);
        try {
            int lv = b == null ? -1 : b.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) * 100 / Math.max(1, b.getIntExtra(BatteryManager.EXTRA_SCALE, 100));
            o.put("level", lv).put("plugged", b != null && b.getIntExtra(BatteryManager.EXTRA_PLUGGED, 0) != 0)
             .put("saverOn", pm.isPowerSaveMode())
             .put("auto", p.getBoolean("batAuto", false)).put("saver", p.getBoolean("batSaver", true))
             .put("dim", p.getBoolean("batDim", true)).put("bright", p.getInt("batBright", 35))
             .put("applied", p.getBoolean("batApplied", false));
        } catch (JSONException ignored) { }
        return o;
    }

    /** 전원을 뽑았을 때: 절전 모드 + 밝기 낮춤 (원래 값은 기억) */
    static String batteryOn(Context c) {
        SharedPreferences p = prefs(c);
        SharedPreferences.Editor e = p.edit();
        StringBuilder did = new StringBuilder();
        if (p.getBoolean("batSaver", true)) {
            PowerManager pm = (PowerManager) c.getSystemService(Context.POWER_SERVICE);
            e.putBoolean("prevSaver", pm.isPowerSaveMode());
            if (Shizu.granted()) { Shizu.run("settings put global low_power 1", 3000); did.append("절전 모드 · "); }
        }
        if (p.getBoolean("batDim", true) && writeOk(c)) {
            ContentResolver r = c.getContentResolver();
            try {
                e.putInt("prevMode", Settings.System.getInt(r, Settings.System.SCREEN_BRIGHTNESS_MODE, 1));
                e.putInt("prevBright", Settings.System.getInt(r, Settings.System.SCREEN_BRIGHTNESS, 128));
                Settings.System.putInt(r, Settings.System.SCREEN_BRIGHTNESS_MODE, Settings.System.SCREEN_BRIGHTNESS_MODE_MANUAL);
                Settings.System.putInt(r, Settings.System.SCREEN_BRIGHTNESS, Math.max(10, p.getInt("batBright", 35) * 255 / 100));
                did.append("밝기 ").append(p.getInt("batBright", 35)).append("% · ");
            } catch (RuntimeException ignored) { }
        }
        e.putBoolean("batApplied", true).apply();
        return did.length() > 0 ? did.substring(0, did.length() - 3) : "";
    }

    /** 전원을 꽂았을 때: 원래대로 */
    static void batteryOff(Context c) {
        SharedPreferences p = prefs(c);
        if (!p.getBoolean("batApplied", false)) return;
        if (p.getBoolean("batSaver", true) && !p.getBoolean("prevSaver", false) && Shizu.granted()) Shizu.run("settings put global low_power 0", 3000);
        if (p.getBoolean("batDim", true) && writeOk(c) && p.contains("prevBright")) {
            ContentResolver r = c.getContentResolver();
            try {
                Settings.System.putInt(r, Settings.System.SCREEN_BRIGHTNESS, p.getInt("prevBright", 128));
                Settings.System.putInt(r, Settings.System.SCREEN_BRIGHTNESS_MODE, p.getInt("prevMode", 1));
            } catch (RuntimeException ignored) { }
        }
        p.edit().putBoolean("batApplied", false).apply();
    }

    // ---------- 오래된 갤럭시 가볍게 ----------
    static final String[] ANIM = {"window_animation_scale", "transition_animation_scale", "animator_duration_scale"};

    static String animNow() {
        if (!Shizu.granted()) return "";
        String o = Shizu.run("settings get global window_animation_scale", 3000);
        return o == null ? "" : o.trim();
    }

    /** 애니메이션 줄이기 (0.5배) · 되돌리기 (1배). Shizuku 필요 */
    static boolean anim(Context c, boolean light) {
        if (!Shizu.granted()) return false;
        StringBuilder sh = new StringBuilder();
        for (String k : ANIM) sh.append("settings put global ").append(k).append(light ? " 0.5" : " 1").append(" ; ");
        Shizu.run(sh.toString(), 4000);
        prefs(c).edit().putBoolean("animLight", light).apply();
        return true;
    }
}
