package com.daesinnam.dex;

import android.app.Activity;
import android.app.ActivityOptions;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.LauncherApps;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import java.util.regex.Pattern;
import java.util.regex.Matcher;
import android.graphics.Canvas;
import android.graphics.Point;
import android.graphics.Rect;
import android.graphics.drawable.Drawable;
import android.hardware.display.DisplayManager;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.BatteryManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.util.DisplayMetrics;
import android.util.Log;
import android.util.LruCache;
import android.view.Display;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.ConsoleMessage;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.text.Collator;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * 덜누름 덱스 — 덱스(DeX)가 없는 일반 안드로이드 태블릿을 데스크톱처럼.
 *
 *  · 태블릿 화면: 홈 앱(런처)으로 작업 표시줄 · 앱 서랍 · 바탕화면 아이콘 · 창으로 열기
 *  · 외부 모니터: "보조 디스플레이에서 데스크톱 모드"를 켜 두면 모니터마다 DisplayHomeActivity가 따로 뜨고,
 *    그 모니터에서 연 앱은 모니터에 창으로 열림 (태블릿 화면은 그대로 따로 씀)
 *  · 덱스 설정: 숨어 있는 자유 창 · 외부 모니터 데스크톱 모드를 Shizuku로 켜거나, 개발자 옵션에서 켜는 방법 안내
 *
 * 화면은 assets/ui/ (WebView), 이 파일은 앱 목록 · 아이콘 · 앱 띄우기 · 창 목록 · 설정을 맡습니다.
 * 인터넷 권한 없음. 앱 목록과 설정은 기기 안에만 둡니다.
 */
@SuppressWarnings("deprecation")
public class MainActivity extends Activity {
    static final String TAG = "Dex";
    static final String SELFTEST_TAG = "DEX_SELFTEST";
    /** ActivityOptions 번들의 창 방식 키 (WindowConfiguration: 1 = 전체 화면, 5 = 자유 창) */
    private static final String KEY_WINDOWING_MODE = "android.activity.windowingMode";
    private static final String ICON_HOST = "dex.local";
    private static final int REQ_SHIZUKU = 7;

    /** 덱스 설정에서 켜고 끌 수 있는 시스템 설정(전역). 이 밖의 값은 건드리지 않습니다. */
    private static final String[] SETTING_KEYS = {
            "enable_freeform_support",                      // 자유 형식 창 사용
            "force_resizable_activities",                   // 앱 크기 조정 강제 허용 (창으로 안 열리는 앱도)
            "force_desktop_mode_on_external_displays",      // 보조 디스플레이에서 데스크톱 모드 강제 사용
            "enable_non_resizable_multi_window",            // 크기 고정 앱도 여러 창에 (안드로이드 12+)
    };

    protected WebView web;
    private SharedPreferences prefs;
    private final Handler main = new Handler(Looper.getMainLooper());
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private final LruCache<String, byte[]> icons = new LruCache<>(4 * 1024 * 1024) {
        @Override protected int sizeOf(String k, byte[] v) { return v.length; }
    };
    private boolean selftest;
    private DisplayManager.DisplayListener displayListener;
    private BroadcastReceiver pkgReceiver;

    private int lastDpi;
    private volatile int insTop, insBottom, insLeft, insRight;   // 상태 표시줄 · 내비게이션 막대 자리

    @Override
    public void onConfigurationChanged(android.content.res.Configuration c) {
        super.onConfigurationChanged(c);
        // 해상도(밀도)가 바뀌면 화면을 새로 그려 선명하게
        if (lastDpi != 0 && c.densityDpi != lastDpi) { lastDpi = c.densityDpi; recreate(); return; }
        lastDpi = c.densityDpi;
        push("displays");
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        lastDpi = getResources().getConfiguration().densityDpi;
        prefs = getSharedPreferences("dex", MODE_PRIVATE);
        selftest = getIntent().getBooleanExtra("dex.selftest", false);
        if (Build.VERSION.SDK_INT >= 30) getWindow().setDecorFitsSystemWindows(false);
        web = new WebView(this);
        WebSettings ws = web.getSettings();
        ws.setJavaScriptEnabled(true);
        ws.setDomStorageEnabled(true);
        ws.setAllowFileAccess(true);
        web.setBackgroundColor(0xFF0E1222);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onConsoleMessage(ConsoleMessage m) {
                Log.i("DexConsole", m.message() + " (" + m.sourceId() + ":" + m.lineNumber() + ")");
                return true;
            }
        });
        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                if (ICON_HOST.equals(u.getHost())) return iconResponse(u.getQueryParameter("p"), u.getQueryParameter("c"));
                return null;
            }
        });
        web.addJavascriptInterface(new Bridge(), "Android");
        setContentView(web);
        // 덱스 화면이 실제로 차지한 자리 = 창이 쓸 수 있는 자리 (상태 표시줄 · 내비게이션 막대 제외)
        web.addOnLayoutChangeListener((v, l, t, r, b2, ol, ot, or, ob) -> {
            int[] at = new int[2];
            v.getLocationOnScreen(at);
            Point real = new Point();
            getWindowManager().getDefaultDisplay().getRealSize(real);
            Display dd = v.getDisplay();
            if (dd != null) dd.getRealSize(real);
            insLeft = Math.max(0, at[0]); insTop = Math.max(0, at[1]);
            insRight = Math.max(0, real.x - at[0] - v.getWidth()); insBottom = Math.max(0, real.y - at[1] - v.getHeight());
        });
        immersive();
        web.loadUrl("file:///android_asset/ui/index.html?d=" + displayId() + (selftest ? "&selftest=1" : ""));

        displayListener = new DisplayManager.DisplayListener() {
            @Override public void onDisplayAdded(int id) { push("displays"); }
            @Override public void onDisplayRemoved(int id) { push("displays"); }
            @Override public void onDisplayChanged(int id) { }
        };
        getSystemService(DisplayManager.class).registerDisplayListener(displayListener, main);
        pkgReceiver = new BroadcastReceiver() {
            @Override public void onReceive(Context c, Intent i) { icons.evictAll(); push("apps"); }
        };
        IntentFilter f = new IntentFilter();
        f.addAction(Intent.ACTION_PACKAGE_ADDED); f.addAction(Intent.ACTION_PACKAGE_REMOVED); f.addAction(Intent.ACTION_PACKAGE_CHANGED);
        f.addDataScheme("package");
        registerReceiver(pkgReceiver, f);
    }

    @Override
    protected void onResume() {
        super.onResume();
        immersive();
        push("resume");
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        // 홈 단추를 누르면: 열려 있는 서랍 · 메뉴 닫기
        push("home");
    }

    @Override
    protected void onDestroy() {
        try { getSystemService(DisplayManager.class).unregisterDisplayListener(displayListener); } catch (Exception ignored) { }
        try { unregisterReceiver(pkgReceiver); } catch (Exception ignored) { }
        worker.shutdownNow();
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        // 홈 화면은 뒤로 가기로 닫지 않음: 열린 서랍 · 메뉴만 닫기
        web.evaluateJavascript("window.Dex && Dex.back && Dex.back()", null);
    }

    /** 윈도우 키(메타) 하나만 눌렀다 떼면 앱 서랍, Esc는 닫기 */
    private boolean metaAlone;
    @Override
    public boolean dispatchKeyEvent(KeyEvent e) {
        int k = e.getKeyCode();
        if (k == KeyEvent.KEYCODE_META_LEFT || k == KeyEvent.KEYCODE_META_RIGHT) {
            if (e.getAction() == KeyEvent.ACTION_DOWN) metaAlone = true;
            else if (e.getAction() == KeyEvent.ACTION_UP && metaAlone) { push("key:meta"); metaAlone = false; }
            return true;
        }
        if (e.getAction() == KeyEvent.ACTION_DOWN) metaAlone = false;
        return super.dispatchKeyEvent(e);
    }

    private void immersive() {
        // 태블릿 화면에서는 상태 표시줄 · 내비게이션 막대를 숨겨 작업 표시줄만 (가장자리를 밀면 잠깐 나옴)
        if (displayId() != Display.DEFAULT_DISPLAY && !selftest) return;
        if (Build.VERSION.SDK_INT >= 30) {
            WindowInsetsController c = getWindow().getInsetsController();
            if (c == null) return;
            c.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            c.hide(WindowInsets.Type.systemBars());
        } else {
            getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
        }
    }

    void push(String what) {
        main.post(() -> { if (web != null) web.evaluateJavascript("window.Dex && Dex.event && Dex.event(" + JSONObject.quote(what) + ")", null); });
    }

    int displayId() {
        try {
            Display d = Build.VERSION.SDK_INT >= 30 ? getDisplay() : getWindowManager().getDefaultDisplay();
            return d != null ? d.getDisplayId() : Display.DEFAULT_DISPLAY;
        }
        catch (RuntimeException e) { return Display.DEFAULT_DISPLAY; }
    }

    // ───────── 앱 목록 · 아이콘 ─────────
    private JSONArray apps() throws JSONException {
        LauncherApps la = getSystemService(LauncherApps.class);
        List<android.content.pm.LauncherActivityInfo> list = la.getActivityList(null, android.os.Process.myUserHandle());
        List<JSONObject> out = new ArrayList<>();
        for (android.content.pm.LauncherActivityInfo a : list) {
            if (a.getComponentName().getPackageName().equals(getPackageName())) continue;
            JSONObject o = new JSONObject();
            o.put("label", String.valueOf(a.getLabel()));
            o.put("pkg", a.getComponentName().getPackageName());
            o.put("cls", a.getComponentName().getClassName());
            o.put("sys", (a.getApplicationInfo().flags & android.content.pm.ApplicationInfo.FLAG_SYSTEM) != 0);
            out.add(o);
        }
        Collator col = Collator.getInstance(Locale.KOREAN);
        out.sort((x, y) -> col.compare(x.optString("label"), y.optString("label")));
        JSONArray a = new JSONArray();
        for (JSONObject o : out) a.put(o);
        return a;
    }

    private WebResourceResponse iconResponse(String pkg, String cls) {
        String key = pkg + "/" + cls;
        byte[] png = icons.get(key);
        if (png == null) {
            try {
                Drawable d = null;
                PackageManager pm = getPackageManager();
                if (cls != null && !cls.isEmpty()) {
                    try { d = pm.getActivityIcon(new ComponentName(pkg, cls)); } catch (Exception ignored) { }
                }
                if (d == null) d = pm.getApplicationIcon(pkg);
                int s = 192;
                Bitmap b = Bitmap.createBitmap(s, s, Bitmap.Config.ARGB_8888);
                Canvas c = new Canvas(b);
                d.setBounds(0, 0, s, s);
                d.draw(c);
                ByteArrayOutputStream bo = new ByteArrayOutputStream();
                b.compress(Bitmap.CompressFormat.PNG, 100, bo);
                b.recycle();
                png = bo.toByteArray();
                icons.put(key, png);
            } catch (Exception e) {
                return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", null, new ByteArrayInputStream(new byte[0]));
            }
        }
        java.util.Map<String, String> h = new java.util.HashMap<>();
        h.put("Cache-Control", "max-age=86400");
        h.put("Access-Control-Allow-Origin", "*");
        return new WebResourceResponse("image/png", null, 200, "OK", h, new ByteArrayInputStream(png));
    }

    // ───────── 화면(디스플레이) ─────────
    private JSONArray displays() throws JSONException {
        JSONArray a = new JSONArray();
        for (Display d : realDisplays()) {
            Point p = new Point();
            d.getRealSize(p);
            JSONObject o = new JSONObject().put("id", d.getDisplayId()).put("name", d.getName()).put("w", p.x).put("h", p.y)
                    .put("main", d.getDisplayId() == Display.DEFAULT_DISPLAY).put("here", d.getDisplayId() == displayId());
            a.put(o);
        }
        return a;
    }

    /** 태블릿 화면 + 실제 연결된 모니터만 (화면 녹화 · 캐스트용 가상 화면은 뺌) */
    private List<Display> realDisplays() {
        DisplayManager dm = getSystemService(DisplayManager.class);
        List<Display> out = new java.util.ArrayList<>();
        Display main0 = dm.getDisplay(Display.DEFAULT_DISPLAY);
        if (main0 != null) out.add(main0);
        for (Display d : dm.getDisplays(DisplayManager.DISPLAY_CATEGORY_PRESENTATION))
            if (d.getDisplayId() != Display.DEFAULT_DISPLAY && (d.getFlags() & Display.FLAG_PRIVATE) == 0) out.add(d);
        Display here = dm.getDisplay(displayId());
        if (here != null && !out.contains(here)) out.add(here);
        return out;
    }

    /** 이 화면 말고 다른 화면(외부 모니터) 하나. 없으면 -1 */
    private int otherDisplay() {
        for (Display d : realDisplays())
            if (d.getDisplayId() != displayId()) return d.getDisplayId();
        return -1;
    }

    private boolean freeformOn() {
        return getPackageManager().hasSystemFeature(PackageManager.FEATURE_FREEFORM_WINDOW_MANAGEMENT)
                || Settings.Global.getInt(getContentResolver(), "enable_freeform_support", 0) == 1;
    }

    private int global(String k) {
        try { return Settings.Global.getInt(getContentResolver(), k, 0); } catch (Exception e) { return 0; }
    }

    private boolean isDefaultHome() {
        Intent i = new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME);
        ResolveInfo r = getPackageManager().resolveActivity(i, PackageManager.MATCH_DEFAULT_ONLY);
        return r != null && r.activityInfo != null && getPackageName().equals(r.activityInfo.packageName);
    }

    private JSONObject info() throws JSONException {
        JSONObject o = new JSONObject();
        o.put("version", BuildConfig.VERSION_NAME).put("sdk", Build.VERSION.SDK_INT).put("android", Build.VERSION.RELEASE)
                .put("model", Build.MANUFACTURER + " " + Build.MODEL)
                .put("display", displayId()).put("monitor", displayId() != Display.DEFAULT_DISPLAY)
                .put("displays", displays())
                .put("freeform", freeformOn())
                .put("freeformFeature", getPackageManager().hasSystemFeature(PackageManager.FEATURE_FREEFORM_WINDOW_MANAGEMENT))
                .put("devOptions", global(Settings.Global.DEVELOPMENT_SETTINGS_ENABLED) == 1)
                .put("defaultHome", isDefaultHome())
                .put("selftest", selftest)
                .put("dpi", getResources().getDisplayMetrics().densityDpi)
                .put("dpiBase", displayId() == Display.DEFAULT_DISPLAY ? DisplayMetrics.DENSITY_DEVICE_STABLE : 0);
        JSONObject s = new JSONObject();
        for (String k : SETTING_KEYS) s.put(k, global(k));
        o.put("settings", s);
        o.put("shizuku", new JSONObject().put("installed", Shizu.installed(this)).put("running", Shizu.running()).put("granted", Shizu.granted()));
        return o;
    }

    // ───────── 앱 띄우기 ─────────
    /**
     * mode: window(창) · left · right(반쪽) · max(작업 표시줄 위 꽉) · full(전체 화면)
     * where: "here"(이 화면) · "other"(다른 화면 = 외부 모니터 또는 태블릿)
     */
    private JSONObject launch(String pkg, String cls, String mode, String where, double taskbarCss) throws JSONException {
        int target = "other".equals(where) ? otherDisplay() : displayId();
        if (target < 0) target = displayId();
        Intent i = new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
                .setComponent(new ComponentName(pkg, cls))
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
        if (target != displayId()) i.addFlags(Intent.FLAG_ACTIVITY_MULTIPLE_TASK); // 다른 화면에 새 창으로
        JSONObject r = new JSONObject().put("mode", mode).put("display", target).put("freeform", freeformOn());
        Bundle opts = null;
        try {
            ActivityOptions o = ActivityOptions.makeBasic();
            o.setLaunchDisplayId(target);
            if ("full".equals(mode) || !freeformOn()) {
                opts = o.toBundle();
                if ("full".equals(mode)) opts.putInt(KEY_WINDOWING_MODE, 1);
            } else {
                Rect b = boundsFor(mode, target, taskbarCss);
                o.setLaunchBounds(b);
                opts = o.toBundle();
                opts.putInt(KEY_WINDOWING_MODE, 5);
                r.put("bounds", b.flattenToString());
            }
        } catch (RuntimeException e) {
            opts = null;
        }
        try {
            startActivity(i, opts);
        } catch (RuntimeException e) {
            Log.w(TAG, "창으로 열지 못해 보통 방식으로 엽니다: " + e);
            try { startActivity(i); r.put("fallback", true); }
            catch (RuntimeException e2) { return r.put("ok", false).put("error", String.valueOf(e2.getMessage())); }
        }
        return r.put("ok", true);
    }

    /** 대상 화면 크기에서 창 자리 (작업 표시줄 높이만큼 아래를 비움) */
    private Rect boundsFor(String mode, int displayId, double taskbarCss) {
        Display d = getSystemService(DisplayManager.class).getDisplay(displayId);
        if (d == null) d = getWindowManager().getDefaultDisplay();
        Point p = new Point();
        d.getRealSize(p);
        DisplayMetrics dm = new DisplayMetrics();
        d.getRealMetrics(dm);
        int tb = (int) Math.round(taskbarCss * dm.density);
        // 쓸 수 있는 자리: 위 상태 표시줄 아래 ~ 아래 (내비게이션 막대 + 작업 표시줄) 위
        boolean mine = displayId == displayId();
        int top = mine ? insTop : 0, bottom = (mine ? insBottom : 0) + tb, left = mine ? insLeft : 0, right = mine ? insRight : 0;
        int w = p.x - left - right, h = p.y - top - bottom;
        Rect r = area(mode, w, h, dm);
        r.offset(left, top);
        return r;
    }

    private Rect area(String mode, int w, int h, DisplayMetrics dm) {
        switch (mode) {
            case "left": return new Rect(0, 0, w / 2, h);
            case "right": return new Rect(w / 2, 0, w, h);
            case "max": return new Rect(0, 0, w, h);
            case "small": { int cw = (int) (w * 0.42), ch = (int) (h * 0.55); return new Rect((w - cw) / 2, (h - ch) / 2, (w + cw) / 2, (h + ch) / 2); }
            case "big": { int cw = (int) (w * 0.82), ch = (int) (h * 0.88); return new Rect((w - cw) / 2, (h - ch) / 2, (w + cw) / 2, (h + ch) / 2); }
            case "center": { int cw = (int) (w * 0.6), ch = (int) (h * 0.72); return new Rect((w - cw) / 2, (h - ch) / 2, (w + cw) / 2, (h + ch) / 2); }
            default: {
                int cw = (int) (w * 0.6), ch = (int) (h * 0.72);
                int n = prefs.getInt("cascade", 0);
                prefs.edit().putInt("cascade", (n + 1) % 6).apply();
                int off = (int) (28 * dm.density) * n;
                int l = Math.max(0, (w - cw) / 2 - (int) (70 * dm.density) + off), t = Math.max(0, (h - ch) / 2 - (int) (40 * dm.density) + off);
                return new Rect(l, t, Math.min(w, l + cw), Math.min(h, t + ch));
            }
        }
    }

    // ───────── 열린 창 (Shizuku) ─────────
    private JSONArray tasks() throws JSONException {
        JSONArray a = new JSONArray();
        if (!Shizu.granted()) return a;
        List<TaskParser.T> all = TaskParser.stackList(Shizu.run("am stack list", 2500));
        if (all.isEmpty()) all = TaskParser.dumpsys(Shizu.run("dumpsys activity activities", 3000));
        Set<String> homes = new HashSet<>();
        for (ResolveInfo r : getPackageManager().queryIntentActivities(new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME), 0))
            homes.add(r.activityInfo.packageName);
        PackageManager pm = getPackageManager();
        for (TaskParser.T t : all) {
            if (t.pkg == null || t.pkg.equals(getPackageName()) || homes.contains(t.pkg) || t.pkg.equals("com.android.systemui")) continue;
            if (t.display >= 0 && t.display != displayId()) continue;
            String label = t.pkg;
            try { label = String.valueOf(pm.getApplicationLabel(pm.getApplicationInfo(t.pkg, 0))); } catch (Exception ignored) { }
            a.put(new JSONObject().put("task", t.task).put("pkg", t.pkg).put("cls", t.cls).put("label", label).put("visible", t.visible)
                    .put("bounds", t.l + "," + t.t + "," + t.r + "," + t.b));
        }
        return a;
    }

    /** 열린 창 하나 다루기: left · right · max · window(가운데) · close */
    private JSONObject taskAction(int task, String action, double taskbarCss) throws JSONException {
        if (!Shizu.granted()) return new JSONObject().put("ok", false).put("need", "shizuku");
        String out;
        if ("close".equals(action)) {
            out = Shizu.run("am stack remove " + task + " || cmd activity stack remove " + task, 2500);
        } else {
            Rect b = boundsFor(action, displayId(), taskbarCss);
            out = Shizu.run("am task resize " + task + " " + b.left + " " + b.top + " " + b.right + " " + b.bottom, 2500);
        }
        return new JSONObject().put("ok", out != null && !out.toLowerCase(Locale.ROOT).contains("exception")).put("out", out == null ? "" : out);
    }

    // ───────── 작업 표시줄 단추: 알림 · 빠른 설정 · 최근 앱 ─────────
    private boolean statusBar(boolean settings) {
        if (Shizu.granted()) {
            String r = Shizu.run("cmd statusbar " + (settings ? "expand-settings" : "expand-notifications"), 2000);
            if (r != null) return true;
        }
        try { // Shizuku가 없을 때: 시스템이 막지 않는 기기에서는 이 방법으로
            Object sb = getSystemService("statusbar");
            sb.getClass().getMethod(settings ? "expandSettingsPanel" : "expandNotificationsPanel").invoke(sb);
            return true;
        } catch (Throwable t) {
            return false;
        }
    }

    // ───────── 덱스 설정 (Shizuku) ─────────
    private JSONObject setSetting(String key, boolean on) throws JSONException {
        boolean known = false;
        for (String k : SETTING_KEYS) if (k.equals(key)) known = true;
        if (!known) return new JSONObject().put("ok", false).put("error", "모르는 설정");
        if (!Shizu.granted()) return new JSONObject().put("ok", false).put("need", "shizuku");
        Shizu.run("settings put global " + key + " " + (on ? 1 : 0), 3000);
        int now = global(key);
        return new JSONObject().put("ok", now == (on ? 1 : 0)).put("value", now);
    }

    // ───────── 해상도 (화면 밀도) : 작을수록 한 화면에 더 많이 보임 ─────────
    private JSONObject readDensity() throws JSONException {
        JSONObject o = new JSONObject().put("current", getResources().getDisplayMetrics().densityDpi);
        if (!Shizu.granted()) return o.put("need", "shizuku");
        String out = Shizu.run("wm density -d " + displayId(), 2500);
        if (out != null) {
            Matcher m = Pattern.compile("Physical density:\\s*(\\d+)").matcher(out);
            if (m.find()) o.put("physical", Integer.parseInt(m.group(1)));
            m = Pattern.compile("Override density:\\s*(\\d+)").matcher(out);
            if (m.find()) o.put("override", Integer.parseInt(m.group(1)));
        }
        return o;
    }

    private JSONObject setDensity(int dpi) throws JSONException {
        if (!Shizu.granted()) return new JSONObject().put("ok", false).put("need", "shizuku");
        if (dpi != 0 && (dpi < 120 || dpi > 640)) return new JSONObject().put("ok", false).put("error", "범위 밖");
        String out = Shizu.run("wm density " + (dpi == 0 ? "reset" : String.valueOf(dpi)) + " -d " + displayId(), 3000);
        return readDensity().put("ok", out != null && !out.toLowerCase(Locale.ROOT).contains("exception"));
    }

    private void open(Intent i) {
        try { startActivity(i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); }
        catch (Exception e) { Log.w(TAG, "open " + i + " " + e); }
    }

    private JSONObject status() throws JSONException {
        JSONObject r = new JSONObject();
        Intent b = registerReceiver(null, new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
        if (b != null) {
            int level = b.getIntExtra(BatteryManager.EXTRA_LEVEL, -1), scale = b.getIntExtra(BatteryManager.EXTRA_SCALE, 100);
            r.put("battery", level < 0 ? -1 : Math.round(level * 100f / Math.max(1, scale)));
            r.put("charging", b.getIntExtra(BatteryManager.EXTRA_PLUGGED, 0) != 0);
        }
        try {
            ConnectivityManager cm = getSystemService(ConnectivityManager.class);
            NetworkCapabilities nc = cm.getNetworkCapabilities(cm.getActiveNetwork());
            r.put("wifi", nc != null && nc.hasTransport(NetworkCapabilities.TRANSPORT_WIFI));
            r.put("online", nc != null);
        } catch (Exception e) { r.put("online", false); }
        return r;
    }

    interface Job { Object run() throws Exception; }

    /** 오래 걸릴 수 있는 일(Shizuku 명령)은 뒤에서 하고 결과를 Dex.reply(id, 결과)로 */
    private void async(String id, Job j) {
        worker.submit(() -> {
            String out;
            try { Object o = j.run(); out = o == null ? "null" : o.toString(); }
            catch (Throwable t) { out = "{\"ok\":false,\"error\":" + JSONObject.quote(String.valueOf(t.getMessage())) + "}"; }
            final String res = out;
            main.post(() -> web.evaluateJavascript("window.Dex && Dex.reply(" + JSONObject.quote(id) + "," + JSONObject.quote(res) + ")", null));
        });
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        push("setup");
    }

    final class Bridge {
        @JavascriptInterface public String info() { try { return MainActivity.this.info().toString(); } catch (Exception e) { return "{}"; } }
        @JavascriptInterface public String apps() { try { return MainActivity.this.apps().toString(); } catch (Exception e) { return "[]"; } }
        @JavascriptInterface public String status() { try { return MainActivity.this.status().toString(); } catch (Exception e) { return "{}"; } }
        @JavascriptInterface public String launch(String pkg, String cls, String mode, String where, double tb) {
            try { return MainActivity.this.launch(pkg, cls, mode, where, tb).toString(); } catch (Exception e) { return "{\"ok\":false}"; }
        }
        @JavascriptInterface public void tasks(String id) { async(id, MainActivity.this::tasks); }
        @JavascriptInterface public void taskAction(String id, int task, String action, double tb) { async(id, () -> MainActivity.this.taskAction(task, action, tb)); }
        @JavascriptInterface public void setting(String id, String key, boolean on) { async(id, () -> setSetting(key, on)); }
        @JavascriptInterface public void density(String id, int dpi) { async(id, () -> setDensity(dpi)); }
        @JavascriptInterface public void densityInfo(String id) { async(id, () -> readDensity()); }
        @JavascriptInterface public void reboot() { worker.submit(() -> Shizu.run("svc power reboot || reboot", 5000)); }
        @JavascriptInterface public void recents() { worker.submit(() -> Shizu.run("input keyevent KEYCODE_APP_SWITCH", 2000)); }
        @JavascriptInterface public void notifications() { worker.submit(() -> statusBar(false)); }
        @JavascriptInterface public void quickSettings() { worker.submit(() -> statusBar(true)); }
        @JavascriptInterface public void requestShizuku() {
            main.post(() -> {
                if (Shizu.running()) Shizu.request(REQ_SHIZUKU);
                else if (Shizu.installed(MainActivity.this)) open(getPackageManager().getLaunchIntentForPackage(Shizu.PKG));
                else open(new Intent(Intent.ACTION_VIEW, Uri.parse(Shizu.DOWNLOAD)));
            });
        }
        @JavascriptInterface public void openDevOptions() {
            main.post(() -> {
                if (global(Settings.Global.DEVELOPMENT_SETTINGS_ENABLED) == 1) open(new Intent(Settings.ACTION_APPLICATION_DEVELOPMENT_SETTINGS));
                else open(new Intent(Settings.ACTION_DEVICE_INFO_SETTINGS)); // 빌드 번호를 일곱 번 눌러 개발자 옵션 켜기
            });
        }
        @JavascriptInterface public void openHomeSettings() { main.post(() -> open(new Intent(Settings.ACTION_HOME_SETTINGS))); }
        @JavascriptInterface public void openSettings() { main.post(() -> open(new Intent(Settings.ACTION_SETTINGS))); }
        @JavascriptInterface public void appInfo(String pkg) { main.post(() -> open(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + pkg)))); }
        @JavascriptInterface public void uninstall(String pkg) { main.post(() -> open(new Intent(Intent.ACTION_DELETE, Uri.parse("package:" + pkg)))); }
        @JavascriptInterface public void save(String k, String v) { prefs.edit().putString(k, v).apply(); }
        @JavascriptInterface public String load(String k) { return prefs.getString(k, ""); }
        @JavascriptInterface public void log(String s) { Log.i(SELFTEST_TAG, s); }
    }
}
