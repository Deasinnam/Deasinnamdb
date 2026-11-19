package com.daesinnam.sseum;

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
 * 덜씀은 이 권한으로
 *  - 오래 안 쓴 앱 종료(am force-stop) · 모든 앱 캐시 정리(pm trim-caches)
 *  - 다운로드 폴더의 설치 파일(APK) 정리 · 절전 모드 · 애니메이션 줄이기
 * 만 씁니다.
 */
final class Shizu {
    static final String TAG = "SseumShizuku";
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

    /** 켜져 있고 덜누름 TV를 허락함 */
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
}
