package com.daesinnam.pc;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.ComponentName;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.hardware.display.DisplayManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.text.TextUtils;
import android.util.Log;
import android.view.Display;
import android.view.WindowManager;
import android.webkit.ConsoleMessage;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.activity.ComponentActivity;
import androidx.webkit.WebViewAssetLoader;

import org.json.JSONObject;

/**
 * 폰 화면: 연결 도우미 + 터치패드.
 *
 * - 모니터 연결 상태, "모니터에 PC 화면 열기", 데스크톱 모드 켜기(개발자 옵션 / Shizuku로 자동), 자동 열기
 * - 터치패드: 폰 화면을 문질러 모니터의 포인터를 움직이고 누르기 · 오른쪽 클릭 · 끌기 · 넘기기, 폰 키보드로 글자 넣기
 * PC 화면(바탕화면 · 작업 표시줄 · 시작 메뉴)은 MainActivity가 모니터에서 그립니다.
 */
public class PhoneActivity extends ComponentActivity implements DisplayManager.DisplayListener {
    static final String TAG = "PcPhone";
    private static final String ORIGIN = "https://appassets.androidplatform.net";
    private static final int REQ_SHIZUKU = 32;

    private final Handler main = new Handler(Looper.getMainLooper());
    private WebView web;
    private SharedPreferences prefs;
    private boolean padOpen;
    private final rikka.shizuku.Shizuku.OnRequestPermissionResultListener shizukuResult = (code, result) -> {
        if (code == REQ_SHIZUKU) js("refresh");
    };

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        prefs = getSharedPreferences("pc", MODE_PRIVATE);
        try { rikka.shizuku.Shizuku.addRequestPermissionResultListener(shizukuResult); } catch (Throwable ignored) { }
        boolean selftest = BuildConfig.DEBUG && getIntent() != null && getIntent().hasExtra("pc.selftest");
        Monitor.selftestLaunch = selftest;

        web = new WebView(this);
        web.setBackgroundColor(0xFF0E1018);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setTextZoom(100);
        WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
                return loader.shouldInterceptRequest(r.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                if ("appassets.androidplatform.net".equals(r.getUrl().getHost())) return false;
                openUrl(r.getUrl().toString());
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(ConsoleMessage m) {
                Log.i(TAG + "Console", m.message() + " (" + m.lineNumber() + ")");
                return true;
            }
        });
        web.addJavascriptInterface(new Bridge(), "Android");
        setContentView(web);
        web.loadUrl(ORIGIN + "/assets/phone/index.html" + (selftest ? "?selftest" : ""));

        getSystemService(DisplayManager.class).registerDisplayListener(this, main);
        MonitorService.sync(this);
        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED && !selftest)
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 7);
    }

    @Override
    protected void onResume() {
        super.onResume();
        js("refresh");
    }

    @Override
    protected void onPause() {
        // 폰 화면을 떠나면 모니터의 터치패드 포인터도 숨김
        PointerService p = PointerService.instance;
        if (p != null && padOpen) p.hide();
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        getSystemService(DisplayManager.class).unregisterDisplayListener(this);
        try { rikka.shizuku.Shizuku.removeRequestPermissionResultListener(shizukuResult); } catch (Throwable ignored) { }
        super.onDestroy();
    }

    @Override public void onDisplayAdded(int id) { main.postDelayed(() -> js("refresh"), 900); }
    @Override public void onDisplayRemoved(int id) { js("refresh"); }
    @Override public void onDisplayChanged(int id) { }

    private void js(String what) {
        main.post(() -> { if (web != null) web.evaluateJavascript("window.onNative && onNative('" + what + "')", null); });
    }

    private void toast(String msg) {
        main.post(() -> web.evaluateJavascript("window.toast && toast(" + JSONObject.quote(msg) + ")", null));
    }

    private void openUrl(String url) {
        try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); }
        catch (Exception e) { toast("열 수 없어요"); }
    }

    private boolean open(Intent i) {
        try { startActivity(i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); return true; }
        catch (Exception e) { return false; }
    }

    private boolean pointerEnabled() {
        String on = Settings.Secure.getString(getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
        if (TextUtils.isEmpty(on)) return false;
        String me = new ComponentName(this, PointerService.class).flattenToString();
        for (String s : on.split(":")) if (s.equalsIgnoreCase(me)) return true;
        return false;
    }

    private final class Bridge {
        @JavascriptInterface
        public String status() {
            JSONObject o = Monitor.status(PhoneActivity.this);
            try {
                o.put("desktopOn", MainActivity.shownOnDisplay);
                o.put("pointerSupported", PointerService.supported());
                o.put("pointerEnabled", pointerEnabled());
                o.put("pointerReady", PointerService.instance != null);
                o.put("shizukuInstalled", Shizu.installed(PhoneActivity.this));
                o.put("shizukuRunning", Shizu.running());
                o.put("shizukuGranted", Shizu.granted());
                o.put("autoOpen", prefs.getBoolean("autoOpen", true));
                o.put("watching", MonitorService.running);
                o.put("overlay", Settings.canDrawOverlays(PhoneActivity.this));
                o.put("speed", prefs.getFloat("speed", 1.6f));
                o.put("version", BuildConfig.VERSION_NAME);
            } catch (Exception ignored) { }
            return o.toString();
        }

        @JavascriptInterface
        public String openDesktop() {
            Display d = Monitor.find(PhoneActivity.this);
            if (d == null) return "none";
            return Monitor.openDesktop(PhoneActivity.this, d) ? "ok" : "fail";
        }

        @JavascriptInterface
        public void setAutoOpen(boolean on) {
            prefs.edit().putBoolean("autoOpen", on).apply();
            MonitorService.sync(PhoneActivity.this);
        }

        @JavascriptInterface
        public void setSpeed(float v) { prefs.edit().putFloat("speed", v).apply(); }

        /** Shizuku 단계: 없음 → 받으러 가기, 꺼짐 → Shizuku 열기, 켜짐 → 허용 요청 */
        @JavascriptInterface
        public void shizukuConnect() {
            main.post(() -> {
                if (!Shizu.installed(PhoneActivity.this)) { openUrl(Shizu.DOWNLOAD); return; }
                if (!Shizu.running()) {
                    toast("Shizuku에서 '시작'을 누른 뒤 돌아와 주세요");
                    Intent i = getPackageManager().getLaunchIntentForPackage(Shizu.PKG);
                    if (i == null || !open(i)) openUrl(Shizu.DOWNLOAD);
                    return;
                }
                if (!Shizu.granted()) Shizu.request(REQ_SHIZUKU);
            });
        }

        /** 데스크톱 모드 켜기: Shizuku가 있으면 바로, 없으면 개발자 옵션 열기 */
        @JavascriptInterface
        public String enableDesktopMode() {
            if (Shizu.granted()) return Monitor.enableDesktopMode() ? "ok" : "fail";
            return open(new Intent(Settings.ACTION_APPLICATION_DEVELOPMENT_SETTINGS)) ? "devopts" : "fail";
        }

        @JavascriptInterface
        public String reboot() {
            if (!Shizu.granted()) return "noshizuku";
            String out = Shizu.run("svc power reboot", 4000);
            return out == null ? "fail" : "ok";
        }

        @JavascriptInterface public boolean openDevOptions() { return open(new Intent(Settings.ACTION_APPLICATION_DEVELOPMENT_SETTINGS)); }
        @JavascriptInterface public boolean openAbout() { return open(new Intent(Settings.ACTION_DEVICE_INFO_SETTINGS)); }
        @JavascriptInterface public boolean openAccessibility() { return open(new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)); }
        @JavascriptInterface public boolean openDisplaySettings() { return open(new Intent(Settings.ACTION_DISPLAY_SETTINGS)); }
        @JavascriptInterface public boolean openOverlay() {
            return open(new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + getPackageName())));
        }

        // ---------- 터치패드 ----------

        private PointerService p() { return PointerService.instance; }

        @JavascriptInterface
        public String padOpen(boolean on) {
            padOpen = on;
            PointerService p = p();
            main.post(() -> {
                getWindow().getDecorView().setKeepScreenOn(on);
                if (on) getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            });
            if (p == null) return pointerEnabled() ? "starting" : "off";
            if (!PointerService.supported()) return "old";
            if (!on) { main.post(p::hide); return "ok"; }
            main.post(p::show);
            return Monitor.find(PhoneActivity.this) != null ? "ok" : "nomonitor";
        }

        @JavascriptInterface
        public void move(float dx, float dy) {
            PointerService p = p();
            if (p != null) main.post(() -> p.move(dx, dy));
        }

        @JavascriptInterface public void click() { PointerService p = p(); if (p != null) main.post(p::click); }
        @JavascriptInterface public void rightClick() { PointerService p = p(); if (p != null) main.post(p::longPress); }
        @JavascriptInterface public void scroll(float dx, float dy) { PointerService p = p(); if (p != null) main.post(() -> p.scroll(dx, dy)); }
        @JavascriptInterface public void dragStart() { PointerService p = p(); if (p != null) main.post(p::dragStart); }
        @JavascriptInterface public void dragEnd() { PointerService p = p(); if (p != null) main.post(p::dragEnd); }
        @JavascriptInterface public void back() { PointerService p = p(); if (p != null) main.post(p::back); }

        @JavascriptInterface
        public String position() {
            PointerService p = p();
            if (p == null) return "[]";
            float[] a = p.position();
            return "[" + Math.round(a[0]) + "," + Math.round(a[1]) + "," + Math.round(a[2]) + "," + Math.round(a[3]) + "," + Math.round(a[4]) + "]";
        }

        /** kind: text / backspace / enter */
        @JavascriptInterface
        public String type(String kind, String text) {
            PointerService p = p();
            if (p == null) return "off";
            return p.type(kind, text == null ? "" : text);
        }

        @JavascriptInterface
        public void log(String s) { Log.i("PC_SELFTEST", s); }
    }
}
