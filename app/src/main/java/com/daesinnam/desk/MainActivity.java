package com.daesinnam.desk;

import android.annotation.SuppressLint;
import android.app.ActivityOptions;
import android.app.role.RoleManager;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.content.res.AssetManager;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Rect;
import android.graphics.drawable.Drawable;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.BatteryManager;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.util.Log;
import android.view.ViewGroup;
import android.webkit.ConsoleMessage;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

import androidx.activity.ComponentActivity;
import androidx.activity.OnBackPressedCallback;
import androidx.annotation.NonNull;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.webkit.JavaScriptReplyProxy;
import androidx.webkit.WebMessageCompat;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.text.Collator;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * 덜누름 데스크 — 안드로이드를 데스크톱처럼 쓰는 홈 앱(런처).
 *
 * 화면(바탕화면·작업 표시줄·시작 메뉴·내부 창)은 assets/ui/ 의 HTML이고, 이 액티비티는
 *  - 설치된 앱 목록과 아이콘을 넘겨주고 (/appicon/<패키지>/<액티비티>)
 *  - 앱을 창 모드(자유 창)·반쪽·전체 화면으로 띄우고
 *  - 배터리·연결 상태를 알려 줍니다.
 * 화면과는 DeskAndroid 메시지로 주고받습니다: {id, method, args} → {id, result}, 앱 → 화면은 {push:…}.
 */
public class MainActivity extends ComponentActivity {
    private static final String TAG = "Desk";
    private static final String APP_ORIGIN = "https://appassets.androidplatform.net";
    private static final String INDEX = APP_ORIGIN + "/assets/ui/index.html";
    /** ActivityOptions 번들의 창 방식 키 (WindowConfiguration: 1 = 전체 화면, 5 = 자유 창) */
    private static final String KEY_WINDOWING_MODE = "android.activity.windowingMode";

    private final Handler main = new Handler(Looper.getMainLooper());
    private final ExecutorService io = Executors.newSingleThreadExecutor();
    private final Map<String, byte[]> iconCache = new ConcurrentHashMap<>();
    private WebView web;
    private FrameLayout root;
    private JavaScriptReplyProxy pageProxy;
    private boolean selftest;
    private int cascade;

    private final BroadcastReceiver packages = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            iconCache.clear();
            push("apps");
        }
    };
    private final BroadcastReceiver battery = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            push("status");
        }
    };

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        selftest = BuildConfig.DEBUG && getIntent() != null && getIntent().hasExtra("desk.selftest");

        root = new FrameLayout(this);
        root.setBackgroundColor(0xFF0E0F13);
        web = new WebView(this);
        web.setBackgroundColor(0xFF0E0F13);
        root.addView(web, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        setContentView(root);
        ViewCompat.setOnApplyWindowInsetsListener(root, (v, insets) -> {
            Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout() | WindowInsetsCompat.Type.ime());
            v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            return WindowInsetsCompat.CONSUMED;
        });

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setSupportZoom(false);
        s.setTextZoom(100);

        WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", this::serveAsset)
                .addPathHandler("/appicon/", this::serveIcon)
                .build();
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                WebResourceResponse r = loader.shouldInterceptRequest(request.getUrl());
                return r != null ? r : notFound();
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !"appassets.androidplatform.net".equals(request.getUrl().getHost());
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(ConsoleMessage m) {
                Log.i(TAG + "Console", m.messageLevel() + " " + m.message() + " (" + m.sourceId() + ":" + m.lineNumber() + ")");
                return true;
            }
        });
        if (WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
            WebViewCompat.addWebMessageListener(web, "DeskAndroid", Collections.singleton(APP_ORIGIN), this::onMessage);
        }

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                push("back"); // 홈 앱은 뒤로 가기로 닫히지 않습니다. 열린 메뉴·창만 닫습니다.
            }
        });

        IntentFilter pf = new IntentFilter();
        pf.addAction(Intent.ACTION_PACKAGE_ADDED);
        pf.addAction(Intent.ACTION_PACKAGE_REMOVED);
        pf.addAction(Intent.ACTION_PACKAGE_CHANGED);
        pf.addDataScheme("package");
        registerReceiver(packages, pf);
        registerReceiver(battery, new IntentFilter(Intent.ACTION_BATTERY_CHANGED));

        web.loadUrl(INDEX + (selftest ? "?selftest" : ""));
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        // 홈 버튼을 다시 누르면: 시작 메뉴 등을 닫고 바탕화면으로
        if (intent != null && intent.hasCategory(Intent.CATEGORY_HOME)) push("home");
    }

    @Override
    protected void onResume() {
        super.onResume();
        push("status");
    }

    @Override
    protected void onDestroy() {
        try {
            unregisterReceiver(packages);
            unregisterReceiver(battery);
        } catch (IllegalArgumentException ignored) {
        }
        io.shutdownNow();
        if (web != null) web.destroy();
        super.onDestroy();
    }

    // ---------- 화면 ↔ 앱 ----------
    private void onMessage(@NonNull WebView view, @NonNull WebMessageCompat message, @NonNull Uri origin,
                           boolean isMainFrame, @NonNull JavaScriptReplyProxy proxy) {
        if (!isMainFrame || message.getData() == null) return;
        pageProxy = proxy;
        try {
            JSONObject m = new JSONObject(message.getData());
            if (m.has("log")) {
                Log.i(selftest ? "DESK_SELFTEST" : TAG, m.optString("log"));
                return;
            }
            int id = m.optInt("id");
            String method = m.optString("method");
            JSONArray a = m.optJSONArray("args");
            if (a == null) a = new JSONArray();
            if ("apps".equals(method)) {
                io.execute(() -> reply(id, safe(this::listApps)));
            } else {
                final JSONArray args = a;
                reply(id, safe(() -> call(method, args)));
            }
        } catch (JSONException e) {
            Log.w(TAG, "잘못된 메시지", e);
        }
    }

    private interface Call {
        Object run() throws Exception;
    }

    private Object safe(Call c) {
        try {
            return c.run();
        } catch (Exception e) {
            Log.w(TAG, "요청 실패", e);
            try {
                return new JSONObject().put("error", String.valueOf(e.getMessage()));
            } catch (JSONException x) {
                return JSONObject.NULL;
            }
        }
    }

    private void reply(int id, Object result) {
        main.post(() -> {
            if (pageProxy == null) return;
            try {
                pageProxy.postMessage(new JSONObject().put("id", id).put("result", result).toString());
            } catch (JSONException ignored) {
            }
        });
    }

    private void push(String what) {
        main.post(() -> {
            if (pageProxy == null) return;
            try {
                pageProxy.postMessage(new JSONObject().put("push", what).toString());
            } catch (JSONException ignored) {
            }
        });
    }

    private Object call(String method, JSONArray a) throws Exception {
        switch (method) {
            case "status":
                return status();
            case "launch":
                return launch(a.getString(0), a.getString(1), a.optString(2, "window"));
            case "appInfo":
                startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.fromParts("package", a.getString(0), null))
                        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
                return true;
            case "uninstall":
                startActivity(new Intent(Intent.ACTION_DELETE, Uri.fromParts("package", a.getString(0), null))
                        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
                return true;
            case "openSettings":
                return openSettings(a.optString(0));
            case "makeDefault":
                return makeDefault();
            default:
                throw new IllegalArgumentException("모르는 요청: " + method);
        }
    }

    // ---------- 앱 목록·아이콘 ----------
    private JSONArray listApps() throws JSONException {
        PackageManager pm = getPackageManager();
        Intent q = new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER);
        List<ResolveInfo> found = pm.queryIntentActivities(q, 0);
        List<String[]> rows = new ArrayList<>();
        for (ResolveInfo r : found) {
            if (r.activityInfo == null) continue;
            if (getPackageName().equals(r.activityInfo.packageName)) continue;
            CharSequence label = r.loadLabel(pm);
            rows.add(new String[]{r.activityInfo.packageName, r.activityInfo.name, label == null ? r.activityInfo.packageName : label.toString()});
        }
        Collator col = Collator.getInstance(Locale.KOREAN);
        rows.sort((x, y) -> col.compare(x[2], y[2]));
        JSONArray out = new JSONArray();
        for (String[] r : rows) out.put(new JSONObject().put("pkg", r[0]).put("cls", r[1]).put("label", r[2]));
        return out;
    }

    /** /appicon/<패키지>/<액티비티> → PNG */
    private WebResourceResponse serveIcon(@NonNull String path) {
        try {
            int slash = path.indexOf('/');
            if (slash <= 0) return notFound();
            String pkg = path.substring(0, slash), cls = path.substring(slash + 1);
            byte[] png = iconCache.get(path);
            if (png == null) {
                Drawable d = getPackageManager().getActivityIcon(new ComponentName(pkg, cls));
                int size = 144;
                Bitmap bmp = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
                Canvas c = new Canvas(bmp);
                d.setBounds(0, 0, size, size);
                d.draw(c);
                ByteArrayOutputStream out = new ByteArrayOutputStream();
                bmp.compress(Bitmap.CompressFormat.PNG, 100, out);
                bmp.recycle();
                png = out.toByteArray();
                iconCache.put(path, png);
            }
            Map<String, String> h = new HashMap<>();
            h.put("Cache-Control", "max-age=600");
            return new WebResourceResponse("image/png", null, 200, "OK", h, new ByteArrayInputStream(png));
        } catch (Exception e) {
            return notFound();
        }
    }

    // ---------- 앱 띄우기 ----------
    private boolean freeformSupported() {
        if (getPackageManager().hasSystemFeature(PackageManager.FEATURE_FREEFORM_WINDOW_MANAGEMENT)) return true;
        return Settings.Global.getInt(getContentResolver(), "enable_freeform_support", 0) == 1;
    }

    /** mode: window(자유 창) · left · right(반쪽 창) · full(전체 화면) */
    private JSONObject launch(String pkg, String cls, String mode) throws JSONException {
        Intent i = new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
                .setComponent(new ComponentName(pkg, cls))
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
        JSONObject r = new JSONObject().put("mode", mode);
        Bundle opts = null;
        try {
            ActivityOptions o = ActivityOptions.makeBasic();
            if ("full".equals(mode)) {
                opts = o.toBundle();
                opts.putInt(KEY_WINDOWING_MODE, 1);
            } else {
                Rect b = boundsFor(mode);
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
            // 창 방식 지정을 받지 않는 기기: 보통 방식으로
            Log.w(TAG, "창 방식으로 열지 못해 보통 방식으로 엽니다: " + e);
            startActivity(i);
            r.put("fallback", true);
        }
        return r.put("ok", true).put("freeform", freeformSupported());
    }

    private Rect boundsFor(String mode) {
        Rect screen = getWindowManager().getMaximumWindowMetrics().getBounds();
        float dp = getResources().getDisplayMetrics().density;
        int top = root.getPaddingTop(), bottom = root.getPaddingBottom();
        int bar = Math.round(64 * dp); // 작업 표시줄 자리는 비워 둠
        int W = screen.width(), H = screen.height();
        int usableTop = top, usableBottom = H - bottom - bar;
        if ("left".equals(mode)) return new Rect(0, usableTop, W / 2, usableBottom);
        if ("right".equals(mode)) return new Rect(W / 2, usableTop, W, usableBottom);
        boolean narrow = W < 600 * dp;
        int w = narrow ? Math.round(W * 0.92f) : Math.max(Math.round(420 * dp), Math.round(W * 0.56f));
        int h = Math.round((usableBottom - usableTop) * (narrow ? 0.62f : 0.78f));
        w = Math.min(w, W);
        int step = Math.round(28 * dp);
        int n = cascade++ % 5;
        int x = Math.min(W - w, (W - w) / 2 + (n - 2) * step);
        int y = Math.min(usableBottom - h, usableTop + Math.round(16 * dp) + n * step);
        x = Math.max(0, x);
        y = Math.max(usableTop, y);
        return new Rect(x, y, x + w, y + h);
    }

    // ---------- 상태·설정 ----------
    private JSONObject status() throws JSONException {
        JSONObject r = new JSONObject();
        Intent b = registerReceiver(null, new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
        if (b != null) {
            int level = b.getIntExtra(BatteryManager.EXTRA_LEVEL, -1), scale = b.getIntExtra(BatteryManager.EXTRA_SCALE, 100);
            int st = b.getIntExtra(BatteryManager.EXTRA_STATUS, -1);
            r.put("battery", level < 0 ? -1 : Math.round(level * 100f / Math.max(1, scale)));
            r.put("charging", st == BatteryManager.BATTERY_STATUS_CHARGING || st == BatteryManager.BATTERY_STATUS_FULL);
        }
        String net = "none";
        try {
            ConnectivityManager cm = getSystemService(ConnectivityManager.class);
            NetworkCapabilities nc = cm == null ? null : cm.getNetworkCapabilities(cm.getActiveNetwork());
            if (nc != null) {
                if (nc.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) net = "wifi";
                else if (nc.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)) net = "cell";
                else if (nc.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)) net = "wired";
                else net = "other";
            }
        } catch (RuntimeException ignored) {
        }
        r.put("net", net);
        r.put("freeform", freeformSupported());
        r.put("isDefault", isDefaultHome());
        r.put("version", BuildConfig.VERSION_NAME);
        return r;
    }

    private boolean isDefaultHome() {
        RoleManager rm = getSystemService(RoleManager.class);
        return rm != null && rm.isRoleAvailable(RoleManager.ROLE_HOME) && rm.isRoleHeld(RoleManager.ROLE_HOME);
    }

    @SuppressWarnings("deprecation")
    private boolean makeDefault() {
        try {
            RoleManager rm = getSystemService(RoleManager.class);
            if (rm != null && rm.isRoleAvailable(RoleManager.ROLE_HOME) && !rm.isRoleHeld(RoleManager.ROLE_HOME)) {
                startActivityForResult(rm.createRequestRoleIntent(RoleManager.ROLE_HOME), 7);
                return true;
            }
        } catch (RuntimeException ignored) {
        }
        startActivity(new Intent(Settings.ACTION_HOME_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        return true;
    }

    private boolean openSettings(String kind) {
        String action;
        switch (kind) {
            case "wifi": action = Settings.ACTION_WIFI_SETTINGS; break;
            case "bluetooth": action = Settings.ACTION_BLUETOOTH_SETTINGS; break;
            case "display": action = Settings.ACTION_DISPLAY_SETTINGS; break;
            case "sound": action = Settings.ACTION_SOUND_SETTINGS; break;
            case "battery": action = Intent.ACTION_POWER_USAGE_SUMMARY; break;
            case "home": action = Settings.ACTION_HOME_SETTINGS; break;
            case "developer": action = Settings.ACTION_APPLICATION_DEVELOPMENT_SETTINGS; break;
            default: action = Settings.ACTION_SETTINGS;
        }
        try {
            startActivity(new Intent(action).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        } catch (RuntimeException e) {
            startActivity(new Intent(Settings.ACTION_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        }
        return true;
    }

    // ---------- 화면 파일 ----------
    private WebResourceResponse serveAsset(@NonNull String path) {
        if (path.contains("..") || !path.startsWith("ui/")) return notFound();
        try {
            InputStream in = getAssets().open(path, AssetManager.ACCESS_STREAMING);
            String ext = path.substring(path.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
            String mime = MIME.containsKey(ext) ? MIME.get(ext) : "application/octet-stream";
            boolean text = mime.startsWith("text/") || mime.endsWith("svg+xml");
            Map<String, String> h = new HashMap<>();
            h.put("Cache-Control", "no-cache");
            return new WebResourceResponse(mime, text ? "utf-8" : null, 200, "OK", h, in);
        } catch (Exception e) {
            return notFound();
        }
    }

    private static final Map<String, String> MIME = new HashMap<>();

    static {
        MIME.put("html", "text/html");
        MIME.put("css", "text/css");
        MIME.put("js", "text/javascript");
        MIME.put("svg", "image/svg+xml");
        MIME.put("png", "image/png");
    }

    private static WebResourceResponse notFound() {
        return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", Collections.emptyMap(), new ByteArrayInputStream(new byte[0]));
    }
}
