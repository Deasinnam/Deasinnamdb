package com.daesinnam.work;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;

/**
 * AI 도우미에서 ChatGPT · Claude 로그인을 브라우저로 여는 동안 앱을 "사용 중"으로 붙잡아 두는 짧은 서비스.
 *
 * 왜: 로그인은 브라우저에서 끝나고, 그 직후 앱 안 문서 엔진(Node)이 OpenAI · Anthropic 서버와 마지막 인증(토큰 교환)을 합니다.
 * 그때 앱은 뒤에 있어 최신 안드로이드(15~17)가 앱의 인터넷을 막거나 멈춰 세워 "연결하지 못했습니다(token-unreachable)"가 됩니다.
 * 짧은 포그라운드 서비스(shortService, 최대 3분)가 떠 있는 동안에는 막히지 않습니다. 앱으로 돌아오면 곧 스스로 끝납니다.
 * 기기 밖으로 보내는 것은 없고, 알림 권한이 없으면 알림은 보이지 않아도 됩니다.
 */
public class SignInKeepAlive extends Service {
    private static final String CHANNEL = "ai_sign_in";
    private static final int ID = 7101;
    private static final long MAX_MS = 170_000; // shortService 한도(3분)보다 조금 짧게
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable stopper = this::stopSelf;
    private static volatile boolean running;

    /** 로그인 주소로 보일 때만 켭니다 */
    static boolean isSignInUrl(String url) {
        if (url == null) return false;
        String u = url.toLowerCase(java.util.Locale.ROOT);
        return u.startsWith("https://auth.openai.com/") || u.startsWith("https://claude.ai/oauth")
                || u.startsWith("https://console.anthropic.com/oauth") || u.contains("/oauth/authorize");
    }

    static void start(Context c) {
        try {
            Intent i = new Intent(c, SignInKeepAlive.class);
            if (Build.VERSION.SDK_INT >= 26) c.startForegroundService(i); else c.startService(i);
        } catch (Exception ignored) {
            // 서비스를 못 띄워도 로그인 자체는 계속합니다
        }
    }

    /** 앱으로 돌아온 뒤 조금 더(마지막 인증이 끝날 시간) 두었다가 끕니다 */
    static void stopSoon(Context c) {
        if (!running) return;
        try {
            Intent i = new Intent(c, SignInKeepAlive.class).setAction("stopSoon");
            c.startService(i);
        } catch (Exception ignored) {
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && "stopSoon".equals(intent.getAction())) {
            handler.removeCallbacks(stopper);
            handler.postDelayed(stopper, 20_000);
            return START_NOT_STICKY;
        }
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        Notification.Builder b;
        if (Build.VERSION.SDK_INT >= 26) {
            if (nm != null && nm.getNotificationChannel(CHANNEL) == null) {
                nm.createNotificationChannel(new NotificationChannel(CHANNEL, "AI 연결", NotificationManager.IMPORTANCE_LOW));
            }
            b = new Notification.Builder(this, CHANNEL);
        } else {
            b = new Notification.Builder(this);
        }
        Notification n = b.setSmallIcon(android.R.drawable.stat_notify_sync)
                .setContentTitle("AI 연결 중")
                .setContentText("로그인을 마치면 덜누름 워크로 돌아오세요")
                .setOngoing(true)
                .build();
        try {
            if (Build.VERSION.SDK_INT >= 34) startForeground(ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_SHORT_SERVICE);
            else startForeground(ID, n);
        } catch (Exception e) {
            stopSelf();
            return START_NOT_STICKY;
        }
        running = true;
        handler.removeCallbacks(stopper);
        handler.postDelayed(stopper, MAX_MS);
        return START_NOT_STICKY;
    }

    @Override
    public void onTimeout(int startId) {
        stopSelf();
    }

    @Override
    public void onDestroy() {
        running = false;
        handler.removeCallbacks(stopper);
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
