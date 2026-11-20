package com.daesinnam.tv;

import android.os.IBinder;
import android.os.SystemClock;
import android.util.Log;
import android.view.InputDevice;
import android.view.InputEvent;
import android.view.KeyCharacterMap;
import android.view.KeyEvent;

import org.lsposed.hiddenapibypass.HiddenApiBypass;

import java.lang.reflect.Method;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import rikka.shizuku.ShizukuBinderWrapper;
import rikka.shizuku.SystemServiceHelper;

/**
 * Shizuku(셸 권한)로 안드로이드 시스템 서비스를 바로 부르는 도우미.
 *  - 키 넣기: 다른 앱이 떠 있는 DeX 화면에 방향 · 확인 키를 직접 넣음 (명령 실행보다 훨씬 빠름)
 *  - 작업(창) 목록 · 창 방식 바꾸기: 앱을 완전한 전체 화면으로
 *  - 점검 기록: 마지막 동작 결과를 설정 화면에서 볼 수 있게
 */
final class Sys {
    static final String TAG = "TvSys";
    private static boolean bypassed;
    private static Object inputManager;

    private Sys() { }

    static void bypass() {
        if (bypassed) return;
        if (android.os.Build.VERSION.SDK_INT < 28) { bypassed = true; return; } // 안드로이드 8에는 숨은 API 제한이 없음
        try { HiddenApiBypass.addHiddenApiExemptions(""); bypassed = true; } catch (Throwable t) { Log.w(TAG, "bypass " + t); }
    }

    // ---------- 점검 기록 ----------
    private static final List<String> LOG = new ArrayList<>();
    static synchronized void log(String s) {
        Log.i(TAG, s);
        LOG.add(new SimpleDateFormat("HH:mm:ss", Locale.KOREA).format(new Date()) + "  " + s);
        while (LOG.size() > 40) LOG.remove(0);
    }
    static synchronized String logText() { return String.join("\n", LOG); }

    // ---------- 키 넣기 ----------
    private static Object im() throws Exception {
        if (inputManager != null) return inputManager;
        bypass();
        IBinder b = new ShizukuBinderWrapper(SystemServiceHelper.getSystemService("input"));
        inputManager = Class.forName("android.hardware.input.IInputManager$Stub").getMethod("asInterface", IBinder.class).invoke(null, b);
        return inputManager;
    }

    /** display 화면에 키 한 번(누름 + 뗌). Shizuku가 없거나 실패하면 false */
    static boolean injectKey(int code, int display) {
        if (!Shizu.granted()) return false;
        try {
            Object im = im();
            Method inj = im.getClass().getMethod("injectInputEvent", InputEvent.class, int.class);
            long t = SystemClock.uptimeMillis();
            int src = InputDevice.SOURCE_KEYBOARD | InputDevice.SOURCE_DPAD;
            KeyEvent down = new KeyEvent(t, t, KeyEvent.ACTION_DOWN, code, 0, 0, KeyCharacterMap.VIRTUAL_KEYBOARD, 0, 0, src);
            KeyEvent up = new KeyEvent(t, t + 20, KeyEvent.ACTION_UP, code, 0, 0, KeyCharacterMap.VIRTUAL_KEYBOARD, 0, 0, src);
            if (display >= 0) {
                Method sd = KeyEvent.class.getMethod("setDisplayId", int.class);
                sd.invoke(down, display); sd.invoke(up, display);
            }
            boolean a = (Boolean) inj.invoke(im, down, 0), b = (Boolean) inj.invoke(im, up, 0);
            return a && b;
        } catch (Throwable e) {
            inputManager = null;
            log("키 넣기 실패: " + e.getClass().getSimpleName() + " " + e.getMessage());
            return false;
        }
    }

    // ---------- 작업(창) ----------
    static final class Task { int id, display = -1; String mode = ""; }

    private static final Pattern DISPLAY = Pattern.compile("^\\s*Display #(\\d+)");
    private static final Pattern HEAD = Pattern.compile("\\* Task\\{[0-9a-f]+ #(\\d+) (.*)\\}");
    private static final Pattern MODE = Pattern.compile("\\bmode=(\\w+)");
    private static final Pattern WMODE = Pattern.compile("mWindowingMode=(\\w+)");
    private static final Pattern REC = Pattern.compile("ActivityRecord\\{[0-9a-f]+ u\\d+ ([^/\\s]+)/\\S+ t(\\d+)");

    /** dumpsys activity activities 에서 pkg 의 작업들 (작업 번호 · 화면 · 창 방식) */
    static List<Task> tasks(String dump, String pkg) {
        List<Task> all = new ArrayList<>(), out = new ArrayList<>();
        if (dump == null) return out;
        int disp = -1;
        Task cur = null;
        List<Integer> mine = new ArrayList<>();
        for (String line : dump.split("\n")) {
            Matcher d = DISPLAY.matcher(line);
            if (d.find()) { disp = Integer.parseInt(d.group(1)); cur = null; continue; }
            Matcher h = HEAD.matcher(line);
            if (h.find()) {
                cur = new Task(); cur.id = Integer.parseInt(h.group(1)); cur.display = disp;
                Matcher m = MODE.matcher(h.group(2)); if (m.find()) cur.mode = m.group(1);
                all.add(cur);
                continue;
            }
            if (cur != null && cur.mode.isEmpty()) { Matcher w = WMODE.matcher(line); if (w.find()) cur.mode = w.group(1); }
            Matcher r = REC.matcher(line);
            if (r.find() && r.group(1).equals(pkg)) mine.add(Integer.parseInt(r.group(2)));
        }
        for (Task t : all) if (mine.contains(t.id) && !out.contains(t)) out.add(t);
        return out;
    }

    /** 작업을 전체 화면 방식으로 (안드로이드 버전에 따라 없을 수 있음) */
    static boolean setFullscreen(int taskId) {
        if (!Shizu.granted()) return false;
        bypass();
        try {
            IBinder b = new ShizukuBinderWrapper(SystemServiceHelper.getSystemService("activity_task"));
            Object atm = Class.forName("android.app.IActivityTaskManager$Stub").getMethod("asInterface", IBinder.class).invoke(null, b);
            for (Method m : atm.getClass().getMethods()) {
                if (m.getName().equals("setTaskWindowingMode") && m.getParameterTypes().length == 3) {
                    Object r = m.invoke(atm, taskId, 1, true);
                    log("setTaskWindowingMode(" + taskId + ") → " + r);
                    return !(r instanceof Boolean) || (Boolean) r;
                }
            }
            log("setTaskWindowingMode 없음 (이 안드로이드 버전)");
        } catch (Throwable e) {
            log("창 방식 바꾸기 실패: " + e.getClass().getSimpleName() + " " + e.getMessage());
        }
        return false;
    }
}
