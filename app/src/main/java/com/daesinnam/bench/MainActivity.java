package com.daesinnam.bench;

import android.app.Activity;
import android.content.ComponentName;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.ResolveInfo;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.WindowManager;
import android.webkit.ConsoleMessage;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;

import org.json.JSONObject;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * 덜누름 벤치 — 덜누름 앱들이 하는 실제 작업(문서 · 사진 · 영상 · 오디오 · 창 · 웹 · 게임 · AI · 계기판)을
 * 이 기기에서 돌려 보고 "PC처럼 어디까지 되나"를 점수로 보여 줍니다.
 * 화면과 점수 계산은 assets/ui/ (WebView), 기기 측정은 Tests · DeviceInfo 가 맡습니다.
 * 인터넷으로 아무것도 보내지 않습니다. 결과는 이 기기에만 저장됩니다.
 */
public class MainActivity extends Activity {
    static final String TAG = "Bench";
    static final String SELFTEST_TAG = "BENCH_SELFTEST";
    static final String JARVIS_PKG = "com.daesinnam.localai";
    static final String ACTION_JARVIS_BENCH = "com.daesinnam.ai.action.BENCH";
    static final int REQ_JARVIS = 41;

    private WebView web;
    private SharedPreferences prefs;
    private boolean selftest;
    private final Handler main = new Handler(Looper.getMainLooper());
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private volatile boolean cancel;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        prefs = getSharedPreferences("bench", MODE_PRIVATE);
        selftest = getIntent().getBooleanExtra("bench.selftest", false);
        web = new WebView(this);
        WebSettings ws = web.getSettings();
        ws.setJavaScriptEnabled(true);
        ws.setDomStorageEnabled(true);
        ws.setAllowFileAccess(true);
        ws.setMediaPlaybackRequiresUserGesture(true);
        web.setBackgroundColor(0xFF0B0B0D);
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(ConsoleMessage m) {
                Log.i("BenchConsole", m.message() + " (" + m.sourceId() + ":" + m.lineNumber() + ")");
                return true;
            }
        });
        web.addJavascriptInterface(new Bridge(), "Android");
        setContentView(web);
        web.loadUrl("file:///android_asset/ui/index.html" + (selftest ? "?selftest=1" : ""));
    }

    @Override
    public void onBackPressed() {
        web.evaluateJavascript("window.Bench && Bench.back ? Bench.back() : false", v -> {
            if (!"true".equals(v)) MainActivity.super.onBackPressed();
        });
    }

    @Override
    protected void onPause() {
        super.onPause();
        // 측정 중에 다른 앱으로 넘어가면 결과가 흔들리므로 JS에 알려 그 측정을 무효로 표시합니다.
        if (web != null) web.evaluateJavascript("window.Bench && Bench.paused && Bench.paused()", null);
    }

    @Override
    protected void onDestroy() {
        cancel = true;
        worker.shutdownNow();
        super.onDestroy();
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        super.onActivityResult(req, res, data);
        if (req != REQ_JARVIS) return;
        String out = data != null ? data.getStringExtra("bench") : null;
        if (res != RESULT_OK || out == null) {
            String err = data != null ? data.getStringExtra("error") : null;
            out = "{\"cancel\":true" + (err != null ? ",\"na\":" + JSONObject.quote(err) : "") + "}";
        }
        js("jarvisDone", out);
    }

    /** 자비스(Chat DNR Ai) 설치 여부 · 버전 · 벤치 입구가 있는지 */
    String jarvisInfo() {
        try {
            JSONObject o = new JSONObject();
            PackageInfo pi;
            try { pi = getPackageManager().getPackageInfo(JARVIS_PKG, 0); } catch (Exception e) { o.put("installed", false); return o.toString(); }
            o.put("installed", true);
            o.put("version", pi.versionName);
            Intent i = new Intent(ACTION_JARVIS_BENCH).setPackage(JARVIS_PKG);
            ResolveInfo ri = getPackageManager().resolveActivity(i, 0);
            o.put("bench", ri != null);
            return o.toString();
        } catch (Exception e) { return "{}"; }
    }

    void js(String fn, String arg) {
        main.post(() -> {
            if (web != null) web.evaluateJavascript("window.Bench && Bench." + fn + "(" + JSONObject.quote(arg) + ")", null);
        });
    }

    /** 화면(JS)에서 부르는 기기 기능 */
    final class Bridge {
        @JavascriptInterface public String device() {
            try { return DeviceInfo.json(MainActivity.this).toString(); } catch (Throwable t) { return "{}"; }
        }

        @JavascriptInterface public String apps() {
            try { return DeviceInfo.apps(MainActivity.this).toString(); } catch (Throwable t) { return "[]"; }
        }

        @JavascriptInterface public String battery() {
            try { return DeviceInfo.battery(MainActivity.this).toString(); } catch (Throwable t) { return "{}"; }
        }

        /** 기기 측정 하나를 뒤에서 돌리고, 끝나면 Bench.nativeDone(결과)를 부릅니다 */
        @JavascriptInterface public void run(String id, String mode) {
            cancel = false;
            worker.submit(() -> {
                JSONObject r;
                try {
                    r = Tests.run(MainActivity.this, id, mode, msg -> js("progress", msg), () -> cancel);
                } catch (Throwable t) {
                    Log.e(TAG, "test " + id, t);
                    r = new JSONObject();
                    try { r.put("id", id); r.put("error", String.valueOf(t)); } catch (Exception ignored) { }
                }
                js("nativeDone", r.toString());
            });
        }

        @JavascriptInterface public void stop() { cancel = true; }

        /** 측정하는 동안: 화면 켜 둠 + 밝기 50% 고정 (같은 조건에서 비교하려고) */
        @JavascriptInterface public void testMode(boolean on) {
            main.post(() -> {
                WindowManager.LayoutParams lp = getWindow().getAttributes();
                lp.screenBrightness = on ? 0.5f : WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_NONE;
                getWindow().setAttributes(lp);
                if (on) getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            });
        }

        @JavascriptInterface public void save(String key, String value) { prefs.edit().putString(key, value).apply(); }

        @JavascriptInterface public String load(String key) { return prefs.getString(key, ""); }

        @JavascriptInterface public void share(String text) {
            main.post(() -> {
                Intent i = new Intent(Intent.ACTION_SEND);
                i.setType("text/plain");
                i.putExtra(Intent.EXTRA_TEXT, text);
                try { startActivity(Intent.createChooser(i, "덜누름 벤치 결과 공유")); } catch (Exception ignored) { }
            });
        }

        @JavascriptInterface public boolean selftest() { return selftest; }

        @JavascriptInterface public String jarvis() { return jarvisInfo(); }

        /** 자비스의 벤치 입구를 엽니다. 결과는 Bench.jarvisDone(JSON)으로 */
        @JavascriptInterface public void runJarvis() {
            main.post(() -> {
                try {
                    startActivityForResult(new Intent(ACTION_JARVIS_BENCH).setPackage(JARVIS_PKG), REQ_JARVIS);
                } catch (Exception e) {
                    js("jarvisDone", "{\"cancel\":true,\"na\":\"자비스를 열지 못했어요\"}");
                }
            });
        }

        @JavascriptInterface public void log(String s) { Log.i(SELFTEST_TAG, s); }

        @JavascriptInterface public String version() { return BuildConfig.VERSION_NAME; }
    }
}
