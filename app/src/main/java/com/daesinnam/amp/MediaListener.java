package com.daesinnam.amp;

import android.app.Notification;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;

/**
 * 알림 접근 권한을 받기 위한 서비스입니다.
 * 이 권한이 있어야 다른 앱(YouTube Music, Spotify)의 재생 정보를 읽고 조작할 수 있습니다.
 *
 * 1.62.1 에어포스원(스페셜판)만: 전화 앱의 "전화 옴" 알림(통화 분류)에서 건 사람 이름(또는 번호)만 읽어
 * 화면 오른쪽 아래에 보여 줍니다. 울리는 동안만 메모리에 두고, 알림이 사라지면 바로 지웁니다.
 * 저장하거나 밖으로 보내지 않습니다. 다른 알림의 내용은 읽지 않습니다. 다른 앱(flavor)에서는 아무것도 읽지 않습니다.
 *
 * 1.64 모든 앱: [AI] 버튼으로 연 ChatGPT·Claude 앱의 알림만(그 두 앱 것만) 읽어, 음성 대화가 이어지는 동안
 * 스피드미터에 'AI 대화 중'과 알림에 뜬 답 한 줄을 보여 줍니다. 메모리에만 두고, 알림이 사라지면 지웁니다.
 */
public class MediaListener extends NotificationListenerService {
    private static final boolean ON = "special".equals(BuildConfig.FLAVOR_device);
    /** 지금 울리는 전화(없으면 key == null) */
    static volatile String callKey = null, callName = null, callText = null;
    static volatile boolean callIncoming = false;
    static volatile long callTs = 0;

    /** 1.64 AI 앱(ChatGPT·Claude) 알림: 대화가 이어지는 동안의 상태와 답 한 줄(없으면 aiKey == null) */
    static final String[] AI_PKGS = { "com.openai.chatgpt", "com.anthropic.claude" };
    static volatile String aiKey = null, aiPkg = null, aiTitle = null, aiText = null;
    static volatile boolean aiOngoing = false;
    static volatile long aiTs = 0;

    private static boolean isAi(String pkg) { for (String p : AI_PKGS) if (p.equals(pkg)) return true; return false; }

    private void onAi(StatusBarNotification sbn) {
        try {
            Notification n = sbn.getNotification(); if (n == null) return;
            Bundle x = n.extras;
            CharSequence t = x != null ? x.getCharSequence(Notification.EXTRA_TITLE) : null;
            CharSequence b = x != null ? x.getCharSequence(Notification.EXTRA_BIG_TEXT) : null;
            CharSequence s = x != null ? x.getCharSequence(Notification.EXTRA_TEXT) : null;
            aiKey = sbn.getKey(); aiPkg = sbn.getPackageName();
            aiTitle = t != null ? t.toString() : null;
            String txt = b != null ? b.toString() : s != null ? s.toString() : null;
            aiText = txt != null && txt.length() > 400 ? txt.substring(0, 400) : txt;
            aiOngoing = (n.flags & Notification.FLAG_ONGOING_EVENT) != 0 || (n.flags & Notification.FLAG_FOREGROUND_SERVICE) != 0;
            aiTs = System.currentTimeMillis();
        } catch (Throwable ignored) {}
    }

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn != null && isAi(sbn.getPackageName())) { onAi(sbn); return; }
        if (!ON || sbn == null) return;
        try {
            Notification n = sbn.getNotification();
            if (n == null || !Notification.CATEGORY_CALL.equals(n.category)) return;
            Bundle x = n.extras;
            // 안드로이드 12+ 통화 알림: android.callType 1 = 걸려 옴, 2 = 통화 중, 3 = 걸러 받는 중. 그 전 버전은 전체 화면 알림이면 걸려 옴으로 봄
            int type = x != null ? x.getInt("android.callType", 0) : 0;
            boolean incoming = type == 1 || (type == 0 && n.fullScreenIntent != null);
            CharSequence t = x != null ? x.getCharSequence(Notification.EXTRA_TITLE) : null;
            CharSequence s = x != null ? x.getCharSequence(Notification.EXTRA_TEXT) : null;
            callKey = sbn.getKey();
            callName = t != null ? t.toString() : null;
            callText = s != null ? s.toString() : null;
            callIncoming = incoming;
            callTs = System.currentTimeMillis();
        } catch (Throwable ignored) {}
    }

    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {
        if (sbn != null && sbn.getKey() != null && sbn.getKey().equals(aiKey)) { aiKey = null; aiTitle = null; aiText = null; aiOngoing = false; aiTs = System.currentTimeMillis(); return; }
        if (!ON || sbn == null) return;
        if (sbn.getKey() != null && sbn.getKey().equals(callKey)) clearCall();
    }

    static void clearCall() { callKey = null; callName = null; callText = null; callIncoming = false; callTs = System.currentTimeMillis(); }
}
