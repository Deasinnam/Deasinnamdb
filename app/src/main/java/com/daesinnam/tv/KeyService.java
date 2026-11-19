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
        if (Build.VERSION.SDK_INT >= 33) {
            int g = a.equals("up") ? GLOBAL_ACTION_DPAD_UP : a.equals("down") ? GLOBAL_ACTION_DPAD_DOWN : a.equals("left") ? GLOBAL_ACTION_DPAD_LEFT
                    : a.equals("right") ? GLOBAL_ACTION_DPAD_RIGHT : GLOBAL_ACTION_DPAD_CENTER;
            if (performGlobalAction(g)) return;
        }
        final int k = a.equals("up") ? 19 : a.equals("down") ? 20 : a.equals("left") ? 21 : a.equals("right") ? 22 : 23;
        if (Shizu.granted()) new Thread(() -> Shizu.run("input keyevent " + k, 2000)).start();
    }

    private void media(int code) {
        AudioManager am = (AudioManager) getSystemService(AUDIO_SERVICE);
        if (am == null) return;
        long t = android.os.SystemClock.uptimeMillis();
        am.dispatchMediaKeyEvent(new KeyEvent(t, t, KeyEvent.ACTION_DOWN, code, 0));
        am.dispatchMediaKeyEvent(new KeyEvent(t, t, KeyEvent.ACTION_UP, code, 0));
    }

    @Override public void onAccessibilityEvent(AccessibilityEvent event) { }
    @Override public void onInterrupt() { }
}
