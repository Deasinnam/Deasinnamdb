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
    private static volatile boolean selftestStarted;
    private volatile String kitchenToken = ""; // 화면이 다시 만들어져도 점검은 한 번만

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
                if ("table".equals(mode()) || "sub".equals(mode())) load("file:///android_asset/web/start.html#lost");
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
        android.widget.FrameLayout root = new android.widget.FrameLayout(this);
        root.setBackgroundColor(Color.parseColor("#F6F5F1"));
        root.addView(web, new android.widget.FrameLayout.LayoutParams(-1, -1));
        root.setOnApplyWindowInsetsListener((v, in) -> {
            int t = in.getSystemWindowInsetTop(), bo = in.getSystemWindowInsetBottom(), l = in.getSystemWindowInsetLeft(), r = in.getSystemWindowInsetRight();
            if (Build.VERSION.SDK_INT >= 30) {
                android.graphics.Insets i = in.getInsets(android.view.WindowInsets.Type.systemBars() | android.view.WindowInsets.Type.displayCutout() | android.view.WindowInsets.Type.ime());
                t = i.top; bo = i.bottom; l = i.left; r = i.right;
            }
            v.setPadding(l, t, r, bo);
            return in;
        });
        setContentView(root);

        selftest = getIntent().getBooleanExtra("to.selftest", false);
        if (selftest && !selftestStarted && b == null) { selftestStarted = true; runSelftest(); return; }
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
        } else if ("sub".equals(m) && !prefs.getString("host", "").isEmpty()) { // 서브 기기: 메인 카운터의 주문판을 그대로
            load("http://" + prefs.getString("host", "") + ":" + OrderServer.PORT + "/admin.html");
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
        @JavascriptInterface public String key() {
            if (currentUrl.startsWith("http://127.0.0.1:")) return OrderService.key(MainActivity.this);
            String h = prefs.getString("host", "");
            if ("sub".equals(MainActivity.this.mode()) && !h.isEmpty() && currentUrl.startsWith("http://" + h + ":")) return prefs.getString("subToken", "");
            return "";
        }

        /** 서브 기기로 연결(주방 · 계산대): 성공하면 "" , 실패하면 이유 */
        @JavascriptInterface public String pair(String host, String code, String name, String role) {
            if (!local() || host == null || !host.matches("[0-9.]{7,15}")) return "주소가 올바르지 않아요";
            try {
                String r = http("POST", "http://" + host + ":" + OrderServer.PORT + "/api/pair", new JSONObject().put("code", code).put("name", name).put("role", role).toString(), null);
                if (r == null) return "카운터에 닿지 않았어요. 같은 와이파이인지 확인해 주세요";
                if (r.startsWith("ERR")) { try { return new JSONObject(r.substring(r.indexOf('{'))).optString("error", "연결하지 못했어요"); } catch (Exception e) { return "연결하지 못했어요"; } }
                JSONObject j = new JSONObject(r);
                prefs.edit().putString("mode", "sub").putString("host", host).putString("subToken", j.getString("token"))
                        .putString("subRole", j.optString("role")).putString("subName", j.optString("name")).apply();
                ui.post(MainActivity.this::go);
                return "";
            } catch (Exception e) {
                return "연결하지 못했어요";
            }
        }

        /** 서브 기기 연결 끊고 처음 화면으로 */
        @JavascriptInterface public void leaveSub() {
            if (!"sub".equals(MainActivity.this.mode())) return;
            prefs.edit().putString("mode", "").remove("subToken").apply();
            load("file:///android_asset/web/start.html");
        }

        @JavascriptInterface public boolean isSub() { return "sub".equals(MainActivity.this.mode()); }

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
        @JavascriptInterface public void lost() { if ("table".equals(MainActivity.this.mode()) || "sub".equals(MainActivity.this.mode())) load("file:///android_asset/web/start.html#lost"); }

        /** 저장된 카운터로 다시(연결 끊겼을 때) */
        @JavascriptInterface public String savedHost() { return prefs.getString("host", ""); }

        @JavascriptInterface public void reconnect(String host) {
            if (!local()) return;
            if (host != null && host.matches("[0-9.]{7,15}")) prefs.edit().putString("host", host).putString("mode", "sub".equals(MainActivity.this.mode()) ? "sub" : "table").apply();
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
                http("POST", base + "/api/admin/settings", "{\"skin\":\"premium\"}", key);
                check("premium".equals(new JSONObject(http("GET", base + "/api/state?table=3", null, null)).optString("skin")), "default skin premium");

                // 가격을 속여 보내도 카운터 메뉴 값으로 계산되는지
                String r = http("POST", base + "/api/order", "{\"table\":3,\"items\":[{\"id\":\"americano\",\"qty\":2,\"price\":1},{\"id\":\"cake\",\"qty\":1}],\"note\":\"얼음 적게\"}", null);
                JSONObject od = new JSONObject(r).getJSONObject("order");
                check(od.getLong("total") == 4500 * 2 + 6500, "order total " + od.getLong("total"));
                // 같은 주문 열쇠로 두 번 보내도 한 번만
                String d1 = http("POST", base + "/api/order", "{\"table\":4,\"key\":\"t4-dup\",\"items\":[{\"id\":\"tea\",\"qty\":1}]}", null);
                String d2 = http("POST", base + "/api/order", "{\"table\":4,\"key\":\"t4-dup\",\"items\":[{\"id\":\"tea\",\"qty\":1}]}", null);
                JSONObject a0 = new JSONObject(http("GET", base + "/api/admin", null, key));
                int t4 = 0;
                for (int i = 0; i < a0.getJSONArray("orders").length(); i++) if (a0.getJSONArray("orders").getJSONObject(i).getInt("table") == 4) t4++;
                check(new JSONObject(d1).getJSONObject("order").getString("id").equals(new JSONObject(d2).getJSONObject("order").getString("id")) && t4 == 1, "duplicate order blocked");
                http("POST", base + "/api/admin/status", new JSONObject().put("id", new JSONObject(d1).getJSONObject("order").getString("id")).put("status", "canceled").toString(), key);
                http("POST", base + "/api/order", "{\"table\":5,\"items\":[{\"id\":\"latte\",\"qty\":1},{\"id\":\"croffle\",\"qty\":2}]}", null);
                http("POST", base + "/api/order", "{\"table\":1,\"items\":[{\"id\":\"ade\",\"qty\":3}]}", null);
                http("POST", base + "/api/call", "{\"table\":2,\"what\":\"물 · 물티슈\"}", null);

                String noKey = http("GET", base + "/api/admin", null, "wrong");
                check(noKey != null && noKey.startsWith("ERR 403"), "admin needs key");
                JSONObject ad = new JSONObject(http("GET", base + "/api/admin", null, key));
                check(ad.getJSONArray("orders").length() == 4 && ad.getJSONArray("calls").length() == 1, "admin sees orders");
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

                // AI와 연동하기: 가짜 AI 서버(이 기기 안)로 OpenAI · Gemini 방식 모두 확인
                int fport = fakeAi();
                http("POST", base + "/api/admin/ai", new JSONObject().put("base", "http://127.0.0.1:" + fport).toString(), key);
                for (String pv : new String[]{"openai", "gemini"}) {
                    http("POST", base + "/api/admin/ai", new JSONObject().put("provider", pv).put("key", "test-secret-" + pv).put("imageProvider", pv).toString(), key);
                    String tr = http("POST", base + "/api/admin/ai/test", new JSONObject().put("provider", pv).toString(), key);
                    String gr = http("POST", base + "/api/admin/ai/image", "{\"prompt\":\"아메리카노 사진\"}", key);
                    String gimg = gr != null && !gr.startsWith("ERR") ? new JSONObject(gr).optString("img") : "";
                    HttpURLConnection gi = gimg.isEmpty() ? null : (HttpURLConnection) new URL(base + gimg).openConnection();
                    check(tr != null && !tr.startsWith("ERR") && gi != null && gi.getResponseCode() == 200 && "image/jpeg".equals(gi.getContentType()), "ai " + pv + " image " + gr);
                }
                // Claude: 메뉴 설명 · 사진 설명 쓰기(그림은 만들지 않음)
                http("POST", base + "/api/admin/ai", "{\"provider\":\"claude\",\"key\":\"test-secret-claude\"}", key);
                String ct0 = http("POST", base + "/api/admin/ai/test", "{\"provider\":\"claude\"}", key);
                String cw = http("POST", base + "/api/admin/ai/write", "{\"kind\":\"desc\",\"name\":\"카페라떼\",\"cat\":\"커피\"}", key);
                String cp = http("POST", base + "/api/admin/ai/write", "{\"kind\":\"prompt\",\"name\":\"카페라떼\"}", key);
                check(ct0 != null && !ct0.startsWith("ERR") && cw != null && new JSONObject(cw).optString("text").contains("라떼") && cp != null && !cp.startsWith("ERR"), "ai claude writes " + cw);
                String info = http("GET", base + "/api/admin/ai", null, key);
                JSONObject ij = new JSONObject(info);
                String pub = http("GET", base + "/api/state?table=1", null, null) + http("GET", base + "/api/admin", null, key);
                check(ij.getJSONObject("providers").getJSONObject("claude").getBoolean("connected") && ij.getBoolean("imageReady") && ij.getBoolean("textReady")
                        && !info.contains("test-secret") && !pub.contains("test-secret"), "ai three providers, keys private");
                String bad = http("POST", base + "/api/admin/ai/image", "{\"prompt\":\"x\"}", key);
                check(bad != null && bad.startsWith("ERR 400"), "ai short prompt rejected");
                // Claude만 연결된 경우: 사진은 안 되고 이유를 알려 줌
                http("POST", base + "/api/admin/ai", "{\"provider\":\"openai\",\"key\":\"\"}", key);
                http("POST", base + "/api/admin/ai", "{\"provider\":\"gemini\",\"key\":\"\"}", key);
                String onlyC = http("POST", base + "/api/admin/ai/image", "{\"prompt\":\"아메리카노 사진\"}", key);
                check(onlyC != null && onlyC.startsWith("ERR 400") && onlyC.contains("Claude"), "claude-only explains no images");
                http("POST", base + "/api/admin/ai", "{\"disconnectAll\":true,\"base\":\"\"}", key);
                String off = http("POST", base + "/api/admin/ai/image", "{\"prompt\":\"아메리카노 사진\"}", key);
                check(off != null && off.startsWith("ERR 400") && off.contains("연동"), "ai off needs connect");

                // 주방 · 보조 계산대(서브 기기) 연결
                String wrong = http("POST", base + "/api/pair", "{\"code\":\"000000\",\"role\":\"kitchen\"}", null);
                check(wrong != null && wrong.startsWith("ERR 400"), "pair needs code");
                String code = new JSONObject(http("POST", base + "/api/admin/devices/code", "{}", key)).getString("code");
                JSONObject kit = new JSONObject(http("POST", base + "/api/pair", new JSONObject().put("code", code).put("name", "주방").put("role", "kitchen").toString(), null));
                String reuse = http("POST", base + "/api/pair", new JSONObject().put("code", code).put("role", "counter").toString(), null);
                String code2 = new JSONObject(http("POST", base + "/api/admin/devices/code", "{}", key)).getString("code");
                JSONObject cnt = new JSONObject(http("POST", base + "/api/pair", new JSONObject().put("code", code2).put("name", "계산대 2").put("role", "counter").toString(), null));
                String kt = kit.getString("token"), ct = cnt.getString("token");
                JSONObject kv = new JSONObject(http("GET", base + "/api/admin", null, kt));
                check("kitchen".equals(kv.getJSONObject("me").getString("role")) && kv.getJSONArray("orders").length() == new JSONObject(http("GET", base + "/api/admin", null, key)).getJSONArray("orders").length() && reuse.startsWith("ERR 400"), "kitchen sees same orders");
                String o5 = null;
                for (int i = 0; i < kv.getJSONArray("orders").length(); i++) if (kv.getJSONArray("orders").getJSONObject(i).getInt("table") == 5) o5 = kv.getJSONArray("orders").getJSONObject(i).getString("id");
                String ks = http("POST", base + "/api/admin/status", new JSONObject().put("id", o5).put("status", "cooking").toString(), kt);
                String km = http("POST", base + "/api/admin/menu", "{\"categories\":[],\"items\":[]}", kt);
                String kc = http("POST", base + "/api/admin/clear", "{\"table\":5}", kt);
                check(ks != null && !ks.startsWith("ERR") && km.startsWith("ERR 403") && kc.startsWith("ERR 403"), "kitchen can cook, not edit menu or pay");
                String cc = http("POST", base + "/api/admin/clear", "{\"table\":1}", ct);
                String cs = http("POST", base + "/api/admin/settings", "{\"shop\":\"x\"}", ct);
                check(cc != null && !cc.startsWith("ERR") && cs.startsWith("ERR 403"), "counter2 can pay, not change settings");
                JSONArray devs = new JSONObject(http("GET", base + "/api/admin/devices", null, key)).getJSONArray("devices");
                check(devs.length() >= 2 && !devs.toString().contains(kt), "device list hides tokens");
                for (int i = 0; i < devs.length(); i++) if ("계산대 2".equals(devs.getJSONObject(i).optString("name")))
                    http("POST", base + "/api/admin/devices/remove", new JSONObject().put("id", devs.getJSONObject(i).getString("id")).toString(), key);
                String gone = http("GET", base + "/api/admin", null, ct);
                check(gone != null && gone.startsWith("ERR 403"), "removed device blocked");

                // 알림벨: 기본 소리 · 내 소리 올리기
                HttpURLConnection sw = (HttpURLConnection) new URL(base + "/snd/chime.wav").openConnection();
                check(sw.getResponseCode() == 200 && "audio/wav".equals(sw.getContentType()) && sw.getContentLength() > 10000, "bell sound served");
                byte[] fake = new byte[4000];
                fake[0] = 'R'; fake[1] = 'I'; fake[2] = 'F'; fake[3] = 'F';
                HttpURLConnection up2 = (HttpURLConnection) new URL(base + "/api/admin/sound").openConnection();
                up2.setDoOutput(true); up2.setRequestMethod("POST"); up2.setRequestProperty("X-Key", key); up2.setRequestProperty("X-Ext", "wav");
                try (OutputStream o = up2.getOutputStream()) { o.write(fake); }
                String sf = new JSONObject(new String(OrderServer.readAll(up2.getInputStream()), StandardCharsets.UTF_8)).getString("file");
                http("POST", base + "/api/admin/settings", new JSONObject().put("bell", "custom").put("bellCustom", sf).put("bellRepeat", 3).toString(), key);
                JSONObject bs = new JSONObject(http("GET", base + "/api/admin", null, kt)).getJSONObject("settings");
                HttpURLConnection sg = (HttpURLConnection) new URL(base + sf).openConnection();
                check("custom".equals(bs.optString("bell")) && sf.equals(bs.optString("bellCustom")) && bs.optInt("bellRepeat") == 3 && sg.getResponseCode() == 200, "custom bell saved and shared");
                String badSnd = http("POST", base + "/api/admin/sound", "{}", kt);
                check(badSnd != null && badSnd.startsWith("ERR 403"), "only main uploads bell");
                http("POST", base + "/api/admin/settings", "{\"bell\":\"dingdong\",\"bellRepeat\":2}", key);
                kitchenToken = kt;

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
                Thread.sleep(5000);
                probe("admin", "JSON.stringify({key:(typeof KEY=='string'?KEY.length:-1),rev:(typeof REV=='number'?REV:-1),loaded:!!(typeof D!='undefined'&&D),orders:document.querySelectorAll('.od').length})");
                Thread.sleep(1000);
                st("SHOT admin");
                Thread.sleep(7000);
                load(base + "/table.html?t=3");
                Thread.sleep(5000);
                probe("table", "JSON.stringify({loaded:document.querySelectorAll('.card').length>0})");
                Thread.sleep(1000);
                st("SHOT table");
                Thread.sleep(7000);
                js("document.querySelector('[data-add=americano]') && document.querySelector('[data-add=americano]').click();" +
                   "document.querySelector('[data-add=cake]') && document.querySelector('[data-add=cake]').click();");
                Thread.sleep(3000);
                probe("cart", "JSON.stringify({loaded:document.getElementById('barCnt').textContent==='2'})");
                Thread.sleep(1000);
                st("SHOT cart");
                Thread.sleep(7000);
                // 스킨 바꾸기: 저장되고(다시 읽어도 그대로) 손님 화면에 바로 적용되는지
                for (String sk : new String[]{"cafe", "korean"}) {
                    http("POST", base + "/api/admin/settings", "{\"skin\":\"" + sk + "\"}", key);
                    Thread.sleep(2500);
                    probe("skin-" + sk, "JSON.stringify({loaded:document.documentElement.getAttribute('data-skin')==='" + sk + "'})");
                    Thread.sleep(1000);
                    st("SHOT " + sk);
                    Thread.sleep(7000);
                }
                check("korean".equals(new Store(getFilesDir()).tableView(0).optString("skin")), "skin saved to file");
                check(new Store(getFilesDir()).tableView(0).getJSONArray("items").length() >= 5, "menu kept after skin change");
                js("document.querySelector('.card[data-id=americano] .nm') && document.querySelector('.card[data-id=americano] .nm').click();");
                Thread.sleep(2500);
                probe("detail", "JSON.stringify({loaded:!!document.querySelector('.box.detail')})");
                Thread.sleep(1000);
                st("SHOT detail");
                Thread.sleep(7000);
                http("POST", base + "/api/admin/settings", "{\"skin\":\"premium\"}", key);
                String lan2 = lanIp();
                if (!lan2.isEmpty() && !kitchenToken.isEmpty()) { // 주방 화면(LAN 주소로 열어 사장님 열쇠 대신 주방 열쇠를 씀)
                    load("http://" + lan2 + ":" + OrderServer.PORT + "/admin.html#key=" + kitchenToken);
                    Thread.sleep(5000);
                    probe("kitchen", "JSON.stringify({loaded:document.body.classList.contains('kitchen')&&document.querySelectorAll('.od').length>0})");
                    Thread.sleep(1000);
                    st("SHOT kitchen");
                    Thread.sleep(7000);
                }
                load("file:///android_asset/web/start.html");
                Thread.sleep(4000);
                st("SHOT start");
                Thread.sleep(7000);
                st("DONE");
            } catch (Throwable e) {
                st("FAIL exception " + e);
                st("DONE");
            }
        }).start();
    }

    /** 화면 확인: 느린 에뮬레이터를 위해 최대 4번(약 8초) 다시 봄 */
    private void probe(String what, String expr) {
        new Thread(() -> {
            for (int tries = 0; tries < 4; tries++) {
                final String[] res = {null};
                final java.util.concurrent.CountDownLatch l = new java.util.concurrent.CountDownLatch(1);
                ui.post(() -> web.evaluateJavascript(expr, v -> { res[0] = v; l.countDown(); }));
                try { l.await(3, java.util.concurrent.TimeUnit.SECONDS); } catch (InterruptedException ignored) { }
                boolean ok = res[0] != null && res[0].contains("\\\"loaded\\\":true");
                if (ok || tries == 3) { st("INFO probe " + what + " " + res[0]); check(ok, what + " screen loaded"); return; }
                try { Thread.sleep(2000); } catch (InterruptedException ignored) { }
            }
        }).start();
    }

    /** 점검용 가짜 AI 서버: OpenAI(/v1/...) · Gemini(/v1beta/...) 모양으로 PNG를 돌려줌 */
    private int fakeAi() throws Exception {
        final java.net.ServerSocket ss = new java.net.ServerSocket(0, 8, InetAddress.getByName("127.0.0.1"));
        android.graphics.Bitmap bm = android.graphics.Bitmap.createBitmap(64, 64, android.graphics.Bitmap.Config.ARGB_8888);
        bm.eraseColor(Color.rgb(200, 150, 90));
        ByteArrayOutputStream pb = new ByteArrayOutputStream();
        bm.compress(android.graphics.Bitmap.CompressFormat.PNG, 100, pb);
        final String png = android.util.Base64.encodeToString(pb.toByteArray(), android.util.Base64.NO_WRAP);
        Thread t = new Thread(() -> {
            while (true) {
                try (java.net.Socket so = ss.accept()) {
                    InputStream in = so.getInputStream();
                    StringBuilder head = new StringBuilder();
                    int c, len = 0;
                    while ((c = in.read()) >= 0) { head.append((char) c); if (head.toString().endsWith("\r\n\r\n")) break; }
                    String hs = head.toString();
                    for (String l : hs.split("\r\n")) if (l.toLowerCase().startsWith("content-length:")) len = Integer.parseInt(l.substring(15).trim());
                    for (int i = 0; i < len; i++) in.read();
                    boolean auth = hs.contains("Bearer test-secret-openai") || hs.toLowerCase().contains("x-goog-api-key: test-secret-gemini")
                            || (hs.toLowerCase().contains("x-api-key: test-secret-claude") && hs.toLowerCase().contains("anthropic-version:"));
                    String path = hs.split(" ")[1];
                    String body = !auth ? "{\"error\":{\"message\":\"bad key\"}}"
                            : path.startsWith("/v1/images") ? "{\"data\":[{\"b64_json\":\"" + png + "\"}]}"
                            : path.startsWith("/v1/messages") ? "{\"content\":[{\"type\":\"text\",\"text\":\"부드러운 우유 거품을 올린 고소한 라떼\"}]}"
                            : path.contains(":generateContent") ? "{\"candidates\":[{\"content\":{\"parts\":[{\"text\":\"ok\"},{\"inlineData\":{\"mimeType\":\"image/png\",\"data\":\"" + png + "\"}}]}}]}"
                            : "{\"data\":[],\"models\":[]}";
                    byte[] bb = body.getBytes(StandardCharsets.UTF_8);
                    OutputStream o = so.getOutputStream();
                    o.write(("HTTP/1.1 " + (auth ? "200 OK" : "401 Unauthorized") + "\r\nContent-Type: application/json\r\nContent-Length: " + bb.length + "\r\nConnection: close\r\n\r\n").getBytes(StandardCharsets.UTF_8));
                    o.write(bb);
                    o.flush();
                } catch (Exception e) {
                    if (ss.isClosed()) return;
                }
            }
        }, "fake-ai");
        t.setDaemon(true);
        t.start();
        return ss.getLocalPort();
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
