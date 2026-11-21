package com.daesinnam.tableorder;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.ActivityManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.media.AudioManager;
import android.media.ToneGenerator;
import android.net.Uri;
import android.net.nsd.NsdManager;
import android.net.nsd.NsdServiceInfo;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.util.Log;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Collections;

/**
 * 덜누름 테이블오더 — 한 앱, 두 가지 쓰임.
 *  · 카운터(사장님 폴드, 덱스): 주문 서버를 켜고 주문 처리 화면(admin.html)을 띄움
 *  · 테이블 주문기(안 쓰는 태블릿 · 구형 폰): 와이파이에서 카운터를 찾아 주문 화면(table.html)을 띄움
 * 처음 켜면 어느 쪽으로 쓸지 고릅니다(start.html). 화면은 모두 웹(assets/web)으로 만들어 큰 화면 · 작은 화면에 맞춰 바뀝니다.
 */
public class MainActivity extends Activity {
    static final String TAG = "TableOrder";
    static final String SELFTEST_TAG = "TO_SELFTEST";
    static volatile boolean foreground;

    private WebView web;
    private SharedPreferences prefs;
    private volatile String currentUrl = "";
    private final Handler ui = new Handler(Looper.getMainLooper());
    private NsdManager nsd;
    private NsdManager.DiscoveryListener discovery;
    private ValueCallback<Uri[]> fileCb;
    private boolean selftest;

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        prefs = getSharedPreferences("tableorder", MODE_PRIVATE);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        getWindow().setStatusBarColor(Color.parseColor("#F6F5F1"));
        if (Build.VERSION.SDK_INT >= 23) getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);

        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#F6F5F1"));
        WebSettings ws = web.getSettings();
        ws.setJavaScriptEnabled(true);
        ws.setDomStorageEnabled(true);
        ws.setMediaPlaybackRequiresUserGesture(false);
        ws.setTextZoom(100);
        ws.setAllowFileAccess(false);
        ws.setAllowContentAccess(false);
        ws.setCacheMode(WebSettings.LOAD_DEFAULT);
        web.addJavascriptInterface(new Bridge(), "TO");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView v, String url, android.graphics.Bitmap f) { currentUrl = url == null ? "" : url; }

            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                String h = r.getUrl().getHost();
                String s = r.getUrl().getScheme();
                if ("file".equals(s) || "127.0.0.1".equals(h) || (h != null && h.equals(prefs.getString("host", "")))) return false;
                return true; // 매장 밖 주소는 열지 않음(키오스크)
            }

            @Override
            public void onReceivedError(WebView v, WebResourceRequest r, WebResourceError e) {
                if (!r.isForMainFrame()) return;
                // 카운터를 못 찾음(꺼짐 · 와이파이 바뀜) → 다시 찾는 화면으로
                if ("table".equals(mode())) load("file:///android_asset/web/start.html#lost");
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(android.webkit.ConsoleMessage m) {
                if (selftest) Log.i(SELFTEST_TAG, "CONSOLE " + m.messageLevel() + " " + m.message() + " @" + m.lineNumber());
                return false;
            }

            @Override
            public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
                if (fileCb != null) fileCb.onReceiveValue(null);
                fileCb = cb;
                Intent i = new Intent(Intent.ACTION_GET_CONTENT).setType("image/*").addCategory(Intent.CATEGORY_OPENABLE);
                try { startActivityForResult(Intent.createChooser(i, "메뉴 사진 고르기"), 7); } catch (Exception ex) { fileCb = null; return false; }
                return true;
            }
        });
        if ((getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0) WebView.setWebContentsDebuggingEnabled(true);
        web.setOnApplyWindowInsetsListener((v, in) -> {
            int t = in.getSystemWindowInsetTop(), bo = in.getSystemWindowInsetBottom(), l = in.getSystemWindowInsetLeft(), r = in.getSystemWindowInsetRight();
            if (Build.VERSION.SDK_INT >= 30) {
                android.graphics.Insets i = in.getInsets(android.view.WindowInsets.Type.systemBars() | android.view.WindowInsets.Type.displayCutout() | android.view.WindowInsets.Type.ime());
                t = i.top; bo = i.bottom; l = i.left; r = i.right;
            }
            v.setPadding(l, t, r, bo);
            return in;
        });
        setContentView(web);

        selftest = getIntent().getBooleanExtra("to.selftest", false);
        if (selftest) { runSelftest(); return; }
        go();
    }

    /** 고른 쓰임에 맞는 화면으로 */
    private void go() {
        String m = mode();
        if ("counter".equals(m)) {
            if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED)
                requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 3);
            OrderService.start(this);
            waitServerThen(() -> load("http://127.0.0.1:" + OrderServer.PORT + "/admin.html"));
        } else if ("table".equals(m) && !prefs.getString("host", "").isEmpty()) {
            load("http://" + prefs.getString("host", "") + ":" + OrderServer.PORT + "/table.html?t=" + prefs.getInt("table", 1));
            if (prefs.getBoolean("kiosk", false)) kiosk(true);
        } else {
            load("file:///android_asset/web/start.html");
        }
    }

    private void load(String url) { ui.post(() -> web.loadUrl(url)); }

    private String mode() { return prefs.getString("mode", ""); }

    /** 서버가 실제로 켜질 때까지 잠깐 기다렸다가 화면을 띄움 */
    private void waitServerThen(Runnable r) {
        new Thread(() -> {
            for (int i = 0; i < 50; i++) {
                if (http("GET", "http://127.0.0.1:" + OrderServer.PORT + "/api/ping", null, null) != null) break;
                try { Thread.sleep(100); } catch (InterruptedException ignored) { }
            }
            ui.post(r);
        }).start();
    }

    @Override
    protected void onResume() { super.onResume(); foreground = true; }

    @Override
    protected void onPause() { super.onPause(); foreground = false; }

    @Override
    protected void onDestroy() {
        stopDiscovery();
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        if ("table".equals(mode())) { js("window.onBack && onBack()"); return; } // 손님이 뒤로 가기로 나가지 못하게
        if (web.canGoBack()) web.goBack(); else super.onBackPressed();
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        super.onActivityResult(req, res, data);
        if (req == 7 && fileCb != null) {
            Uri u = res == RESULT_OK && data != null ? data.getData() : null;
            fileCb.onReceiveValue(u == null ? null : new Uri[]{u});
            fileCb = null;
        }
    }

    private void js(String code) { ui.post(() -> web.evaluateJavascript(code, null)); }

    private void kiosk(boolean on) {
        ui.post(() -> {
            try {
                if (on) startLockTask(); else stopLockTask();
            } catch (Exception e) {
                Log.w(TAG, "lockTask: " + e);
            }
            View d = getWindow().getDecorView();
            d.setSystemUiVisibility(on ? (View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_STABLE)
                    : (Build.VERSION.SDK_INT >= 23 ? View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR : 0));
        });
    }

    // ---------- 와이파이에서 카운터 찾기 ----------

    private void startDiscovery() {
        stopDiscovery();
        try {
            nsd = (NsdManager) getSystemService(NSD_SERVICE);
            discovery = new NsdManager.DiscoveryListener() {
                @Override public void onStartDiscoveryFailed(String t, int e) { js("window.onFindFail && onFindFail()"); }
                @Override public void onStopDiscoveryFailed(String t, int e) { }
                @Override public void onDiscoveryStarted(String t) { }
                @Override public void onDiscoveryStopped(String t) { }
                @Override public void onServiceLost(NsdServiceInfo s) { }
                @Override public void onServiceFound(NsdServiceInfo s) {
                    try {
                        nsd.resolveService(s, new NsdManager.ResolveListener() {
                            @Override public void onResolveFailed(NsdServiceInfo i, int e) { }
                            @Override public void onServiceResolved(NsdServiceInfo i) {
                                InetAddress a = i.getHost();
                                if (a == null) return;
                                String host = a.getHostAddress();
                                if (host == null || host.contains(":")) return; // IPv4만
                                try {
                                    JSONObject o = new JSONObject().put("name", i.getServiceName()).put("host", host);
                                    js("window.onFound && onFound(" + o + ")");
                                } catch (Exception ignored) { }
                            }
                        });
                    } catch (Exception ignored) { }
                }
            };
            nsd.discoverServices(OrderService.NSD_TYPE, NsdManager.PROTOCOL_DNS_SD, discovery);
        } catch (Exception e) {
            js("window.onFindFail && onFindFail()");
        }
    }

    private void stopDiscovery() {
        try { if (nsd != null && discovery != null) nsd.stopServiceDiscovery(discovery); } catch (Exception ignored) { }
        discovery = null;
    }

    static String lanIp() {
        try {
            for (NetworkInterface ni : Collections.list(NetworkInterface.getNetworkInterfaces())) {
                if (!ni.isUp() || ni.isLoopback()) continue;
                String n = ni.getName();
                for (InetAddress a : Collections.list(ni.getInetAddresses())) {
                    if (a instanceof Inet4Address && !a.isLoopbackAddress() && (n.startsWith("wlan") || n.startsWith("eth") || n.startsWith("ap") || n.startsWith("swlan")))
                        return a.getHostAddress();
                }
            }
            for (NetworkInterface ni : Collections.list(NetworkInterface.getNetworkInterfaces()))
                for (InetAddress a : Collections.list(ni.getInetAddresses()))
                    if (a instanceof Inet4Address && !a.isLoopbackAddress()) return a.getHostAddress();
        } catch (Exception ignored) { }
        return "";
    }

    /** 아주 작은 HTTP 도우미(점검 · 연결 확인용) */
    static String http(String method, String url, String body, String key) {
        try {
            HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
            c.setConnectTimeout(1500);
            c.setReadTimeout(4000);
            c.setRequestMethod(method);
            if (key != null) c.setRequestProperty("X-Key", key);
            if (body != null) {
                c.setDoOutput(true);
                c.setRequestProperty("Content-Type", "application/json");
                try (OutputStream o = c.getOutputStream()) { o.write(body.getBytes(StandardCharsets.UTF_8)); }
            }
            int code = c.getResponseCode();
            InputStream in = code < 400 ? c.getInputStream() : c.getErrorStream();
            ByteArrayOutputStream b = new ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            for (int n; in != null && (n = in.read(buf)) > 0; ) b.write(buf, 0, n);
            String s = b.toString("UTF-8");
            return code < 400 ? s : "ERR " + code + " " + s;
        } catch (Exception e) {
            return null;
        }
    }

    // ---------- 화면(JS)과 이어지는 다리 ----------

    final class Bridge {
        private boolean local() { return currentUrl.startsWith("http://127.0.0.1:") || currentUrl.startsWith("file:///android_asset/"); }

        @JavascriptInterface public String mode() { return MainActivity.this.mode(); }

        @JavascriptInterface public String version() {
            try { return getPackageManager().getPackageInfo(getPackageName(), 0).versionName; } catch (Exception e) { return ""; }
        }

        /** 사장님 화면 열쇠: 이 기기 안의 카운터 화면에만 줌 */
        @JavascriptInterface public String key() { return currentUrl.startsWith("http://127.0.0.1:") ? OrderService.key(MainActivity.this) : ""; }

        @JavascriptInterface public String ip() { return lanIp(); }

        @JavascriptInterface public int table() { return prefs.getInt("table", 1); }

        @JavascriptInterface public boolean kioskOn() { return prefs.getBoolean("kiosk", false); }

        @JavascriptInterface public void useCounter() {
            if (!local()) return;
            prefs.edit().putString("mode", "counter").apply();
            ui.post(MainActivity.this::go);
        }

        @JavascriptInterface public void find() { if (local()) ui.post(MainActivity.this::startDiscovery); }

        @JavascriptInterface public void stopFind() { ui.post(MainActivity.this::stopDiscovery); }

        /** 카운터 주소가 맞는지 확인(가게 이름을 돌려줌, 못 찾으면 빈 값) */
        @JavascriptInterface public String check(String host) {
            if (host == null || !host.matches("[0-9.]{7,15}")) return "";
            String r = http("GET", "http://" + host + ":" + OrderServer.PORT + "/api/ping", null, null);
            try { return r != null && !r.startsWith("ERR") ? new JSONObject(r).optString("shop", "카운터") : ""; } catch (Exception e) { return ""; }
        }

        /** 테이블 주문기로 쓰기: 카운터 주소 · 테이블 번호 · 키오스크 · 나가기 비밀번호 */
        @JavascriptInterface public void useTable(String host, int table, boolean kiosk, String pin) {
            if (!local() || host == null || !host.matches("[0-9.]{7,15}")) return;
            prefs.edit().putString("mode", "table").putString("host", host).putInt("table", Math.max(1, Math.min(99, table)))
                    .putBoolean("kiosk", kiosk).putString("pin", pin == null || pin.length() < 4 ? "0000" : pin).apply();
            ui.post(MainActivity.this::go);
        }

        /** 테이블 화면에서 설정으로 나가기(비밀번호 맞으면) */
        @JavascriptInterface public boolean leave(String pin) {
            if (!prefs.getString("pin", "0000").equals(pin)) return false;
            kiosk(false);
            prefs.edit().putString("mode", "").apply();
            load("file:///android_asset/web/start.html#setup");
            return true;
        }

        /** 카운터 그만 쓰기(서버 끔) */
        @JavascriptInterface public void stopCounter() {
            if (!currentUrl.startsWith("http://127.0.0.1:")) return;
            OrderService.stop(MainActivity.this);
            prefs.edit().putString("mode", "").apply();
            load("file:///android_asset/web/start.html");
        }

        /** 카운터를 오래 못 찾으면 다시 찾는 화면으로 */
        @JavascriptInterface public void lost() { if ("table".equals(MainActivity.this.mode())) load("file:///android_asset/web/start.html#lost"); }

        /** 저장된 카운터로 다시(연결 끊겼을 때) */
        @JavascriptInterface public String savedHost() { return prefs.getString("host", ""); }

        @JavascriptInterface public void reconnect(String host) {
            if (!local()) return;
            if (host != null && host.matches("[0-9.]{7,15}")) prefs.edit().putString("host", host).putString("mode", "table").apply();
            ui.post(MainActivity.this::go);
        }

        @JavascriptInterface public void beep() {
            try { new ToneGenerator(AudioManager.STREAM_NOTIFICATION, 90).startTone(ToneGenerator.TONE_PROP_BEEP2, 350); } catch (Exception ignored) { }
        }

        @JavascriptInterface public void vibrate(int ms) {
            try {
                Vibrator v = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
                if (Build.VERSION.SDK_INT >= 26) v.vibrate(VibrationEffect.createOneShot(Math.min(ms, 1000), VibrationEffect.DEFAULT_AMPLITUDE));
                else v.vibrate(Math.min(ms, 1000));
            } catch (Exception ignored) { }
        }

        @JavascriptInterface public boolean pinned() {
            ActivityManager am = (ActivityManager) getSystemService(ACTIVITY_SERVICE);
            return Build.VERSION.SDK_INT >= 23 && am.getLockTaskModeState() != ActivityManager.LOCK_TASK_MODE_NONE;
        }
    }

    // ---------- 에뮬레이터 자동 점검 ----------

    private void st(String s) { Log.i(SELFTEST_TAG, s); }

    private void check(boolean ok, String what) { st((ok ? "PASS " : "FAIL ") + what); }

    private void runSelftest() {
        prefs.edit().putString("mode", "counter").apply();
        OrderService.start(this);
        new Thread(() -> {
            try {
                String base = "http://127.0.0.1:" + OrderServer.PORT;
                String key = OrderService.key(this);
                String ping = null;
                for (int i = 0; i < 60 && ping == null; i++) { ping = http("GET", base + "/api/ping", null, null); if (ping == null) Thread.sleep(200); }
                check(ping != null && ping.contains("deolnureum-tableorder"), "server up " + ping);
                http("POST", base + "/api/admin/reset", "{}", key);
                String st0 = http("GET", base + "/api/state?table=3", null, null);
                JSONObject s0 = new JSONObject(st0);
                check(s0.getJSONArray("items").length() >= 5, "menu for table " + s0.getJSONArray("items").length());

                // 가격을 속여 보내도 카운터 메뉴 값으로 계산되는지
                String r = http("POST", base + "/api/order", "{\"table\":3,\"items\":[{\"id\":\"americano\",\"qty\":2,\"price\":1},{\"id\":\"cake\",\"qty\":1}],\"note\":\"얼음 적게\"}", null);
                JSONObject od = new JSONObject(r).getJSONObject("order");
                check(od.getLong("total") == 4500 * 2 + 6500, "order total " + od.getLong("total"));
                http("POST", base + "/api/order", "{\"table\":5,\"items\":[{\"id\":\"latte\",\"qty\":1},{\"id\":\"croffle\",\"qty\":2}]}", null);
                http("POST", base + "/api/order", "{\"table\":1,\"items\":[{\"id\":\"ade\",\"qty\":3}]}", null);
                http("POST", base + "/api/call", "{\"table\":2,\"what\":\"물 · 물티슈\"}", null);

                String noKey = http("GET", base + "/api/admin", null, "wrong");
                check(noKey != null && noKey.startsWith("ERR 403"), "admin needs key");
                JSONObject ad = new JSONObject(http("GET", base + "/api/admin", null, key));
                check(ad.getJSONArray("orders").length() == 3 && ad.getJSONArray("calls").length() == 1, "admin sees orders");
                check(ad.getLong("todaySales") == 15500 + 15000 + 18000, "today sales " + ad.getLong("todaySales"));

                http("POST", base + "/api/admin/status", new JSONObject().put("id", od.getString("id")).put("status", "cooking").toString(), key);
                http("POST", base + "/api/admin/soldout", "{\"id\":\"cookie\",\"on\":true}", key);
                String sold = http("POST", base + "/api/order", "{\"table\":4,\"items\":[{\"id\":\"cookie\",\"qty\":1}]}", null);
                check(sold != null && sold.startsWith("ERR 400") && sold.contains("품절"), "soldout rejected");
                JSONObject s3 = new JSONObject(http("GET", base + "/api/state?table=3", null, null));
                check(s3.getJSONArray("orders").length() == 1 && "cooking".equals(s3.getJSONArray("orders").getJSONObject(0).getString("status")), "table sees status");

                // 바뀔 때 바로 깨어나는지(롱 폴링)
                long rev = ad.getLong("rev") + 2;
                long t0 = System.currentTimeMillis();
                new Thread(() -> { try { Thread.sleep(600); http("POST", base + "/api/call", "{\"table\":6,\"what\":\"직원 호출\"}", null); } catch (Exception ignored) { } }).start();
                JSONObject w = new JSONObject(http("GET", base + "/api/admin?rev=" + new JSONObject(http("GET", base + "/api/admin", null, key)).getLong("rev"), null, key));
                long dt = System.currentTimeMillis() - t0;
                check(dt >= 400 && dt < 5000 && w.getJSONArray("calls").length() == 2, "long poll wakes " + dt + "ms");

                // 사진 올리기
                byte[] jpg = tinyJpeg();
                HttpURLConnection c = (HttpURLConnection) new URL(base + "/api/admin/image").openConnection();
                c.setDoOutput(true);
                c.setRequestMethod("POST");
                c.setRequestProperty("X-Key", key);
                try (OutputStream o = c.getOutputStream()) { o.write(jpg); }
                String up = new String(OrderServer.readAll(c.getInputStream()), StandardCharsets.UTF_8);
                String img = new JSONObject(up).getString("img");
                HttpURLConnection g = (HttpURLConnection) new URL(base + img).openConnection();
                check(g.getResponseCode() == 200 && "image/jpeg".equals(g.getContentType()), "image upload " + img);

                String page = http("GET", base + "/table.html", null, null);
                check(page != null && page.contains("<html"), "table page served");
                String lan = lanIp();
                String viaLan = lan.isEmpty() ? null : http("GET", "http://" + lan + ":" + OrderServer.PORT + "/api/ping", null, null);
                check(viaLan != null, "reachable on LAN ip " + lan);

                // 와이파이 찾기(에뮬레이터에서는 안 될 수 있어 기록만)
                final String[] found = {null};
                ui.post(() -> {
                    try {
                        NsdManager m = (NsdManager) getSystemService(NSD_SERVICE);
                        m.discoverServices(OrderService.NSD_TYPE, NsdManager.PROTOCOL_DNS_SD, new NsdManager.DiscoveryListener() {
                            @Override public void onStartDiscoveryFailed(String t, int e) { found[0] = "start-failed " + e; }
                            @Override public void onStopDiscoveryFailed(String t, int e) { }
                            @Override public void onDiscoveryStarted(String t) { }
                            @Override public void onDiscoveryStopped(String t) { }
                            @Override public void onServiceFound(NsdServiceInfo s) { found[0] = "found " + s.getServiceName(); }
                            @Override public void onServiceLost(NsdServiceInfo s) { }
                        });
                    } catch (Exception e) { found[0] = "error " + e; }
                });
                for (int i = 0; i < 40 && found[0] == null; i++) Thread.sleep(250);
                st("INFO nsd " + found[0]);

                // 화면 기록: 카운터 화면 → (스크립트가 찍음) → 테이블 화면
                load(base + "/admin.html");
                Thread.sleep(4000);
                probe("admin", "JSON.stringify({key:(typeof KEY=='string'?KEY.length:-1),rev:(typeof REV=='number'?REV:-1),loaded:!!(typeof D!='undefined'&&D),orders:document.querySelectorAll('.od').length})");
                st("SHOT admin");
                Thread.sleep(8000);
                load(base + "/table.html?t=3");
                st("SHOT table");
                Thread.sleep(9000);
                js("document.querySelector('[data-id=americano]') && document.querySelector('[data-id=americano]').click();" +
                   "document.querySelector('[data-id=cake]') && document.querySelector('[data-id=cake]').click();");
                st("SHOT cart");
                Thread.sleep(6000);
                load("file:///android_asset/web/start.html");
                st("SHOT start");
                Thread.sleep(6000);
                st("DONE");
            } catch (Throwable e) {
                st("FAIL exception " + e);
                st("DONE");
            }
        }).start();
    }

    private void probe(String what, String expr) {
        ui.post(() -> web.evaluateJavascript(expr, v -> { st("INFO probe " + what + " " + v); check(v != null && v.contains("\\\"loaded\\\":true"), what + " screen loaded"); }));
    }

    /** 점검용 아주 작은 JPEG(흰 점 하나) */
    private static byte[] tinyJpeg() {
        android.graphics.Bitmap bm = android.graphics.Bitmap.createBitmap(16, 16, android.graphics.Bitmap.Config.ARGB_8888);
        bm.eraseColor(Color.WHITE);
        ByteArrayOutputStream b = new ByteArrayOutputStream();
        bm.compress(android.graphics.Bitmap.CompressFormat.JPEG, 80, b);
        return b.toByteArray();
    }
}
