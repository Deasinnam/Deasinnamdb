package com.daesinnam.tableorder;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ServiceInfo;
import android.media.AudioManager;
import android.media.ToneGenerator;
import android.net.nsd.NsdManager;
import android.net.nsd.NsdServiceInfo;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.security.SecureRandom;

/**
 * 카운터 기기(사장님 폴드)에서 주문 서버를 켜 두는 서비스.
 * 화면이 꺼지거나 다른 앱을 써도 테이블 주문을 받고, 새 주문이 오면 알림과 소리로 알려 줍니다.
 * 와이파이에서 "덜누름 테이블오더 카운터"로 보이게 알려(NSD) 테이블 주문기가 자동으로 찾습니다.
 */
public class OrderService extends Service implements OrderServer.Listener {
    static final String NSD_TYPE = "_deoltable._tcp.";
    private static final String CH_RUN = "running", CH_ORDER = "orders_bell";
    private static final int ID_RUN = 1;

    static volatile Store store;
    static volatile boolean running;
    private OrderServer server;
    private NsdManager nsd;
    private NsdManager.RegistrationListener reg;
    private WifiManager.WifiLock wifiLock;
    private PowerManager.WakeLock wakeLock;
    private int orderNotiId = 100;

    static Store store(Context c) {
        if (store == null) {
            synchronized (OrderService.class) {
                if (store == null) store = new Store(c.getApplicationContext().getFilesDir());
            }
        }
        return store;
    }

    /** 사장님 화면이 /api/admin 에 쓰는 열쇠(기기마다 한 번 만들어 보관) */
    static synchronized String key(Context c) {
        SharedPreferences p = c.getSharedPreferences("tableorder", MODE_PRIVATE);
        String k = p.getString("adminKey", null);
        if (k == null) {
            byte[] b = new byte[16];
            new SecureRandom().nextBytes(b);
            StringBuilder sb = new StringBuilder();
            for (byte x : b) sb.append(String.format("%02x", x));
            k = sb.toString();
            p.edit().putString("adminKey", k).apply();
        }
        return k;
    }

    static File imgDir(Context c) {
        File d = new File(c.getApplicationContext().getFilesDir(), "img");
        if (!d.isDirectory()) d.mkdirs();
        return d;
    }

    static void start(Context c) {
        Intent i = new Intent(c, OrderService.class);
        if (Build.VERSION.SDK_INT >= 26) c.startForegroundService(i); else c.startService(i);
    }

    static void stop(Context c) { c.stopService(new Intent(c, OrderService.class)); }

    @Override
    public void onCreate() {
        super.onCreate();
        NotificationManager nm = getSystemService(NotificationManager.class);
        if (Build.VERSION.SDK_INT >= 26 && nm != null) {
            nm.createNotificationChannel(new NotificationChannel(CH_RUN, "주문 받는 중", NotificationManager.IMPORTANCE_MIN));
            try { nm.deleteNotificationChannel("orders"); } catch (Exception ignored) { } // 0.1 채널(기본 알림음) 정리
            NotificationChannel ch = new NotificationChannel(CH_ORDER, "새 주문 · 직원 호출", NotificationManager.IMPORTANCE_HIGH);
            ch.enableVibration(true);
            ch.setSound(null, null); // 소리는 알림벨 설정으로 따로 울림
            nm.createNotificationChannel(ch);
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Notification n = build(CH_RUN, "주문 받는 중", "테이블 주문기에서 들어오는 주문을 받고 있습니다", false);
        try {
            if (Build.VERSION.SDK_INT >= 34) startForeground(ID_RUN, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
            else startForeground(ID_RUN, n);
        } catch (Exception e) {
            Log.w(OrderServer.TAG, "startForeground: " + e);
        }
        if (server == null) {
            server = new OrderServer(getAssets(), store(this), imgDir(this), key(this), this);
            server.ai = new AiImage(this, imgDir(this));
            server.devices = new Devices(this);
            try {
                server.start();
                running = true;
                register();
                hold();
            } catch (Exception e) {
                Log.e(OrderServer.TAG, "서버를 켜지 못했습니다: " + e);
                server = null;
            }
        }
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        running = false;
        if (server != null) server.stop();
        server = null;
        try { if (nsd != null && reg != null) nsd.unregisterService(reg); } catch (Exception ignored) { }
        if (wifiLock != null && wifiLock.isHeld()) wifiLock.release();
        if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }

    /** 와이파이에 "덜누름 테이블오더 · 가게 이름"으로 알리기 */
    private void register() {
        try {
            nsd = (NsdManager) getSystemService(NSD_SERVICE);
            NsdServiceInfo info = new NsdServiceInfo();
            String shop = "카운터";
            try { shop = store(this).adminView().getJSONObject("settings").optString("shop", "카운터"); } catch (Exception ignored) { }
            info.setServiceName(shop.length() > 40 ? shop.substring(0, 40) : shop);
            info.setServiceType(NSD_TYPE);
            info.setPort(OrderServer.PORT);
            reg = new NsdManager.RegistrationListener() {
                @Override public void onRegistrationFailed(NsdServiceInfo s, int e) { Log.w(OrderServer.TAG, "NSD 등록 실패 " + e); }
                @Override public void onUnregistrationFailed(NsdServiceInfo s, int e) { }
                @Override public void onServiceRegistered(NsdServiceInfo s) { Log.i(OrderServer.TAG, "NSD 등록: " + s.getServiceName()); }
                @Override public void onServiceUnregistered(NsdServiceInfo s) { }
            };
            nsd.registerService(info, NsdManager.PROTOCOL_DNS_SD, reg);
        } catch (Exception e) {
            Log.w(OrderServer.TAG, "NSD: " + e);
        }
    }

    /** 화면이 꺼져도 와이파이와 서버가 잠들지 않게 */
    private void hold() {
        try {
            WifiManager wm = (WifiManager) getApplicationContext().getSystemService(WIFI_SERVICE);
            wifiLock = wm.createWifiLock(Build.VERSION.SDK_INT >= 29 ? WifiManager.WIFI_MODE_FULL_HIGH_PERF : WifiManager.WIFI_MODE_FULL, "tableorder");
            wifiLock.acquire();
            PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "tableorder:server");
            wakeLock.acquire();
        } catch (Exception e) {
            Log.w(OrderServer.TAG, "lock: " + e);
        }
    }

    // ---------- 새 주문 · 호출 알림 ----------

    @Override
    public void onOrder(JSONObject od) {
        StringBuilder sb = new StringBuilder();
        JSONArray items = od.optJSONArray("items");
        for (int i = 0; items != null && i < items.length(); i++) {
            JSONObject it = items.optJSONObject(i);
            if (i > 0) sb.append(", ");
            sb.append(it.optString("name")).append(" ").append(it.optInt("qty"));
        }
        alert(od.optInt("table") + "번 테이블 · 새 주문 #" + od.optInt("no"), sb.toString());
    }

    @Override
    public void onCall(JSONObject c) {
        alert(c.optInt("table") + "번 테이블 · " + c.optString("what"), "테이블에서 부릅니다");
    }

    private void alert(String title, String text) {
        try {
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) nm.notify(orderNotiId++ % 1000 + 100, build(CH_ORDER, title, text, true));
            JSONObject st = null;
            try { st = store(this).adminView().getJSONObject("settings"); } catch (Exception ignored) { }
            boolean sound = st == null || st.optBoolean("sound", true);
            if (sound && !MainActivity.foreground) ring(st); // 앱 화면이 켜져 있으면 화면이 직접 울림
        } catch (Exception ignored) {
        }
    }

    /** 알림벨 울리기(기본 소리 또는 사장님이 올린 소리, 설정한 횟수만큼) */
    private android.media.MediaPlayer player;
    private void ring(JSONObject st) {
        try {
            if (player != null) { player.release(); player = null; }
            String bell = st == null ? "dingdong" : st.optString("bell", "dingdong");
            final int[] left = {st == null ? 2 : Math.max(1, Math.min(3, st.optInt("bellRepeat", 2)))};
            android.media.MediaPlayer mp = new android.media.MediaPlayer();
            mp.setAudioAttributes(new android.media.AudioAttributes.Builder().setUsage(android.media.AudioAttributes.USAGE_NOTIFICATION_EVENT)
                    .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION).build());
            String custom = st == null ? "" : st.optString("bellCustom");
            File cf = custom.startsWith("/sndc/") ? new File(new File(getFilesDir(), "snd"), custom.substring(6)) : null;
            if ("custom".equals(bell) && cf != null && cf.isFile()) mp.setDataSource(cf.getPath());
            else {
                String name = "custom".equals(bell) ? "dingdong" : bell;
                android.content.res.AssetFileDescriptor fd = getAssets().openFd("web/snd/" + name + ".wav");
                mp.setDataSource(fd.getFileDescriptor(), fd.getStartOffset(), fd.getLength());
                fd.close();
            }
            mp.setOnCompletionListener(m -> { if (--left[0] > 0) m.start(); else { m.release(); if (player == m) player = null; } });
            mp.prepare();
            mp.start();
            player = mp;
        } catch (Exception e) {
            try { new ToneGenerator(AudioManager.STREAM_NOTIFICATION, 90).startTone(ToneGenerator.TONE_PROP_BEEP2, 400); } catch (Exception ignored) { }
        }
    }

    private Notification build(String ch, String title, String text, boolean auto) {
        Intent open = new Intent(this, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pi = PendingIntent.getActivity(this, 0, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(this, ch) : new Notification.Builder(this);
        return b.setSmallIcon(android.R.drawable.stat_notify_more)
                .setContentTitle(title)
                .setContentText(text)
                .setContentIntent(pi)
                .setAutoCancel(auto)
                .setOngoing(!auto)
                .build();
    }
}
