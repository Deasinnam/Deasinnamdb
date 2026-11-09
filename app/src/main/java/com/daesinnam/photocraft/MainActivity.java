package com.daesinnam.photocraft;

import android.annotation.SuppressLint;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.res.AssetManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.OpenableColumns;
import android.util.Base64;
import android.util.Log;
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

import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayDeque;
import java.util.Collections;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * PhotoCraft 안드로이드판: PhotoCraft 공식 웹 빌드(WebAssembly)를 WebView로 띄웁니다.
 *
 *  https://appassets.androidplatform.net/assets/www/index.html  ← 앱에 넣은 웹 빌드
 *  저장: 웹판의 다운로드를 bridge.js가 가로채 넘기면 안드로이드 "파일 만들기"로 저장
 *  열기: 웹판의 파일 선택(<input type=file>) → 안드로이드 파일 고르기,
 *        다른 앱에서 연 사진은 bridge.js가 캔버스에 끌어다 놓기로 넣음
 */
public class MainActivity extends ComponentActivity {
    private static final String TAG = "PhotoCraft";
    private static final String APP_ORIGIN = "https://appassets.androidplatform.net";
    private static final String INDEX = APP_ORIGIN + "/assets/www/index.html";

    private WebView web;
    private boolean selftest;
    private final ExecutorService io = Executors.newSingleThreadExecutor();
    private final Handler main = new Handler(Looper.getMainLooper());

    private JavaScriptReplyProxy pageProxy;
    private Uri pendingOpen;

    // 저장 중인 파일들 (웹 → 앱, 조각으로 옴)
    private final Map<Integer, PendingSave> saves = new HashMap<>();
    private final ArrayDeque<PendingSave> readyToSave = new ArrayDeque<>();
    private PendingSave choosing;

    private static final class PendingSave {
        File temp;
        OutputStream out;
        String name;
        String mime;
    }

    private ValueCallback<Uri[]> fileChooserCallback;

    private final ActivityResultLauncher<Intent> createDocument =
            registerForActivityResult(new ActivityResultContracts.StartActivityForResult(), result -> {
                PendingSave s = choosing;
                choosing = null;
                Uri uri = result.getData() == null ? null : result.getData().getData();
                if (s != null) {
                    if (result.getResultCode() == RESULT_OK && uri != null) writeOut(s, uri);
                    else {
                        //noinspection ResultOfMethodCallIgnored
                        s.temp.delete();
                        toast("저장을 취소했습니다");
                    }
                }
                askNextSave();
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
        selftest = getIntent() != null && getIntent().hasExtra("photocraft.selftest");

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
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setTextZoom(100);
        s.setMediaPlaybackRequiresUserGesture(false);

        WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", this::serveAsset)
                .build();

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                WebResourceResponse r = loader.shouldInterceptRequest(url);
                if (r == null && "appassets.androidplatform.net".equals(url.getHost())) return notFound();
                return r;
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                if ("appassets.androidplatform.net".equals(url.getHost())) return false;
                String scheme = url.getScheme();
                if ("http".equals(scheme) || "https".equals(scheme) || "mailto".equals(scheme)) {
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, url));
                    } catch (ActivityNotFoundException ignored) {
                    }
                }
                return true;
            }

            @Override
            public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                pageProxy = null;
                if (!WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) {
                    view.evaluateJavascript(bridgeScript(), null); // 오래된 WebView: 늦게라도 넣음
                }
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileChooserCallback != null) fileChooserCallback.onReceiveValue(null);
                fileChooserCallback = callback;
                try {
                    Intent i = params.createIntent();
                    // 웹판이 확장자로만 거르는 형식(PSD 등)도 고를 수 있게 전체 파일을 보여 줌
                    i.setType("*/*");
                    fileChooser.launch(i);
                    return true;
                } catch (ActivityNotFoundException e) {
                    fileChooserCallback = null;
                    return false;
                }
            }

            @Override
            public boolean onConsoleMessage(android.webkit.ConsoleMessage m) {
                if (selftest || m.messageLevel() == android.webkit.ConsoleMessage.MessageLevel.ERROR) {
                    Log.i(TAG + "Console", m.messageLevel() + " " + m.message());
                }
                return true;
            }
        });

        if (WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
            WebViewCompat.addWebMessageListener(web, "PhotoCraftAndroid",
                    Collections.singleton(APP_ORIGIN), this::onWebMessage);
        } else {
            Toast.makeText(this, "Android System WebView를 업데이트해 주세요 (저장에 필요)", Toast.LENGTH_LONG).show();
        }
        if (WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) {
            WebViewCompat.addDocumentStartJavaScript(web, bridgeScript(), Collections.singleton(APP_ORIGIN));
        }

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                new AlertDialog.Builder(MainActivity.this)
                        .setMessage("PhotoCraft를 닫을까요?\n저장하지 않은 작업은 사라집니다.")
                        .setPositiveButton("닫기", (d, w) -> finish())
                        .setNegativeButton("계속 작업", null)
                        .show();
            }
        });

        pendingOpen = incomingUri(getIntent());
        web.loadUrl(selftest ? INDEX + "?selftest" : INDEX);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        Uri uri = incomingUri(intent);
        if (uri == null) return;
        if (pageProxy != null) sendFileToPage(uri);
        else pendingOpen = uri;
    }

    @Override
    protected void onDestroy() {
        io.shutdown();
        if (web != null) web.destroy();
        super.onDestroy();
    }

    private static Uri incomingUri(Intent intent) {
        if (intent == null) return null;
        String action = intent.getAction();
        if (Intent.ACTION_VIEW.equals(action) || Intent.ACTION_EDIT.equals(action)) return intent.getData();
        if (Intent.ACTION_SEND.equals(action)) return intent.getParcelableExtra(Intent.EXTRA_STREAM);
        return null;
    }

    // ---------- 웹 → 앱 ----------

    private void onWebMessage(@NonNull WebView view, @NonNull WebMessageCompat message, @NonNull Uri origin,
                              boolean isMainFrame, @NonNull JavaScriptReplyProxy proxy) {
        if (!isMainFrame || message.getData() == null) return;
        JSONObject m;
        try {
            m = new JSONObject(message.getData());
        } catch (JSONException e) {
            return;
        }
        String t = m.optString("t");
        int id = m.optInt("id");
        switch (t) {
            case "ready":
                pageProxy = proxy;
                if (pendingOpen != null) {
                    Uri u = pendingOpen;
                    pendingOpen = null;
                    sendFileToPage(u);
                }
                break;
            case "save-begin":
                try {
                    PendingSave s = new PendingSave();
                    File dir = new File(getCacheDir(), "saves");
                    //noinspection ResultOfMethodCallIgnored
                    dir.mkdirs();
                    s.temp = File.createTempFile("save-", ".bin", dir);
                    s.out = new FileOutputStream(s.temp);
                    s.name = safeName(m.optString("name", "image"));
                    s.mime = m.optString("mime", "");
                    saves.put(id, s);
                } catch (IOException e) {
                    toast("저장 준비 실패: " + e.getMessage());
                }
                break;
            case "save-chunk": {
                PendingSave s = saves.get(id);
                if (s == null) break;
                try {
                    s.out.write(Base64.decode(m.optString("d"), Base64.DEFAULT));
                } catch (IOException | IllegalArgumentException e) {
                    saves.remove(id);
                    toast("저장 실패: " + e.getMessage());
                }
                break;
            }
            case "save-end": {
                PendingSave s = saves.remove(id);
                if (s == null) break;
                try {
                    s.out.close();
                } catch (IOException ignored) {
                }
                if (selftest) {
                    Log.i("PHOTOCRAFT_SELFTEST", "save ok name=" + s.name + " bytes=" + s.temp.length());
                    Log.i("PHOTOCRAFT_SELFTEST", "DONE");
                    break;
                }
                readyToSave.add(s);
                askNextSave();
                break;
            }
            case "selftest":
                Log.i("PHOTOCRAFT_SELFTEST", "page started=" + m.optBoolean("started") + " seconds=" + m.optInt("seconds")
                        + " canvas=" + m.optString("canvas") + " webgpu=" + m.optBoolean("webgpu") + " ua=" + m.optString("ua")
                        + " errors=" + m.optInt("errors") + " first=" + m.optString("first") + " text=" + m.optString("text"));
                break;
            case "log":
                Log.i(TAG, m.optString("m"));
                break;
            default:
                break;
        }
    }

    /** 저장할 파일마다 "어디에 저장할까요?"를 차례로 물음 */
    private void askNextSave() {
        if (choosing != null || readyToSave.isEmpty()) return;
        choosing = readyToSave.poll();
        Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT)
                .addCategory(Intent.CATEGORY_OPENABLE)
                .setType(mimeFor(choosing))
                .putExtra(Intent.EXTRA_TITLE, choosing.name);
        try {
            createDocument.launch(i);
        } catch (ActivityNotFoundException e) {
            choosing = null;
            toast("저장할 곳을 고를 수 없습니다");
        }
    }

    private void writeOut(PendingSave s, Uri uri) {
        io.execute(() -> {
            try (InputStream in = new FileInputStream(s.temp);
                 OutputStream out = getContentResolver().openOutputStream(uri, "wt")) {
                if (out == null) throw new IOException("파일을 쓸 수 없습니다");
                copy(in, out);
                toast("저장했습니다: " + displayName(uri, s.name));
            } catch (Exception e) {
                toast("저장 실패: " + e.getMessage());
            } finally {
                //noinspection ResultOfMethodCallIgnored
                s.temp.delete();
            }
        });
    }

    // ---------- 앱 → 웹: 다른 앱에서 연 파일 ----------

    private void sendFileToPage(Uri uri) {
        JavaScriptReplyProxy proxy = pageProxy;
        if (proxy == null) {
            pendingOpen = uri;
            return;
        }
        io.execute(() -> {
            String name = displayName(uri, "image");
            String mime = getContentResolver().getType(uri);
            int id = (int) (System.currentTimeMillis() & 0x7fffffff);
            try (InputStream in = getContentResolver().openInputStream(uri)) {
                if (in == null) throw new IOException("파일을 열 수 없습니다");
                post(proxy, json("t", "open-begin", "id", id, "name", name, "mime", mime == null ? "" : mime));
                byte[] buf = new byte[768 * 1024];
                int n;
                while ((n = readFully(in, buf)) > 0) {
                    post(proxy, json("t", "open-chunk", "id", id, "d", Base64.encodeToString(buf, 0, n, Base64.NO_WRAP)));
                }
                post(proxy, json("t", "open-end", "id", id));
            } catch (Exception e) {
                toast("사진을 열지 못했습니다: " + e.getMessage());
            }
        });
    }

    private void post(JavaScriptReplyProxy proxy, String text) {
        main.post(() -> {
            try {
                proxy.postMessage(text);
            } catch (Exception ignored) {
            }
        });
    }

    private static String json(Object... kv) {
        JSONObject o = new JSONObject();
        try {
            for (int i = 0; i + 1 < kv.length; i += 2) o.put((String) kv[i], kv[i + 1]);
        } catch (JSONException ignored) {
        }
        return o.toString();
    }

    // ---------- 도우미 ----------

    private String bridgeScript() {
        try (InputStream in = getAssets().open("bridge.js")) {
            ByteArrayOutputStream bo = new ByteArrayOutputStream();
            copy(in, bo);
            return bo.toString("UTF-8");
        } catch (IOException e) {
            return "";
        }
    }

    private WebResourceResponse serveAsset(@NonNull String path) {
        if (path.contains("..")) return notFound();
        try {
            InputStream in = getAssets().open(path, AssetManager.ACCESS_STREAMING);
            String mime = mimeOf(path);
            String enc = mime.startsWith("text/") || mime.endsWith("javascript") || mime.endsWith("json") ? "utf-8" : null;
            Map<String, String> headers = new HashMap<>();
            headers.put("Cache-Control", "no-cache");
            return new WebResourceResponse(mime, enc, 200, "OK", headers, in);
        } catch (Exception e) {
            return notFound();
        }
    }

    private static WebResourceResponse notFound() {
        return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", Collections.emptyMap(),
                new ByteArrayInputStream(new byte[0]));
    }

    private static final Map<String, String> MIME = new HashMap<>();

    static {
        MIME.put("html", "text/html");
        MIME.put("js", "text/javascript");
        MIME.put("mjs", "text/javascript");
        MIME.put("css", "text/css");
        MIME.put("json", "application/json");
        MIME.put("wasm", "application/wasm");
        MIME.put("svg", "image/svg+xml");
        MIME.put("png", "image/png");
        MIME.put("ico", "image/x-icon");
        MIME.put("woff", "font/woff");
        MIME.put("woff2", "font/woff2");
        MIME.put("ttf", "font/ttf");
        MIME.put("otf", "font/otf");
        MIME.put("txt", "text/plain");
        MIME.put("webmanifest", "application/manifest+json");
    }

    private static String mimeOf(String path) {
        int dot = path.lastIndexOf('.');
        String ext = dot < 0 ? "" : path.substring(dot + 1).toLowerCase(Locale.ROOT);
        String m = MIME.get(ext);
        return m != null ? m : "application/octet-stream";
    }

    private static String mimeFor(PendingSave s) {
        if (s.mime != null && !s.mime.isEmpty()) return s.mime;
        String n = s.name.toLowerCase(Locale.ROOT);
        if (n.endsWith(".png")) return "image/png";
        if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
        if (n.endsWith(".webp")) return "image/webp";
        if (n.endsWith(".psd")) return "image/vnd.adobe.photoshop";
        if (n.endsWith(".tif") || n.endsWith(".tiff")) return "image/tiff";
        if (n.endsWith(".gif")) return "image/gif";
        return "application/octet-stream";
    }

    private static String safeName(String n) {
        String s = n.replaceAll("[\\\\/:*?\"<>|\\u0000]", "_").trim();
        return s.isEmpty() ? "image" : s;
    }

    private String displayName(Uri uri, String fallback) {
        try (Cursor c = getContentResolver().query(uri, new String[]{OpenableColumns.DISPLAY_NAME}, null, null, null)) {
            if (c != null && c.moveToFirst() && c.getString(0) != null) return c.getString(0);
        } catch (Exception ignored) {
        }
        String last = uri.getLastPathSegment();
        return last != null ? last : fallback;
    }

    private static int readFully(InputStream in, byte[] buf) throws IOException {
        int total = 0;
        while (total < buf.length) {
            int n = in.read(buf, total, buf.length - total);
            if (n < 0) break;
            total += n;
        }
        return total;
    }

    private static void copy(InputStream in, OutputStream out) throws IOException {
        byte[] b = new byte[1 << 16];
        int n;
        while ((n = in.read(b)) > 0) out.write(b, 0, n);
    }

    private void toast(String text) {
        main.post(() -> Toast.makeText(this, text, Toast.LENGTH_SHORT).show());
    }

    @SuppressWarnings("unused")
    private static byte[] utf8(String s) {
        return s.getBytes(StandardCharsets.UTF_8);
    }
}
