package com.daesinnam.tableorder;

import android.content.res.AssetManager;
import android.util.Log;

import org.json.JSONObject;

import java.io.BufferedInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.SocketTimeoutException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * 카운터 기기 안의 작은 웹 서버(매장 와이파이 안에서만).
 * - 테이블 주문기: /table.html 화면을 받아 가고, /api/state · /api/order · /api/call 로 주문
 * - 사장님 화면: /admin.html, /api/admin/... (비밀 열쇠 필요)
 * 인터넷으로 나가는 통신은 없습니다.
 */
final class OrderServer {
    static final String TAG = "TableOrder";
    static final int PORT = 8787;

    interface Listener { void onOrder(JSONObject order); void onCall(JSONObject call); }

    private final AssetManager assets;
    private final Store store;
    private final File imgDir;
    private final String key;
    private final Listener listener;
    private final ExecutorService pool = Executors.newFixedThreadPool(48);
    private ServerSocket server;
    private volatile boolean running;

    OrderServer(AssetManager assets, Store store, File imgDir, String key, Listener listener) {
        this.assets = assets;
        this.store = store;
        this.imgDir = imgDir;
        this.key = key;
        this.listener = listener;
    }

    synchronized void start() throws IOException {
        if (running) return;
        server = new ServerSocket();
        server.setReuseAddress(true);
        server.bind(new java.net.InetSocketAddress((InetAddress) null, PORT), 64);
        running = true;
        Thread t = new Thread(() -> {
            while (running) {
                try {
                    Socket s = server.accept();
                    pool.execute(() -> handle(s));
                } catch (IOException e) {
                    if (running) Log.w(TAG, "accept: " + e);
                }
            }
        }, "order-server");
        t.setDaemon(true);
        t.start();
        Log.i(TAG, "서버 시작 port=" + PORT);
    }

    synchronized void stop() {
        running = false;
        try { if (server != null) server.close(); } catch (IOException ignored) { }
        pool.shutdownNow();
    }

    // ---------- 요청 하나 ----------

    private void handle(Socket sock) {
        try (Socket s = sock) {
            s.setSoTimeout(30_000);
            InputStream in = new BufferedInputStream(s.getInputStream());
            String line = readLine(in);
            if (line == null) return;
            String[] p = line.split(" ");
            if (p.length < 2) return;
            String method = p[0], target = p[1];
            Map<String, String> h = new HashMap<>();
            for (String l; (l = readLine(in)) != null && !l.isEmpty(); ) {
                int c = l.indexOf(':');
                if (c > 0) h.put(l.substring(0, c).trim().toLowerCase(Locale.ROOT), l.substring(c + 1).trim());
            }
            int len = 0;
            try { len = Integer.parseInt(h.getOrDefault("content-length", "0")); } catch (NumberFormatException ignored) { }
            if (len > 8 * 1024 * 1024) { send(s.getOutputStream(), 413, "text/plain", bytes("too big")); return; }
            byte[] body = new byte[Math.max(0, len)];
            int off = 0;
            while (off < len) { int n = in.read(body, off, len - off); if (n < 0) break; off += n; }
            String path = target, query = "";
            int q = target.indexOf('?');
            if (q >= 0) { path = target.substring(0, q); query = target.substring(q + 1); }
            Map<String, String> qs = parseQuery(query);
            route(s.getOutputStream(), method, path, qs, h, body);
        } catch (SocketTimeoutException ignored) {
        } catch (Exception e) {
            Log.w(TAG, "handle: " + e);
        }
    }

    private void route(OutputStream out, String method, String path, Map<String, String> qs, Map<String, String> h, byte[] body) throws Exception {
        if ("OPTIONS".equals(method)) { send(out, 204, "text/plain", new byte[0]); return; }
        try {
            // ----- 손님(테이블) -----
            if (path.equals("/api/ping")) { json(out, new JSONObject().put("ok", true).put("app", "deolnureum-tableorder").put("shop", store.tableView(0).optString("shop"))); return; }
            if (path.equals("/api/state")) {
                int t = parseInt(qs.get("table"));
                long known = parseLong(qs.get("rev"));
                if (known > 0) store.waitChange(known, 20_000); // 바뀔 때까지 잠깐 기다렸다 돌려줌(품절 · 주문 상태가 바로 보이게)
                json(out, store.tableView(t));
                return;
            }
            if (path.equals("/api/order") && "POST".equals(method)) {
                JSONObject od = store.placeOrder(new JSONObject(str(body)));
                if (listener != null) listener.onOrder(od);
                json(out, new JSONObject().put("ok", true).put("order", od));
                return;
            }
            if (path.equals("/api/call") && "POST".equals(method)) {
                JSONObject c = store.call(new JSONObject(str(body)));
                if (listener != null) listener.onCall(c);
                json(out, new JSONObject().put("ok", true));
                return;
            }
            if (path.startsWith("/img/")) { image(out, path.substring(5)); return; }

            // ----- 사장님(카운터) -----
            if (path.startsWith("/api/admin")) {
                if (!key.equals(h.get("x-key"))) { send(out, 403, "application/json", bytes("{\"ok\":false,\"error\":\"열쇠가 맞지 않습니다\"}")); return; }
                String a = path.substring("/api/admin".length());
                if (a.equals("/image") && "POST".equals(method)) { // 메뉴 사진(화면에서 줄인 JPEG)
                    if (body.length < 100 || body.length > 3 * 1024 * 1024 || (body[0] & 0xff) != 0xFF || (body[1] & 0xff) != 0xD8) throw new IllegalArgumentException("사진을 읽지 못했습니다");
                    String name = java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 16) + ".jpg";
                    try (java.io.FileOutputStream fo = new java.io.FileOutputStream(new File(imgDir, name))) { fo.write(body); }
                    json(out, new JSONObject().put("ok", true).put("img", "/img/" + name));
                    return;
                }
                if (a.equals("") || a.equals("/")) {
                    long known = parseLong(qs.get("rev"));
                    if (known > 0) store.waitChange(known, 20_000);
                    json(out, store.adminView());
                    return;
                }
                JSONObject b = body.length > 0 ? new JSONObject(str(body)) : new JSONObject();
                switch (a) {
                    case "/status": store.setStatus(b.getString("id"), b.getString("status")); break;
                    case "/clear": store.clearTable(b.getInt("table")); break;
                    case "/call-done": store.doneCall(b.getString("id")); break;
                    case "/soldout": store.soldout(b.getString("id"), b.getBoolean("on")); break;
                    case "/menu": store.setMenu(b); break;
                    case "/settings": store.setSettings(b); break;
                    case "/reset": store.resetToday(); break;
                    default: send(out, 404, "text/plain", bytes("없음")); return;
                }
                json(out, new JSONObject().put("ok", true).put("rev", store.rev()));
                return;
            }

            // ----- 화면 파일 -----
            if (path.equals("/")) path = "/table.html";
            asset(out, path);
        } catch (IllegalArgumentException e) {
            send(out, 400, "application/json", bytes(new JSONObject().put("ok", false).put("error", e.getMessage()).toString()));
        } catch (org.json.JSONException e) {
            send(out, 400, "application/json", bytes(new JSONObject().put("ok", false).put("error", "요청 내용이 올바르지 않습니다").toString()));
        }
    }

    private void asset(OutputStream out, String path) throws IOException {
        if (path.contains("..")) { send(out, 404, "text/plain", bytes("없음")); return; }
        String name = path.startsWith("/") ? path.substring(1) : path;
        try (InputStream in = assets.open("web/" + name)) {
            send(out, 200, mime(name), readAll(in));
        } catch (IOException e) {
            send(out, 404, "text/plain; charset=utf-8", bytes("없음"));
        }
    }

    private void image(OutputStream out, String name) throws IOException {
        if (!name.matches("[A-Za-z0-9_-]{1,40}\\.jpg")) { send(out, 404, "text/plain", bytes("없음")); return; }
        File f = new File(imgDir, name);
        if (!f.isFile()) { send(out, 404, "text/plain", bytes("없음")); return; }
        try (InputStream in = new FileInputStream(f)) { send(out, 200, "image/jpeg", readAll(in), "public, max-age=604800"); }
    }

    // ---------- 작은 도구 ----------

    private static void json(OutputStream out, JSONObject o) throws IOException {
        send(out, 200, "application/json; charset=utf-8", bytes(o.toString()));
    }

    private static void send(OutputStream out, int code, String type, byte[] body) throws IOException {
        send(out, code, type, body, "no-store");
    }

    private static void send(OutputStream out, int code, String type, byte[] body, String cache) throws IOException {
        String head = "HTTP/1.1 " + code + " " + (code == 200 ? "OK" : code == 204 ? "No Content" : "Error") + "\r\n"
                + "Content-Type: " + type + "\r\n"
                + "Content-Length: " + body.length + "\r\n"
                + "Cache-Control: " + cache + "\r\n"
                + "Access-Control-Allow-Origin: *\r\n"
                + "Access-Control-Allow-Headers: Content-Type, X-Key\r\n"
                + "Connection: close\r\n\r\n";
        out.write(head.getBytes(StandardCharsets.UTF_8));
        out.write(body);
        out.flush();
    }

    private static String mime(String n) {
        if (n.endsWith(".html")) return "text/html; charset=utf-8";
        if (n.endsWith(".js")) return "text/javascript; charset=utf-8";
        if (n.endsWith(".css")) return "text/css; charset=utf-8";
        if (n.endsWith(".svg")) return "image/svg+xml";
        if (n.endsWith(".png")) return "image/png";
        if (n.endsWith(".mp3")) return "audio/mpeg";
        return "application/octet-stream";
    }

    private static String readLine(InputStream in) throws IOException {
        ByteArrayOutputStream b = new ByteArrayOutputStream();
        int c;
        while ((c = in.read()) >= 0) {
            if (c == '\n') break;
            if (c != '\r') b.write(c);
            if (b.size() > 16384) break;
        }
        if (c < 0 && b.size() == 0) return null;
        return b.toString("UTF-8");
    }

    static byte[] readAll(InputStream in) throws IOException {
        ByteArrayOutputStream b = new ByteArrayOutputStream();
        byte[] buf = new byte[16384];
        for (int n; (n = in.read(buf)) > 0; ) b.write(buf, 0, n);
        return b.toByteArray();
    }

    private static Map<String, String> parseQuery(String q) {
        Map<String, String> m = new HashMap<>();
        for (String kv : q.split("&")) {
            int e = kv.indexOf('=');
            if (e <= 0) continue;
            try { m.put(URLDecoder.decode(kv.substring(0, e), "UTF-8"), URLDecoder.decode(kv.substring(e + 1), "UTF-8")); } catch (Exception ignored) { }
        }
        return m;
    }

    private static int parseInt(String v) { try { return Integer.parseInt(v); } catch (Exception e) { return 0; } }
    private static long parseLong(String v) { try { return Long.parseLong(v); } catch (Exception e) { return 0; } }
    private static String str(byte[] b) { return new String(b, StandardCharsets.UTF_8); }
    private static byte[] bytes(String s) { return s.getBytes(StandardCharsets.UTF_8); }
}
