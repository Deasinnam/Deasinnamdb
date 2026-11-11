package com.daesinnam.work;

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
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;
import okio.ByteString;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
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
public class OfficeActivity extends ComponentActivity {
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
    private NodeRuntime node;
    private final ExecutorService nodeIo = Executors.newCachedThreadPool();
    /** 화면이 연 Node 연결 (통로 번호 → 웹소켓) */
    private final Map<String, WebSocket> nodeChannels = new ConcurrentHashMap<>();
    private boolean pendingNeedPath;
    private String pendingFlow;
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
        node = NodeRuntime.get(this);
        node.acquire();
        nodeIo.execute(() -> node.ensureStarted(null));

        FrameLayout root = new FrameLayout(this);
        web = new WebView(this);
        root.addView(web, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        setContentView(root);
        HomeButton.attach(this, root, "office");
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
            public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                closeNodeChannels();
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                // 자동 점검(시험용 빌드): 사람이 누르는 것과 같은 길로 편집기를 엽니다
                String flow = pendingFlow;
                if (flow == null || url == null || !url.startsWith(HOME_URL)) return;
                pendingFlow = null;
                String sel = "diag".equals(flow) ? "#diag" : "[data-new=\"" + flow.replaceAll("[^a-z]", "") + "\"]";
                view.evaluateJavascript("(function(){var b=document.querySelector('" + sel + "');if(b)b.click();return !!b})()", null);
            }

            @Override
            public boolean onRenderProcessGone(WebView view, android.webkit.RenderProcessGoneDetail detail) {
                // 화면을 그리는 프로세스가 죽은 경우(메모리 부족 등): 앱이 꺼지지 않게 하고 문서 첫 화면으로
                node.note("화면 프로세스 종료 crash=" + (android.os.Build.VERSION.SDK_INT >= 26 && detail.didCrash()));
                recreate();
                return true;
            }

            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                if (PREVIEW_HOST.equals(url.getHost())) {
                    return new WebResourceResponse("text/html", "utf-8", 200, "OK", noCache(),
                            new ByteArrayInputStream(previewHtml.getBytes(StandardCharsets.UTF_8)));
                }
                String path = url.getPath();
                if ("appassets.androidplatform.net".equals(url.getHost()) && path != null && path.startsWith("/proto/")) {
                    return proxyToNode(url, request.getMethod());
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
                    // 문서 첫 화면에서 뒤로: 문서 편집을 닫고 덜누름 워크 첫 화면으로
                    HomeButton.goHome(OfficeActivity.this);
                    finish();
                }
            }
        });

        node.note("문서 화면 열림 " + windowInfo());
        if (getIntent() != null && getIntent().hasExtra("ieum.selftest")) web.loadUrl(HOME_URL + "?selftest=0");
        else if (!handleIntent(getIntent())) web.loadUrl(HOME_URL);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIntent(intent);
    }

    @Override
    protected void onDestroy() {
        closeNodeChannels();
        node.release();
        nodeIo.shutdown();
        io.shutdown();
        if (web != null) web.destroy();
        super.onDestroy();
    }

    // ---------- 다른 앱에서 연 파일 ----------

    private boolean handleIntent(Intent intent) {
        if (intent == null) return false;
        String flow = intent.getStringExtra("ieum.flow");
        if (flow != null && (getApplicationInfo().flags & android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) != 0) {
            pendingFlow = flow;
            web.loadUrl(HOME_URL);
            return true;
        }
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
                pendingNeedPath = a.optBoolean(0, false);
                openDocument.launch(OPEN_TYPES);
                break;
            case "createDocument": {
                if (!startPending(proxy, id)) return;
                pendingNeedPath = a.optBoolean(2, false);
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
            case "materialize":
                io.execute(() -> {
                    try {
                        File f = docs.materialize(a.optString(0));
                        reply(proxy, id, okWith("path", f.getAbsolutePath()));
                    } catch (Exception e) {
                        reply(proxy, id, fail("문서를 준비하지 못했습니다: " + e.getMessage()));
                    }
                });
                break;
            case "syncFile":
                io.execute(() -> reply(proxy, id, syncFile(a.optString(0))));
                break;
            case "openExternal": {
                Uri u = Uri.parse(a.optString(0));
                String sc = u.getScheme();
                if ("http".equals(sc) || "https".equals(sc) || "mailto".equals(sc)) {
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, u));
                    } catch (ActivityNotFoundException ignored) {
                    }
                }
                break;
            }
            case "nodeStatus": {
                JSONObject st = ok();
                try {
                    st.put("available", node.isAvailable());
                    st.put("ready", node.isReady());
                    if (node.failure() != null) st.put("failure", node.failure());
                } catch (JSONException ignored) {
                }
                reply(proxy, id, st);
                break;
            }
            case "nodeDiag":
                io.execute(() -> reply(proxy, id, diag()));
                break;
            case "pageReport":
                // 편집기 화면이 스스로 알리는 상태 (열림/연결 실패/오류). 문제 진단 기록에 남깁니다.
                node.note("화면 " + clip(a.optString(0), 20) + " " + clip(a.optString(1), 20) + " " + clip(a.optString(2), 300));
                android.util.Log.i("IEUM_PAGE", a.optString(0) + " " + a.optString(1) + " " + a.optString(2));
                break;
            case "diagReport": {
                String text = a.optString(0);
                for (String line : text.split("\n")) android.util.Log.i("IEUM_DIAG", line);
                break;
            }
            case "copyText": {
                android.content.ClipboardManager cm = (android.content.ClipboardManager) getSystemService(CLIPBOARD_SERVICE);
                if (cm != null) cm.setPrimaryClip(android.content.ClipData.newPlainText("덜누름 워크 진단", a.optString(0)));
                reply(proxy, id, ok());
                break;
            }
            case "shareText":
                try {
                    startActivity(Intent.createChooser(new Intent(Intent.ACTION_SEND).setType("text/plain")
                            .putExtra(Intent.EXTRA_SUBJECT, "덜누름 워크 진단 결과")
                            .putExtra(Intent.EXTRA_TEXT, a.optString(0)), "진단 결과 보내기"));
                } catch (ActivityNotFoundException ignored) {
                }
                break;
            case "nodeOpen":
                nodeOpen(proxy, a.optString(0), a.optString(1));
                break;
            case "nodeSend": {
                WebSocket ws = nodeChannels.get(a.optString(0));
                if (ws != null) ws.send(a.optString(1));
                break;
            }
            case "nodeClose": {
                WebSocket ws = nodeChannels.remove(a.optString(0));
                if (ws != null) ws.close(1000, null);
                break;
            }
            case "selftestFiles":
                io.execute(() -> reply(proxy, id, selftestFiles()));
                break;
            case "selftestReport":
                android.util.Log.i("IEUM_SELFTEST", a.optString(0) + " " + a.optString(1));
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
        boolean needPath = pendingNeedPath;
        pendingNeedPath = false;
        io.execute(() -> {
            JSONObject r = ok();
            try {
                r.put("id", docId);
                r.put("name", docs.displayName(docId));
                if (needPath) {
                    // 열기: 내용을 복사해 둠 / 새로 만들기: 아직 빈 자리 (Node가 쓰면 옮겨 씀)
                    File f = docs.localFile(docId);
                    if (canRead(docId) && hasContent(uri)) f = docs.materialize(docId);
                    r.put("path", f.getAbsolutePath());
                }
            } catch (Exception e) {
                reply(proxy, id, fail("문서를 준비하지 못했습니다: " + e.getMessage()));
                return;
            }
            reply(proxy, id, r);
        });
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

    // ---------- Node ----------

    private void nodeOpen(JavaScriptReplyProxy proxy, String channel, String query) {
        // 세션에 붙는 연결(편집기 화면)은 엔진을 다시 시작하면 세션이 사라지므로 다시 시도하지 않습니다
        runNodeIo(() -> connectNode(proxy, channel, query, query == null || query.isEmpty()));
    }

    private void runNodeIo(Runnable r) {
        try {
            nodeIo.execute(r);
        } catch (java.util.concurrent.RejectedExecutionException ignored) {
            // 화면이 이미 닫힘
        }
    }

    private void connectNode(JavaScriptReplyProxy proxy, String channel, String query, boolean mayRetry) {
        NodeRuntime.Listener status = (state, detail) ->
                push(proxy, channel, "status", state + (detail == null || detail.isEmpty() ? "" : ":" + detail));
        node.ensureStarted(status);
        if (!node.isReady()) {
            push(proxy, channel, "error", node.failure() == null ? "문서 엔진을 시작하지 못했습니다" : node.failure());
            push(proxy, channel, "close", "1011");
            return;
        }
        final boolean[] opened = {false};
        WebSocket ws = node.openSocket(query, new WebSocketListener() {
            @Override
            public void onOpen(@NonNull WebSocket webSocket, @NonNull okhttp3.Response response) {
                opened[0] = true;
                push(proxy, channel, "open", null);
            }

            @Override
            public void onMessage(@NonNull WebSocket webSocket, @NonNull String text) {
                push(proxy, channel, "message", text);
            }

            @Override
            public void onMessage(@NonNull WebSocket webSocket, @NonNull ByteString bytes) {
                push(proxy, channel, "message", bytes.utf8());
            }

            @Override
            public void onClosing(@NonNull WebSocket webSocket, int code, @NonNull String reason) {
                webSocket.close(code, null);
            }

            @Override
            public void onClosed(@NonNull WebSocket webSocket, int code, @NonNull String reason) {
                nodeChannels.remove(channel, webSocket);
                push(proxy, channel, "close", String.valueOf(code));
            }

            @Override
            public void onFailure(@NonNull WebSocket webSocket, @NonNull Throwable t, okhttp3.Response response) {
                // 화면이 바뀌어 우리가 끊은 연결이면 알릴 필요 없음
                if (!nodeChannels.remove(channel, webSocket)) return;
                String why = t + (response == null ? "" : " (응답 " + response.code() + ")");
                node.markBroken((opened[0] ? "연결 끊김: " : "연결 실패: ") + why);
                if (!opened[0] && mayRetry) {
                    // 엔진이 응답하지 않음 → 한 번 다시 시작해서 붙어 봅니다
                    runNodeIo(() -> {
                        node.restart(status);
                        connectNode(proxy, channel, query, false);
                    });
                    return;
                }
                push(proxy, channel, "error", (opened[0] ? "문서 엔진 연결이 끊겼습니다: " : "문서 엔진에 연결하지 못했습니다: ") + why);
                push(proxy, channel, "close", "1006");
            }
        });
        nodeChannels.put(channel, ws);
    }

    /** 문제 진단: 기기·앱·문서 엔진 상태 (문서 내용·파일 이름은 넣지 않음) */
    private JSONObject diag() {
        JSONObject o = ok();
        try {
            String build = "?";
            try (InputStream in = getAssets().open("build.txt")) {
                byte[] b = new byte[64];
                int n = in.read(b);
                build = new String(b, 0, Math.max(n, 0), StandardCharsets.UTF_8).trim();
            } catch (Exception ignored) {
            }
            android.content.pm.PackageInfo pi = getPackageManager().getPackageInfo(getPackageName(), 0);
            o.put("app", pi.versionName + " 빌드 " + build
                    + ((getApplicationInfo().flags & android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) != 0 ? " (시험용)" : ""));
            o.put("device", android.os.Build.MANUFACTURER + " " + android.os.Build.MODEL);
            o.put("android", android.os.Build.VERSION.RELEASE + " (API " + android.os.Build.VERSION.SDK_INT + ")");
            o.put("abis", android.text.TextUtils.join(",", android.os.Build.SUPPORTED_ABIS));
            android.content.pm.PackageInfo wv = WebViewCompat.getCurrentWebViewPackage(this);
            o.put("webview", wv == null ? "?" : wv.packageName + " " + wv.versionName);
            o.put("window", windowInfo());
            o.put("node", node.diag());
        } catch (Exception e) {
            try {
                o.put("error", String.valueOf(e));
            } catch (JSONException ignored) {
            }
        }
        return o;
    }

    /** 창·화면 상태 (DeX, 여러 창, 키보드·마우스 연결 여부) */
    private String windowInfo() {
        try {
            android.content.res.Configuration c = getResources().getConfiguration();
            StringBuilder sb = new StringBuilder();
            sb.append(c.screenWidthDp).append("x").append(c.screenHeightDp).append("dp ").append(c.densityDpi).append("dpi");
            if (android.os.Build.VERSION.SDK_INT >= 30 && getDisplay() != null) sb.append(" 화면#").append(getDisplay().getDisplayId());
            if (isInMultiWindowMode()) sb.append(" 창모드");
            if ((c.uiMode & android.content.res.Configuration.UI_MODE_TYPE_MASK) == android.content.res.Configuration.UI_MODE_TYPE_DESK) sb.append(" 데스크");
            if (c.keyboard == android.content.res.Configuration.KEYBOARD_QWERTY) sb.append(" 키보드");
            if (c.touchscreen == android.content.res.Configuration.TOUCHSCREEN_NOTOUCH) sb.append(" 터치없음");
            if (c.navigation != android.content.res.Configuration.NAVIGATION_NONAV) sb.append(" 내비=").append(c.navigation);
            try {
                // 삼성 DeX 여부 (삼성 기기에만 있는 값)
                Class<?> k = c.getClass();
                int on = k.getField("SEM_DESKTOP_MODE_ENABLED").getInt(k);
                if (k.getField("semDesktopModeEnabled").getInt(c) == on) sb.append(" DeX");
            } catch (Throwable ignored) {
            }
            return sb.toString();
        } catch (Throwable t) {
            return "?";
        }
    }

    private static String clip(String s, int max) {
        if (s == null) return "";
        return s.length() > max ? s.substring(0, max) + "…" : s;
    }

    private void push(JavaScriptReplyProxy proxy, String channel, String ev, String data) {
        JSONObject m = new JSONObject();
        try {
            m.put("node", channel);
            m.put("ev", ev);
            if (data != null) m.put("data", data);
        } catch (JSONException ignored) {
        }
        String text = m.toString();
        main.post(() -> {
            try {
                proxy.postMessage(text);
            } catch (Exception ignored) {
                // 화면이 바뀐 뒤면 받을 곳이 없음
            }
        });
    }

    private void closeNodeChannels() {
        for (WebSocket ws : nodeChannels.values()) ws.close(1001, null);
        nodeChannels.clear();
    }

    private WebResourceResponse proxyToNode(Uri url, String method) {
        try {
            String q = url.getEncodedQuery();
            NodeRuntime.ProxyResult r = node.proxy(url.getEncodedPath() + (q == null ? "" : "?" + q), method);
            InputStream body = r.body != null ? r.body : new ByteArrayInputStream(new byte[0]);
            return new WebResourceResponse(r.mime, r.encoding, r.status, r.reason, r.headers, body);
        } catch (Exception e) {
            return new WebResourceResponse("text/plain", "utf-8", 502, "Bad Gateway", noCache(),
                    new ByteArrayInputStream(new byte[0]));
        }
    }

    /** 빌드 서버의 자동 점검용 견본 문서(assets/selftest)를 앱 폴더로 꺼냅니다 */
    private JSONObject selftestFiles() {
        try {
            File dir = new File(getFilesDir(), "selftest");
            //noinspection ResultOfMethodCallIgnored
            dir.mkdirs();
            JSONArray list = new JSONArray();
            String[] names = getAssets().list("selftest");
            if (names != null) {
                java.util.Arrays.sort(names);
                for (String n : names) {
                    String module = n.replaceAll("^\\d+-([a-z]+)\\..*$", "$1");
                    File f = new File(dir, n);
                    try (InputStream in = getAssets().open("selftest/" + n);
                         OutputStream out = new java.io.FileOutputStream(f)) {
                        byte[] b = new byte[8192];
                        int k;
                        while ((k = in.read(b)) > 0) out.write(b, 0, k);
                    }
                    JSONObject o = new JSONObject();
                    o.put("module", module);
                    o.put("path", f.getAbsolutePath());
                    list.put(o);
                }
            }
            JSONObject r = ok();
            r.put("files", list);
            return r;
        } catch (Exception e) {
            return fail(String.valueOf(e.getMessage()));
        }
    }

    private JSONObject syncFile(String path) {
        String docId = docs.idForLocal(path);
        if (docId == null) return fail("앱 밖 파일이라 옮겨 쓰지 않았습니다");
        try {
            docs.syncBack(docId, new File(path));
            return okWith("synced", true);
        } catch (Exception e) {
            return fail("원래 위치에 저장하지 못했습니다: " + e.getMessage());
        }
    }

    private boolean hasContent(Uri uri) {
        try (InputStream in = getContentResolver().openInputStream(uri)) {
            return in != null && in.read() >= 0;
        } catch (Exception e) {
            return false;
        }
    }

    private static JSONObject okWith(String key, Object value) {
        JSONObject o = ok();
        try {
            o.put(key, value);
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
