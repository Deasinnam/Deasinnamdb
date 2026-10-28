package com.daesinnam.amp;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.bluetooth.BluetoothDevice;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import android.provider.Settings;

/**
 * 차(블루투스)에 연결되면 Daesinnam Amp를 열어 마지막 곡을 이어서 재생합니다.
 * - 앱이 켜져 있으면: 화면에서 바로 재생
 * - 앱이 꺼져 있고 "다른 앱 위에 표시" 권한이 있으면: 앱을 자동으로 열어 재생
 * - 그 외: "차량 연결됨 · 눌러서 재생" 알림 (안드로이드가 백그라운드 앱 실행을 막기 때문)
 */
public class CarConnect extends BroadcastReceiver {

    static final String EXTRA_AUTOPLAY = "carAutoplay";
    private static final String PREFS = "car";
    private static final String CHANNEL = "car";
    private static final int NOTI_ID = 7;

    static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    static boolean enabled(Context c) {
        return prefs(c).getBoolean("autoplay", false);
    }

    /** 지정한 차량 이름(비어 있으면 모든 블루투스 오디오 기기) */
    static String carName(Context c) {
        return prefs(c).getString("carName", "");
    }

    static boolean matches(Context c, String deviceName) {
        String want = carName(c);
        return want.isEmpty() || (deviceName != null && deviceName.equals(want));
    }

    static boolean hasBtPerm(Context c) {
        return Build.VERSION.SDK_INT < 31
                || c.checkSelfPermission(Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED;
    }

    static boolean canAutoLaunch(Context c) {
        return Settings.canDrawOverlays(c);
    }

    @Override
    public void onReceive(Context ctx, Intent intent) {
        if (!enabled(ctx)) return;
        String action = intent.getAction();
        boolean connected;
        if (BluetoothDevice.ACTION_ACL_CONNECTED.equals(action)) {
            connected = true;
        } else if ("android.bluetooth.headset.profile.action.CONNECTION_STATE_CHANGED".equals(action)) {
            connected = intent.getIntExtra("android.bluetooth.profile.extra.STATE", -1) == 2;
        } else {
            return;
        }
        if (!connected) return;

        String name = null;
        try {
            BluetoothDevice dev = intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
            if (dev != null && hasBtPerm(ctx)) name = dev.getName();
        } catch (Exception ignored) {}
        if (!matches(ctx, name)) return;

        MainActivity act = MainActivity.current.get();
        if (act != null && !act.isFinishing() && !act.isDestroyed()) {
            act.onCarConnected(name);
            return;
        }

        Intent open = new Intent(ctx, MainActivity.class)
                .putExtra(EXTRA_AUTOPLAY, true)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        if (canAutoLaunch(ctx)) {
            try {
                ctx.startActivity(open);
                return;
            } catch (Exception ignored) {}
        }
        notifyTapToPlay(ctx, open, name);
    }

    private static void notifyTapToPlay(Context ctx, Intent open, String name) {
        NotificationManager nm = ctx.getSystemService(NotificationManager.class);
        NotificationChannel ch = new NotificationChannel(CHANNEL, "차량 연결", NotificationManager.IMPORTANCE_HIGH);
        nm.createNotificationChannel(ch);
        PendingIntent pi = PendingIntent.getActivity(ctx, 30, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        Notification n = new Notification.Builder(ctx, CHANNEL)
                .setSmallIcon(R.drawable.ic_stat)
                .setColor(0xFF2F5BFF)
                .setContentTitle("차량에 연결됐어요" + (name != null ? " · " + name : ""))
                .setContentText("눌러서 Daesinnam Amp로 이어서 재생")
                .setContentIntent(pi)
                .setAutoCancel(true)
                .setCategory(Notification.CATEGORY_TRANSPORT)
                .build();
        nm.notify(NOTI_ID, n);
    }

    static void clearNotification(Context ctx) {
        try { ctx.getSystemService(NotificationManager.class).cancel(NOTI_ID); } catch (Exception ignored) {}
    }
}
