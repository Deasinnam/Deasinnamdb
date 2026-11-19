package com.daesinnam.tv;

import android.accessibilityservice.AccessibilityService;
import android.content.Context;
import android.content.Intent;
import android.provider.Settings;
import android.view.KeyEvent;
import android.view.accessibility.AccessibilityEvent;

/**
 * 넷플릭스 등 다른 앱을 보는 중에도 블루투스 키보드로 덜누름 TV를 부르는 단축키.
 *   F12 · Alt+H      → 덜누름 TV 홈으로
 *   Alt+1 ~ Alt+9    → 내 서비스 그 번째를 바로 열기
 *   맞춤 리모컨(미테르 등)의 홈 단추 → 덜누름 TV 홈 (설정에서 끌 수 있음)
 * 이 두 가지만 가로채고 나머지 키는 그대로 지금 앱에 넘깁니다. 화면 내용은 읽지 않습니다.
 */
public class KeyService extends AccessibilityService {
    static final String COMPONENT = "com.daesinnam.tv/com.daesinnam.tv.KeyService";
    private int swallowUp = -1; // 가로챈 키의 '뗌'도 앱에 안 가게

    static boolean enabled(Context c) {
        String s = Settings.Secure.getString(c.getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
        return s != null && (s.contains(COMPONENT) || s.contains("com.daesinnam.tv/.KeyService"));
    }

    @Override
    protected boolean onKeyEvent(KeyEvent e) {
        int c = e.getKeyCode();
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

    @Override public void onAccessibilityEvent(AccessibilityEvent event) { }
    @Override public void onInterrupt() { }
}
