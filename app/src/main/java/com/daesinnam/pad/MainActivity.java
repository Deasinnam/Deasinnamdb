package com.daesinnam.pad;

import android.app.Activity;
import android.app.ActivityOptions;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.IntentFilter;
import android.media.AudioManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.drawable.Drawable;
import android.hardware.display.DisplayManager;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.util.Base64;
import android.util.Log;
import android.view.Display;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 덜누름 패드: DeX에 연결한 동안 휴대폰 화면을 버튼 판으로 씁니다.
 * 버튼을 누르면 고른 앱이 큰 화면(DeX·외부 화면)에 열립니다. 외부 화면이 없으면 이 화면에서 엽니다.
 *
 * 화면은 assets/ui (WebView), 이 클래스는 앱 목록·아이콘·앱 열기·화면(디스플레이) 정보를 화면에 알려 줍니다.
 * 버튼 판은 기기 안(SharedPreferences)에만 저장합니다. 인터넷 권한은 없습니다.
 */
public class MainActivity extends Activity {
    static final String TAG = "DeolnureumPad";
    static final String SELFTEST_TAG = "PAD_SELFTEST";

    private WebView web;
    private DisplayManager displays;
    private final Handler main = new Handler(Looper.getMainLooper());
    private final Map<String, String> iconCache = new HashMap<>();
    private boolean selftest;
    private AudioManager audio;

    // 휴대폰 볼륨 단추 등으로 미디어 소리가 바뀌면 화면의 다이얼도 따라가게
    private final BroadcastReceiver volumeReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context c, Intent i) { notifyVolume(); }
    };

    private final DisplayManager.DisplayListener displayListener = new DisplayManager.DisplayListener() {
        @Override public void onDisplayAdded(int id) { notifyDisplays(); }
        @Override public void onDisplayRemoved(int id) { notifyDisplays(); }
        @Override public void onDisplayChanged(int id) { }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        selftest = getIntent() != null && getIntent().getBooleanExtra("pad.selftest", false);
        displays = (DisplayManager) getSystemService(Context.DISPLAY_SERVICE);
        audio = (AudioManager) getSystemService(Context.AUDIO_SERVICE);

        web = new WebView(this);
        web.setBackgroundColor(Color.BLACK);
        // 상태 표시줄·내비게이션 막대에 가리지 않게 여백을 둠 (안드로이드 15의 화면 끝까지 그리기).
        // WebView 자신의 여백(padding)은 화면 내용에 적용되지 않으므로, 바깥 틀에 여백을 줌
        android.widget.FrameLayout root = new android.widget.FrameLayout(this);
        root.setBackgroundColor(Color.BLACK);
        root.addView(web, new android.widget.FrameLayout.LayoutParams(-1, -1));
        setContentView(root);
        root.setOnApplyWindowInsetsListener((v, insets) -> {
            android.graphics.Insets b = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
            v.setPadding(b.left, b.top, b.right, b.bottom);
            return WindowInsets.CONSUMED;
        });

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(false);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setTextZoom(100);
        web.setVerticalScrollBarEnabled(false);
        web.setHorizontalScrollBarEnabled(false);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.addJavascriptInterface(new Bridge(), "Pad");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !"file".equals(request.getUrl().getScheme());
            }
        });
        web.loadUrl("file:///android_asset/ui/index.html" + (selftest ? "?selftest" : ""));
    }

    @Override
    protected void onResume() {
        super.onResume();
        displays.registerDisplayListener(displayListener, main);
        notifyDisplays();
        IntentFilter f = new IntentFilter("android.media.VOLUME_CHANGED_ACTION");
        f.addAction("android.media.STREAM_MUTE_CHANGED_ACTION");
        if (android.os.Build.VERSION.SDK_INT >= 33) registerReceiver(volumeReceiver, f, Context.RECEIVER_EXPORTED);
        else registerReceiver(volumeReceiver, f);
        notifyVolume();
    }

    @Override
    protected void onPause() {
        displays.unregisterDisplayListener(displayListener);
        try { unregisterReceiver(volumeReceiver); } catch (RuntimeException ignored) { }
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        if (web != null) web.destroy();
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        // 편집 창 등이 열려 있으면 화면이 먼저 닫음
        web.evaluateJavascript("window.padBack ? padBack() : false", v -> {
            if (!"true".equals(v)) MainActivity.super.onBackPressed();
        });
    }

    // ---------- 화면(디스플레이) ----------

    /** 앱을 열 큰 화면: 이 앱이 떠 있는 화면이 아닌, 공개된 다른 화면 (DeX·외부 모니터). 없으면 null */
    private Display targetDisplay() {
        int here = currentDisplayId();
        Display best = null;
        for (Display d : displays.getDisplays()) {
            int id = d.getDisplayId();
            if (id == here || !d.isValid()) continue;
            if ((d.getFlags() & Display.FLAG_PRIVATE) != 0) continue;
            String n = String.valueOf(d.getName()).toLowerCase();
            boolean dex = n.contains("dex") || n.contains("desktop");
            if (best == null || dex) best = d;
            if (dex) break;
        }
        return best;
    }

    private int currentDisplayId() {
        Display d = getDisplay();
        return d == null ? Display.DEFAULT_DISPLAY : d.getDisplayId();
    }

    private JSONObject displayInfo() throws JSONException {
        Display t = targetDisplay();
        JSONObject o = new JSONObject();
        o.put("here", currentDisplayId());
        o.put("onPhone", currentDisplayId() == Display.DEFAULT_DISPLAY);
        o.put("external", t != null);
        if (t != null) {
            o.put("targetId", t.getDisplayId());
            o.put("targetName", String.valueOf(t.getName()));
        }
        return o;
    }

    private void notifyDisplays() {
        if (web == null) return;
        try {
            web.evaluateJavascript("window.padDisplays && padDisplays(" + JSONObject.quote(displayInfo().toString()) + ")", null);
        } catch (JSONException ignored) {
        }
    }

    // ---------- 볼륨 (미디어 소리) ----------

    private JSONObject volumeInfo() throws JSONException {
        int s = AudioManager.STREAM_MUSIC;
        return new JSONObject().put("cur", audio.getStreamVolume(s)).put("max", audio.getStreamMaxVolume(s)).put("muted", audio.isStreamMute(s));
    }

    private String volumeJson() {
        try { return volumeInfo().toString(); } catch (JSONException e) { return "{}"; }
    }

    private void notifyVolume() {
        if (web == null || audio == null) return;
        web.evaluateJavascript("window.padVolume && padVolume(" + JSONObject.quote(volumeJson()) + ")", null);
    }

    // ---------- 앱 목록 · 아이콘 ----------

    private List<ResolveInfo> launchables() {
        Intent q = new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER);
        return getPackageManager().queryIntentActivities(q, 0);
    }

    private String iconDataUrl(String pkg, String cls) {
        String key = pkg + "/" + cls;
        String hit = iconCache.get(key);
        if (hit != null) return hit;
        PackageManager pm = getPackageManager();
        Drawable d;
        try {
            d = pm.getActivityIcon(new ComponentName(pkg, cls));
        } catch (PackageManager.NameNotFoundException e) {
            try {
                d = pm.getApplicationIcon(pkg);
            } catch (PackageManager.NameNotFoundException e2) {
                return "";
            }
        }
        int size = 144;
        Bitmap bmp = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(bmp);
        d.setBounds(0, 0, size, size);
        d.draw(c);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        bmp.compress(Bitmap.CompressFormat.PNG, 100, out);
        String url = "data:image/png;base64," + Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP);
        iconCache.put(key, url);
        return url;
    }

    private static String categoryName(int c) {
        switch (c) {
            case ApplicationInfo.CATEGORY_GAME: return "game";
            case ApplicationInfo.CATEGORY_AUDIO: return "audio";
            case ApplicationInfo.CATEGORY_VIDEO: return "video";
            case ApplicationInfo.CATEGORY_IMAGE: return "image";
            case ApplicationInfo.CATEGORY_SOCIAL: return "social";
            case ApplicationInfo.CATEGORY_NEWS: return "news";
            case ApplicationInfo.CATEGORY_MAPS: return "maps";
            case ApplicationInfo.CATEGORY_PRODUCTIVITY: return "productivity";
            case ApplicationInfo.CATEGORY_ACCESSIBILITY: return "accessibility";
            default: return "";
        }
    }

    // ---------- 앱 열기 ----------

    private JSONObject launch(String pkg, String cls) throws JSONException {
        JSONObject r = new JSONObject();
        Intent i;
        if (cls != null && !cls.isEmpty()) {
            i = new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER).setComponent(new ComponentName(pkg, cls));
        } else {
            i = getPackageManager().getLaunchIntentForPackage(pkg);
            if (i == null) return r.put("ok", false).put("error", "앱을 찾을 수 없습니다");
        }
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
        Display t = targetDisplay();
        if (t != null) {
            try {
                ActivityOptions o = ActivityOptions.makeBasic();
                o.setLaunchDisplayId(t.getDisplayId());
                startActivity(i, o.toBundle());
                Log.i(TAG, "열기 " + pkg + " → 화면 " + t.getDisplayId());
                return r.put("ok", true).put("display", t.getDisplayId()).put("external", true);
            } catch (RuntimeException e) {
                Log.w(TAG, "큰 화면에서 열지 못해 이 화면에서 엽니다: " + e);
                r.put("fallback", String.valueOf(e.getMessage()));
            }
        }
        try {
            startActivity(i);
            return r.put("ok", true).put("display", currentDisplayId()).put("external", false);
        } catch (RuntimeException e) {
            return r.put("ok", false).put("error", "열지 못했습니다: " + e.getMessage());
        }
    }

    /** 패드를 휴대폰 화면(기본 화면)으로 옮김: DeX 쪽에서 열었을 때 */
    private boolean moveToPhone() {
        if (currentDisplayId() == Display.DEFAULT_DISPLAY) return false;
        try {
            ActivityOptions o = ActivityOptions.makeBasic();
            o.setLaunchDisplayId(Display.DEFAULT_DISPLAY);
            Intent i = new Intent(this, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_MULTIPLE_TASK);
            startActivity(i, o.toBundle());
            finishAndRemoveTask();
            return true;
        } catch (RuntimeException e) {
            Log.w(TAG, "휴대폰 화면으로 옮기지 못함: " + e);
            return false;
        }
    }

    // ---------- 화면(웹)에서 부르는 것 ----------

    class Bridge {
        @JavascriptInterface
        public String apps() {
            JSONArray arr = new JSONArray();
            PackageManager pm = getPackageManager();
            for (ResolveInfo ri : launchables()) {
                try {
                    if (ri.activityInfo == null) continue;
                    String pkg = ri.activityInfo.packageName;
                    if (pkg.equals(getPackageName())) continue;
                    ApplicationInfo ai = ri.activityInfo.applicationInfo;
                    arr.put(new JSONObject()
                            .put("pkg", pkg)
                            .put("cls", ri.activityInfo.name)
                            .put("label", String.valueOf(ri.loadLabel(pm)))
                            .put("cat", ai == null ? "" : categoryName(ai.category))
                            .put("system", ai != null && (ai.flags & ApplicationInfo.FLAG_SYSTEM) != 0));
                } catch (JSONException ignored) {
                }
            }
            return arr.toString();
        }

        @JavascriptInterface
        public String icon(String pkg, String cls) {
            return iconDataUrl(pkg, cls);
        }

        @JavascriptInterface
        public String launch(String pkg, String cls) {
            final String[] out = {"{\"ok\":false}"};
            final Object lock = new Object();
            final boolean[] done = {false};
            // 액티비티 시작은 메인 스레드에서
            main.post(() -> {
                try {
                    out[0] = MainActivity.this.launch(pkg, cls).toString();
                } catch (Exception e) {
                    out[0] = "{\"ok\":false,\"error\":" + JSONObject.quote(String.valueOf(e.getMessage())) + "}";
                }
                synchronized (lock) { done[0] = true; lock.notifyAll(); }
            });
            synchronized (lock) {
                long until = System.currentTimeMillis() + 3000;
                while (!done[0] && System.currentTimeMillis() < until) {
                    try { lock.wait(200); } catch (InterruptedException e) { break; }
                }
            }
            return out[0];
        }

        @JavascriptInterface
        public String displays() {
            try {
                return displayInfo().toString();
            } catch (JSONException e) {
                return "{}";
            }
        }

        @JavascriptInterface
        public void moveToPhone() {
            main.post(MainActivity.this::moveToPhone);
        }

        @JavascriptInterface
        public String load() {
            return prefs().getString("state", "");
        }

        @JavascriptInterface
        public void save(String json) {
            prefs().edit().putString("state", json).apply();
        }

        @JavascriptInterface
        public void tap() {
            try {
                Vibrator v = getSystemService(Vibrator.class);
                if (v != null && v.hasVibrator()) v.vibrate(VibrationEffect.createPredefined(VibrationEffect.EFFECT_CLICK));
            } catch (RuntimeException ignored) {
            }
        }

        @JavascriptInterface
        public void keepScreenOn(boolean on) {
            main.post(() -> {
                if (on) getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            });
        }

        @JavascriptInterface
        public String volume() {
            return volumeJson();
        }

        @JavascriptInterface
        public String setVolume(int level) {
            try {
                int s = AudioManager.STREAM_MUSIC;
                if (audio.isStreamMute(s)) audio.adjustStreamVolume(s, AudioManager.ADJUST_UNMUTE, 0);
                audio.setStreamVolume(s, Math.max(0, Math.min(level, audio.getStreamMaxVolume(s))), 0);
            } catch (RuntimeException e) {
                Log.w(TAG, "볼륨을 바꾸지 못함: " + e);
            }
            return volumeJson();
        }

        @JavascriptInterface
        public String toggleMute() {
            try {
                audio.adjustStreamVolume(AudioManager.STREAM_MUSIC, AudioManager.ADJUST_TOGGLE_MUTE, 0);
            } catch (RuntimeException e) {
                Log.w(TAG, "음소거를 바꾸지 못함: " + e);
            }
            return volumeJson();
        }

        @JavascriptInterface
        public String version() {
            return BuildConfig.VERSION_NAME;
        }

        /** 자동 점검(에뮬레이터)에서만: 화면 상태를 기록에 남김 */
        @JavascriptInterface
        public void report(String line) {
            if (selftest) Log.i(SELFTEST_TAG, line);
        }
    }

    private SharedPreferences prefs() {
        return getSharedPreferences("pad", MODE_PRIVATE);
    }
}
