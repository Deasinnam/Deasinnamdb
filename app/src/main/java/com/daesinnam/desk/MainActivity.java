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
import android.content.res.Configuration;
import android.content.res.ColorStateList;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.ImageDecoder;
import android.graphics.Rect;
import android.hardware.camera2.CameraCharacteristics;
import android.hardware.camera2.CameraManager;
import android.media.AudioManager;
import android.os.PowerManager;
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
import android.util.SizeF;
import android.view.ContextThemeWrapper;
import android.view.View;
import android.widget.ImageView;
import android.widget.TextView;
import android.view.HapticFeedbackConstants;
import android.view.MotionEvent;
import android.view.ViewConfiguration;
import android.view.ViewGroup;
import android.webkit.ConsoleMessage;
import android.webkit.RenderProcessGoneDetail;
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
    private static final int REQ_SHIZUKU = 31;
    private final rikka.shizuku.Shizuku.OnRequestPermissionResultListener shizukuResult = (code, result) -> {
        if (code == REQ_SHIZUKU) push("shizuku");
    };
    private AppWidgetManager widgetManager;
    private AppWidgetHost widgetHost;
    /**
     * 다른 앱 위젯을 그릴 때 쓰는 테마. 삼성 위젯(모드 및 루틴 등)은 아이콘 색을 기기 기본 테마(One UI)에서 가져오는데,
     * 앱 테마(Material)로 그리면 아이콘이 투명하거나 배경색과 같아져 안 보일 수 있습니다. 그래서 기기 기본 테마(낮/밤 따름)로 그립니다.
     */
    private Context widgetCtx;
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
        try { rikka.shizuku.Shizuku.addRequestPermissionResultListener(shizukuResult); } catch (Throwable ignored) { }
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
        widgetCtx = new ContextThemeWrapper(this, android.R.style.Theme_DeviceDefault_DayNight);
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

            @Override
            public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                return rendererGone("배경", detail);
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

            @Override
            public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                return rendererGone("바탕화면", detail);
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

        // 화면 크기가 바뀌면(접기·펴기, 창 크기) 위젯 자리를 다시 맞추게 알림
        web.addOnLayoutChangeListener((v, l, t, r, b, ol, ot, or, ob) -> {
            if (r - l != or - ol || b - t != ob - ot) push("layout");
        });
        web.loadUrl(INDEX + (selftest ? ("2".equals(getIntent().getStringExtra("desk.phase")) ? "?selftest=2" : "?selftest") : ""));
    }

    /**
     * 화면을 그리는 프로세스(WebView 렌더러)가 메모리 부족 등으로 꺼졌을 때.
     * 그대로 두면 안드로이드가 앱 전체를 닫으므로, 화면만 새로 만듭니다 (위젯 자리·설정은 저장돼 있어 그대로 돌아옴).
     */
    private boolean rendererGone(String which, RenderProcessGoneDetail detail) {
        Log.w(TAG, which + " 화면 렌더러가 꺼짐 (crash=" + detail.didCrash() + ", priority=" + detail.rendererPriorityAtExit() + ") → 화면을 새로 만듭니다");
        if (selftest) Log.i("DESK_SELFTEST", "FAIL renderer gone " + which + " crash=" + detail.didCrash());
        pageProxy = null;
        if (!isFinishing() && !isDestroyed()) main.post(this::recreate);
        return true;
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
        push("resume"); // 창을 내렸다가 다시 띄웠을 때 등: 화면이 위젯 자리를 다시 맞추게
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
        try { rikka.shizuku.Shizuku.removeRequestPermissionResultListener(shizukuResult); } catch (Throwable ignored) { }
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
            } else if ("windows".equals(method)) { // 창정리: 셸 명령이라 시간이 걸려 따로
                final double reserve = a.optDouble(0, 0);
                io.execute(() -> reply(id, safe(() -> windows(reserve))));
            } else if ("arrange".equals(method)) {
                final JSONArray items = a.optJSONArray(0);
                final double reserve = a.optDouble(1, 0);
                io.execute(() -> reply(id, safe(() -> arrange(items == null ? new JSONArray() : items, reserve))));
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
                return launch(a.getString(0), a.getString(1), a.optString(2, "window"), a.optJSONArray(3), a.optDouble(4, 0));
            case "exitSplit":
                return exitSplit();
            case "shizuku":
                return shizukuState();
            case "shizukuConnect":
                return shizukuConnect();
            case "arrangeDiag":
                return lastArrange;
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
                return widgetSync(a.getJSONArray(0), a.getJSONArray(1), a.optDouble(2, 0), a.optBoolean(3, false), a.optBoolean(4, false),
                        a.optDouble(5, 0), a.optDouble(6, 0));
            case "widgetProbe":
                return widgetProbe();
            case "widgetDiag":
                return widgetDiag();
            case "quick":
                return quickState();
            case "setVolume": {
                AudioManager am = getSystemService(AudioManager.class);
                am.setStreamVolume(AudioManager.STREAM_MUSIC, Math.max(0, Math.min(a.getInt(0), am.getStreamMaxVolume(AudioManager.STREAM_MUSIC))), 0);
                return true;
            }
            case "setBrightness": {
                if (!Settings.System.canWrite(this)) return new JSONObject().put("need", "write");
                Settings.System.putInt(getContentResolver(), Settings.System.SCREEN_BRIGHTNESS_MODE, Settings.System.SCREEN_BRIGHTNESS_MODE_MANUAL);
                Settings.System.putInt(getContentResolver(), Settings.System.SCREEN_BRIGHTNESS, Math.max(1, Math.min(255, a.getInt(0))));
                return true;
            }
            case "torch": {
                String cam = torchCamera();
                if (cam == null) return new JSONObject().put("error", "손전등이 없는 기기입니다");
                getSystemService(CameraManager.class).setTorchMode(cam, a.getBoolean(0));
                torchOn = a.getBoolean(0);
                return true;
            }
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
     *  dpr, cssHeight: 화면의 CSS 픽셀 1개가 실제 몇 픽셀인지, 화면 높이(CSS 픽셀)
     * 돌려주는 값: {missing: [불러올 수 없는 위젯 번호], stale?: 이 뷰 크기와 화면이 아는 크기가 다름}
     *
     * 비율은 화면이 알려 준 값(dpr)을 씁니다. 예전처럼 "지금 뷰 너비 ÷ 화면 너비"로 계산하면, 화면 크기가 바뀌는
     * 도중(접기·펴기, 창 내리기·올리기)에 뷰 너비만 먼저 바뀐 순간 비율이 틀어져 위젯이 엉뚱한 자리(왼쪽 위 쪽)에 놓일 수 있습니다.
     */
    private JSONObject widgetSync(JSONArray layout, JSONArray blockers, double cssWidth, boolean blockAll, boolean dragging,
                                  double dpr, double cssHeight) throws JSONException {
        float density = getResources().getDisplayMetrics().density;
        float scale = dpr > 0 ? (float) dpr : web.getWidth() > 0 && cssWidth > 0 ? (float) (web.getWidth() / cssWidth) : density;
        String stale = null;
        if (dpr > 0 && cssWidth > 0 && web.getWidth() > 0) {
            float tol = (float) Math.ceil(dpr) + 2;
            if (Math.abs(web.getWidth() - cssWidth * dpr) > tol || (cssHeight > 0 && Math.abs(web.getHeight() - cssHeight * dpr) > tol)) {
                stale = Math.round(cssWidth * dpr) + "x" + Math.round(cssHeight * dpr);
            }
        }
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
                v = widgetHost.createView(widgetCtx, id, info);
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
                    if (android.os.Build.VERSION.SDK_INT >= 31) {
                        // 안드로이드 12+: 크기 목록으로 알려야 크기별 모양을 가진 위젯이 이 크기에 맞는 모양(아이콘 포함)을 고릅니다
                        v.updateAppWidgetSize(new Bundle(), Collections.singletonList(new SizeF(wd, hd)));
                    } else {
                        v.updateAppWidgetSize(null, wd, hd, wd, hd);
                    }
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
        JSONObject out = new JSONObject().put("missing", missing);
        if (stale != null) out.put("stale", stale).put("view", web.getWidth() + "x" + web.getHeight());
        return out;
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

    /**
     * 위젯 진단(사용자가 "위젯 자리 기록"에서 봄): 위젯마다 그림 칸(ImageView)이 몇 개이고, 그중 비었거나 투명하거나
     * 숨겨진 것이 몇 개인지. 아이콘이 안 보이는 위젯의 원인을 기기에서 찍어 보내 받기 위한 기록입니다.
     */
    private JSONArray widgetDiag() throws JSONException {
        JSONArray out = new JSONArray();
        boolean night = (getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES;
        for (Map.Entry<Integer, AppWidgetHostView> e : widgetViews.entrySet()) {
            AppWidgetHostView v = e.getValue();
            AppWidgetProviderInfo info = v.getAppWidgetInfo();
            int[] n = new int[5]; // 그림 칸, 빈 칸, 투명, 숨김, 글자 칸
            StringBuilder tints = new StringBuilder();
            StringBuilder texts = new StringBuilder();
            walkWidget(v, n, tints, texts);
            out.put(new JSONObject().put("id", e.getKey())
                    .put("app", info == null ? "?" : info.provider.getPackageName())
                    .put("label", info == null ? "?" : String.valueOf(info.loadLabel(getPackageManager())))
                    .put("size", v.getWidth() + "x" + v.getHeight())
                    .put("night", night)
                    .put("images", n[0]).put("empty", n[1]).put("clear", n[2]).put("hidden", n[3]).put("texts", n[4])
                    .put("tints", tints.toString())
                    .put("sample", texts.length() > 80 ? texts.substring(0, 80) : texts.toString()));
        }
        return out;
    }

    private void walkWidget(View view, int[] n, StringBuilder tints, StringBuilder texts) {
        if (view instanceof ImageView) {
            ImageView iv = (ImageView) view;
            Drawable d = iv.getDrawable();
            n[0]++;
            if (d == null || (d.getIntrinsicWidth() == 0 && d.getIntrinsicHeight() == 0)) n[1]++;
            else if (d.getAlpha() == 0 || iv.getImageAlpha() == 0 || iv.getAlpha() == 0f) n[2]++;
            if (iv.getVisibility() != View.VISIBLE) n[3]++;
            ColorStateList t = iv.getImageTintList();
            if (t != null && tints.length() < 60) tints.append(String.format(Locale.ROOT, "#%08X ", t.getDefaultColor()));
        } else if (view instanceof TextView) {
            n[4]++;
            CharSequence c = ((TextView) view).getText();
            if (c != null && c.length() > 0 && texts.length() < 80) texts.append(c).append(" / ");
        }
        if (view instanceof ViewGroup) {
            ViewGroup g = (ViewGroup) view;
            for (int i = 0; i < g.getChildCount(); i++) walkWidget(g.getChildAt(i), n, tints, texts);
        }
    }

    // ---------- 배경 층 ----------
    private void applyWallLook() {
        if (wallReady && wallLook != null) wallWeb.evaluateJavascript(wallLook, null);
    }

    // ---------- 내 사진 배경 ----------
    private File wallpaperFile() {
        return new File(getFilesDir(), "wallpaper.jpg");
    }

    /** 안드로이드 8: ImageDecoder가 없어 크기를 먼저 재고 줄여서 읽음 */
    private Bitmap decodeOld(Uri uri) throws java.io.IOException {
        android.graphics.BitmapFactory.Options o = new android.graphics.BitmapFactory.Options();
        o.inJustDecodeBounds = true;
        try (java.io.InputStream in = getContentResolver().openInputStream(uri)) { android.graphics.BitmapFactory.decodeStream(in, null, o); }
        int longSide = Math.max(o.outWidth, o.outHeight), sample = 1;
        while (longSide / sample > 2600) sample *= 2;
        android.graphics.BitmapFactory.Options d = new android.graphics.BitmapFactory.Options();
        d.inSampleSize = sample;
        try (java.io.InputStream in = getContentResolver().openInputStream(uri)) {
            Bitmap b = android.graphics.BitmapFactory.decodeStream(in, null, d);
            if (b == null) throw new java.io.IOException("사진을 읽지 못함");
            return b;
        }
    }

    private void onWallpaperPicked(Uri uri) {
        if (uri == null) return; // 고르지 않고 닫음
        io.execute(() -> {
            try {
                // 화면보다 지나치게 큰 사진은 줄여서 저장 (긴 쪽 2600px 이하). 사진의 회전 정보는 자동 반영됩니다.
                Bitmap b = Compat.SDK >= 28 ? ImageDecoder.decodeBitmap(ImageDecoder.createSource(getContentResolver(), uri), (decoder, info, src) -> {
                    decoder.setAllocator(ImageDecoder.ALLOCATOR_SOFTWARE);
                    int longSide = Math.max(info.getSize().getWidth(), info.getSize().getHeight());
                    int sample = 1;
                    while (longSide / sample > 2600) sample *= 2;
                    decoder.setTargetSampleSize(sample);
                }) : decodeOld(uri);
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

    /**
     * mode: window(자유 창) · left · right(반쪽 창) · full(전체 화면) · zone(화면 나누기 자리)
     * zone: [왼, 위, 오른, 아래] 비율(0~1) — 작업 표시줄 위 넓이 안에서. reserveCss: 아래에 비워 둘 높이(CSS 픽셀, 작업 표시줄)
     */
    private JSONObject launch(String pkg, String cls, String mode, JSONArray zone, double reserveCss) throws JSONException {
        zoneArg = zone;
        reserveArg = reserveCss;
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
                if (Compat.display(MainActivity.this) != null) o.setLaunchDisplayId(Compat.display(MainActivity.this).getDisplayId());
                opts = o.toBundle();
                // DeX는 이미 모든 창이 자유 창 — 창 방식까지 지정하면 자리 요청을 무시하는 경우가 있어 DeX에서는 자리만 줌
                if (!dexOn()) opts.putInt(KEY_WINDOWING_MODE, 5);
                r.put("bounds", b.flattenToString()).put("dex", dexOn());
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

    private JSONArray zoneArg;
    private double reserveArg;

    private Rect boundsFor(String mode) {
        Rect screen = Compat.maxBounds(MainActivity.this);
        float dp = getResources().getDisplayMetrics().density;
        int top = root.getPaddingTop(), bottom = root.getPaddingBottom();
        int bar = reserveArg > 0 ? (int) Math.round(reserveArg * dp) : Math.round(64 * dp); // 작업 표시줄 자리는 비워 둠
        int W = screen.width(), H = screen.height();
        int usableTop = top, usableBottom = H - bottom - bar;
        if ("zone".equals(mode) && zoneArg != null && zoneArg.length() == 4) {
            int[] u = arrangeArea(reserveArg); // [왼, 위, 오른, 아래] — 화면 전체 기준(DeX에서 데스크가 창이어도)
            int uw = u[2] - u[0], uh = u[3] - u[1];
            return new Rect(u[0] + (int) Math.round(uw * zoneArg.optDouble(0)), u[1] + (int) Math.round(uh * zoneArg.optDouble(1)),
                    u[0] + (int) Math.round(uw * zoneArg.optDouble(2)), u[1] + (int) Math.round(uh * zoneArg.optDouble(3)));
        }
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

    // ---------- 창정리: 배치 펼치기 · 열린 창 옮기기 (고급 기능 Shizuku) ----------

    private JSONObject shizukuState() throws JSONException {
        return new JSONObject().put("installed", Shizu.installed(this)).put("running", Shizu.running()).put("granted", Shizu.granted());
    }

    /** 단계별로: 설치 안 됨 → 받으러 가기, 꺼져 있음 → Shizuku 열기, 켜져 있음 → 허락 요청 */
    private String shizukuConnect() {
        if (!Shizu.installed(this)) {
            startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(Shizu.DOWNLOAD)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
            return "install";
        }
        if (!Shizu.running()) {
            Intent i = getPackageManager().getLaunchIntentForPackage(Shizu.PKG);
            if (i != null) startActivity(i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
            return "start";
        }
        if (!Shizu.granted()) { Shizu.request(REQ_SHIZUKU); return "request"; }
        return "ok";
    }

    /** 창 자리 계산에 쓰는 넓이: 화면 너비 W, 쓸 수 있는 위·아래(작업 표시줄 자리는 뺌) */
    /** 데스크가 화면 전체(바탕화면)가 아니라 창으로 떠 있나 — DeX에서 앱으로 열었을 때 */
    private boolean deskWindowed() {
        Configuration c = getResources().getConfiguration();
        if (c.toString().contains("mWindowingMode=freeform")) return true;
        Rect mine = Compat.curBounds(MainActivity.this), max = Compat.maxBounds(MainActivity.this);
        return mine.width() < max.width() - 8 || mine.height() < max.height() - 8;
    }

    /** 삼성 DeX가 켜져 있나 (삼성 기기의 Configuration.semDesktopModeEnabled) */
    private boolean dexOn() {
        try {
            Configuration c = getResources().getConfiguration();
            java.lang.reflect.Field f = c.getClass().getField("semDesktopModeEnabled"), on = c.getClass().getField("SEM_DESKTOP_MODE_ENABLED");
            return f.getInt(c) == on.getInt(c);
        } catch (Throwable t) { return false; }
    }

    /**
     * 창정리 자리 계산 넓이 [왼, 위, 오른, 아래] (화면 픽셀).
     * 화면 전체에서 시스템 막대(상태 표시줄 · DeX 작업 표시줄 · 내비게이션)를 뺀 곳.
     * 데스크가 바탕화면으로 화면 전체를 쓰면 데스크 작업 표시줄 자리도 뺍니다.
     */
    /** 화면 가장자리 시스템 막대 두께 {왼, 위, 오, 아래} — 안드로이드 11+는 숨겨져 있어도 포함 */
    private int[] barsOf() {
        if (Compat.SDK >= 30) {
            android.graphics.Insets in = getWindowManager().getMaximumWindowMetrics().getWindowInsets().getInsetsIgnoringVisibility(
                    android.view.WindowInsets.Type.systemBars() | android.view.WindowInsets.Type.displayCutout());
            return new int[]{in.left, in.top, in.right, in.bottom};
        }
        android.view.WindowInsets wi = getWindow().getDecorView().getRootWindowInsets();
        return wi == null ? new int[4] : Compat.bars(wi);
    }

    private int[] arrangeArea(double reserveCss) {
        Rect s = Compat.maxBounds(MainActivity.this);
        int[] in = barsOf();
        int l = s.left + in[0], t = s.top + in[1], r = s.right - in[2], b = s.bottom - in[3];
        if (!deskWindowed()) {
            float dp = getResources().getDisplayMetrics().density;
            b -= reserveCss > 0 ? (int) Math.round(reserveCss * dp) : Math.round(64 * dp);
            t = Math.max(t, root.getPaddingTop());
        }
        return new int[]{l, t, r, Math.max(t + 100, b)};
    }

    private int[] usable(double reserveCss) {
        int[] a = arrangeArea(reserveCss);
        return new int[]{a[2] - a[0], a[1], a[3], a[0]};
    }

    private static final java.util.Set<String> NOT_WINDOWS = new java.util.HashSet<>(java.util.Arrays.asList(
            "com.android.systemui", "com.sec.android.app.desktoplauncher", "com.sec.android.app.launcher",
            "com.google.android.apps.nexuslauncher", "com.android.launcher3", "com.samsung.android.app.taskedge"));
    private String lastTaskSource = "";

    /** 이 화면에 열린 다른 앱의 창: 위에 있는 것부터. Shizuku가 없으면 null */
    private JSONArray openTasks() throws JSONException {
        if (!Shizu.granted()) return null;
        java.util.List<TaskParser.T> all = TaskParser.stackList(Shizu.run("am stack list", 2500));
        lastTaskSource = "stack";
        if (all.isEmpty()) { all = TaskParser.dumpsys(Shizu.run("dumpsys activity activities", 4000)); lastTaskSource = "dumpsys"; }
        int myDisplay = Compat.display(MainActivity.this) != null ? Compat.display(MainActivity.this).getDisplayId() : 0;
        boolean anyHere = false;
        for (TaskParser.T t : all) if (t.display == myDisplay) { anyHere = true; break; }
        JSONArray list = new JSONArray();
        java.util.Set<String> seen = new java.util.HashSet<>();
        for (TaskParser.T t : all) {
            boolean here = anyHere ? t.display == myDisplay : (dexOn() && t.display != 0);
            if (!here || t.pkg.equals(getPackageName()) || NOT_WINDOWS.contains(t.pkg) || seen.contains(t.pkg)) continue;
            seen.add(t.pkg);
            list.put(new JSONObject().put("task", t.task).put("pkg", t.pkg).put("cls", t.cls).put("display", t.display)
                    .put("b", new JSONArray().put(t.l).put(t.t).put(t.r).put(t.b)).put("visible", t.visible));
        }
        return list;
    }

    /** 지금 열린 창과 자리 (창정리의 "지금 배치 저장"용). 자리는 작업 표시줄 위 넓이 기준 비율 */
    private JSONObject windows(double reserveCss) throws JSONException {
        JSONObject r = new JSONObject().put("shizuku", Shizu.granted());
        JSONArray tasks = openTasks();
        if (tasks == null) return r.put("list", new JSONArray());
        int[] u = usable(reserveCss);
        double uh = Math.max(1, u[2] - u[1]);
        JSONArray list = new JSONArray();
        for (int i = 0; i < tasks.length(); i++) {
            JSONObject t = tasks.getJSONObject(i);
            if (!t.optBoolean("visible")) continue;
            JSONArray b = t.getJSONArray("b");
            double l = (b.getInt(0) - u[3]) / (double) u[0], top = (b.getInt(1) - u[1]) / uh, rr = (b.getInt(2) - u[3]) / (double) u[0], bot = (b.getInt(3) - u[1]) / uh;
            if (rr - l < 0.05 || bot - top < 0.05) continue; // 접힌 창·작은 팝업은 빼기
            t.put("zone", new JSONArray().put(clamp01(l)).put(clamp01(top)).put(clamp01(rr)).put(clamp01(bot)));
            list.put(t);
        }
        return r.put("list", list);
    }

    private static double clamp01(double v) { return Math.round(Math.max(0, Math.min(1, v)) * 1000) / 1000.0; }

    /**
     * 배치 펼치기: items = [{pkg, cls, zone:[왼,위,오른,아래 비율]}]
     * 안 열린 앱은 그 자리로 열고, 이미 열린 앱은 Shizuku가 있으면 앞으로 불러 그 자리로 옮깁니다.
     */
    private JSONObject lastArrange = new JSONObject();

    /** 그 창이 원하는 자리(±12px)에 있나 */
    private boolean placed(int task, Rect want) throws JSONException {
        JSONArray now = openTasks();
        if (now == null) return false;
        for (int i = 0; i < now.length(); i++) {
            JSONObject t = now.getJSONObject(i);
            if (t.getInt("task") != task) continue;
            JSONArray b = t.getJSONArray("b");
            return Math.abs(b.getInt(0) - want.left) <= 12 && Math.abs(b.getInt(1) - want.top) <= 12 && Math.abs(b.getInt(2) - want.right) <= 12 && Math.abs(b.getInt(3) - want.bottom) <= 12;
        }
        return false;
    }

    private JSONObject arrange(JSONArray items, double reserveCss) throws Exception {
        JSONObject diag = new JSONObject();
        int[] area = arrangeArea(reserveCss);
        Rect max = Compat.maxBounds(MainActivity.this), cur = Compat.curBounds(MainActivity.this);
        diag.put("time", System.currentTimeMillis()).put("display", Compat.display(MainActivity.this) != null ? Compat.display(MainActivity.this).getDisplayId() + " " + Compat.display(MainActivity.this).getName() : "?")
                .put("dex", dexOn()).put("deskWindowed", deskWindowed()).put("freeform", freeformSupported()).put("shizuku", Shizu.granted())
                .put("screen", max.flattenToString()).put("desk", cur.flattenToString())
                .put("area", area[0] + "," + area[1] + " - " + area[2] + "," + area[3]).put("reserveCss", reserveCss);
        JSONArray diagItems = new JSONArray();
        JSONArray before = openTasks();
        java.util.Map<String, Integer> open = new HashMap<>();
        if (before != null) for (int i = 0; i < before.length(); i++) open.put(before.getJSONObject(i).getString("pkg"), before.getJSONObject(i).getInt("task"));
        JSONArray results = new JSONArray();
        for (int i = 0; i < items.length(); i++) {
            JSONObject it = items.getJSONObject(i);
            String pkg = it.getString("pkg"), cls = it.getString("cls");
            JSONArray zone = it.getJSONArray("zone");
            JSONObject res = new JSONObject().put("pkg", pkg);
            // 1) 그 자리로 열기 (이미 열린 앱이면 앞으로만 나옴)
            java.util.concurrent.CountDownLatch done = new java.util.concurrent.CountDownLatch(1);
            final Rect[] want = new Rect[1];
            main.post(() -> {
                try {
                    zoneArg = zone; reserveArg = reserveCss;
                    want[0] = boundsFor("zone");
                    Intent front = open.containsKey(pkg) ? getPackageManager().getLaunchIntentForPackage(pkg) : null;
                    if (front != null) startActivity(front.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); // 이미 열린 창: 앞으로만
                    else {
                        try { launch(pkg, cls, "zone", zone, reserveCss); }
                        catch (RuntimeException e) { // 저장된 클래스가 바로 열 수 없는 화면이면 앱의 첫 화면으로
                            Intent li = getPackageManager().getLaunchIntentForPackage(pkg);
                            if (li != null) launch(pkg, li.getComponent().getClassName(), "zone", zone, reserveCss); else throw e;
                        }
                    }
                } catch (Exception e) { Log.w(TAG, "배치 펼치기: 열지 못함 " + pkg, e); }
                done.countDown();
            });
            done.await(3, java.util.concurrent.TimeUnit.SECONDS);
            Integer task = open.get(pkg);
            if (task == null && Shizu.granted()) { // 새로 연 창: 앱이 자리를 무시했을 수 있어 확인 후 맞춤
                Thread.sleep(700);
                JSONArray now = openTasks();
                if (now != null) for (int k = 0; k < now.length(); k++) if (now.getJSONObject(k).getString("pkg").equals(pkg)) { task = now.getJSONObject(k).getInt("task"); break; }
                res.put("how", "opened");
            } else if (task == null) {
                res.put("how", "opened");
            } else {
                Thread.sleep(250);
            }
            // 2) 자리 옮기기 (Shizuku)
            if (task != null && want[0] != null && Shizu.granted()) {
                Rect b = want[0];
                String cmd = "am task resize " + task + " " + b.left + " " + b.top + " " + b.right + " " + b.bottom;
                String out = Shizu.run(cmd, 2500);
                boolean ok = out != null && !out.toLowerCase(java.util.Locale.ROOT).contains("error") && !out.contains("Exception");
                if (ok) { // 정말 옮겨졌는지 확인하고, 아니면 잠깐 뒤 한 번 더
                    Thread.sleep(250);
                    if (!placed(task, b)) { Thread.sleep(400); out = Shizu.run(cmd, 2500); Thread.sleep(250); ok = placed(task, b); }
                }
                if (open.containsKey(pkg)) res.put("how", ok ? "moved" : "stuck");
                if (!ok) res.put("detail", out == null ? "" : out.length() > 160 ? out.substring(0, 160) : out);
            } else if (open.isEmpty() && !Shizu.granted()) {
                res.put("maybeStuck", true); // 이미 열려 있던 앱이면 자리가 안 바뀌었을 수 있음
            }
            res.put("want", want[0] == null ? "" : want[0].flattenToString()).put("wasOpen", open.containsKey(pkg));
            results.put(res);
            Thread.sleep(220);
        }
        // 실제로 놓인 자리 (Shizuku가 있을 때만 읽을 수 있음)
        Thread.sleep(600);
        JSONArray after = openTasks();
        for (int i = 0; i < results.length(); i++) {
            JSONObject res = results.getJSONObject(i);
            String got = "";
            if (after != null) for (int k = 0; k < after.length(); k++) {
                JSONObject t = after.getJSONObject(k);
                if (t.getString("pkg").equals(res.getString("pkg"))) { JSONArray b = t.getJSONArray("b"); got = b.getInt(0) + " " + b.getInt(1) + " " + b.getInt(2) + " " + b.getInt(3); break; }
            }
            res.put("got", got);
            diagItems.put(res);
        }
        diag.put("items", diagItems);
        diag.put("source", lastTaskSource);
        if (Shizu.granted()) diag.put("stack", String.valueOf(Shizu.run("am stack list | grep -E 'RootTask|taskId=' | head -24", 2500)));
        lastArrange = diag;
        return new JSONObject().put("ok", true).put("shizuku", Shizu.granted()).put("results", results);
    }

    // ---------- 화면 나누기(분할 화면) 막기 ----------
    // 덜누름 데스크는 바탕화면이라 화면 나누기 안에서 쓰지 않습니다(안에서 다른 앱을 나눠 띄움).
    // 큰 화면에서는 안드로이드가 앱 설정만으로 막을 수 없게 해 두어, 들어가면 알아채서 화면에 안내를 띄웁니다.
    private boolean inSplit() {
        if (!isInMultiWindowMode()) return false;
        String c = getResources().getConfiguration().toString();
        if (c.contains("mWindowingMode=freeform")) return false; // DeX 창·팝업 창은 괜찮음
        return c.contains("mWindowingMode=multi-window") || c.contains("mWindowingMode=split-screen") || !c.contains("mWindowingMode=");
    }

    @Override
    public void onMultiWindowModeChanged(boolean isInMultiWindowMode, @NonNull Configuration newConfig) {
        super.onMultiWindowModeChanged(isInMultiWindowMode, newConfig);
        push("status");
    }

    /** 화면 나누기에서 빠져나와 전체 화면으로 다시 띄우기 */
    private boolean exitSplit() {
        try {
            ActivityOptions o = ActivityOptions.makeBasic();
            Bundle b = o.toBundle();
            b.putInt(KEY_WINDOWING_MODE, 1);
            startActivity(new Intent(this, getClass()).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT), b);
        } catch (RuntimeException e) {
            Log.w(TAG, "전체 화면으로 다시 띄우지 못함", e);
        }
        if (isDefaultHome()) { // 기본 홈이면 홈으로 가면 전체 화면 바탕화면이 나옴
            try {
                startActivity(new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
            } catch (RuntimeException ignored) {
            }
        }
        return true;
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
        r.put("dex", dexOn());
        r.put("split", inSplit());
        r.put("isDefault", isDefaultHome());
        File wp = wallpaperFile();
        r.put("wallpaper", wp.exists() ? wp.lastModified() : 0); // 내 사진 배경이 있으면 바뀐 시각(화면이 새 사진을 다시 읽게)
        r.put("version", BuildConfig.VERSION_NAME);
        r.put("pkg", getPackageName());
        return r;
    }

    private boolean isDefaultHome() {
        if (Compat.SDK < 29) { // 안드로이드 8 · 9: 기본 홈 앱을 직접 확인
            android.content.pm.ResolveInfo ri = getPackageManager().resolveActivity(new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME), android.content.pm.PackageManager.MATCH_DEFAULT_ONLY);
            return ri != null && ri.activityInfo != null && getPackageName().equals(ri.activityInfo.packageName);
        }
        RoleManager rm = getSystemService(RoleManager.class);
        return rm != null && rm.isRoleAvailable(RoleManager.ROLE_HOME) && rm.isRoleHeld(RoleManager.ROLE_HOME);
    }

    @SuppressWarnings("deprecation")
    private boolean makeDefault() {
        if (Compat.SDK >= 29) try {
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

    // ---------- 빠른 설정 ----------
    private volatile boolean torchOn;
    private String torchId;
    private boolean torchListening;

    private String torchCamera() {
        if (torchId != null) return torchId;
        try {
            CameraManager cm = getSystemService(CameraManager.class);
            for (String id : cm.getCameraIdList()) {
                Boolean flash = cm.getCameraCharacteristics(id).get(CameraCharacteristics.FLASH_INFO_AVAILABLE);
                if (Boolean.TRUE.equals(flash)) {
                    torchId = id;
                    if (!torchListening) {
                        torchListening = true;
                        cm.registerTorchCallback(new CameraManager.TorchCallback() {
                            @Override
                            public void onTorchModeChanged(@NonNull String cameraId, boolean enabled) {
                                if (cameraId.equals(torchId)) torchOn = enabled;
                            }
                        }, main);
                    }
                    return id;
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "손전등 찾기 실패", e);
        }
        return null;
    }

    /** 빠른 설정에 보여 줄 상태: 음량·밝기·비행기 모드·절전·손전등 */
    private JSONObject quickState() throws JSONException {
        JSONObject r = new JSONObject();
        AudioManager am = getSystemService(AudioManager.class);
        r.put("vol", am.getStreamVolume(AudioManager.STREAM_MUSIC)).put("volMax", am.getStreamMaxVolume(AudioManager.STREAM_MUSIC));
        try {
            r.put("bright", Settings.System.getInt(getContentResolver(), Settings.System.SCREEN_BRIGHTNESS));
        } catch (Settings.SettingNotFoundException e) {
            r.put("bright", 128);
        }
        r.put("canWrite", Settings.System.canWrite(this));
        r.put("airplane", Settings.Global.getInt(getContentResolver(), Settings.Global.AIRPLANE_MODE_ON, 0) != 0);
        PowerManager pm = getSystemService(PowerManager.class);
        r.put("saver", pm != null && pm.isPowerSaveMode());
        r.put("hasTorch", torchCamera() != null).put("torch", torchOn);
        return r;
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
            case "internet": action = Settings.Panel.ACTION_INTERNET_CONNECTIVITY; break;   // 화면 아래에 뜨는 인터넷 패널
            case "volume": action = Settings.Panel.ACTION_VOLUME; break;
            case "airplane": action = Settings.ACTION_AIRPLANE_MODE_SETTINGS; break;
            case "saver": action = Settings.ACTION_BATTERY_SAVER_SETTINGS; break;
            case "accessibility": action = Settings.ACTION_ACCESSIBILITY_SETTINGS; break;
            case "notifications": action = Settings.ACTION_APP_NOTIFICATION_SETTINGS; break;
            case "write": // 밝기를 바꾸려면 "시스템 설정 변경" 허용이 필요
                startActivity(new Intent(Settings.ACTION_MANAGE_WRITE_SETTINGS, Uri.parse("package:" + getPackageName())).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
                return true;
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
