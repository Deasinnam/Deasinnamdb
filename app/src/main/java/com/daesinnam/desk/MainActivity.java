package com.daesinnam.desk;

import android.annotation.SuppressLint;
import android.app.ActivityOptions;
import android.app.role.RoleManager;
import android.appwidget.AppWidgetHost;
import android.appwidget.AppWidgetHostView;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProviderInfo;
import android.content.ActivityNotFoundException;
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
import android.graphics.ImageDecoder;
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
import android.view.HapticFeedbackConstants;
import android.view.MotionEvent;
import android.view.ViewConfiguration;
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
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.PickVisualMediaRequest;
import androidx.activity.result.contract.ActivityResultContracts;
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
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.text.Collator;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
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
 *  - 다른 앱의 위젯을 바탕화면에 올립니다 (안드로이드 위젯 호스트).
 * 화면과는 DeskAndroid 메시지로 주고받습니다: {id, method, args} → {id, result}, 앱 → 화면은 {push:…}.
 *
 * 뷰는 세 겹입니다: 맨 아래 배경(작은 WebView) → 위젯(안드로이드 뷰) → 바탕화면 화면(투명한 WebView).
 * 그래서 창·시작 메뉴는 위젯 위에 그려지고, 위젯이 드러난 곳을 누르면 위젯이 받습니다(PassWebView).
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
    private PassWebView web;
    private WebView wallWeb;
    private FrameLayout root;

    // ---- 위젯 ----
    private static final int WIDGET_HOST_ID = 0x44454B; // "DEK"
    private static final int REQ_WIDGET_CONFIG = 21;
    private AppWidgetManager widgetManager;
    private AppWidgetHost widgetHost;
    private FrameLayout widgetLayer;
    private final Map<Integer, AppWidgetHostView> widgetViews = new HashMap<>();
    /** 올리는 중인 위젯: 화면이 자기 목록에 넣었다고 알려 오기 전에는 지우지 않습니다 */
    private final Set<Integer> protectedIds = new HashSet<>();
    private volatile List<AppWidgetProviderInfo> providers = new ArrayList<>();
    private int pendingWidgetId = -1;
    private AppWidgetProviderInfo pendingWidgetInfo;
    private boolean wallReady;
    private String wallLook;

    /** "이 앱이 위젯을 만들도록 허용할까요?" 확인 창 */
    private final ActivityResultLauncher<Intent> bindWidget =
            registerForActivityResult(new ActivityResultContracts.StartActivityForResult(), result -> {
                int id = pendingWidgetId;
                AppWidgetProviderInfo info = pendingWidgetInfo;
                if (id < 0 || info == null) return;
                if (result.getResultCode() == RESULT_OK) afterWidgetBound(id, info);
                else cancelWidget(id, "denied");
            });
    private JavaScriptReplyProxy pageProxy;
    private boolean selftest;
    private int cascade;

    /** 배경으로 쓸 사진 고르기 (안드로이드 사진 고르기 창 — 저장소 권한이 필요 없음) */
    private final ActivityResultLauncher<PickVisualMediaRequest> pickWallpaper =
            registerForActivityResult(new ActivityResultContracts.PickVisualMedia(), this::onWallpaperPicked);

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
        // 아래부터: 배경 → 위젯 → 바탕화면 화면(투명)
        wallWeb = new WebView(this);
        wallWeb.setBackgroundColor(0xFF0E0F13);
        wallWeb.setFocusable(false);
        wallWeb.setOnTouchListener((v, e) -> true);
        root.addView(wallWeb, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        widgetLayer = new FrameLayout(this);
        root.addView(widgetLayer, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        web = new PassWebView(this);
        web.setBackgroundColor(0x00000000);
        root.addView(web, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        setContentView(root);
        widgetManager = AppWidgetManager.getInstance(this);
        widgetHost = new Host(this);
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
                .addPathHandler("/wallpaper/", this::serveWallpaper)
                .addPathHandler("/widgetpreview/", this::serveWidgetPreview)
                .build();
        wallWeb.getSettings().setJavaScriptEnabled(true);
        wallWeb.getSettings().setAllowFileAccess(false);
        wallWeb.getSettings().setAllowContentAccess(false);
        wallWeb.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                WebResourceResponse r = loader.shouldInterceptRequest(request.getUrl());
                return r != null ? r : notFound();
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return true;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                wallReady = true;
                applyWallLook();
            }
        });
        wallWeb.loadUrl(APP_ORIGIN + "/assets/ui/wallpaper.html");
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
    protected void onStart() {
        super.onStart();
        try {
            widgetHost.startListening(); // 위젯 내용이 바뀌면 받아서 다시 그림
        } catch (RuntimeException e) {
            Log.w(TAG, "위젯 듣기를 시작하지 못했습니다", e);
        }
    }

    @Override
    protected void onStop() {
        try {
            widgetHost.stopListening();
        } catch (RuntimeException ignored) {
        }
        super.onStop();
    }

    @SuppressWarnings("deprecation")
    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != REQ_WIDGET_CONFIG) return;
        // 위젯이 자기 설정 화면을 띄운 뒤 돌아옴
        int id = pendingWidgetId;
        AppWidgetProviderInfo info = pendingWidgetInfo;
        if (id < 0 || info == null) return;
        if (resultCode == RESULT_OK) finishWidget(id, info);
        else cancelWidget(id, "canceled");
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
        if (wallWeb != null) wallWeb.destroy();
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
            } else if ("widgetProviders".equals(method)) {
                io.execute(() -> reply(id, safe(this::listWidgetProviders)));
            } else if ("lookProbe".equals(method)) { // 자동 점검: 배경 층에 실제로 걸린 배경
                wallWeb.evaluateJavascript("getComputedStyle(document.body).backgroundImage + ' / ' + document.body.className", v -> reply(id, v));
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
        push(what, null);
    }

    private void push(String what, JSONObject data) {
        main.post(() -> {
            if (pageProxy == null) return;
            try {
                JSONObject m = new JSONObject().put("push", what);
                if (data != null) m.put("data", data);
                pageProxy.postMessage(m.toString());
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
            case "pickWallpaper":
                pickWallpaper.launch(new PickVisualMediaRequest.Builder()
                        .setMediaType(ActivityResultContracts.PickVisualMedia.ImageOnly.INSTANCE).build());
                return true;
            case "clearWallpaper":
                //noinspection ResultOfMethodCallIgnored
                wallpaperFile().delete();
                return true;
            case "look": // 배경 층에 배경 걸기 (기본 배경 번호 또는 내 사진)
                wallLook = "setLook(" + JSONObject.quote(a.optString(0)) + "," + JSONObject.quote(a.optString(1)) + ")";
                applyWallLook();
                return true;
            case "addWidget":
                return addWidget(a.getInt(0));
            case "widgetSync":
                return widgetSync(a.getJSONArray(0), a.getJSONArray(1), a.optDouble(2, 0), a.optBoolean(3, false), a.optBoolean(4, false));
            case "widgetProbe":
                return widgetProbe();
            case "testWallpaper": { // 자동 점검 전용: 사진 고르기 대신 만든 그림을 같은 길로 저장
                if (!selftest) throw new IllegalStateException("점검 전용");
                Bitmap b = Bitmap.createBitmap(900, 1600, Bitmap.Config.ARGB_8888);
                new Canvas(b).drawColor(0xFF2E7D6B);
                saveWallpaper(b);
                return true;
            }
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

    // ---------- 위젯 ----------

    /** 위젯 하나를 감싸는 뷰: 길게 누르거나 마우스 오른쪽 단추로 누르면 "위젯 편집"을 엽니다 */
    private final class WidgetView extends AppWidgetHostView {
        private final int slop;
        private float downX, downY;
        private boolean fired;
        private final Runnable longPress = () -> {
            fired = true;
            performHapticFeedback(HapticFeedbackConstants.LONG_PRESS);
            editWidget(getAppWidgetId());
        };

        WidgetView(Context context) {
            super(context);
            slop = ViewConfiguration.get(context).getScaledTouchSlop();
        }

        @Override
        public boolean onInterceptTouchEvent(MotionEvent ev) {
            switch (ev.getActionMasked()) {
                case MotionEvent.ACTION_DOWN:
                    fired = false;
                    downX = ev.getX();
                    downY = ev.getY();
                    removeCallbacks(longPress);
                    if ((ev.getButtonState() & MotionEvent.BUTTON_SECONDARY) != 0) {
                        fired = true;
                        editWidget(getAppWidgetId());
                    } else {
                        postDelayed(longPress, ViewConfiguration.getLongPressTimeout() + 150L);
                    }
                    break;
                case MotionEvent.ACTION_MOVE:
                    if (Math.hypot(ev.getX() - downX, ev.getY() - downY) > slop) removeCallbacks(longPress);
                    break;
                case MotionEvent.ACTION_UP:
                case MotionEvent.ACTION_CANCEL:
                    removeCallbacks(longPress);
                    break;
                default:
                    break;
            }
            return fired; // 편집을 열었으면 위젯 안의 단추는 눌리지 않게
        }

        @Override
        public boolean onTouchEvent(MotionEvent ev) {
            int a = ev.getActionMasked();
            if (a == MotionEvent.ACTION_UP || a == MotionEvent.ACTION_CANCEL) removeCallbacks(longPress);
            return true; // 위젯 안의 아무것도 받지 않는 곳도 길게 누름을 알아채도록
        }
    }

    private final class Host extends AppWidgetHost {
        Host(Context context) {
            super(context, WIDGET_HOST_ID);
        }

        @Override
        protected AppWidgetHostView onCreateView(Context context, int appWidgetId, AppWidgetProviderInfo appWidget) {
            return new WidgetView(context);
        }
    }

    private void editWidget(int id) {
        try {
            push("widget-edit", new JSONObject().put("id", id));
        } catch (JSONException ignored) {
        }
    }

    private int toDp(int px) {
        return Math.round(px / getResources().getDisplayMetrics().density);
    }

    /** 올릴 수 있는 위젯 목록 (앱 이름 → 위젯 이름 순) */
    private JSONArray listWidgetProviders() throws JSONException {
        PackageManager pm = getPackageManager();
        List<AppWidgetProviderInfo> found = new ArrayList<>(widgetManager.getInstalledProviders());
        Map<String, String> appNames = new HashMap<>();
        List<Object[]> rows = new ArrayList<>();
        for (AppWidgetProviderInfo info : found) {
            if (info == null || info.provider == null) continue;
            String pkg = info.provider.getPackageName();
            String app = appNames.get(pkg);
            if (app == null) {
                try {
                    app = String.valueOf(pm.getApplicationLabel(pm.getApplicationInfo(pkg, 0)));
                } catch (PackageManager.NameNotFoundException e) {
                    app = pkg;
                }
                appNames.put(pkg, app);
            }
            String label = info.loadLabel(pm);
            rows.add(new Object[]{info, app, label == null ? app : label});
        }
        Collator col = Collator.getInstance(Locale.KOREAN);
        rows.sort((x, y) -> {
            int c = col.compare((String) x[1], (String) y[1]);
            return c != 0 ? c : col.compare((String) x[2], (String) y[2]);
        });
        List<AppWidgetProviderInfo> ordered = new ArrayList<>();
        JSONArray out = new JSONArray();
        for (Object[] r : rows) {
            AppWidgetProviderInfo info = (AppWidgetProviderInfo) r[0];
            JSONObject o = new JSONObject().put("i", ordered.size()).put("app", r[1]).put("label", r[2])
                    .put("pkg", info.provider.getPackageName())
                    .put("w", toDp(info.minWidth)).put("h", toDp(info.minHeight));
            if (android.os.Build.VERSION.SDK_INT >= 31) o.put("cw", info.targetCellWidth).put("ch", info.targetCellHeight);
            ordered.add(info);
            out.put(o);
        }
        providers = ordered;
        return out;
    }

    /** /widgetpreview/<번호> → 위젯 미리보기 그림 (없으면 위젯·앱 아이콘) */
    private WebResourceResponse serveWidgetPreview(@NonNull String path) {
        try {
            List<AppWidgetProviderInfo> list = providers;
            AppWidgetProviderInfo info = list.get(Integer.parseInt(path));
            Drawable d = info.loadPreviewImage(this, 0);
            if (d == null) d = info.loadIcon(this, 0);
            if (d == null) d = getPackageManager().getApplicationIcon(info.provider.getPackageName());
            int w = d.getIntrinsicWidth(), h = d.getIntrinsicHeight();
            if (w <= 0 || h <= 0) {
                w = 144;
                h = 144;
            }
            float k = Math.min(1f, 360f / Math.max(w, h));
            int bw = Math.max(1, Math.round(w * k)), bh = Math.max(1, Math.round(h * k));
            Bitmap bmp = Bitmap.createBitmap(bw, bh, Bitmap.Config.ARGB_8888);
            d.setBounds(0, 0, bw, bh);
            d.draw(new Canvas(bmp));
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            bmp.compress(Bitmap.CompressFormat.PNG, 100, out);
            bmp.recycle();
            Map<String, String> h2 = new HashMap<>();
            h2.put("Cache-Control", "max-age=300");
            return new WebResourceResponse("image/png", null, 200, "OK", h2, new ByteArrayInputStream(out.toByteArray()));
        } catch (Exception e) {
            return notFound();
        }
    }

    /** 위젯 올리기 시작: 번호 받기 → (필요하면 허용 확인) → (필요하면 위젯 자체 설정) → 화면에 알림 */
    private boolean addWidget(int index) {
        List<AppWidgetProviderInfo> list = providers;
        if (index < 0 || index >= list.size()) throw new IllegalArgumentException("위젯 목록이 바뀌었습니다. 다시 열어 주세요.");
        AppWidgetProviderInfo info = list.get(index);
        int id = widgetHost.allocateAppWidgetId();
        protectedIds.add(id);
        pendingWidgetId = id;
        pendingWidgetInfo = info;
        boolean bound;
        try {
            bound = widgetManager.bindAppWidgetIdIfAllowed(id, info.getProfile(), info.provider, null);
        } catch (RuntimeException e) {
            Log.w(TAG, "위젯 연결 실패", e);
            cancelWidget(id, "failed");
            return true;
        }
        if (bound) {
            afterWidgetBound(id, info);
            return true;
        }
        // 처음 한 번: 안드로이드가 "덜누름 데스크가 위젯을 만들도록 허용" 확인 창을 띄웁니다
        try {
            bindWidget.launch(new Intent(AppWidgetManager.ACTION_APPWIDGET_BIND)
                    .putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, id)
                    .putExtra(AppWidgetManager.EXTRA_APPWIDGET_PROVIDER, info.provider)
                    .putExtra(AppWidgetManager.EXTRA_APPWIDGET_PROVIDER_PROFILE, info.getProfile()));
        } catch (ActivityNotFoundException e) {
            cancelWidget(id, "failed");
        }
        return true;
    }

    private void afterWidgetBound(int id, AppWidgetProviderInfo info) {
        boolean optional = android.os.Build.VERSION.SDK_INT >= 31
                && (info.widgetFeatures & AppWidgetProviderInfo.WIDGET_FEATURE_CONFIGURATION_OPTIONAL) != 0
                && (info.widgetFeatures & AppWidgetProviderInfo.WIDGET_FEATURE_RECONFIGURABLE) != 0;
        if (info.configure != null && !optional) {
            try {
                widgetHost.startAppWidgetConfigureActivityForResult(this, id, 0, REQ_WIDGET_CONFIG, null);
                return; // 결과는 onActivityResult로
            } catch (RuntimeException e) {
                Log.w(TAG, "위젯 설정 화면을 열지 못해 그대로 올립니다: " + e);
            }
        }
        finishWidget(id, info);
    }

    private void finishWidget(int id, AppWidgetProviderInfo info) {
        pendingWidgetId = -1;
        pendingWidgetInfo = null;
        try {
            String label = info.loadLabel(getPackageManager());
            JSONObject o = new JSONObject().put("id", id).put("label", label == null ? "" : label)
                    .put("w", toDp(info.minWidth)).put("h", toDp(info.minHeight));
            if (android.os.Build.VERSION.SDK_INT >= 31) o.put("cw", info.targetCellWidth).put("ch", info.targetCellHeight);
            push("widget-added", o);
        } catch (JSONException ignored) {
        }
    }

    private void cancelWidget(int id, String reason) {
        pendingWidgetId = -1;
        pendingWidgetInfo = null;
        protectedIds.remove(id);
        try {
            widgetHost.deleteAppWidgetId(id);
        } catch (RuntimeException ignored) {
        }
        try {
            push("widget-failed", new JSONObject().put("reason", reason));
        } catch (JSONException ignored) {
        }
    }

    /**
     * 화면이 알려 준 대로 위젯을 놓습니다.
     *  layout:   [{id, x, y, w, h}]  (화면 좌표, CSS 픽셀)
     *  blockers: [[왼쪽, 위, 오른쪽, 아래]]  위젯을 덮는 것들(창·아이콘·작업 표시줄)
     *  cssWidth: 화면 너비(CSS 픽셀) — 실제 픽셀과의 비율 계산용
     *  blockAll: 메뉴가 열려 있거나 위젯 편집 중 → 위젯이 누름을 받지 않음
     *  dragging: 끌어서 옮기거나 크기를 바꾸는 중 → 위젯에 크기 알림은 놓은 뒤에
     * 돌려주는 값: {missing: [불러올 수 없는 위젯 번호]}
     */
    private JSONObject widgetSync(JSONArray layout, JSONArray blockers, double cssWidth, boolean blockAll, boolean dragging) throws JSONException {
        float density = getResources().getDisplayMetrics().density;
        float scale = web.getWidth() > 0 && cssWidth > 0 ? (float) (web.getWidth() / cssWidth) : density;
        Set<Integer> keep = new HashSet<>();
        JSONArray missing = new JSONArray();
        List<Rect> rects = new ArrayList<>();
        for (int i = 0; i < layout.length(); i++) {
            JSONObject o = layout.getJSONObject(i);
            int id = o.getInt("id");
            int x = Math.round((float) o.getDouble("x") * scale), y = Math.round((float) o.getDouble("y") * scale);
            int w = Math.max(1, Math.round((float) o.getDouble("w") * scale)), h = Math.max(1, Math.round((float) o.getDouble("h") * scale));
            keep.add(id);
            protectedIds.remove(id); // 화면이 자기 목록에 넣었음
            AppWidgetHostView v = widgetViews.get(id);
            if (v == null) {
                AppWidgetProviderInfo info = widgetManager.getAppWidgetInfo(id);
                if (info == null) { // 그 앱이 지워졌거나 아직 준비되지 않음
                    missing.put(id);
                    continue;
                }
                v = widgetHost.createView(this, id, info);
                widgetViews.put(id, v);
                FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(w, h);
                lp.leftMargin = x;
                lp.topMargin = y;
                widgetLayer.addView(v, lp);
                v.setTag(null);
            } else {
                FrameLayout.LayoutParams lp = (FrameLayout.LayoutParams) v.getLayoutParams();
                if (lp.width != w || lp.height != h || lp.leftMargin != x || lp.topMargin != y) {
                    lp.width = w;
                    lp.height = h;
                    lp.leftMargin = x;
                    lp.topMargin = y;
                    v.setLayoutParams(lp);
                }
            }
            String size = w + "x" + h;
            if (!dragging && !size.equals(v.getTag())) {
                // 위젯에게 자기 크기를 알려 줌 (크기에 맞춰 내용을 바꾸는 위젯용)
                int wd = Math.round(w / density), hd = Math.round(h / density);
                try {
                    v.updateAppWidgetSize(null, wd, hd, wd, hd);
                } catch (RuntimeException ignored) {
                }
                v.setTag(size);
            }
            rects.add(new Rect(x, y, x + w, y + h));
        }
        // 목록에서 빠진 위젯은 뷰도, 위젯 번호도 정리
        List<Integer> gone = new ArrayList<>();
        for (Integer id : widgetViews.keySet()) if (!keep.contains(id)) gone.add(id);
        for (Integer id : gone) widgetLayer.removeView(widgetViews.remove(id));
        try {
            for (int id : widgetHost.getAppWidgetIds()) {
                if (!keep.contains(id) && !protectedIds.contains(id)) widgetHost.deleteAppWidgetId(id);
            }
        } catch (RuntimeException e) {
            Log.w(TAG, "위젯 정리 실패", e);
        }
        List<Rect> blocks = new ArrayList<>();
        for (int i = 0; i < blockers.length(); i++) {
            JSONArray b = blockers.getJSONArray(i);
            blocks.add(new Rect((int) Math.floor(b.getDouble(0) * scale), (int) Math.floor(b.getDouble(1) * scale),
                    (int) Math.ceil(b.getDouble(2) * scale), (int) Math.ceil(b.getDouble(3) * scale)));
        }
        web.setRegions(rects, blocks, blockAll);
        return new JSONObject().put("missing", missing);
    }

    /** 자동 점검: 실제로 놓인 위젯 뷰 */
    private JSONArray widgetProbe() throws JSONException {
        JSONArray out = new JSONArray();
        int[] at = new int[2];
        for (Map.Entry<Integer, AppWidgetHostView> e : widgetViews.entrySet()) {
            AppWidgetHostView v = e.getValue();
            v.getLocationOnScreen(at);
            out.put(new JSONObject().put("id", e.getKey()).put("sx", at[0]).put("sy", at[1])
                    .put("w", v.getWidth()).put("h", v.getHeight()).put("kids", v.getChildCount())
                    .put("shown", v.isShown()));
        }
        return out;
    }

    // ---------- 배경 층 ----------
    private void applyWallLook() {
        if (wallReady && wallLook != null) wallWeb.evaluateJavascript(wallLook, null);
    }

    // ---------- 내 사진 배경 ----------
    private File wallpaperFile() {
        return new File(getFilesDir(), "wallpaper.jpg");
    }

    private void onWallpaperPicked(Uri uri) {
        if (uri == null) return; // 고르지 않고 닫음
        io.execute(() -> {
            try {
                // 화면보다 지나치게 큰 사진은 줄여서 저장 (긴 쪽 2600px 이하). 사진의 회전 정보는 자동 반영됩니다.
                Bitmap b = ImageDecoder.decodeBitmap(ImageDecoder.createSource(getContentResolver(), uri), (decoder, info, src) -> {
                    decoder.setAllocator(ImageDecoder.ALLOCATOR_SOFTWARE);
                    int longSide = Math.max(info.getSize().getWidth(), info.getSize().getHeight());
                    int sample = 1;
                    while (longSide / sample > 2600) sample *= 2;
                    decoder.setTargetSampleSize(sample);
                });
                saveWallpaper(b);
                push("wallpaper");
            } catch (Exception e) {
                Log.w(TAG, "배경 사진을 읽지 못했습니다", e);
                push("wallpaper-failed");
            }
        });
    }

    private void saveWallpaper(Bitmap b) throws java.io.IOException {
        File tmp = new File(getFilesDir(), "wallpaper.tmp");
        try (FileOutputStream out = new FileOutputStream(tmp)) {
            b.compress(Bitmap.CompressFormat.JPEG, 90, out);
        }
        b.recycle();
        if (!tmp.renameTo(wallpaperFile())) throw new java.io.IOException("배경 파일을 저장하지 못했습니다");
    }

    /** /wallpaper/current.jpg → 저장해 둔 배경 사진 */
    private WebResourceResponse serveWallpaper(@NonNull String path) {
        try {
            File f = wallpaperFile();
            if (!f.exists()) return notFound();
            Map<String, String> h = new HashMap<>();
            h.put("Cache-Control", "no-cache");
            return new WebResourceResponse("image/jpeg", null, 200, "OK", h, new FileInputStream(f));
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
        File wp = wallpaperFile();
        r.put("wallpaper", wp.exists() ? wp.lastModified() : 0); // 내 사진 배경이 있으면 바뀐 시각(화면이 새 사진을 다시 읽게)
        r.put("version", BuildConfig.VERSION_NAME);
        r.put("pkg", getPackageName());
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
