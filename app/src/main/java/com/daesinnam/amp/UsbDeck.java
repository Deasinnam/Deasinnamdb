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
 * PC 프로그램(SDLibrary)과 같은 순서로 인사(HAN) → 화면 켜기(DIS) → 밝기(LIG) → 연결 유지(CONNECT)를 보내고,
 * 들어오는 보고서를 그대로 웹 화면에 넘깁니다(어떤 키인지는 웹 쪽에서 '키 배우기'로 정함).
 * 장치에 저장된 설정·펌웨어는 바꾸지 않습니다.
 */
final class UsbDeck {
    interface Sink { void onReport(String hex); void onState(String json); }

    // 알려진 장치: 몬스타덱 TS115 v3(0x0400:0x1000), MiraBox/HotSpot 계열 몇 가지
    private static final int[][] KNOWN = { {0x0400, 0x1000}, {0x5500, 0x1001}, {0x5500, 0x1002}, {0x6603, 0x1005}, {0x6603, 0x1006}, {0x6602, 0x1001} };
    private static final String ACTION = "com.daesinnam.amp.USB_DECK_PERMISSION";

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
                if (i.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false) && d != null) open(d);
                else { lastErr = "USB 사용을 허용하지 않았어요"; state(); }
            } else if (UsbManager.ACTION_USB_DEVICE_DETACHED.equals(a)) {
                if (d != null && dev != null && d.getDeviceId() == dev.getDeviceId()) { close(); lastErr = ""; state(); }
            } else if (UsbManager.ACTION_USB_DEVICE_ATTACHED.equals(a)) {
                if (isDeck(d)) connect();
            }
        }
    };

    void start() {
        if (registered || um == null) return;
        IntentFilter f = new IntentFilter(ACTION);
        f.addAction(UsbManager.ACTION_USB_DEVICE_DETACHED);
        f.addAction(UsbManager.ACTION_USB_DEVICE_ATTACHED);
        if (Build.VERSION.SDK_INT >= 33) ctx.registerReceiver(rx, f, Context.RECEIVER_NOT_EXPORTED);
        else ctx.registerReceiver(rx, f);
        registered = true;
    }

    void stop() {
        close();
        if (registered) { try { ctx.unregisterReceiver(rx); } catch (Exception ignored) {} registered = false; }
    }

    /** 연결(필요하면 USB 사용 허용 창을 띄움). 장치가 없으면 false */
    boolean connect() {
        start();
        UsbDevice d = find();
        if (d == null) { lastErr = "몬스타덱이 연결되어 있지 않아요"; state(); return false; }
        if (conn != null && dev != null && dev.getDeviceId() == d.getDeviceId()) { state(); return true; }
        if (um.hasPermission(d)) { open(d); return true; }
        int fl = Build.VERSION.SDK_INT >= 31 ? PendingIntent.FLAG_MUTABLE : 0;
        Intent it = new Intent(ACTION).setPackage(ctx.getPackageName());
        um.requestPermission(d, PendingIntent.getBroadcast(ctx, 0, it, fl | PendingIntent.FLAG_UPDATE_CURRENT));
        lastErr = "USB 사용 허용을 기다리는 중"; state();
        return true;
    }

    private synchronized void open(UsbDevice d) {
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
            if (!c.claimInterface(pick, true)) { lastErr = "다른 앱이 장치를 쓰고 있어요"; c.close(); state(); return; }
            dev = d; conn = c; iface = pick; in = ei; out = eo; lastErr = "";
            run = true;
            // PC 프로그램과 같은 순서: 인사 → 화면 켜기 → 밝기 → 연결 유지
            send(pkt("HAN"));
            send(crt("DIS"));
            setBrightness(brightness);
            send(crt("CONNECT"));
            reader = new Thread(this::readLoop, "deck-read"); reader.start();
            beat = new Thread(() -> {
                while (run) { try { Thread.sleep(5000); } catch (InterruptedException e) { return; } if (run) send(crt("CONNECT")); }
            }, "deck-beat");
            beat.start();
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

    /** 키 화면 밝기 0~100 */
    void setBrightness(int pct) {
        brightness = Math.max(0, Math.min(100, pct));
        byte[] b = crt("LIG\0\0");
        b[10] = (byte) brightness;
        send(b);
    }

    void wake() { send(crt("DIS")); }

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
