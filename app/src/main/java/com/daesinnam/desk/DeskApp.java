package com.daesinnam.desk;

import android.app.Application;
import android.content.ComponentName;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.SystemClock;
import android.util.Log;

import java.io.File;
import java.io.FileOutputStream;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * 덜누름 데스크가 열자마자 꺼지는 일을 막는 지킴이 (1.6.8).
 *
 * - 앱이 예상치 못하게 꺼지면 그 까닭(오류 기록)을 files/last_crash.txt에 남깁니다.
 *   다음에 열 때 화면에 "꺼진 이유 복사" 창을 띄워, 사용자가 그대로 보내 줄 수 있게 합니다.
 * - 켠 지 20초 안에 꺼지는 일이 두 번 이어지면 다음에는 "안전 모드"로 엽니다:
 *   다른 앱 위젯을 그리지 않고, 고급 기능(Shizuku) 연결을 쓰지 않습니다. 20초 넘게 잘 돌면 보통 모드로 돌아갑니다.
 * - 꺼진 까닭이 Shizuku 연결 부품이면 그 부품을 꺼 둡니다(창정리 고급 기능만 안 되고 나머지는 됨).
 */
public class DeskApp extends Application {
    static final String TAG = "DeskGuard";
    private static final String PREF = "desk_guard";
    private static final long EARLY_MS = 20_000;
    private static long startedAt;

    @Override
    protected void attachBaseContext(Context base) {
        super.attachBaseContext(base);
        startedAt = SystemClock.elapsedRealtime();
        final Thread.UncaughtExceptionHandler prev = Thread.getDefaultUncaughtExceptionHandler();
        Thread.setDefaultUncaughtExceptionHandler((t, e) -> {
            try { record(base, t, e); } catch (Throwable ignored) { }
            if (prev != null) prev.uncaughtException(t, e);
            else { android.os.Process.killProcess(android.os.Process.myPid()); System.exit(10); }
        });
    }

    private static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences(PREF, MODE_PRIVATE);
    }

    static File crashFile(Context c) {
        return new File(c.getFilesDir(), "last_crash.txt");
    }

    /** 기기 · 버전 정보 한 줄 (꺼진 이유에 함께 적음) */
    static String deviceLine(Context c) {
        String oneUi = "";
        try {
            int v = (int) Build.VERSION.class.getField("SEM_PLATFORM_INT").get(null); // 삼성: 90000 = One UI 1.0
            int major = (v - 90000) / 10000 + 1, minor = ((v - 90000) % 10000) / 100;
            oneUi = " · One UI " + major + "." + minor;
        } catch (Throwable ignored) { }
        return Build.MANUFACTURER + " " + Build.MODEL + " (" + Build.DEVICE + ") · 안드로이드 " + Build.VERSION.RELEASE
                + " (API " + Build.VERSION.SDK_INT + ")" + oneUi + " · 덜누름 데스크 " + BuildConfig.VERSION_NAME;
    }

    private static void record(Context c, Thread t, Throwable e) throws Exception {
        long ran = SystemClock.elapsedRealtime() - startedAt;
        StringWriter sw = new StringWriter();
        e.printStackTrace(new PrintWriter(sw));
        String trace = sw.toString();
        String text = "덜누름 데스크 꺼진 이유\n"
                + new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.KOREA).format(new Date()) + " · 켠 뒤 " + (ran / 1000) + "초 · 스레드 " + t.getName() + "\n"
                + deviceLine(c) + "\n\n" + trace;
        if (text.length() > 12000) text = text.substring(0, 12000);
        try (FileOutputStream o = new FileOutputStream(crashFile(c))) {
            o.write(text.getBytes(StandardCharsets.UTF_8));
        }
        SharedPreferences p = prefs(c);
        int strikes = ran < EARLY_MS ? p.getInt("strikes", 0) + 1 : 0;
        p.edit().putInt("strikes", strikes).putBoolean("unseen", true).commit();
        if (trace.contains("rikka.shizuku") || trace.contains("moe.shizuku")) {
            try {
                c.getPackageManager().setComponentEnabledSetting(new ComponentName(c, "rikka.shizuku.ShizukuProvider"),
                        PackageManager.COMPONENT_ENABLED_STATE_DISABLED, PackageManager.DONT_KILL_APP);
                p.edit().putBoolean("shizukuOff", true).commit();
            } catch (Throwable ignored) { }
        }
        Log.e(TAG, "앱이 꺼짐 (켠 뒤 " + ran + "ms, 연속 " + strikes + "번)", e);
    }

    /** 켠 지 얼마 안 돼 두 번 이상 이어서 꺼졌으면 안전 모드 */
    static boolean safeMode(Context c) {
        return prefs(c).getInt("strikes", 0) >= 2;
    }

    static boolean shizukuOff(Context c) {
        return prefs(c).getBoolean("shizukuOff", false);
    }

    /** 20초 넘게 잘 돌았음 → 연속 횟수 지우기 (다음에는 보통 모드) */
    static void ranFine(Context c) {
        prefs(c).edit().putInt("strikes", 0).apply();
    }

    /** 아직 보여 주지 않은 꺼진 이유가 있으면 그 글, 없으면 null */
    static String unseenCrash(Context c) {
        if (!prefs(c).getBoolean("unseen", false)) return null;
        File f = crashFile(c);
        if (!f.exists()) return null;
        try {
            byte[] b = java.nio.file.Files.readAllBytes(f.toPath());
            return new String(b, StandardCharsets.UTF_8);
        } catch (Throwable t) { return null; }
    }

    static String lastCrash(Context c) {
        File f = crashFile(c);
        if (!f.exists()) return null;
        try { return new String(java.nio.file.Files.readAllBytes(f.toPath()), StandardCharsets.UTF_8); }
        catch (Throwable t) { return null; }
    }

    static void markSeen(Context c) {
        prefs(c).edit().putBoolean("unseen", false).apply();
    }

    /** 안전 모드를 끄고 Shizuku 부품도 다시 켬 (사용자가 "보통으로" 고름) */
    static void reset(Context c) {
        prefs(c).edit().clear().apply();
        try {
            c.getPackageManager().setComponentEnabledSetting(new ComponentName(c, "rikka.shizuku.ShizukuProvider"),
                    PackageManager.COMPONENT_ENABLED_STATE_DEFAULT, PackageManager.DONT_KILL_APP);
        } catch (Throwable ignored) { }
    }
}
