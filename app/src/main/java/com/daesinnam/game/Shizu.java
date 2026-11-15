package com.daesinnam.game;

import android.content.Context;
import android.content.pm.PackageManager;
import android.util.Log;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.lang.reflect.Method;
import java.util.concurrent.TimeUnit;

import rikka.shizuku.Shizuku;

/**
 * 고급 기능(Shizuku) 연결.
 *
 * Shizuku는 사용자가 따로 설치하는 무료 공개 앱입니다. 무선 디버깅으로 한 번 켜 두면,
 * 허락받은 앱이 개발자용 셸(ADB)과 같은 권한으로 명령을 실행할 수 있습니다(루팅 필요 없음).
 * 덜누름 게임은 이 권한으로
 *  - 실제 FPS 읽기 (화면에 그려진 프레임 수: SurfaceFlinger)
 *  - 맞춤 설정 적용 (cmd game mode / cmd game set / 화면 주사율)
 *  - FPS 표시 창 권한 켜기 (appops SYSTEM_ALERT_WINDOW)
 * 만 씁니다.
 */
final class Shizu {
    static final String TAG = "GameShizuku";
    static final String PKG = "moe.shizuku.privileged.api";
    static final String DOWNLOAD = "https://play.google.com/store/apps/details?id=moe.shizuku.privileged.api";

    private Shizu() { }

    static boolean installed(Context c) {
        try { c.getPackageManager().getApplicationInfo(PKG, 0); return true; }
        catch (PackageManager.NameNotFoundException e) { return false; }
    }

    /** Shizuku 앱이 켜져 있고 연결됨 */
    static boolean running() {
        try { return Shizuku.pingBinder() && !Shizuku.isPreV11(); } catch (Throwable t) { return false; }
    }

    /** 켜져 있고 덜누름 게임을 허락함 */
    static boolean granted() {
        try { return running() && Shizuku.checkSelfPermission() == PackageManager.PERMISSION_GRANTED; }
        catch (Throwable t) { return false; }
    }

    static void request(int code) {
        try { Shizuku.requestPermission(code); } catch (Throwable t) { Log.w(TAG, "request " + t); }
    }

    /** 셸 명령을 Shizuku 권한으로 시작 (긴 시간 도는 명령용). Shizuku 13은 newProcess를 숨겨 두어 리플렉션으로 부릅니다. */
    static Process start(String cmd) throws Exception {
        Method m = Shizuku.class.getDeclaredMethod("newProcess", String[].class, String[].class, String.class);
        m.setAccessible(true);
        return (Process) m.invoke(null, new String[]{"sh", "-c", cmd}, null, null);
    }

    /** 셸 명령 실행 후 출력(표준 출력 + 오류) 돌려줌. 실패하면 null */
    static String run(String cmd, long timeoutMs) {
        if (!granted()) return null;
        try {
            Process p = start(cmd + " 2>&1");
            StringBuilder sb = new StringBuilder();
            Thread reader = new Thread(() -> {
                try (BufferedReader r = new BufferedReader(new InputStreamReader(p.getInputStream()))) {
                    String line;
                    while ((line = r.readLine()) != null) sb.append(line).append('\n');
                } catch (Exception ignored) { }
            });
            reader.start();
            if (!p.waitFor(timeoutMs, TimeUnit.MILLISECONDS)) p.destroy();
            reader.join(300);
            return sb.toString().trim();
        } catch (Throwable t) {
            Log.w(TAG, "run " + cmd + " " + t);
            return null;
        }
    }

    /** "service call SurfaceFlinger 1013" 결과에서 지금까지 그린 프레임 수. 못 읽으면 -1 */
    static long parseFrameCount(String line) {
        if (line == null) return -1;
        int i = line.indexOf("Parcel(");
        if (i < 0) return -1;
        int s = i + 7, e = s;
        while (e < line.length() && Character.digit(line.charAt(e), 16) >= 0) e++;
        if (e - s < 1 || e - s > 8) return -1;
        // 오류 결과(예외 꾸러미)는 "Parcel(fffffffc ..." 처럼 음수 코드로 옵니다 — 그 경우 건너뜀
        if (line.contains("Exception")) return -1;
        long v = Long.parseLong(line.substring(s, e), 16);
        return v >= 0x80000000L ? -1 : v;
    }
}
