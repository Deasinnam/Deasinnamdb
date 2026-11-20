package com.daesinnam.sseum;

import android.app.Activity;
import android.app.PendingIntent;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.MediaStore;
import android.provider.Settings;
import android.util.Log;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

import rikka.shizuku.Shizuku;

/** 덜씀 (갤럭시): 화면은 assets/ui 의 웹 화면, 정리는 Cleaner. */
public class MainActivity extends Activity {
    static final String TAG = "Sseum";
    private static final int REQ_TRASH = 41, REQ_MEDIA = 42, REQ_NOTIF = 43, REQ_SHZ = 44;
    private final Handler main = new Handler(Looper.getMainLooper());
    private WebView web;
    private boolean selftest;

    private final Shizuku.OnRequestPermissionResultListener shzResult = (code, res) -> push("perms", "{}");

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        selftest = getIntent() != null && getIntent().getBooleanExtra("sseum.selftest", false);
        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#EEF0FA"));
        android.widget.FrameLayout root = new android.widget.FrameLayout(this);
        root.addView(web, new android.widget.FrameLayout.LayoutParams(-1, -1));
        setContentView(root);
        Compat.edgeToEdge(getWindow());
        root.setOnApplyWindowInsetsListener((v, insets) -> {
            int[] s = Compat.bars(insets);
            v.setPadding(s[0], s[1], s[2], s[3]);
            return Compat.consumed(insets);
        });
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(false);
        s.setSupportZoom(false);
        s.setTextZoom(100);
        web.setVerticalScrollBarEnabled(false);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.addJavascriptInterface(new Bridge(), "S");
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) { return !"file".equals(r.getUrl().getScheme()); }
        });
        web.loadUrl("file:///android_asset/ui/index.html" + (selftest ? "?selftest" : ""));
        try { Shizuku.addRequestPermissionResultListener(shzResult); } catch (Throwable ignored) { }
        GuardService.sync(this);
    }

    @Override
    protected void onResume() {
        super.onResume();
        push("resume", "{}"); // 설정 화면에서 권한을 켜고 돌아왔을 수 있음
    }

    @Override
    protected void onDestroy() {
        try { Shizuku.removeRequestPermissionResultListener(shzResult); } catch (Throwable ignored) { }
        if (web != null) web.destroy();
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        web.evaluateJavascript("window.goBack ? goBack() : false", v -> { if (!"true".equals(v)) MainActivity.super.onBackPressed(); });
    }

    @Override
    protected void onActivityResult(int code, int res, Intent data) {
        super.onActivityResult(code, res, data);
        if (code == REQ_TRASH) push("trashDone", "{\"ok\":" + (res == RESULT_OK) + "}");
    }

    @Override
    public void onRequestPermissionsResult(int code, String[] p, int[] r) {
        super.onRequestPermissionsResult(code, p, r);
        push("perms", "{}");
    }

    private void push(String kind, String json) {
        main.post(() -> { if (web != null) web.evaluateJavascript("window.done && done(" + JSONObject.quote(kind) + "," + json + ")", null); });
    }

    private void bg(String kind, java.util.concurrent.Callable<String> job) {
        new Thread(() -> {
            String r;
            try { r = job.call(); } catch (Exception e) { Log.w(TAG, kind + " " + e); r = "{\"error\":" + JSONObject.quote(String.valueOf(e.getMessage())) + "}"; }
            push(kind, r);
        }, "sseum-" + kind).start();
    }

    private void open(Intent i) {
        try { startActivity(i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); }
        catch (RuntimeException e) { try { startActivity(new Intent(Settings.ACTION_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); } catch (RuntimeException ignored) { } }
    }

    private boolean mediaOk() {
        return checkSelfPermission(Build.VERSION.SDK_INT >= 33 ? android.Manifest.permission.READ_MEDIA_IMAGES : android.Manifest.permission.READ_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED;
    }

    class Bridge {
        @JavascriptInterface public String mem() { return Cleaner.mem(MainActivity.this).toString(); }

        @JavascriptInterface
        public String perms() {
            try {
                return new JSONObject().put("usage", Cleaner.usageOk(MainActivity.this)).put("write", Cleaner.writeOk(MainActivity.this))
                        .put("shzInstalled", Shizu.installed(MainActivity.this)).put("shzRunning", Shizu.running()).put("shizuku", Shizu.granted())
                        .put("notif", Build.VERSION.SDK_INT < 33 || checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED)
                        .put("media", mediaOk()).toString();
            } catch (JSONException e) { return "{}"; }
        }

        @JavascriptInterface public void openUsage() { main.post(() -> open(new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS, Uri.parse("package:" + getPackageName())))); }
        @JavascriptInterface public void openWrite() { main.post(() -> open(new Intent(Settings.ACTION_MANAGE_WRITE_SETTINGS, Uri.parse("package:" + getPackageName())))); }
        @JavascriptInterface public void openStorage() { main.post(() -> open(new Intent(Settings.ACTION_INTERNAL_STORAGE_SETTINGS))); }
        @JavascriptInterface public void openSaver() { main.post(() -> open(new Intent(Settings.ACTION_BATTERY_SAVER_SETTINGS))); }
        @JavascriptInterface public void openReleases() { main.post(() -> open(new Intent(Intent.ACTION_VIEW, Uri.parse("https://deolnureum.com/releases/")))); }

        @JavascriptInterface
        public String shizukuConnect() {
            if (Shizu.granted()) return "ok";
            if (!Shizu.installed(MainActivity.this)) { main.post(() -> open(new Intent(Intent.ACTION_VIEW, Uri.parse(Shizu.DOWNLOAD)))); return "install"; }
            if (!Shizu.running()) {
                main.post(() -> { Intent i = getPackageManager().getLaunchIntentForPackage(Shizu.PKG); if (i != null) open(i); });
                return "start";
            }
            main.post(() -> Shizu.request(REQ_SHZ));
            return "asked";
        }

        @JavascriptInterface
        public void askNotif() { if (Build.VERSION.SDK_INT >= 33) main.post(() -> requestPermissions(new String[]{android.Manifest.permission.POST_NOTIFICATIONS}, REQ_NOTIF)); }

        @JavascriptInterface
        public void askMedia() {
            main.post(() -> requestPermissions(Build.VERSION.SDK_INT >= 33
                    ? new String[]{android.Manifest.permission.READ_MEDIA_IMAGES, android.Manifest.permission.READ_MEDIA_VIDEO}
                    : new String[]{android.Manifest.permission.READ_EXTERNAL_STORAGE}, REQ_MEDIA));
        }

        // ---------- 메모리 덜씀 ----------
        @JavascriptInterface public void idle(int minutes) { bg("idle", () -> Cleaner.idleApps(MainActivity.this, minutes).toString()); }

        @JavascriptInterface
        public void memClean(String js) {
            bg("memDone", () -> {
                JSONObject o = new JSONObject(js);
                long before = Cleaner.availMem(MainActivity.this);
                List<String> pk = new ArrayList<>();
                JSONArray a = o.optJSONArray("pkgs");
                if (a != null) for (int i = 0; i < a.length(); i++) pk.add(a.getString(i));
                int n = Cleaner.stopApps(MainActivity.this, pk);
                if (o.optBoolean("bg", true)) Cleaner.trimBackground(MainActivity.this);
                Thread.sleep(1500);
                long after = Cleaner.availMem(MainActivity.this);
                return new JSONObject().put("stopped", n).put("freed", Math.max(0, after - before)).put("full", Shizu.granted()).toString();
            });
        }

        // ---------- 저장공간 덜씀 ----------
        @JavascriptInterface public void storage() { bg("storage", () -> Cleaner.storage(MainActivity.this).toString()); }

        @JavascriptInterface
        public void storageClean(String js) {
            bg("storageDone", () -> {
                JSONObject o = new JSONObject(js), r = new JSONObject();
                if (o.optBoolean("cache")) r.put("cache", Cleaner.trimCaches(MainActivity.this));
                if (o.optJSONArray("apks") != null) r.put("apk", Cleaner.deleteApks(o.optJSONArray("apks")));
                if (o.optBoolean("trash")) {
                    List<Uri> uris = new ArrayList<>();
                    long[] t = Cleaner.trash(MainActivity.this, uris);
                    if (!uris.isEmpty() && Compat.SDK >= 30) {
                        PendingIntent pi = MediaStore.createDeleteRequest(getContentResolver(), uris);
                        main.post(() -> {
                            try { startIntentSenderForResult(pi.getIntentSender(), REQ_TRASH, null, 0, 0, 0); }
                            catch (Exception e) { push("trashDone", "{\"ok\":false}"); }
                        });
                        r.put("trashAsked", t[1]);
                    }
                }
                return r.toString();
            });
        }

        // ---------- 배터리 덜씀 ----------
        @JavascriptInterface public String battery() { return Cleaner.battery(MainActivity.this).toString(); }

        @JavascriptInterface
        public void setBattery(String js) {
            try {
                JSONObject o = new JSONObject(js);
                android.content.SharedPreferences.Editor e = Cleaner.prefs(MainActivity.this).edit();
                if (o.has("auto")) e.putBoolean("batAuto", o.getBoolean("auto"));
                if (o.has("saver")) e.putBoolean("batSaver", o.getBoolean("saver"));
                if (o.has("dim")) e.putBoolean("batDim", o.getBoolean("dim"));
                if (o.has("bright")) e.putInt("batBright", o.getInt("bright"));
                e.apply();
                if (o.has("auto") && !o.getBoolean("auto")) new Thread(() -> Cleaner.batteryOff(MainActivity.this)).start();
                GuardService.sync(MainActivity.this);
            } catch (JSONException ignored) { }
        }

        @JavascriptInterface public void batteryNow() { bg("batDone", () -> new JSONObject().put("did", Cleaner.batteryOn(MainActivity.this)).toString()); }
        @JavascriptInterface public void batteryRestore() { bg("batDone", () -> { Cleaner.batteryOff(MainActivity.this); return "{\"restored\":true}"; }); }

        // ---------- 오래된 갤럭시 가볍게 ----------
        @JavascriptInterface
        public String old() {
            android.content.SharedPreferences p = Cleaner.prefs(MainActivity.this);
            try {
                return new JSONObject().put("animLight", p.getBoolean("animLight", false)).put("autoClean", p.getBoolean("autoClean", false))
                        .put("autoLast", p.getLong("autoLast", 0)).put("autoLastN", p.getInt("autoLastN", 0)).toString();
            } catch (JSONException e) { return "{}"; }
        }

        @JavascriptInterface public void setAnim(boolean light) { bg("animDone", () -> new JSONObject().put("ok", Cleaner.anim(MainActivity.this, light)).put("light", light).toString()); }

        @JavascriptInterface
        public void setAutoClean(boolean on) {
            Cleaner.prefs(MainActivity.this).edit().putBoolean("autoClean", on).apply();
            GuardService.sync(MainActivity.this);
        }

        @JavascriptInterface public String version() { return BuildConfig.VERSION_NAME; }
        @JavascriptInterface public void report(String s) { Log.i("SSEUM_SELFTEST", s); }
        @JavascriptInterface public void tap() { getWindow().getDecorView().performHapticFeedback(android.view.HapticFeedbackConstants.KEYBOARD_TAP); }
    }
}
