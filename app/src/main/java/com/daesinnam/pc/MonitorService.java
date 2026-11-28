package com.daesinnam.pc;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ServiceInfo;
import android.hardware.display.DisplayManager;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;
import android.view.Display;

/**
 * 모니터 연결 지켜보기 (켜 두면): 모니터를 꽂으면 바로 PC 화면을 모니터에 엽니다.
 *
 * 안드로이드는 화면에 보이지 않는 앱이 마음대로 화면을 여는 것을 막습니다. 터치패드(접근성)가 켜져 있거나
 * "다른 앱 위에 표시"가 허용돼 있으면 바로 열리고, 아니면 알림의 "모니터에 열기"를 누르면 열립니다.
 */
public class MonitorService extends Service implements DisplayManager.DisplayListener {
    static final String TAG = "PcMonitorSvc";
    private static final String CHANNEL = "monitor";
    private static final int NOTI_ID = 5;
    static volatile boolean running;

    private DisplayManager dm;
    private final Handler main = new Handler(Looper.getMainLooper());
    private int lastOpened = -1;

    static void sync(Context c) {
        boolean on = c.getSharedPreferences("pc", MODE_PRIVATE).getBoolean("autoOpen", true);
        Intent i = new Intent(c, MonitorService.class);
        try {
            if (on) c.startForegroundService(i);
            else c.stopService(i);
        } catch (Exception e) {
            Log.w(TAG, "sync " + e);
        }
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }

    @Override
    public void onCreate() {
        super.onCreate();
        dm = getSystemService(DisplayManager.class);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        try {
            if (Build.VERSION.SDK_INT >= 34) startForeground(NOTI_ID, notification(Monitor.find(this)), ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
            else startForeground(NOTI_ID, notification(Monitor.find(this)));
        } catch (Exception e) {
            Log.w(TAG, "foreground " + e);
            stopSelf();
            return START_NOT_STICKY;
        }
        if (!running) {
            running = true;
            dm.registerDisplayListener(this, main);
            Log.i(TAG, "watching displays");
        }
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        running = false;
        if (dm != null) dm.unregisterDisplayListener(this);
        super.onDestroy();
    }

    private Notification notification(Display d) {
        NotificationManager nm = getSystemService(NotificationManager.class);
        if (nm.getNotificationChannel(CHANNEL) == null)
            nm.createNotificationChannel(new NotificationChannel(CHANNEL, "모니터 연결", NotificationManager.IMPORTANCE_LOW));
        PendingIntent phone = PendingIntent.getActivity(this, 40, new Intent(this, PhoneActivity.class), PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder b = new Notification.Builder(this, CHANNEL)
                .setSmallIcon(R.drawable.ic_stat_monitor)
                .setOngoing(true)
                .setShowWhen(false);
        if (d != null) {
            PendingIntent open = Monitor.openPending(this, d);
            b.setContentTitle("모니터 연결됨 · " + d.getName())
             .setContentText("눌러서 모니터에 PC 화면 열기")
             .setContentIntent(open)
             .addAction(new Notification.Action.Builder(null, "모니터에 열기", open).build())
             .addAction(new Notification.Action.Builder(null, "터치패드", phone).build());
        } else {
            b.setContentTitle("모니터를 기다리는 중")
             .setContentText("꽂으면 PC 화면을 모니터에 열어요")
             .setContentIntent(phone);
        }
        return b.build();
    }

    private void refresh() {
        getSystemService(NotificationManager.class).notify(NOTI_ID, notification(Monitor.find(this)));
    }

    @Override
    public void onDisplayAdded(int displayId) {
        // 화면이 막 생긴 직후에는 크기 등이 아직 준비 안 된 기기가 있어 잠깐 기다림
        main.postDelayed(() -> {
            Display d = Monitor.find(this);
            refresh();
            SharedPreferences p = getSharedPreferences("pc", MODE_PRIVATE);
            if (d != null && d.getDisplayId() != lastOpened && p.getBoolean("autoOpen", true)) {
                lastOpened = d.getDisplayId();
                Log.i(TAG, "monitor added " + d.getDisplayId() + " → open desktop");
                Monitor.openDesktop(this, d);
            }
        }, 800);
    }

    @Override
    public void onDisplayRemoved(int displayId) {
        if (displayId == lastOpened) lastOpened = -1;
        refresh();
    }

    @Override
    public void onDisplayChanged(int displayId) { }
}
