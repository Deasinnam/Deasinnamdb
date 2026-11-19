package com.daesinnam.sseum;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.ServiceInfo;
import android.os.BatteryManager;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;

import org.json.JSONArray;

import java.util.ArrayList;
import java.util.List;

/**
 * 덜씀 지킴이: 사용자가 켠 자동 기능만 돕니다.
 *  - 배터리 덜씀 '전원을 뽑으면 자동으로': 뽑으면 절전 · 밝기 낮춤, 꽂으면 원래대로
 *  - 오래된 갤럭시 '자동 정리': 메모리가 '주의' 이상이면 1시간 넘게 안 쓴 앱을 정리 (3분마다 확인)
 */
public class GuardService extends Service {
    private static final String CH = "guard";
    private final Handler h = new Handler(Looper.getMainLooper());
    private long lastAuto;

    static boolean wanted(Context c) {
        SharedPreferences p = Cleaner.prefs(c);
        return p.getBoolean("batAuto", false) || p.getBoolean("autoClean", false);
    }

    /** 켤 일이 있으면 켜고, 없으면 끔 */
    static void sync(Context c) {
        Intent i = new Intent(c, GuardService.class);
        if (wanted(c)) { try { c.startForegroundService(i); } catch (RuntimeException ignored) { } }
        else c.stopService(i);
    }

    private final BroadcastReceiver power = new BroadcastReceiver() {
        @Override public void onReceive(Context c, Intent i) {
            if (!Cleaner.prefs(c).getBoolean("batAuto", false)) return;
            boolean plugged = Intent.ACTION_POWER_CONNECTED.equals(i.getAction());
            new Thread(() -> { if (plugged) Cleaner.batteryOff(c); else Cleaner.batteryOn(c); update(); }).start();
        }
    };

    private final Runnable tick = new Runnable() {
        @Override public void run() {
            if (Cleaner.prefs(GuardService.this).getBoolean("autoClean", false) && !"정상".equals(Cleaner.level(GuardService.this))
                    && System.currentTimeMillis() - lastAuto > 10 * 60_000L) {
                lastAuto = System.currentTimeMillis();
                new Thread(() -> {
                    JSONArray idle = Cleaner.idleApps(GuardService.this, 60);
                    List<String> p = new ArrayList<>();
                    for (int k = 0; k < idle.length(); k++) p.add(idle.optJSONObject(k).optString("pkg"));
                    if (p.isEmpty()) Cleaner.trimBackground(GuardService.this); else Cleaner.stopApps(GuardService.this, p);
                    Cleaner.prefs(GuardService.this).edit().putLong("autoLast", System.currentTimeMillis()).putInt("autoLastN", p.size()).apply();
                    update();
                }).start();
            }
            h.postDelayed(this, 3 * 60_000L);
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        NotificationManager nm = getSystemService(NotificationManager.class);
        nm.createNotificationChannel(new NotificationChannel(CH, "덜씀 지킴이", NotificationManager.IMPORTANCE_MIN));
        IntentFilter f = new IntentFilter(Intent.ACTION_POWER_CONNECTED);
        f.addAction(Intent.ACTION_POWER_DISCONNECTED);
        registerReceiver(power, f);
        h.postDelayed(tick, 20_000L);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Notification n = note();
        if (Build.VERSION.SDK_INT >= 34) startForeground(1, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
        else startForeground(1, n);
        if (!wanted(this)) { stopSelf(); return START_NOT_STICKY; }
        // 지금 배터리로 쓰는 중이면 바로 적용
        Intent b = registerReceiver(null, new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
        boolean plugged = b != null && b.getIntExtra(BatteryManager.EXTRA_PLUGGED, 0) != 0;
        if (Cleaner.prefs(this).getBoolean("batAuto", false) && !plugged && !Cleaner.prefs(this).getBoolean("batApplied", false))
            new Thread(() -> Cleaner.batteryOn(this)).start();
        return START_STICKY;
    }

    private Notification note() {
        SharedPreferences p = Cleaner.prefs(this);
        String t = (p.getBoolean("batAuto", false) ? "전원을 뽑으면 배터리 덜씀" : "") + (p.getBoolean("batAuto", false) && p.getBoolean("autoClean", false) ? " · " : "")
                + (p.getBoolean("autoClean", false) ? "메모리 부족하면 자동 정리" : "");
        PendingIntent pi = PendingIntent.getActivity(this, 0, new Intent(this, MainActivity.class), PendingIntent.FLAG_IMMUTABLE);
        return new Notification.Builder(this, CH).setSmallIcon(android.R.drawable.ic_menu_manage)
                .setContentTitle("덜씀 지킴이").setContentText(t).setContentIntent(pi).setOngoing(true).build();
    }

    private void update() { h.post(() -> getSystemService(NotificationManager.class).notify(1, note())); }

    @Override
    public void onDestroy() {
        h.removeCallbacksAndMessages(null);
        try { unregisterReceiver(power); } catch (RuntimeException ignored) { }
        super.onDestroy();
    }

    @Override public IBinder onBind(Intent intent) { return null; }
}
