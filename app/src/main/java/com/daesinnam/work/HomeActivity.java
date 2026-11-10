package com.daesinnam.work;

import android.annotation.SuppressLint;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.res.AssetManager;
import android.net.Uri;
import android.os.Bundle;
import android.view.ViewGroup;
import android.webkit.MimeTypeMap;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;

import androidx.activity.ComponentActivity;
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
import java.io.InputStream;
import java.util.Collections;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * 덜누름 워크 첫 화면: 문서·사진·동영상 편집 중 하나를 고르거나, 파일을 열면 형식에 맞는 편집기로 보냅니다.
 * 화면은 assets/work/ (HTML), 앱과는 WorkAndroid 메시지로 주고받습니다.
 */
public class HomeActivity extends ComponentActivity {
    private static final String APP_ORIGIN = "https://appassets.androidplatform.net";
    private static final String HOME = APP_ORIGIN + "/assets/work/index.html";
    private WebView web;

    private final ActivityResultLauncher<String[]> pick =
            registerForActivityResult(new ActivityResultContracts.OpenDocument(), this::openPicked);

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        FrameLayout root = new FrameLayout(this);
        web = new WebView(this);
        root.addView(web, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        setContentView(root);
        ViewCompat.setOnApplyWindowInsetsListener(root, (v, insets) -> {
            Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
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
        WebViewAssetLoader loader = new WebViewAssetLoader.Builder().addPathHandler("/assets/", this::serveAsset).build();
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                WebResourceResponse r = loader.shouldInterceptRequest(request.getUrl());
                if (r == null && "appassets.androidplatform.net".equals(request.getUrl().getHost())) return notFound();
                return r;
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                if ("appassets.androidplatform.net".equals(url.getHost())) return false;
                if ("https".equals(url.getScheme()) || "http".equals(url.getScheme())) {
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, url));
                    } catch (ActivityNotFoundException ignored) {
                    }
                }
                return true;
            }
        });
        if (WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
            WebViewCompat.addWebMessageListener(web, "WorkAndroid", Collections.singleton(APP_ORIGIN), this::onMessage);
        }
        web.loadUrl(HOME);
    }

    @Override
    protected void onDestroy() {
        if (web != null) web.destroy();
        super.onDestroy();
    }

    private void onMessage(@NonNull WebView view, @NonNull WebMessageCompat message, @NonNull Uri origin,
                           boolean isMainFrame, @NonNull JavaScriptReplyProxy proxy) {
        if (!isMainFrame || message.getData() == null) return;
        try {
            JSONObject m = new JSONObject(message.getData());
            String go = m.optString("go");
            switch (go) {
                case "office": startActivity(new Intent(this, OfficeActivity.class)); break;
                case "photo": startActivity(new Intent(this, PhotoActivity.class)); break;
                case "film": startActivity(new Intent(this, FilmActivity.class)); break;
                case "open": pick.launch(new String[]{"*/*"}); break;
                default: break;
            }
        } catch (JSONException | ActivityNotFoundException ignored) {
        }
    }

    /** 고른 파일을 형식에 맞는 편집기로 */
    private void openPicked(Uri uri) {
        if (uri == null) return;
        try {
            getContentResolver().takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
        } catch (SecurityException e) {
            try {
                getContentResolver().takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
            } catch (SecurityException ignored) {
            }
        }
        Class<?> target = editorFor(getContentResolver().getType(uri), uri.getLastPathSegment());
        Intent i = new Intent(Intent.ACTION_VIEW, uri, this, target)
                .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION
                        | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
        try {
            startActivity(i);
        } catch (ActivityNotFoundException e) {
            Toast.makeText(this, "이 파일을 열 편집기를 찾지 못했습니다", Toast.LENGTH_SHORT).show();
        }
    }

    static Class<?> editorFor(String mime, String name) {
        String m = mime == null ? "" : mime.toLowerCase(Locale.ROOT);
        String n = name == null ? "" : name.toLowerCase(Locale.ROOT);
        String ext = n.contains(".") ? n.substring(n.lastIndexOf('.') + 1) : "";
        if (m.startsWith("video/") || m.startsWith("audio/") || ext.equals("fcproj") || ext.equals("mxf")) return FilmActivity.class;
        if (m.startsWith("image/") || ext.equals("psd") || ext.equals("pcproj")) return PhotoActivity.class;
        if (m.isEmpty() || m.equals("application/octet-stream")) {
            String guess = MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext);
            if (guess != null && !guess.equals("application/octet-stream")) return editorFor(guess, null);
        }
        return OfficeActivity.class;
    }

    private WebResourceResponse serveAsset(@NonNull String path) {
        if (path.contains("..") || !path.startsWith("work/")) return notFound();
        try {
            InputStream in = getAssets().open(path, AssetManager.ACCESS_STREAMING);
            String ext = path.substring(path.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
            String mime = MIME.containsKey(ext) ? MIME.get(ext) : "application/octet-stream";
            boolean text = mime.startsWith("text/") || mime.endsWith("javascript") || mime.endsWith("json") || mime.endsWith("svg+xml");
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
        MIME.put("txt", "text/plain");
        MIME.put("json", "application/json");
        MIME.put("md", "text/plain");
    }

    private static WebResourceResponse notFound() {
        return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", Collections.emptyMap(), new ByteArrayInputStream(new byte[0]));
    }
}
