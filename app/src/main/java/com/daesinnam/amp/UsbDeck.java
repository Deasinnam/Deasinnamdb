package com.daesinnam.amp;

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.hardware.usb.UsbConstants;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbDeviceConnection;
import android.hardware.usb.UsbEndpoint;
import android.hardware.usb.UsbInterface;
import android.hardware.usb.UsbManager;
import android.os.Build;

/**
 * 몬스타덱(MiraBox StreamDock 293V3 계열) USB 단축키 패드 읽기.
 *
 * 몬스타덱은 키를 눌러도 일반 키보드 신호를 보내지 않고, 제조사 전용 HID 보고서(512바이트)로 알립니다.
 * 키를 누르면 장치가 "ACK··OK··<키 번호>" 보고서를 보내므로, 아무 명령도 보내지 않고 들어오는 보고서를 그대로 웹 화면에 넘깁니다(어떤 키인지는 웹 쪽에서 '키 배우기'로 정함).
 * 장치에 저장된 설정·펌웨어는 바꾸지 않습니다.
 */
final class UsbDeck {
    interface Sink { void onReport(String hex); void onState(String json); }

    // 알려진 장치: 몬스타덱 TS115 v3(0x0400:0x1000), MiraBox/HotSpot 계열 몇 가지
    private static final int[][] KNOWN = { {0x0400, 0x1000}, {0x5500, 0x1001}, {0x5500, 0x1002}, {0x6603, 0x1005}, {0x6603, 0x1006}, {0x6602, 0x1001} };
    private static final String ACTION = "com.daesinnam.amp.USB_DECK_PERMISSION";
    // 1.62.6 대신남 앱이 여러 개 깔려 있으면(대신남 원·에어포스원 등) 먼저 연 앱이 덱을 붙잡고 있어 다른 앱은 키를 못 받았음.
    // 덱을 쓰려는 앱이 형제 앱에 "놓아 줘"를 보내고, 받은 앱은 연결을 닫음(앞에 있는 앱이 덱을 씀)
    static final String RELEASE = "com.daesinnam.action.DECK_RELEASE";
    private static final String[] SIBLINGS = { "com.daesinnam.one.v1", "com.daesinnam.one.v1.fold8", "com.daesinnam.oneapp", "com.daesinnam.ampapp", "com.daesinnam.specialapp", "com.daesinnam.dist.test", "com.daesinnam.one.androidtest" };
    private final android.os.Handler ui = new android.os.Handler(android.os.Looper.getMainLooper());

    private final Context ctx;
    private final UsbManager um;
    private final Sink sink;
    private UsbDevice dev;
    private UsbDeviceConnection conn;
    private UsbInterface iface;
    private UsbEndpoint in, out;
    private volatile boolean run;
    private Thread reader, beat;
    private String lastErr = "";
    private int brightness = 70;
    private boolean registered;

    UsbDeck(Context c, Sink s) {
        ctx = c.getApplicationContext();
        um = (UsbManager) ctx.getSystemService(Context.USB_SERVICE);
        sink = s;
    }

    static boolean isDeck(UsbDevice d) {
        if (d == null) return false;
        for (int[] k : KNOWN) if (d.getVendorId() == k[0] && d.getProductId() == k[1]) return true;
        return false;
    }

    UsbDevice find() {
        if (um == null) return null;
        for (UsbDevice d : um.getDeviceList().values()) if (isDeck(d)) return d;
        return null;
    }

    private final BroadcastReceiver rx = new BroadcastReceiver() {
        @Override public void onReceive(Context c, Intent i) {
            String a = i.getAction();
            UsbDevice d = i.getParcelableExtra(UsbManager.EXTRA_DEVICE);
            if (ACTION.equals(a)) {
                if (i.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false) && d != null) { askSiblings(); open(d, 0); }
                else { lastErr = "USB 사용을 허용하지 않았어요"; state(); }
            } else if (UsbManager.ACTION_USB_DEVICE_DETACHED.equals(a)) {
                if (d != null && dev != null && d.getDeviceId() == dev.getDeviceId()) { close(); lastErr = ""; state(); }
            } else if (UsbManager.ACTION_USB_DEVICE_ATTACHED.equals(a)) {
                if (isDeck(d)) connect();
            }
        }
    };

    private final BroadcastReceiver releaseRx = new BroadcastReceiver() {
        @Override public void onReceive(Context c, Intent i) {
            if (ctx.getPackageName().equals(i.getStringExtra("from"))) return;
            if (conn != null) { close(); lastErr = "다른 대신남 앱이 몬스타덱을 쓰는 중이에요(이 앱으로 돌아오면 다시 연결)"; state(); }
        }
    };

    private void askSiblings() {
        String me = ctx.getPackageName();
        for (String p : SIBLINGS) {
            if (p.equals(me)) continue;
            try { ctx.sendBroadcast(new Intent(RELEASE).setPackage(p).putExtra("from", me)); } catch (Exception ignored) {}
        }
    }

    boolean isOpen() { return conn != null; }

    /** 앱이 앞으로 나올 때: 덱이 꽂혀 있고 이미 허용된 경우에만 다시 연결(허용 창을 또 띄우지 않음) */
    void resumeIfAllowed() {
        if (um == null || conn != null) return;
        UsbDevice d = find();
        if (d == null) return;
        // 1.69 아직 이 앱에 USB 사용을 허용하지 않았으면(다른 대신남 앱만 허용한 경우 등) 앱을 켠 뒤 한 번은 허용 창을 띄움
        if (um.hasPermission(d) || !askedOnce) { askedOnce = true; connect(); }
    }
    private boolean askedOnce = false;

    void start() {
        if (registered || um == null) return;
        if (Build.VERSION.SDK_INT >= 33) ctx.registerReceiver(releaseRx, new IntentFilter(RELEASE), Context.RECEIVER_EXPORTED);
        else ctx.registerReceiver(releaseRx, new IntentFilter(RELEASE));
        IntentFilter f = new IntentFilter(ACTION);
        f.addAction(UsbManager.ACTION_USB_DEVICE_DETACHED);
        f.addAction(UsbManager.ACTION_USB_DEVICE_ATTACHED);
        if (Build.VERSION.SDK_INT >= 33) ctx.registerReceiver(rx, f, Context.RECEIVER_NOT_EXPORTED);
        else ctx.registerReceiver(rx, f);
        registered = true;
    }

    void stop() {
        close();
        if (registered) { try { ctx.unregisterReceiver(rx); } catch (Exception ignored) {} try { ctx.unregisterReceiver(releaseRx); } catch (Exception ignored) {} registered = false; }
    }

    /** 연결(필요하면 USB 사용 허용 창을 띄움). 장치가 없으면 false */
    boolean connect() {
        start();
        UsbDevice d = find();
        if (d == null) { lastErr = "몬스타덱이 연결되어 있지 않아요"; state(); return false; }
        if (conn != null && dev != null && dev.getDeviceId() == d.getDeviceId()) { state(); return true; }
        askSiblings();
        if (um.hasPermission(d)) { open(d, 0); return true; }
        int fl = Build.VERSION.SDK_INT >= 31 ? PendingIntent.FLAG_MUTABLE : 0;
        Intent it = new Intent(ACTION).setPackage(ctx.getPackageName());
        um.requestPermission(d, PendingIntent.getBroadcast(ctx, 0, it, fl | PendingIntent.FLAG_UPDATE_CURRENT));
        lastErr = "USB 사용 허용을 기다리는 중"; state();
        return true;
    }

    private synchronized void open(final UsbDevice d, final int tries) {
        close();
        try {
            UsbInterface pick = null;
            for (int i = 0; i < d.getInterfaceCount() && pick == null; i++) {
                UsbInterface f = d.getInterface(i);
                if (f.getInterfaceClass() == UsbConstants.USB_CLASS_HID || d.getInterfaceCount() == 1) pick = f;
            }
            if (pick == null) { lastErr = "장치 인터페이스를 찾지 못했어요"; state(); return; }
            UsbEndpoint ei = null, eo = null;
            for (int i = 0; i < pick.getEndpointCount(); i++) {
                UsbEndpoint e = pick.getEndpoint(i);
                if (e.getDirection() == UsbConstants.USB_DIR_IN && ei == null) ei = e;
                if (e.getDirection() == UsbConstants.USB_DIR_OUT && eo == null) eo = e;
            }
            UsbDeviceConnection c = um.openDevice(d);
            if (c == null || ei == null) { lastErr = "장치를 열지 못했어요"; if (c != null) c.close(); state(); return; }
            if (!c.claimInterface(pick, true)) {
                c.close();
                // 형제 앱이 놓아 주는 동안 잠깐 기다렸다 다시(최대 약 4초)
                // 1.69 최대 약 8초, 2초마다 형제 앱에 다시 놓아 달라고 함
                if (tries < 16) { if (tries % 4 == 3) askSiblings(); lastErr = "몬스타덱 연결 중…"; state(); ui.postDelayed(() -> { if (conn == null) open(d, tries + 1); }, 500); return; }
                lastErr = "다른 앱이 장치를 쓰고 있어요(다른 대신남 앱을 닫고 다시 연결)"; state(); return;
            }
            dev = d; conn = c; iface = pick; in = ei; out = eo; lastErr = "";
            run = true;
            // TS115(펌웨어 V2.293S)는 꽂자마자 키를 누를 때마다 "ACK··OK··<키>"를 보냄. 아무 명령도 보내지 않고 읽기만 함.
            // (실측: "CRT··DIS"를 보내면 그 뒤로 키 신호가 끊김 → 보내지 않음. 밝기는 사용자가 바꿀 때만)
            reader = new Thread(this::readLoop, "deck-read"); reader.start();
            state();
        } catch (Exception e) { lastErr = "연결 오류: " + e.getMessage(); close(); state(); }
    }

    private void readLoop() {
        final UsbEndpoint ep = in; if (ep == null) return;
        byte[] buf = new byte[Math.max(ep.getMaxPacketSize(), 512)];
        while (run) {
            UsbDeviceConnection c = conn; if (c == null) break;
            int r;
            try { r = c.bulkTransfer(ep, buf, buf.length, 250); } catch (Exception e) { break; }
            if (r > 0) {
                int len = r; while (len > 0 && buf[len - 1] == 0) len--;
                if (len == 0) continue;
                if (buf[0] == 'H' && buf[1] == 'A' && buf[2] == 'N') send(pkt("HAN")); // 장치가 인사를 청하면 다시 인사
                StringBuilder sb = new StringBuilder(Math.min(len, 32) * 2);
                for (int i = 0; i < Math.min(len, 32); i++) sb.append(String.format("%02x", buf[i] & 0xff));
                sink.onReport(sb.toString());
            } else if (r < 0 && find() == null) break;
        }
    }

    synchronized void close() {
        run = false;
        if (beat != null) beat.interrupt();
        beat = null; reader = null;
        if (conn != null) {
            try { if (iface != null) conn.releaseInterface(iface); } catch (Exception ignored) {}
            try { conn.close(); } catch (Exception ignored) {}
        }
        conn = null; iface = null; in = null; out = null; dev = null;
    }

    private static byte[] pkt(String head) {
        byte[] b = new byte[512];
        byte[] h = head.getBytes(java.nio.charset.StandardCharsets.ISO_8859_1);
        System.arraycopy(h, 0, b, 0, h.length);
        return b;
    }
    private static byte[] crt(String cmd) { return pkt("CRT\0\0" + cmd); }

    private boolean send(byte[] b) {
        UsbDeviceConnection c = conn; if (c == null) return false;
        try {
            if (out != null) return c.bulkTransfer(out, b, b.length, 500) >= 0;
            // OUT 엔드포인트가 없으면 HID SET_REPORT(출력 보고서)
            return c.controlTransfer(0x21, 0x09, 0x0200, iface.getId(), b, b.length, 500) >= 0;
        } catch (Exception e) { return false; }
    }

    /**
     * 키 그림 넣기: 화면 켜기(DIS) → 화면 위치 1~15에 기능 아이콘, 오른쪽 세로 화면 3칸에 로고 → 새로고침(STP).
     * (실측: DIS 뒤에는 키 신호가 멈췄다가 STP로 그림을 확정하면 다시 옴) 그림은 assets/deck/*.jpg(장치 방향에 맞게 미리 돌려 둠)
     */
    void sendImages(final String[] acts) {
        if (conn == null) return;
        new Thread(() -> {
            synchronized (UsbDeck.this) {
                try {
                    send(crt("DIS"));
                    { byte[] c = crt("CLE\0\0\0"); c[11] = (byte) 0xff; send(c); } // 화면 전체 지우기(다른 프로그램이 남긴 그림 정리)
                    for (int pos = 1; pos <= 15; pos++) {
                        String a = acts != null && pos - 1 < acts.length && acts[pos - 1] != null ? acts[pos - 1] : "none";
                        byte[] img = asset("deck/act_" + a.replaceAll("[^A-Za-z]", "") + ".jpg");
                        if (img == null) img = asset("deck/act_none.jpg");
                        int r = (pos - 1) / 5, c = (pos - 1) % 5;
                        bat((4 - c) * 3 + r + 1, img);
                    }
                    for (int i = 0; i < 3; i++) { byte[] img = asset("deck/side" + (i + 1) + ".jpg"); if (img != null) bat(16 + i, img); }
                } catch (Exception ignored) {
                } finally {
                    send(crt("STP")); // 1.69 그림을 넣다 실패해도 꼭 확정 — DIS 뒤 STP가 없으면 키 신호가 끊겨 '반응 없음'이 됨
                }
            }
        }, "deck-img").start();
    }

    private byte[] asset(String name) {
        try (java.io.InputStream in = ctx.getAssets().open(name)) {
            java.io.ByteArrayOutputStream o = new java.io.ByteArrayOutputStream();
            byte[] b = new byte[4096]; int n; while ((n = in.read(b)) > 0) o.write(b, 0, n);
            return o.toByteArray();
        } catch (Exception e) { return null; }
    }

    private void bat(int dev, byte[] img) {
        if (img == null || img.length > 0xffff) return;
        byte[] h = crt("BAT\0\0");
        h[10] = (byte) ((img.length >> 8) & 0xff); h[11] = (byte) (img.length & 0xff); h[12] = (byte) dev;
        send(h);
        for (int i = 0; i < img.length; i += 512) {
            byte[] p = new byte[512];
            System.arraycopy(img, i, p, 0, Math.min(512, img.length - i));
            send(p);
        }
    }

    /** 키 화면 밝기 0~100 */
    void setBrightness(int pct) {
        brightness = Math.max(0, Math.min(100, pct));
        byte[] b = crt("LIG\0\0");
        b[10] = (byte) brightness;
        send(b);
    }


    String stateJson() {
        UsbDevice d = dev != null ? dev : find();
        try {
            org.json.JSONObject o = new org.json.JSONObject();
            o.put("present", d != null);
            o.put("open", conn != null);
            o.put("err", lastErr);
            if (d != null) {
                o.put("vid", String.format("%04x", d.getVendorId()));
                o.put("pid", String.format("%04x", d.getProductId()));
                o.put("name", d.getProductName() == null ? "" : d.getProductName());
            }
            org.json.JSONArray all = new org.json.JSONArray();
            if (um != null) for (UsbDevice x : um.getDeviceList().values()) {
                String nm = x.getProductName(); String mf = x.getManufacturerName();
                all.put(String.format("%04x:%04x", x.getVendorId(), x.getProductId()) + " " + (mf == null ? "" : mf) + " " + (nm == null ? "" : nm) + " (인터페이스 " + x.getInterfaceCount() + ")");
            }
            o.put("all", all);
            o.put("host", um != null);
            if (in != null) o.put("ep", in.getMaxPacketSize() + "/" + (out == null ? "ctl" : String.valueOf(out.getMaxPacketSize())));
            return o.toString();
        } catch (Exception e) { return "{}"; }
    }

    private void state() { sink.onState(stateJson()); }
}
