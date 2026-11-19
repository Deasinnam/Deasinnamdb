package com.daesinnam.tv;

import android.accessibilityservice.AccessibilityService;
import android.content.Context;
import android.content.Intent;
import android.media.AudioManager;
import android.os.Build;
import android.widget.Toast;
import android.provider.Settings;
import android.view.KeyEvent;
import android.view.accessibility.AccessibilityEvent;

/**
 * 넷플릭스 등 다른 앱을 보는 중에도 블루투스 키보드로 덜누름 TV를 부르는 단축키.
 *   F12 · Alt+H      → 덜누름 TV 홈으로
 *   Alt+1 ~ Alt+9    → 내 서비스 그 번째를 바로 열기
 *   맞춤 리모컨(미테르 등)의 홈 단추 → 덜누름 TV 홈 (설정에서 끌 수 있음)
 *   덜누름 TV를 켜 둔 동안 다른 앱에서도 미테르 단추 배치 유지 (+ − 상하, • 볼륨 모드, ▶/II 확인 · 길게 재생)
 * 이 두 가지만 가로채고 나머지 키는 그대로 지금 앱에 넘깁니다. 화면 내용은 읽지 않습니다.
 */
public class KeyService extends AccessibilityService {
    static final String COMPONENT = "com.daesinnam.tv/com.daesinnam.tv.KeyService";
    private int swallowUp = -1; // 가로챈 키의 '뗌'도 앱에 안 가게

    static boolean enabled(Context c) {
        String s = Settings.Secure.getString(c.getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
        return s != null && (s.contains(COMPONENT) || s.contains("com.daesinnam.tv/.KeyService"));
    }

    static volatile boolean live; // 접근성 서비스가 실제로 붙어 동작 중
    private int logged; // 점검 기록은 처음 몇 번만
    private long okDown; // ▶/II 길게 누름 판단
    private int heldRemote = -1; // 미테르에서 눌러 가로챈 키

    @Override
    protected boolean onKeyEvent(KeyEvent e) {
        int c = e.getKeyCode();
        // 덜누름 TV를 켜 둔 동안, 다른 앱 화면에서도 미테르 단추 기능 유지
        if (MainActivity.alive && !MainActivity.focused && RemoteMap.on(this) && RemoteMap.fromRemote(this, e) && c != KeyEvent.KEYCODE_HOME) {
            Boolean r = remote(e);
            if (r != null) return r;
        }
        if (e.getAction() == KeyEvent.ACTION_UP) {
            if (c == swallowUp) { swallowUp = -1; return true; }
            return false;
        }
        if (e.getAction() != KeyEvent.ACTION_DOWN || e.getRepeatCount() > 0) return c == swallowUp;
        // 맞춤 리모컨(미테르 등)의 홈 단추 → DeX 바탕화면 대신 덜누름 TV 홈
        if (c == KeyEvent.KEYCODE_HOME && RemoteMap.homeToTv(this) && RemoteMap.fromRemote(this, e)) {
            swallowUp = c;
            try { startActivity(new Intent(this, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT).putExtra(MainActivity.EXTRA_OPEN, 0)); }
            catch (RuntimeException ignored) { }
            return true;
        }
        boolean alt = e.isAltPressed() && !e.isCtrlPressed() && !e.isMetaPressed();
        int open = -1;
        if (c == KeyEvent.KEYCODE_F12 || (alt && c == KeyEvent.KEYCODE_H)) open = 0;
        else if (alt && c >= KeyEvent.KEYCODE_1 && c <= KeyEvent.KEYCODE_9) open = c - KeyEvent.KEYCODE_0;
        if (open < 0) return false;
        swallowUp = c;
        Intent i = new Intent(this, MainActivity.class)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
                .putExtra(MainActivity.EXTRA_OPEN, open);
        try { startActivity(i); } catch (RuntimeException ignored) { }
        return true;
    }

    /**
     * 다른 앱(넷플릭스 등)에서 미테르 단추: 덜누름 TV와 같은 배치로 바꿔 보냄.
     * null = 손대지 않음(원래 키 그대로), true = 처리하고 삼킴.
     */
    private Boolean remote(KeyEvent e) {
        int c = e.getKeyCode();
        boolean down = e.getAction() == KeyEvent.ACTION_DOWN;
        if (!down) { if (c == heldRemote) { heldRemote = -1; finishOk(c); return true; } return null; }
        String a = RemoteMap.map(this).optString(KeyEvent.keyCodeToString(c), "");
        if (logged < 12 && e.getRepeatCount() == 0) { logged++; Sys.log("다른 앱에서 리모컨 " + KeyEvent.keyCodeToString(c).replace("KEYCODE_", "") + " → " + (a.isEmpty() ? "그대로" : a) + (a.endsWith("Vol") ? (RemoteMap.volMode ? " (볼륨)" : " (상하)") : "")); }
        if (a.equals("upVol")) a = RemoteMap.volMode ? "volUp" : "up";
        else if (a.equals("downVol")) a = RemoteMap.volMode ? "volDown" : "down";
        boolean first = e.getRepeatCount() == 0;
        switch (a) {
            case "up": case "down": case "left": case "right":
                heldRemote = c; dpad(a); return true;
            case "ok":
                heldRemote = c; if (first) okDown = e.getEventTime(); return true; // 뗄 때: 짧게 = 확인, 길게 = 재생/일시정지
            case "back":
                heldRemote = c; if (first) performGlobalAction(GLOBAL_ACTION_BACK); return true;
            case "volUp": case "volDown": {
                heldRemote = c;
                AudioManager am = (AudioManager) getSystemService(AUDIO_SERVICE);
                if (am != null) am.adjustStreamVolume(AudioManager.STREAM_MUSIC, a.equals("volUp") ? AudioManager.ADJUST_RAISE : AudioManager.ADJUST_LOWER, AudioManager.FLAG_SHOW_UI);
                return true;
            }
            case "mute": {
                heldRemote = c;
                AudioManager am = (AudioManager) getSystemService(AUDIO_SERVICE);
                if (am != null && first) am.adjustStreamVolume(AudioManager.STREAM_MUSIC, AudioManager.ADJUST_TOGGLE_MUTE, AudioManager.FLAG_SHOW_UI);
                return true;
            }
            case "mode":
                heldRemote = c;
                if (first) {
                    RemoteMap.volMode = !RemoteMap.volMode;
                    Toast.makeText(this, RemoteMap.volMode ? "＋ − 볼륨 조절 (• 를 다시 누르면 위 · 아래)" : "＋ − 위 · 아래 고르기", Toast.LENGTH_SHORT).show();
                }
                return true;
            case "tvhome": case "settings": case "apps":
                heldRemote = c;
                if (first) try { startActivity(new Intent(this, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT).putExtra(MainActivity.EXTRA_OPEN, 0)); } catch (RuntimeException ignored) { }
                return true;
            default:
                return null; // 이전 · 다음(길게) 등은 원래 키 그대로 → 앱이 앞뒤 곡 · 영상으로 씀
        }
    }

    private void finishOk(int c) {
        String a = RemoteMap.map(this).optString(KeyEvent.keyCodeToString(c), "");
        if (!a.equals("ok") || okDown == 0) return;
        long held = android.os.SystemClock.uptimeMillis() - okDown;
        okDown = 0;
        if (held >= 500) media(KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE);
        else dpad("ok");
    }

    /** 앱에 방향 · 확인 키 보내기: 안드로이드 13+ 는 접근성 동작, 그 아래는 Shizuku로 */
    private void dpad(String a) {
        final int k = a.equals("up") ? KeyEvent.KEYCODE_DPAD_UP : a.equals("down") ? KeyEvent.KEYCODE_DPAD_DOWN : a.equals("left") ? KeyEvent.KEYCODE_DPAD_LEFT
                : a.equals("right") ? KeyEvent.KEYCODE_DPAD_RIGHT : KeyEvent.KEYCODE_DPAD_CENTER;
        // 1) Shizuku: 앱이 떠 있는 DeX 화면에 바로 키 넣기 (가장 확실)
        if (Shizu.granted()) {
            final int d = MainActivity.tvDisplay;
            new Thread(() -> {
                boolean ok = Sys.injectKey(k, d);
                if (logged < 16) { logged++; Sys.log("  키 넣기 " + a + " 화면 " + d + (ok ? " ✓" : " ✗ → 접근성 동작으로")); }
                if (!ok) globalDpad(a);
            }).start();
            return;
        }
        globalDpad(a);
    }

    private void globalDpad(String a) {
        if (Build.VERSION.SDK_INT >= 33) {
            int g = a.equals("up") ? GLOBAL_ACTION_DPAD_UP : a.equals("down") ? GLOBAL_ACTION_DPAD_DOWN : a.equals("left") ? GLOBAL_ACTION_DPAD_LEFT
                    : a.equals("right") ? GLOBAL_ACTION_DPAD_RIGHT : GLOBAL_ACTION_DPAD_CENTER;
            boolean ok = performGlobalAction(g);
            if (logged < 16) { logged++; Sys.log("  접근성 방향 동작 " + a + (ok ? " ✓" : " ✗")); }
        } else if (logged < 16) { logged++; Sys.log("  안드로이드 12 이하: Shizuku 연결이 있어야 위 · 아래를 보낼 수 있음"); }
    }

    private void media(int code) {
        AudioManager am = (AudioManager) getSystemService(AUDIO_SERVICE);
        if (am == null) return;
        long t = android.os.SystemClock.uptimeMillis();
        am.dispatchMediaKeyEvent(new KeyEvent(t, t, KeyEvent.ACTION_DOWN, code, 0));
        am.dispatchMediaKeyEvent(new KeyEvent(t, t, KeyEvent.ACTION_UP, code, 0));
    }

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        live = true; Sys.bypass();
        Sys.log("키 서비스 연결됨");
    }

    @Override
    public void onDestroy() { live = false; super.onDestroy(); }

    @Override public void onAccessibilityEvent(AccessibilityEvent event) { }
    @Override public void onInterrupt() { }
}
