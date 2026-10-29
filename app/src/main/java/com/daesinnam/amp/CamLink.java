package com.daesinnam.amp;

import android.annotation.SuppressLint;
import android.content.Context;
import android.net.ConnectivityManager;
import android.net.LinkAddress;
import android.net.LinkProperties;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkRequest;
import android.net.RouteInfo;
import android.net.wifi.WifiNetworkSpecifier;
import android.os.Build;
import android.os.PatternMatcher;
import android.os.SystemClock;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/**
 * D1 DASHCAM: 블랙박스 와이파이에 "이 앱만" 연결하고, 인터넷(기본 네트워크)은 모바일 데이터를 그대로 둡니다.
 *
 * - 카메라 와이파이는 ConnectivityManager.requestNetwork(WifiNetworkSpecifier, 인터넷 없음)로 앱 전용으로 잡거나,
 *   이미 시스템 와이파이로 연결돼 있으면 그 네트워크를 찾아 씁니다.
 * - 카메라와 주고받는 소켓만 Network.bindSocket()/getSocketFactory()로 그 와이파이에 묶습니다.
 *   bindProcessToNetwork는 쓰지 않으므로 앱의 다른 통신(지도 등)과 다른 앱은 모바일 데이터를 씁니다.
 * - 통신 방식 찾기: JHCMD(UDP 20000 → 영상 UDP 10900), RTSP(554), HTTP(80/8080) 등을 차례로 확인합니다.
 * - JHCMD 라이브: UDP로 받은 조각을 JPEG 한 장으로 모아 /cam/frame.jpg로 화면에 넘깁니다.
 *   (공개 구현 HeikoGr/wifi-cam-proxy의 JHCMD 설명을 참고. 제조사 라이브러리는 쓰지 않음)
 */
final class CamLink {

    private static final int JH_CMD_PORT = 20000;
    private static final int JH_VIDEO_PORT = 10900;
    private static final String[] FALLBACK_IPS = {"192.168.29.1", "192.168.25.1", "192.168.26.1", "192.168.27.1",
            "192.168.28.1", "192.168.30.1", "192.168.31.1", "192.168.32.1", "192.168.33.1", "192.168.34.1",
            "192.168.35.1", "192.168.1.1", "192.168.1.254", "192.168.0.1", "192.168.123.1", "192.168.254.1", "175.16.10.2"};

    private final Context ctx;
    private final ConnectivityManager cm;

    private volatile Network net;
    private volatile String state = "idle"; // idle | requesting | connected | lost | unavailable
    private volatile String via = "";
    private volatile String ssid = "";
    private volatile String lastErr = "";
    private ConnectivityManager.NetworkCallback cb;

    // 통신 방식 찾기
    private volatile boolean probing = false;
    private volatile JSONArray probe = new JSONArray();
    private volatile String camIp = "";
    private volatile String proto = "";

    // JHCMD 라이브
    private volatile boolean live = false;
    private Thread liveThread;
    private volatile byte[] frame;
    private volatile long frameAt = 0;
    private volatile int frames = 0;
    private volatile long packets = 0;
    private volatile float fps = 0;

    CamLink(Context c) {
        ctx = c.getApplicationContext();
        cm = ctx.getSystemService(ConnectivityManager.class);
    }

    // ---------- 연결

    /** 이미 연결된 카메라 와이파이가 있으면 바로 쓰고, 없으면 앱 전용 연결을 요청합니다. 반환: "existing" | "request" | "old" | "error" */
    synchronized String connect(String wantSsid, String pass) {
        ssid = wantSsid == null ? "" : wantSsid.trim();
        lastErr = "";
        Network ex = findExistingWifi();
        if (ex != null) {
            useNetwork(ex, "existing");
            return "existing";
        }
        if (Build.VERSION.SDK_INT < 29) {
            state = "unavailable";
            lastErr = "안드로이드 9 이하에서는 휴대폰 와이파이 설정에서 블랙박스 와이파이에 먼저 연결해 주세요.";
            return "old";
        }
        try {
            release();
            WifiNetworkSpecifier.Builder b = new WifiNetworkSpecifier.Builder();
            if (ssid.isEmpty() || ssid.endsWith("*")) {
                String prefix = ssid.isEmpty() ? "Car-Cam" : ssid.substring(0, ssid.length() - 1);
                b.setSsidPattern(new PatternMatcher(prefix, PatternMatcher.PATTERN_PREFIX));
            } else {
                b.setSsid(ssid);
            }
            if (pass != null && pass.length() >= 8) b.setWpa2Passphrase(pass);
            NetworkRequest req = new NetworkRequest.Builder()
                    .addTransportType(NetworkCapabilities.TRANSPORT_WIFI)
                    .removeCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                    .setNetworkSpecifier(b.build())
                    .build();
            cb = new ConnectivityManager.NetworkCallback() {
                @Override public void onAvailable(Network n) { useNetwork(n, "request"); }
                @Override public void onLost(Network n) { if (n.equals(net)) { net = null; state = "lost"; stopLive(); } }
                @Override public void onUnavailable() { state = "unavailable"; lastErr = "카메라 와이파이를 찾지 못했거나 연결을 취소했습니다."; }
            };
            state = "requesting";
            via = "request";
            cm.requestNetwork(req, cb);
            return "request";
        } catch (Exception e) {
            state = "unavailable";
            lastErr = "연결 요청 실패: " + e.getMessage();
            return "error";
        }
    }

    synchronized void disconnect() {
        stopLive();
        release();
        net = null;
        state = "idle";
        via = "";
    }

    private void release() {
        if (cb != null) {
            try { cm.unregisterNetworkCallback(cb); } catch (Exception ignored) {}
            cb = null;
        }
    }

    private void useNetwork(Network n, String how) {
        net = n;
        via = how;
        state = "connected";
        String gw = gateway(n);
        if (!gw.isEmpty() && camIp.isEmpty()) camIp = gw;
    }

    /** 인터넷이 없는 와이파이 중 카메라처럼 보이는 것(사설 대역 게이트웨이)을 찾습니다. */
    @SuppressLint("MissingPermission")
    private Network findExistingWifi() {
        try {
            for (Network n : cm.getAllNetworks()) {
                NetworkCapabilities c = cm.getNetworkCapabilities(n);
                if (c == null || !c.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) continue;
                LinkProperties lp = cm.getLinkProperties(n);
                if (lp == null) continue;
                String gw = gateway(n);
                boolean noInternet = !c.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED);
                if (noInternet && (gw.startsWith("192.168.") || gw.startsWith("175.16."))) return n;
            }
        } catch (Exception ignored) {}
        return null;
    }

    private String gateway(Network n) {
        try {
            LinkProperties lp = cm.getLinkProperties(n);
            if (lp == null) return "";
            for (RouteInfo r : lp.getRoutes()) {
                InetAddress g = r.getGateway();
                if (g instanceof Inet4Address && !g.isAnyLocalAddress()) return g.getHostAddress();
            }
            if (Build.VERSION.SDK_INT >= 30 && lp.getDhcpServerAddress() != null) return lp.getDhcpServerAddress().getHostAddress();
        } catch (Exception ignored) {}
        return "";
    }

    private String localIp(Network n) {
        try {
            LinkProperties lp = cm.getLinkProperties(n);
            if (lp == null) return "";
            for (LinkAddress a : lp.getLinkAddresses()) if (a.getAddress() instanceof Inet4Address) return a.getAddress().getHostAddress();
        } catch (Exception ignored) {}
        return "";
    }

    /** 앱 전체 기본 네트워크(카메라 소켓 외 통신)가 인터넷이 되는지 */
    private boolean defaultHasInternet() {
        try {
            Network d = cm.getActiveNetwork();
            NetworkCapabilities c = d == null ? null : cm.getNetworkCapabilities(d);
            return c != null && c.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED);
        } catch (Exception e) { return false; }
    }

    private String defaultKind() {
        try {
            Network d = cm.getActiveNetwork();
            NetworkCapabilities c = d == null ? null : cm.getNetworkCapabilities(d);
            if (c == null) return "none";
            if (c.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)) return "mobile";
            if (c.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) return "wifi";
            return "other";
        } catch (Exception e) { return "none"; }
    }

    String status() {
        JSONObject o = new JSONObject();
        try {
            Network n = net;
            o.put("state", state);
            o.put("via", via);
            o.put("ssid", ssid);
            o.put("err", lastErr);
            o.put("localIp", n == null ? "" : localIp(n));
            o.put("gateway", n == null ? "" : gateway(n));
            o.put("camIp", camIp);
            o.put("proto", proto);
            o.put("internet", defaultHasInternet());
            o.put("defaultNet", defaultKind());
            o.put("probing", probing);
            o.put("probe", probe);
            o.put("live", live);
            o.put("frames", frames);
            o.put("packets", packets);
            o.put("fps", Math.round(fps * 10) / 10.0);
            o.put("frameAge", frameAt == 0 ? -1 : SystemClock.elapsedRealtime() - frameAt);
        } catch (Exception ignored) {}
        return o.toString();
    }

    // ---------- 통신 방식 찾기

    void startProbe() {
        final Network n = net;
        if (n == null || probing) return;
        probing = true;
        probe = new JSONArray();
        new Thread(() -> {
            JSONArray out = new JSONArray();
            try {
                List<String> ips = new ArrayList<>();
                String gw = gateway(n);
                if (!gw.isEmpty()) ips.add(gw);
                for (String ip : FALLBACK_IPS) if (!ips.contains(ip)) ips.add(ip);
                String found = "";
                // 1) JHCMD: 게이트웨이와 흔한 주소 몇 개만(각 약 1.2초)
                for (int i = 0; i < Math.min(3, ips.size()); i++) {
                    String ip = ips.get(i);
                    int got = probeJh(n, ip);
                    add(out, "JHCMD (UDP 20000 → 10900)", ip, got > 0, got > 0 ? "영상 조각 " + got + "개 수신" : "응답 없음");
                    if (got > 0) { found = ip; proto = "jhcmd"; camIp = ip; break; }
                }
                // 2) 게이트웨이의 TCP 포트들
                String target = !found.isEmpty() ? found : (gw.isEmpty() ? ips.get(0) : gw);
                add(out, "RTSP (TCP 554)", target, rtsp(n, target, 554), lastProbeNote);
                add(out, "RTSP (TCP 8554)", target, rtsp(n, target, 8554), lastProbeNote);
                add(out, "HTTP (TCP 80)", target, http(n, target, 80), lastProbeNote);
                add(out, "HTTP (TCP 8080)", target, http(n, target, 8080), lastProbeNote);
                for (int port : new int[]{8081, 8000, 5000, 6666, 7070, 9000, 20000, 21}) {
                    boolean ok = tcpOpen(n, target, port);
                    add(out, "TCP " + port, target, ok, ok ? "열림" : "닫힘");
                }
                if (found.isEmpty() && proto.isEmpty()) camIp = target;
            } catch (Exception e) {
                add(out, "오류", "", false, String.valueOf(e.getMessage()));
            }
            probe = out;
            probing = false;
        }, "cam-probe").start();
    }

    private volatile String lastProbeNote = "";

    private static void add(JSONArray a, String what, String ip, boolean ok, String note) {
        try {
            JSONObject o = new JSONObject();
            o.put("what", what); o.put("ip", ip); o.put("ok", ok); o.put("note", note);
            a.put(o);
        } catch (Exception ignored) {}
    }

    private static byte[] jh(int a, int b) {
        byte[] p = new byte[7];
        System.arraycopy("JHCMD".getBytes(StandardCharsets.US_ASCII), 0, p, 0, 5);
        p[5] = (byte) a; p[6] = (byte) b;
        return p;
    }

    /** JHCMD 초기화·시작을 보내고 10900으로 들어오는 UDP 조각 수를 셉니다. */
    private int probeJh(Network n, String ip) {
        if (live) return frames > 0 ? 1 : 0;
        DatagramSocket s = null;
        try {
            s = new DatagramSocket(null);
            s.setReuseAddress(true);
            s.bind(new InetSocketAddress(JH_VIDEO_PORT));
            n.bindSocket(s);
            s.setSoTimeout(300);
            InetAddress cam = InetAddress.getByName(ip);
            for (byte[] c : new byte[][]{jh(0x10, 0), jh(0x20, 0), jh(0xD0, 1)}) s.send(new DatagramPacket(c, c.length, cam, JH_CMD_PORT));
            int got = 0;
            byte[] buf = new byte[2048];
            long end = SystemClock.elapsedRealtime() + 1200;
            while (SystemClock.elapsedRealtime() < end) {
                try { s.receive(new DatagramPacket(buf, buf.length)); got++; } catch (java.net.SocketTimeoutException ignored) {}
            }
            byte[] stop = jh(0xD0, 2);
            s.send(new DatagramPacket(stop, stop.length, cam, JH_CMD_PORT));
            return got;
        } catch (Exception e) {
            return 0;
        } finally {
            if (s != null) s.close();
        }
    }

    private boolean tcpOpen(Network n, String ip, int port) {
        try (Socket so = n.getSocketFactory().createSocket()) {
            so.connect(new InetSocketAddress(ip, port), 500);
            return true;
        } catch (Exception e) { return false; }
    }

    private boolean rtsp(Network n, String ip, int port) {
        lastProbeNote = "닫힘";
        try (Socket so = n.getSocketFactory().createSocket()) {
            so.connect(new InetSocketAddress(ip, port), 600);
            so.setSoTimeout(800);
            OutputStream os = so.getOutputStream();
            os.write(("OPTIONS rtsp://" + ip + ":" + port + "/ RTSP/1.0\r\nCSeq: 1\r\nUser-Agent: D1Dashcam\r\n\r\n").getBytes(StandardCharsets.US_ASCII));
            String head = readHead(so.getInputStream());
            lastProbeNote = head.isEmpty() ? "열림(응답 없음)" : head;
            return head.startsWith("RTSP/");
        } catch (Exception e) { return false; }
    }

    private boolean http(Network n, String ip, int port) {
        lastProbeNote = "닫힘";
        try (Socket so = n.getSocketFactory().createSocket()) {
            so.connect(new InetSocketAddress(ip, port), 600);
            so.setSoTimeout(800);
            so.getOutputStream().write(("GET / HTTP/1.0\r\nHost: " + ip + "\r\n\r\n").getBytes(StandardCharsets.US_ASCII));
            String head = readHead(so.getInputStream());
            lastProbeNote = head.isEmpty() ? "열림(응답 없음)" : head;
            return head.startsWith("HTTP/");
        } catch (Exception e) { return false; }
    }

    private static String readHead(InputStream in) {
        try {
            byte[] b = new byte[512];
            int k = in.read(b);
            if (k <= 0) return "";
            String s = new String(b, 0, k, StandardCharsets.ISO_8859_1);
            StringBuilder sb = new StringBuilder();
            for (String line : s.split("\r?\n")) {
                if (line.isEmpty()) break;
                if (sb.length() == 0 || line.toLowerCase().startsWith("server:")) { if (sb.length() > 0) sb.append(" · "); sb.append(line.trim()); }
            }
            return sb.length() > 160 ? sb.substring(0, 160) : sb.toString();
        } catch (Exception e) { return ""; }
    }

    // ---------- JHCMD 라이브

    synchronized void startLive() {
        final Network n = net;
        if (n == null || live) return;
        final String ip = camIp.isEmpty() ? (gateway(n).isEmpty() ? "192.168.29.1" : gateway(n)) : camIp;
        live = true;
        frames = 0; packets = 0; fps = 0;
        liveThread = new Thread(() -> runJh(n, ip), "cam-live");
        liveThread.start();
    }

    synchronized void stopLive() {
        live = false;
        Thread t = liveThread;
        liveThread = null;
        if (t != null) t.interrupt();
    }

    private void runJh(Network n, String ip) {
        DatagramSocket s = null;
        try {
            s = new DatagramSocket(null);
            s.setReuseAddress(true);
            s.bind(new InetSocketAddress(JH_VIDEO_PORT));
            n.bindSocket(s);
            s.setSoTimeout(500);
            s.setReceiveBufferSize(1 << 20);
            InetAddress cam = InetAddress.getByName(ip);
            for (byte[] c : new byte[][]{jh(0x10, 0), jh(0x20, 0)}) s.send(new DatagramPacket(c, c.length, cam, JH_CMD_PORT));
            byte[] start = jh(0xD0, 1);
            long nextBeat = 0, fpsT = SystemClock.elapsedRealtime();
            int fpsN = 0, curId = -1;
            TreeMap<Integer, byte[]> parts = new TreeMap<>();
            byte[] buf = new byte[65536];
            while (live) {
                long now = SystemClock.elapsedRealtime();
                if (now >= nextBeat) { s.send(new DatagramPacket(start, start.length, cam, JH_CMD_PORT)); nextBeat = now + 1000; }
                DatagramPacket p = new DatagramPacket(buf, buf.length);
                try { s.receive(p); } catch (java.net.SocketTimeoutException e) { continue; }
                int len = p.getLength();
                if (len <= 8) continue;
                packets++;
                // 8바이트 머리: [0..1] 프레임 번호(LE) · [2] 조각 수 · [3] 조각 순서 · 나머지 예약
                int id = (buf[0] & 0xFF) | ((buf[1] & 0xFF) << 8);
                int idx = buf[3] & 0xFF;
                if (id != curId) { parts.clear(); curId = id; }
                byte[] payload = new byte[len - 8];
                System.arraycopy(buf, 8, payload, 0, payload.length);
                parts.put(parts.containsKey(idx) ? 1000 + parts.size() : idx, payload);
                // JPEG 끝(FF D9)을 보면 한 장으로 합칩니다
                if (payload.length >= 2 && (payload[payload.length - 2] & 0xFF) == 0xFF && (payload[payload.length - 1] & 0xFF) == 0xD9) {
                    ByteArrayOutputStream bo = new ByteArrayOutputStream();
                    for (Map.Entry<Integer, byte[]> e : parts.entrySet()) bo.write(e.getValue(), 0, e.getValue().length);
                    byte[] jpg = bo.toByteArray();
                    int soi = indexOfSoi(jpg);
                    if (soi >= 0) {
                        if (soi > 0) { byte[] t = new byte[jpg.length - soi]; System.arraycopy(jpg, soi, t, 0, t.length); jpg = t; }
                        frame = jpg; frameAt = SystemClock.elapsedRealtime(); frames++; fpsN++;
                        if (!"jhcmd".equals(proto)) { proto = "jhcmd"; camIp = ip; }
                    }
                    parts.clear(); curId = -1;
                }
                if (now - fpsT >= 1000) { fps = fpsN * 1000f / (now - fpsT); fpsN = 0; fpsT = now; }
            }
            byte[] stop = jh(0xD0, 2);
            try { s.send(new DatagramPacket(stop, stop.length, cam, JH_CMD_PORT)); } catch (Exception ignored) {}
        } catch (Exception e) {
            lastErr = "라이브 오류: " + e.getMessage();
        } finally {
            if (s != null) s.close();
            live = false;
        }
    }

    private static int indexOfSoi(byte[] b) {
        for (int i = 0; i + 2 < b.length; i++) if ((b[i] & 0xFF) == 0xFF && (b[i + 1] & 0xFF) == 0xD8 && (b[i + 2] & 0xFF) == 0xFF) return i;
        return -1;
    }

    /** 가장 최근 JPEG 한 장(없으면 null) */
    byte[] latestFrame() {
        return frame;
    }
}
