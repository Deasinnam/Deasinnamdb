package com.daesinnam.tv;

import android.app.Activity;
import android.app.ActivityOptions;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.content.res.Configuration;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Rect;
import android.graphics.drawable.Drawable;
import android.media.AudioManager;
import android.net.Uri;
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
import android.view.WindowInsetsController;
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
 * 덜누름 TV: DeX로 연결한 (터치) 모니터를 스마트 TV처럼.
 * 넷플릭스 · 웨이브 · 티빙 · 유튜브 · 스포티파이 같은 서비스를 큰 타일에서 골라 전체 화면으로 엽니다.
 *
 * 화면은 assets/ui (WebView), 이 클래스는 앱 목록 · 아이콘 · 앱 열기 · 설치 페이지 · 볼륨 · 전체 화면을 화면에 알려 줍니다.
 * 설정은 기기 안(SharedPreferences)에만 저장합니다. 인터넷 권한은 없습니다.
 */
public class MainActivity extends Activity {
    static final String TAG = "DeolnureumTV";
    static final String SELFTEST_TAG = "TV_SELFTEST";
    /** ActivityOptions 숨은 키: 창 방식 (1 = 전체 화면) */
    static final String KEY_WINDOWING_MODE = "android.activity.windowingMode";

    private WebView web;
    private RemoteLink rlink;
    static final String EXTRA_OPEN = "open"; // 키보드 단축키: 0 = 홈, 1~9 = n번째 서비스
    private int pendingOpen = -1;
    private volatile boolean keyTest; // 설정의 '단추 눌러 보기' 중이면 모든 단추 이름을 화면에 넘김
    private android.widget.FrameLayout root;
    private final Handler main = new Handler(Looper.getMainLooper());
    private final Map<String, String> iconCache = new HashMap<>();
    private boolean selftest, immersive = true;
    private AudioManager audio;

    private final BroadcastReceiver volumeReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context c, Intent i) { notifyVolume(); }
    };
    // 앱을 새로 깔거나 지우면 타일을 다시 그림
    private final BroadcastReceiver packageReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context c, Intent i) { push("apps"); }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (getIntent() != null) pendingOpen = getIntent().getIntExtra(EXTRA_OPEN, -1);
        selftest = getIntent() != null && getIntent().getBooleanExtra("tv.selftest", false);
        audio = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        immersive = prefs().getBoolean("immersive", true);

        web = new WebView(this);
        web.setBackgroundColor(Color.BLACK);
        root = new android.widget.FrameLayout(this);
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
        s.setMediaPlaybackRequiresUserGesture(true);
        web.setVerticalScrollBarEnabled(false);
        web.setHorizontalScrollBarEnabled(false);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.addJavascriptInterface(new Bridge(), "TV");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !"file".equals(request.getUrl().getScheme());
            }
        });
        web.loadUrl("file:///android_asset/ui/index.html" + (selftest ? "?selftest" : ""));
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }

    @Override
    protected void onResume() {
        super.onResume();
        applyImmersive();
        IntentFilter f = new IntentFilter("android.media.VOLUME_CHANGED_ACTION");
        f.addAction("android.media.STREAM_MUTE_CHANGED_ACTION");
        IntentFilter p = new IntentFilter(Intent.ACTION_PACKAGE_ADDED);
        p.addAction(Intent.ACTION_PACKAGE_REMOVED);
        p.addDataScheme("package");
        if (android.os.Build.VERSION.SDK_INT >= 33) {
            registerReceiver(volumeReceiver, f, Context.RECEIVER_EXPORTED);
            registerReceiver(packageReceiver, p, Context.RECEIVER_EXPORTED);
        } else {
            registerReceiver(volumeReceiver, f);
            registerReceiver(packageReceiver, p);
        }
        notifyVolume();
        HomeButton.hide(this); // 돌아왔으니 홈 단추는 숨김
        push("resume");
    }

    @Override
    protected void onPause() {
        try { unregisterReceiver(volumeReceiver); } catch (RuntimeException ignored) { }
        try { unregisterReceiver(packageReceiver); } catch (RuntimeException ignored) { }
        super.onPause();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) { applyImmersive(); HomeButton.hide(this); } // 덜누름 TV가 다시 보이면 홈 단추는 숨김
    }

    @Override
    public void onTopResumedActivityChanged(boolean top) {
        super.onTopResumedActivityChanged(top);
        if (top) HomeButton.hide(this);
    }

    @Override
    public void onConfigurationChanged(Configuration c) {
        super.onConfigurationChanged(c);
        push("window");
    }

    @Override
    protected void onDestroy() {
        if (rlink != null) rlink.destroy();
        if (web != null) web.destroy();
        super.onDestroy();
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        int n = intent == null ? -1 : intent.getIntExtra(EXTRA_OPEN, -1);
        if (n >= 0 && web != null) web.evaluateJavascript("window.tvKey && tvKey(" + JSONObject.quote(n == 0 ? "home" : "n" + n) + ")", null);
    }

    @Override
    public void onRequestPermissionsResult(int code, String[] p, int[] r) {
        super.onRequestPermissionsResult(code, p, r);
        if (rlink != null) rlink.onPermResult(code);
    }

    @Override
    protected void onActivityResult(int code, int res, Intent data) {
        super.onActivityResult(code, res, data);
        if (rlink != null) rlink.onEnableResult(code);
    }

    private RemoteLink link() {
        if (rlink == null) rlink = new RemoteLink(this, (fn, arg) -> main.post(() -> {
            if (web != null) web.evaluateJavascript("window." + fn + " && " + fn + "(" + JSONObject.quote(arg) + ")", null);
        }));
        return rlink;
    }

    /** 리모컨 · 키보드 단추: 웹 화면이 모르는 TV 단추는 이름을 붙여 화면에 넘김 (볼륨 단추는 시스템이 처리) */
    @Override
    public boolean dispatchKeyEvent(android.view.KeyEvent e) {
        if (e.getAction() == android.view.KeyEvent.ACTION_DOWN) {
            String k = null;
            switch (e.getKeyCode()) {
                case android.view.KeyEvent.KEYCODE_CHANNEL_UP: case android.view.KeyEvent.KEYCODE_PAGE_UP: k = "chUp"; break;
                case android.view.KeyEvent.KEYCODE_CHANNEL_DOWN: case android.view.KeyEvent.KEYCODE_PAGE_DOWN: k = "chDown"; break;
                case android.view.KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE: case android.view.KeyEvent.KEYCODE_MEDIA_PLAY: k = "play"; break;
                case android.view.KeyEvent.KEYCODE_MENU: case android.view.KeyEvent.KEYCODE_SETTINGS: k = "menu"; break;
                case android.view.KeyEvent.KEYCODE_PROG_RED: k = "red"; break;
                case android.view.KeyEvent.KEYCODE_PROG_GREEN: k = "green"; break;
                case android.view.KeyEvent.KEYCODE_PROG_YELLOW: k = "yellow"; break;
                case android.view.KeyEvent.KEYCODE_PROG_BLUE: k = "blue"; break;
                case android.view.KeyEvent.KEYCODE_GUIDE: case android.view.KeyEvent.KEYCODE_TV: k = "home"; break;
                case android.view.KeyEvent.KEYCODE_MUTE: case android.view.KeyEvent.KEYCODE_VOLUME_MUTE:
                    audio.adjustStreamVolume(AudioManager.STREAM_MUSIC, AudioManager.ADJUST_TOGGLE_MUTE, AudioManager.FLAG_SHOW_UI); return true;
                default:
                    int c = e.getKeyCode();
                    if (c >= android.view.KeyEvent.KEYCODE_1 && c <= android.view.KeyEvent.KEYCODE_9) k = "n" + (c - android.view.KeyEvent.KEYCODE_0);
                    else if (c >= android.view.KeyEvent.KEYCODE_NUMPAD_1 && c <= android.view.KeyEvent.KEYCODE_NUMPAD_9) k = "n" + (c - android.view.KeyEvent.KEYCODE_NUMPAD_0);
            }
            if (k == null && keyTest && web != null) {
                // 시험 중: 덜누름 TV가 모르는 단추도 이름(KEYCODE_…)을 보여 줌. 방향 · 확인 · 뒤로는 화면이 직접 처리
                int c = e.getKeyCode();
                boolean web0 = c == android.view.KeyEvent.KEYCODE_DPAD_UP || c == android.view.KeyEvent.KEYCODE_DPAD_DOWN || c == android.view.KeyEvent.KEYCODE_DPAD_LEFT
                        || c == android.view.KeyEvent.KEYCODE_DPAD_RIGHT || c == android.view.KeyEvent.KEYCODE_DPAD_CENTER || c == android.view.KeyEvent.KEYCODE_ENTER
                        || c == android.view.KeyEvent.KEYCODE_BACK || c == android.view.KeyEvent.KEYCODE_ESCAPE || c == android.view.KeyEvent.KEYCODE_VOLUME_UP || c == android.view.KeyEvent.KEYCODE_VOLUME_DOWN;
                if (!web0) k = "raw:" + android.view.KeyEvent.keyCodeToString(c);
            }
            if (k != null && web != null) { web.evaluateJavascript("window.tvKey && tvKey(" + JSONObject.quote(k) + ")", null); return true; }
        }
        return super.dispatchKeyEvent(e);
    }

    @Override
    public void onBackPressed() {
        // 고르기 창 · 화면 보호기가 열려 있으면 화면이 먼저 닫음
        web.evaluateJavascript("window.tvBack ? tvBack() : false", v -> {
            if (!"true".equals(v)) MainActivity.super.onBackPressed();
        });
    }

    private void push(String what) {
        if (web != null) web.evaluateJavascript("window.tvPush && tvPush(" + JSONObject.quote(what) + ")", null);
    }

    // ---------- 전체 화면 (TV처럼) ----------

    /** 상태 표시줄 · 내비게이션 막대를 숨김 (가장자리를 밀면 잠깐 나옴) */
    private void applyImmersive() {
        WindowInsetsController c = getWindow().getInsetsController();
        if (c == null) return;
        if (immersive) {
            c.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            c.hide(WindowInsets.Type.systemBars());
        } else {
            c.show(WindowInsets.Type.systemBars());
        }
    }

    /** 이 앱이 화면 전체가 아니라 창으로 떠 있나 (DeX) */
    private boolean windowed() {
        Rect cur = getWindowManager().getCurrentWindowMetrics().getBounds(), max = getWindowManager().getMaximumWindowMetrics().getBounds();
        return cur.width() < max.width() - 8 || cur.height() < max.height() - 8;
    }

    /** 삼성 DeX가 켜져 있나 */
    private boolean dexOn() {
        try {
            Configuration c = getResources().getConfiguration();
            return c.getClass().getField("semDesktopModeEnabled").getInt(c) == c.getClass().getField("SEM_DESKTOP_MODE_ENABLED").getInt(c);
        } catch (Throwable t) { return false; }
    }

    private int currentDisplayId() {
        Display d = getDisplay();
        return d == null ? Display.DEFAULT_DISPLAY : d.getDisplayId();
    }

    /** DeX에서 창으로 떠 있을 때: 같은 화면에 전체 화면으로 다시 열기 */
    private boolean goFullscreen() {
        try {
            ActivityOptions o = ActivityOptions.makeBasic();
            o.setLaunchDisplayId(currentDisplayId());
            Bundle b = o.toBundle();
            b.putInt(KEY_WINDOWING_MODE, 1);
            Intent i = new Intent(this, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_MULTIPLE_TASK);
            startActivity(i, b);
            finishAndRemoveTask();
            return true;
        } catch (RuntimeException e) {
            Log.w(TAG, "전체 화면으로 다시 열지 못함: " + e);
            return false;
        }
    }

    private JSONObject screenInfo() throws JSONException {
        Rect max = getWindowManager().getMaximumWindowMetrics().getBounds();
        Display d = getDisplay();
        return new JSONObject().put("display", currentDisplayId()).put("name", d == null ? "" : String.valueOf(d.getName()))
                .put("dex", dexOn()).put("windowed", windowed()).put("w", max.width()).put("h", max.height())
                .put("immersive", immersive).put("onPhone", currentDisplayId() == Display.DEFAULT_DISPLAY);
    }

    // ---------- 볼륨 (미디어 소리) ----------

    private String volumeJson() {
        try {
            int s = AudioManager.STREAM_MUSIC;
            return new JSONObject().put("cur", audio.getStreamVolume(s)).put("max", audio.getStreamMaxVolume(s)).put("muted", audio.isStreamMute(s)).toString();
        } catch (JSONException e) { return "{}"; }
    }

    private void notifyVolume() {
        if (web == null || audio == null) return;
        web.evaluateJavascript("window.tvVolume && tvVolume(" + JSONObject.quote(volumeJson()) + ")", null);
    }

    // ---------- 앱 목록 · 아이콘 ----------

    private List<ResolveInfo> launchables() {
        Intent q = new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER);
        return getPackageManager().queryIntentActivities(q, 0);
    }

    private String iconDataUrl(String pkg, String cls, int size) {
        String key = pkg + "/" + cls + "@" + size;
        String hit = iconCache.get(key);
        if (hit != null) return hit;
        PackageManager pm = getPackageManager();
        Drawable d;
        try {
            d = cls == null || cls.isEmpty() ? pm.getApplicationIcon(pkg) : pm.getActivityIcon(new ComponentName(pkg, cls));
        } catch (PackageManager.NameNotFoundException e) {
            try { d = pm.getApplicationIcon(pkg); } catch (PackageManager.NameNotFoundException e2) { return ""; }
        }
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
            case ApplicationInfo.CATEGORY_PRODUCTIVITY: return "productivity";
            default: return "";
        }
    }

    // ---------- 앱 열기 · 설치 페이지 ----------

    /** 이 화면(TV로 쓰는 모니터)에서 열기. full이면 전체 화면으로 (안 되는 기기 · 앱은 보통 창으로) */
    private JSONObject launch(String pkg, String cls, boolean full) throws JSONException {
        JSONObject r = new JSONObject();
        Intent i;
        if (cls != null && !cls.isEmpty()) {
            i = new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER).setComponent(new ComponentName(pkg, cls));
        } else {
            i = getPackageManager().getLaunchIntentForPackage(pkg);
            if (i == null) return r.put("ok", false).put("missing", true);
        }
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
        try {
            ActivityOptions o = ActivityOptions.makeBasic();
            o.setLaunchDisplayId(currentDisplayId());
            if (full) o.setLaunchBounds(getWindowManager().getMaximumWindowMetrics().getBounds()); // 화면 전체 크기의 창 (DeX)
            Bundle b = o.toBundle();
            // DeX는 일반 앱이 창 방식(전체 화면)까지 지정하면 요청 전체를 무시하는 경우가 있어, DeX에서는 크기만 줌
            if (full && !dexOn()) b.putInt(KEY_WINDOWING_MODE, 1);
            startActivity(i, b);
            Log.i(TAG, "열기 " + pkg + " 화면 " + currentDisplayId() + (full ? " 전체 화면" : ""));
            afterLaunch();
            return r.put("ok", true).put("display", currentDisplayId()).put("full", full).put("how", "bounds");
        } catch (RuntimeException e) {
            Log.w(TAG, "옵션으로 열지 못해 보통으로 엽니다: " + e);
        }
        try {
            startActivity(i);
            afterLaunch();
            return r.put("ok", true).put("display", currentDisplayId()).put("fallback", true);
        } catch (RuntimeException e) {
            return r.put("ok", false).put("error", "열지 못했습니다: " + e.getMessage());
        }
    }

    /** 고급 기능(Shizuku): 셸 권한으로 확실히 전체 화면으로 열기. 안 되면 null */
    private JSONObject launchShell(String pkg, String cls, int display) throws JSONException {
        if (!Shizu.granted()) return null;
        if (cls == null || cls.isEmpty()) {
            Intent li = getPackageManager().getLaunchIntentForPackage(pkg);
            if (li == null || li.getComponent() == null) return null;
            cls = li.getComponent().getClassName();
        }
        // 이미 창으로 열려 있으면 "전체 화면으로 열기"가 그 창을 앞으로만 불러오므로, 그 창을 닫고 전체 화면으로 다시 엶
        String dump = Shizu.run("dumpsys activity activities", 4000);
        if (dump != null) {
            java.util.regex.Matcher m = java.util.regex.Pattern.compile("Task\\{[0-9a-f]+ #(\\d+) type=standard A=\\d+:(\\S+) .*?mode=(\\w+)").matcher(dump);
            while (m.find()) {
                String aff = m.group(2);
                if ((aff.equals(pkg) || aff.startsWith(pkg + ":")) && !"fullscreen".equals(m.group(3))) {
                    Log.i(TAG, "창으로 열린 " + pkg + " (작업 " + m.group(1) + ", " + m.group(3) + ") 닫고 전체 화면으로");
                    Shizu.run("am stack remove " + m.group(1) + " ; cmd activity remove-task " + m.group(1), 3000);
                    try { Thread.sleep(400); } catch (InterruptedException ignored) { }
                }
            }
        }
        String out = Shizu.run("am start --windowingMode 1 --display " + display + " -a android.intent.action.MAIN -c android.intent.category.LAUNCHER -f 0x10200000 -n " + pkg + "/" + cls, 5000);
        if (out == null || out.contains("Error") || out.contains("Exception")) { Log.w(TAG, "셸로 열지 못함: " + out); return null; }
        main.post(this::afterLaunch);
        return new JSONObject().put("ok", true).put("display", display).put("full", true).put("how", "shell");
    }

    /** 앱을 연 뒤: 덜누름 TV로 돌아올 홈 단추 띄우기 */
    private void afterLaunch() {
        if (prefs().getBoolean("homeButton", true)) HomeButton.show(this, currentDisplayId());
    }

    /** 설치 안 된 서비스: Play 스토어의 그 앱 페이지 */
    private boolean openStore(String pkg) {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=" + pkg)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
            return true;
        } catch (RuntimeException e) {
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=" + pkg)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
                return true;
            } catch (RuntimeException e2) {
                return false;
            }
        }
    }

    private String onMain(java.util.concurrent.Callable<String> job) {
        final String[] out = {"{\"ok\":false}"};
        java.util.concurrent.CountDownLatch done = new java.util.concurrent.CountDownLatch(1);
        main.post(() -> {
            try { out[0] = job.call(); } catch (Exception e) { out[0] = "{\"ok\":false,\"error\":" + JSONObject.quote(String.valueOf(e.getMessage())) + "}"; }
            done.countDown();
        });
        try { done.await(3, java.util.concurrent.TimeUnit.SECONDS); } catch (InterruptedException ignored) { }
        return out[0];
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
                    arr.put(new JSONObject().put("pkg", pkg).put("cls", ri.activityInfo.name).put("label", String.valueOf(ri.loadLabel(pm)))
                            .put("cat", ai == null ? "" : categoryName(ai.category)).put("system", ai != null && (ai.flags & ApplicationInfo.FLAG_SYSTEM) != 0));
                } catch (JSONException ignored) { }
            }
            return arr.toString();
        }

        @JavascriptInterface
        public String icon(String pkg, String cls) { return iconDataUrl(pkg, cls, 192); }

        @JavascriptInterface
        public String launch(String pkg, String cls, boolean full) {
            if (full) {
                try {
                    final int d = currentDisplayId();
                    JSONObject r = launchShell(pkg, cls, d);
                    if (r != null) return r.toString();
                } catch (Exception e) { Log.w(TAG, "셸로 열기 실패: " + e); }
            }
            return onMain(() -> MainActivity.this.launch(pkg, cls, full).toString());
        }

        /** 홈 단추: on = 쓰기로 함, allowed = "다른 앱 위에 표시" 권한 있음 */
        @JavascriptInterface
        public String homeButton() {
            try { return new JSONObject().put("on", prefs().getBoolean("homeButton", true)).put("allowed", HomeButton.allowed(MainActivity.this)).toString(); }
            catch (JSONException e) { return "{}"; }
        }

        @JavascriptInterface
        public void setHomeButton(boolean on) { prefs().edit().putBoolean("homeButton", on).apply(); }

        /** "다른 앱 위에 표시" 설정 화면 열기 */
        @JavascriptInterface
        public void askOverlay() {
            main.post(() -> {
                try { startActivity(new Intent(android.provider.Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + getPackageName()))); }
                catch (RuntimeException e) { Log.w(TAG, "권한 화면을 열지 못함: " + e); }
            });
        }

        @JavascriptInterface
        public String shizuku() {
            try { return new JSONObject().put("installed", Shizu.installed(MainActivity.this)).put("running", Shizu.running()).put("granted", Shizu.granted()).toString(); }
            catch (JSONException e) { return "{}"; }
        }

        /** 단계별: 설치 안 됨 → 받으러 가기, 꺼짐 → Shizuku 열기, 켜짐 → 허락 요청 */
        @JavascriptInterface
        public String shizukuConnect() {
            return onMain(() -> {
                if (!Shizu.installed(MainActivity.this)) { openStore(Shizu.PKG); return "install"; }
                if (!Shizu.running()) {
                    Intent i = getPackageManager().getLaunchIntentForPackage(Shizu.PKG);
                    if (i != null) startActivity(i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
                    return "start";
                }
                if (!Shizu.granted()) { Shizu.request(41); return "request"; }
                return "ok";
            });
        }

        @JavascriptInterface
        public boolean store(String pkg) {
            final boolean[] ok = {false};
            onMain(() -> { ok[0] = openStore(pkg); return ""; });
            return ok[0];
        }

        @JavascriptInterface
        public String screen() {
            try { return screenInfo().toString(); } catch (JSONException e) { return "{}"; }
        }

        @JavascriptInterface
        public void setImmersive(boolean on) {
            immersive = on;
            prefs().edit().putBoolean("immersive", on).apply();
            main.post(MainActivity.this::applyImmersive);
        }

        @JavascriptInterface
        public void goFullscreen() { main.post(MainActivity.this::goFullscreen); }

        @JavascriptInterface
        public String load() { return prefs().getString("state", ""); }

        @JavascriptInterface
        public void save(String json) { prefs().edit().putString("state", json).apply(); }

        @JavascriptInterface
        public void tap() {
            try {
                Vibrator v = getSystemService(Vibrator.class);
                if (v != null && v.hasVibrator()) v.vibrate(VibrationEffect.createPredefined(VibrationEffect.EFFECT_CLICK));
            } catch (RuntimeException ignored) { }
        }

        @JavascriptInterface
        public void keepScreenOn(boolean on) {
            main.post(() -> {
                if (on) getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            });
        }

        @JavascriptInterface
        public String volume() { return volumeJson(); }

        @JavascriptInterface
        public String setVolume(int level) {
            try {
                int s = AudioManager.STREAM_MUSIC;
                if (audio.isStreamMute(s)) audio.adjustStreamVolume(s, AudioManager.ADJUST_UNMUTE, 0);
                audio.setStreamVolume(s, Math.max(0, Math.min(level, audio.getStreamMaxVolume(s))), 0);
            } catch (RuntimeException e) { Log.w(TAG, "볼륨을 바꾸지 못함: " + e); }
            return volumeJson();
        }

        @JavascriptInterface
        public String toggleMute() {
            try { audio.adjustStreamVolume(AudioManager.STREAM_MUSIC, AudioManager.ADJUST_TOGGLE_MUTE, 0); }
            catch (RuntimeException e) { Log.w(TAG, "음소거를 바꾸지 못함: " + e); }
            return volumeJson();
        }

        /** 블루투스 설정 화면 (리모컨 연결) */
        @JavascriptInterface
        public void openBluetooth() {
            main.post(() -> {
                try { startActivity(new Intent(android.provider.Settings.ACTION_BLUETOOTH_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); }
                catch (RuntimeException e) { try { startActivity(new Intent(android.provider.Settings.ACTION_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); } catch (RuntimeException ignored) { } }
            });
        }

        /** 삼성 스마트 리모컨 바로 연결: 상태 · 찾기 · 멈추기 · 짝짓기 · 단추 시험 */
        @JavascriptInterface public String rcState() { return link().state(); }
        @JavascriptInterface public void rcScan() { main.post(() -> link().scan()); }
        @JavascriptInterface public void rcStop() { main.post(() -> { if (rlink != null) rlink.stopScan(); }); }
        @JavascriptInterface public void rcPair(String addr) { main.post(() -> link().pair(addr)); }
        @JavascriptInterface public void setKeyTest(boolean on) { keyTest = on; }

        /** 앱을 처음 열 때 받은 키보드 단축키 (0 홈, 1~9 서비스, -1 없음) */
        @JavascriptInterface public int takeOpen() { int n = pendingOpen; pendingOpen = -1; return n; }

        /** 다른 앱 위에서도 쓰는 키보드 단축키(접근성 서비스) 상태 */
        @JavascriptInterface
        public String kbGlobal() {
            try { return new JSONObject().put("on", KeyService.enabled(MainActivity.this)).put("shizuku", Shizu.granted()).toString(); }
            catch (JSONException e) { return "{}"; }
        }

        /** 켜기: Shizuku가 연결돼 있으면 바로 켜고, 아니면 접근성 설정 화면을 엶 */
        @JavascriptInterface
        public String kbEnable() {
            if (Shizu.granted()) {
                String cur = Shizu.run("settings get secure enabled_accessibility_services", 3000);
                cur = cur == null ? "" : cur.trim();
                if (cur.equals("null")) cur = "";
                if (!cur.contains(KeyService.COMPONENT)) {
                    String v = cur.isEmpty() ? KeyService.COMPONENT : cur + ":" + KeyService.COMPONENT;
                    Shizu.run("settings put secure enabled_accessibility_services '" + v + "' ; settings put secure accessibility_enabled 1", 3000);
                }
                if (KeyService.enabled(MainActivity.this)) return "on";
            }
            main.post(() -> {
                try { startActivity(new Intent(android.provider.Settings.ACTION_ACCESSIBILITY_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); }
                catch (RuntimeException ignored) { }
            });
            return "settings";
        }

        /** 앱 정보 화면 (안드로이드 13+ '제한된 설정 허용'을 여기서) */
        @JavascriptInterface
        public void openAppInfo() {
            main.post(() -> {
                try { startActivity(new Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getPackageName())).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); }
                catch (RuntimeException ignored) { }
            });
        }

        /** 지금 연결된 바깥 입력 장치(리모컨 · 키보드 · 마우스 · 게임패드) 이름 */
        @JavascriptInterface
        public String remotes() {
            JSONArray arr = new JSONArray();
            for (int id : android.view.InputDevice.getDeviceIds()) {
                android.view.InputDevice d = android.view.InputDevice.getDevice(id);
                if (d == null || d.isVirtual() || !d.isExternal()) continue;
                try {
                    int src = d.getSources();
                    String kind = (src & android.view.InputDevice.SOURCE_DPAD) == android.view.InputDevice.SOURCE_DPAD ? "remote"
                            : (src & android.view.InputDevice.SOURCE_GAMEPAD) == android.view.InputDevice.SOURCE_GAMEPAD ? "gamepad"
                            : (src & android.view.InputDevice.SOURCE_MOUSE) == android.view.InputDevice.SOURCE_MOUSE && d.getKeyboardType() != android.view.InputDevice.KEYBOARD_TYPE_ALPHABETIC ? "mouse"
                            : d.getKeyboardType() == android.view.InputDevice.KEYBOARD_TYPE_ALPHABETIC ? "keyboard" : "keys";
                    arr.put(new JSONObject().put("name", d.getName()).put("kind", kind));
                } catch (JSONException ignored) { }
            }
            return arr.toString();
        }

        @JavascriptInterface
        public String version() { return BuildConfig.VERSION_NAME; }

        /** 자동 점검(에뮬레이터)에서만: 화면 상태를 기록에 남김 */
        @JavascriptInterface
        public void report(String line) { if (selftest) Log.i(SELFTEST_TAG, line); }
    }

    private SharedPreferences prefs() { return getSharedPreferences("tv", MODE_PRIVATE); }
}
