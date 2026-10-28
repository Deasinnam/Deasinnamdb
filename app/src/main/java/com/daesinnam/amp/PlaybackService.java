package com.daesinnam.amp;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.graphics.drawable.Icon;

/** 화면이 꺼지거나 다른 앱을 써도 음악이 끊기지 않도록 유지하는 포그라운드 서비스. */
public class PlaybackService extends Service {

    static final String ACTION_UPDATE = "com.daesinnam.amp.UPDATE";
    static final String ACTION_PREV = "com.daesinnam.amp.PREV";
    static final String ACTION_TOGGLE = "com.daesinnam.amp.TOGGLE";
    static final String ACTION_NEXT = "com.daesinnam.amp.NEXT";
    private static final String CHANNEL = "playback";
    private static final int NOTI_ID = 1;

    static volatile boolean running = false;

    private boolean playing = false;
    private String title = "Daesinnam Amp";
    private String artist = "";
    private PowerManager.WakeLock cpuLock;

    @Override
    public void onCreate() {
        super.onCreate();
        running = true;
        NotificationManager nm = getSystemService(NotificationManager.class);
        NotificationChannel ch = new NotificationChannel(CHANNEL, getString(R.string.channel_name), NotificationManager.IMPORTANCE_LOW);
        ch.setShowBadge(false);
        nm.createNotificationChannel(ch);
        PowerManager pm = getSystemService(PowerManager.class);
        cpuLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "DaesinnamAmp:playback");
        cpuLock.setReferenceCounted(false);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : null;
        if (ACTION_UPDATE.equals(action)) {
            playing = intent.getBooleanExtra("playing", false);
            String t = intent.getStringExtra("title");
            String a = intent.getStringExtra("artist");
            if (t != null && !t.isEmpty()) title = t;
            artist = a != null ? a : "";
        } else if (action != null) {
            MainActivity act = MainActivity.current.get();
            if (act != null) {
                if (ACTION_PREV.equals(action)) act.control("prev");
                else if (ACTION_NEXT.equals(action)) act.control("next");
                else if (ACTION_TOGGLE.equals(action)) act.control("toggle");
            }
        }

        Notification n = build();
        if (Build.VERSION.SDK_INT >= 29) {
            startForeground(NOTI_ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        } else {
            startForeground(NOTI_ID, n);
        }

        if (playing) cpuLock.acquire(6 * 60 * 60 * 1000L);
        else if (cpuLock.isHeld()) cpuLock.release();
        return START_NOT_STICKY;
    }

    private PendingIntent action(String a, int code) {
        Intent i = new Intent(this, PlaybackService.class).setAction(a);
        return PendingIntent.getService(this, code, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    private Notification build() {
        Intent open = new Intent(this, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent content = PendingIntent.getActivity(this, 0, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);

        Notification.Builder b = new Notification.Builder(this, CHANNEL)
                .setSmallIcon(R.drawable.ic_stat)
                .setContentTitle(title)
                .setContentText(artist.isEmpty() ? (playing ? "재생 중" : "일시정지") : artist)
                .setContentIntent(content)
                .setColor(0xFFFF8C1A)
                .setOngoing(playing)
                .setOnlyAlertOnce(true)
                .setVisibility(Notification.VISIBILITY_PUBLIC)
                .addAction(new Notification.Action.Builder(Icon.createWithResource(this, android.R.drawable.ic_media_previous), "이전", action(ACTION_PREV, 1)).build())
                .addAction(new Notification.Action.Builder(Icon.createWithResource(this, playing ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play), playing ? "일시정지" : "재생", action(ACTION_TOGGLE, 2)).build())
                .addAction(new Notification.Action.Builder(Icon.createWithResource(this, android.R.drawable.ic_media_next), "다음", action(ACTION_NEXT, 3)).build())
                .setStyle(new Notification.MediaStyle().setShowActionsInCompactView(0, 1, 2));
        return b.build();
    }

    @Override
    public void onDestroy() {
        running = false;
        if (cpuLock != null && cpuLock.isHeld()) cpuLock.release();
        stopForeground(STOP_FOREGROUND_REMOVE);
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
