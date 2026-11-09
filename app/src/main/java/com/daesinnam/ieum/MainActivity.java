package com.daesinnam.ieum;

import android.annotation.SuppressLint;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.res.AssetManager;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Base64;
import android.view.ViewGroup;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;

import androidx.activity.ComponentActivity;
import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResultLauncher;
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
import java.io.FileNotFoundException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * 이음오피스 안드로이드판: 데스크톱판의 편집기 화면(웹)을 WebView로 띄우고,
 * Electron 메인 프로세스가 하던 파일 열기·저장을 여기서 대신합니다.
 *
 *  https://appassets.androidplatform.net/assets/www/...  앱에 넣은 편집기 화면
 *  https://appassets.androidplatform.net/doc/<id>         사용자가 연 문서 (읽기)
 *  https://ieum-preview.local/view/                       HTML 편집기의 미리보기 (앱 브리지와 분리된 출처)
 *
 * 웹 ↔ 앱 통신은 addWebMessageListener로, 앱 화면 출처에만 IeumAndroid 객체를 넣어 줍니다.
 */
public class MainActivity extends ComponentActivity {
    private static final String APP_ORIGIN = "https://appassets.androidplatform.net";
    private static final String HOME_URL = APP_ORIGIN + "/assets/www/home/index.html";
    private static final String PREVIEW_HOST = "ieum-preview.local";

    private static final String[] OPEN_TYPES = {
            "application/pdf", "application/x-hwp", "application/haansofthwp", "application/vnd.hancom.hwp",
            "application/hwp+zip", "application/haansofthwpx", "application/vnd.hancom.hwpx",
            "text/markdown", "text/x-markdown", "text/html", "text/plain", "application/octet-stream",
    };

    private WebView web;
    private DocStore docs;
    private final ExecutorService io = Executors.newSingleThreadExecutor();
    private final Handler main = new Handler(Looper.getMainLooper());
    private volatile String previewHtml = "<!doctype html><meta charset=utf-8>";

    // 파일 고르기·만들기는 화면이 바뀌므로 응답할 곳을 잠시 기억해 둡니다.
    private JavaScriptReplyProxy pendingProxy;
    private int pendingId;
    private ValueCallback<Uri[]> fileChooserCallback;

    private final ActivityResultLauncher<String[]> openDocument =
            registerForActivityResult(new ActivityResultContracts.OpenDocument(), this::onPicked);

    private final ActivityResultLauncher<Intent> createDocument =
            registerForActivityResult(new ActivityResultContracts.StartActivityForResult(), result -> {
                Uri uri = result.getData() == null ? null : result.getData().getData();
                onPicked(result.getResultCode() == RESULT_OK ? uri : null);
            });

    private final ActivityResultLauncher<Intent> fileChooser =
            registerForActivityResult(new ActivityResultContracts.StartActivityForResult(), result -> {
                if (fileChooserCallback == null) return;
                fileChooserCallback.onReceiveValue(
                        WebChromeClient.FileChooserParams.parseResult(result.getResultCode(), result.getData()));
                fileChooserCallback = null;
            });

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        docs = new DocStore(this);

        FrameLayout root = new FrameLayout(this);
        web = new WebView(this);
        root.addView(web, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        setContentView(root);
        ViewCompat.setOnApplyWindowInsetsListener(root, (v, insets) -> {
            Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars()
                    | WindowInsetsCompat.Type.displayCutout() | WindowInsetsCompat.Type.ime());
            v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            return WindowInsetsCompat.CONSUMED;
        });

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setSupportZoom(false);
        s.setTextZoom(100);
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(true);

        WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", this::serveAsset)
                .addPathHandler("/doc/", this::serveDoc)
                .build();

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                if (PREVIEW_HOST.equals(url.getHost())) {
                    return new WebResourceResponse("text/html", "utf-8", 200, "OK", noCache(),
                            new ByteArrayInputStream(previewHtml.getBytes(StandardCharsets.UTF_8)));
                }
                WebResourceResponse r = loader.shouldInterceptRequest(url);
                if (r == null && "appassets.androidplatform.net".equals(url.getHost())) return notFound();
                return r;
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                String host = url.getHost();
                if ("appassets.androidplatform.net".equals(host) || PREVIEW_HOST.equals(host)) return false;
                String scheme = url.getScheme();
                if (request.isForMainFrame() || request.hasGesture()) {
                    if ("http".equals(scheme) || "https".equals(scheme) || "mailto".equals(scheme)) {
                        try {
                            startActivity(new Intent(Intent.ACTION_VIEW, url));
                        } catch (ActivityNotFoundException ignored) {
                        }
                    }
                }
                return true; // 앱 밖 주소는 WebView 안에서 열지 않습니다
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileChooserCallback != null) fileChooserCallback.onReceiveValue(null);
                fileChooserCallback = callback;
                try {
                    fileChooser.launch(params.createIntent());
                    return true;
                } catch (ActivityNotFoundException e) {
                    fileChooserCallback = null;
                    return false;
                }
            }
        });

        if (WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
            WebViewCompat.addWebMessageListener(web, "IeumAndroid",
                    Collections.singleton(APP_ORIGIN), this::onWebMessage);
        } else {
            Toast.makeText(this, "Android System WebView를 업데이트해 주세요 (파일 열기·저장에 필요)", Toast.LENGTH_LONG).show();
        }

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                String url = web.getUrl();
                if (url != null && url.contains("/assets/www/modules/")) {
                    web.evaluateJavascript("(window.__ieumIsDirty && window.__ieumIsDirty()) || false",
                            v -> goHome("true".equals(v)));
                } else {
                    finish();
                }
            }
        });

        if (!handleIntent(getIntent())) web.loadUrl(HOME_URL);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIntent(intent);
    }

    @Override
    protected void onDestroy() {
        io.shutdown();
        if (web != null) web.destroy();
        super.onDestroy();
    }

    // ---------- 다른 앱에서 연 파일 ----------

    private boolean handleIntent(Intent intent) {
        if (intent == null) return false;
        Uri uri = null;
        String action = intent.getAction();
        if (Intent.ACTION_VIEW.equals(action) || Intent.ACTION_EDIT.equals(action)) {
            uri = intent.getData();
        } else if (Intent.ACTION_SEND.equals(action)) {
            uri = intent.getParcelableExtra(Intent.EXTRA_STREAM);
        }
        if (uri == null) return false;
        boolean persistable = (intent.getFlags() & Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION) != 0;
        String id = docs.add(uri, persistable);
        String name = docs.displayName(id);
        web.loadUrl(HOME_URL + "?open=" + enc(id) + "&name=" + enc(name));
        return true;
    }

    private void goHome(boolean dirty) {
        if (!dirty) {
            web.loadUrl(HOME_URL);
            return;
        }
        new AlertDialog.Builder(this)
                .setMessage("저장하지 않은 변경 내용이 있습니다. 저장하지 않고 나갈까요?")
                .setPositiveButton("나가기", (d, w) -> web.loadUrl(HOME_URL))
                .setNeutralButton("저장", (d, w) -> web.evaluateJavascript("window.__ieumSave && window.__ieumSave('save')", null))
                .setNegativeButton("취소", null)
                .show();
    }

    // ---------- 웹 → 앱 메시지 ----------

    private void onWebMessage(@NonNull WebView view, @NonNull WebMessageCompat message, @NonNull Uri origin,
                              boolean isMainFrame, @NonNull JavaScriptReplyProxy proxy) {
        if (!isMainFrame || message.getData() == null) return;
        int id;
        String method;
        JSONArray args;
        try {
            JSONObject m = new JSONObject(message.getData());
            id = m.optInt("id", 0);
            method = m.getString("method");
            args = m.optJSONArray("args");
            if (args == null) args = new JSONArray();
        } catch (JSONException e) {
            return;
        }
        final JSONArray a = args;
        switch (method) {
            case "pickDocument":
                if (!startPending(proxy, id)) return;
                openDocument.launch(OPEN_TYPES);
                break;
            case "createDocument": {
                if (!startPending(proxy, id)) return;
                Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT)
                        .addCategory(Intent.CATEGORY_OPENABLE)
                        .setType(a.optString(1, "application/octet-stream"))
                        .putExtra(Intent.EXTRA_TITLE, a.optString(0, "새 문서"));
                createDocument.launch(i);
                break;
            }
            case "writeText":
                io.execute(() -> reply(proxy, id, write(a.optString(0), a.optString(1).getBytes(StandardCharsets.UTF_8))));
                break;
            case "writeBase64":
                io.execute(() -> {
                    byte[] bytes;
                    try {
                        bytes = Base64.decode(a.optString(1), Base64.DEFAULT);
                    } catch (IllegalArgumentException e) {
                        reply(proxy, id, fail("잘못된 데이터"));
                        return;
                    }
                    reply(proxy, id, write(a.optString(0), bytes));
                });
                break;
            case "hasDocument":
                io.execute(() -> reply(proxy, id, canRead(a.optString(0)) ? ok() : fail("접근 불가")));
                break;
            case "forget":
                docs.forget(a.optString(0));
                break;
            case "goHome":
                goHome(a.optBoolean(0, false));
                break;
            case "setPreview":
                previewHtml = a.optString(0, "");
                break;
            default:
                reply(proxy, id, fail("지원하지 않는 요청: " + method));
        }
    }

    private boolean startPending(JavaScriptReplyProxy proxy, int id) {
        if (pendingProxy != null) {
            reply(proxy, id, fail("다른 파일 선택이 진행 중입니다"));
            return false;
        }
        pendingProxy = proxy;
        pendingId = id;
        return true;
    }

    private void onPicked(Uri uri) {
        JavaScriptReplyProxy proxy = pendingProxy;
        int id = pendingId;
        pendingProxy = null;
        if (proxy == null) return;
        if (uri == null) {
            JSONObject canceled = ok();
            try {
                canceled.put("canceled", true);
            } catch (JSONException ignored) {
            }
            reply(proxy, id, canceled);
            return;
        }
        String docId = docs.add(uri, true);
        JSONObject r = ok();
        try {
            r.put("id", docId);
            r.put("name", docs.displayName(docId));
        } catch (JSONException ignored) {
        }
        reply(proxy, id, r);
    }

    private JSONObject write(String docId, byte[] bytes) {
        Uri uri = docs.get(docId);
        if (uri == null) return fail("알 수 없는 문서");
        try (OutputStream out = getContentResolver().openOutputStream(uri, "wt")) {
            if (out == null) return fail("파일을 쓸 수 없습니다");
            out.write(bytes);
            out.flush();
            return ok();
        } catch (SecurityException | FileNotFoundException e) {
            return fail("이 파일에는 쓸 권한이 없습니다");
        } catch (Exception e) {
            // 일부 저장소는 "wt"를 모릅니다 → "w"로 다시 시도
            try (OutputStream out = getContentResolver().openOutputStream(uri, "w")) {
                if (out == null) return fail("파일을 쓸 수 없습니다");
                out.write(bytes);
                return ok();
            } catch (Exception e2) {
                return fail("저장 실패: " + e2.getMessage());
            }
        }
    }

    private boolean canRead(String docId) {
        Uri uri = docs.get(docId);
        if (uri == null) return false;
        try (InputStream in = getContentResolver().openInputStream(uri)) {
            return in != null;
        } catch (Exception e) {
            return false;
        }
    }

    private void reply(JavaScriptReplyProxy proxy, int id, JSONObject result) {
        if (id == 0) return;
        JSONObject msg = new JSONObject();
        try {
            msg.put("id", id);
            msg.put("result", result);
        } catch (JSONException ignored) {
        }
        String text = msg.toString();
        if (Looper.myLooper() == Looper.getMainLooper()) proxy.postMessage(text);
        else main.post(() -> proxy.postMessage(text));
    }

    private static JSONObject ok() {
        JSONObject o = new JSONObject();
        try {
            o.put("ok", true);
        } catch (JSONException ignored) {
        }
        return o;
    }

    private static JSONObject fail(String error) {
        JSONObject o = new JSONObject();
        try {
            o.put("ok", false);
            o.put("error", error);
        } catch (JSONException ignored) {
        }
        return o;
    }

    // ---------- 응답 만들기 ----------

    private WebResourceResponse serveAsset(@NonNull String path) {
        if (path.contains("..")) return notFound();
        AssetManager am = getAssets();
        try {
            InputStream in = am.open(path, AssetManager.ACCESS_STREAMING);
            String mime = mimeOf(path);
            String enc = mime.startsWith("text/") || mime.endsWith("javascript") || mime.endsWith("json") ? "utf-8" : null;
            return new WebResourceResponse(mime, enc, 200, "OK", Collections.emptyMap(), in);
        } catch (Exception e) {
            return notFound();
        }
    }

    private WebResourceResponse serveDoc(@NonNull String path) {
        Uri uri = docs.get(Uri.decode(path));
        if (uri == null) return notFound();
        try {
            InputStream in = getContentResolver().openInputStream(uri);
            if (in == null) return notFound();
            return new WebResourceResponse("application/octet-stream", null, 200, "OK", noCache(), in);
        } catch (Exception e) {
            return new WebResourceResponse("text/plain", "utf-8", 403, "Forbidden", noCache(),
                    new ByteArrayInputStream(new byte[0]));
        }
    }

    private static Map<String, String> noCache() {
        Map<String, String> h = new HashMap<>();
        h.put("Cache-Control", "no-store");
        return h;
    }

    private static WebResourceResponse notFound() {
        return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", Collections.emptyMap(),
                new ByteArrayInputStream(new byte[0]));
    }

    private static final Map<String, String> MIME = new HashMap<>();

    static {
        MIME.put("html", "text/html");
        MIME.put("htm", "text/html");
        MIME.put("js", "text/javascript");
        MIME.put("mjs", "text/javascript");
        MIME.put("css", "text/css");
        MIME.put("json", "application/json");
        MIME.put("wasm", "application/wasm");
        MIME.put("svg", "image/svg+xml");
        MIME.put("png", "image/png");
        MIME.put("jpg", "image/jpeg");
        MIME.put("jpeg", "image/jpeg");
        MIME.put("gif", "image/gif");
        MIME.put("webp", "image/webp");
        MIME.put("ico", "image/x-icon");
        MIME.put("woff", "font/woff");
        MIME.put("woff2", "font/woff2");
        MIME.put("ttf", "font/ttf");
        MIME.put("otf", "font/otf");
        MIME.put("txt", "text/plain");
        MIME.put("md", "text/markdown");
        MIME.put("xml", "application/xml");
        MIME.put("bcmap", "application/octet-stream");
        MIME.put("pfb", "application/octet-stream");
    }

    private static String mimeOf(String path) {
        int dot = path.lastIndexOf('.');
        String ext = dot < 0 ? "" : path.substring(dot + 1).toLowerCase(Locale.ROOT);
        String m = MIME.get(ext);
        return m != null ? m : "application/octet-stream";
    }

    private static String enc(String s) {
        try {
            return URLEncoder.encode(s, "UTF-8").replace("+", "%20");
        } catch (Exception e) {
            return s;
        }
    }
}
