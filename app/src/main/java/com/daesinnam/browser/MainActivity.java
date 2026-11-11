package com.daesinnam.browser;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.net.http.SslError;
import android.os.Build;
import android.os.Bundle;
import android.os.ParcelFileDescriptor;
import android.text.InputFilter;
import android.text.InputType;
import android.util.Log;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputMethodManager;
import android.webkit.CookieManager;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.SafeBrowsingResponse;
import android.webkit.SslErrorHandler;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebStorage;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebViewDatabase;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.webkit.ScriptHandler;
import androidx.webkit.UserAgentMetadata;
import androidx.webkit.WebSettingsCompat;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.util.Collections;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 덜누름 브라우저 — 언제나 PC 화면으로 여는 가벼운 브라우저.
 *
 *  - PC용 사용자 에이전트와 넓은 화면 폭(1024~1920)을 항상 씁니다.
 *  - HTTPS만 엽니다. 인증서 오류·유해 사이트·로컬 파일·외부 앱 링크는 막습니다.
 *  - 위쪽은 주소 줄 한 줄만 둡니다(40dp). 진행 표시는 화면 위에 겹쳐 그려 자리를 차지하지 않습니다.
 */
public class MainActivity extends Activity {
    private static final String TAG = "BROWSER_SELFTEST";
    private static final String HOME = "https://www.naver.com/";
    private static final int REQ_FILE = 42;
    private static final int MAX_BOOKMARKS = 200;
    private static final int[] WIDTHS = {1024, 1280, 1600, 1920};
    private static final Pattern SCHEME = Pattern.compile("^[a-zA-Z][a-zA-Z0-9+.-]*:");
    private static final Pattern CHROME = Pattern.compile("Chrome/([0-9.]+)");

    private static final int BG = Color.rgb(16, 24, 34);
    private static final int FIELD = Color.rgb(30, 41, 56);
    private static final int ACCENT = Color.rgb(80, 230, 170);
    private static final int INK = Color.WHITE;
    private static final int INK_DIM = 0xFFB8C2CF;

    private WebView web;
    private EditText address;
    private TextView notice;
    private ProgressBar progress;
    private LinearLayout root, topBar, bottomBar;
    private FrameLayout stage, fullscreenHolder;
    private View customView;
    private WebChromeClient.CustomViewCallback customViewCallback;

    private JSONArray bookmarks;
    private int desktopWidth = 1280;
    private ScriptHandler viewportScript;
    private boolean clearingData;
    private boolean clearHistoryAfterLoad;
    private boolean safeBrowsingReady;
    private boolean pickerActive;
    private ValueCallback<Uri[]> upload;
    private long pageGeneration;
    private long uploadGeneration;
    private boolean selftest;
    private boolean selftestDone;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    public void onCreate(Bundle state) {
        super.onCreate(state);
        selftest = BuildConfig.DEBUG && getIntent() != null && getIntent().hasExtra("browser.selftest");
        desktopWidth = getPreferences(MODE_PRIVATE).getInt("width", 1280);
        loadBookmarks();
        WebView.setWebContentsDebuggingEnabled(false);

        buildLayout();
        setContentView(root);
        // 화면 끝까지 쓰고, 상태 표시줄·내비게이션·키보드·카메라 구멍만큼만 직접 띄웁니다
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        ViewCompat.setOnApplyWindowInsetsListener(root, (v, insets) -> {
            Insets in = insets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout() | WindowInsetsCompat.Type.ime());
            boolean full = customView != null;
            v.setPadding(full ? 0 : in.left, full ? 0 : in.top, full ? 0 : in.right, full ? 0 : in.bottom);
            return WindowInsetsCompat.CONSUMED;
        });

        setupWeb();
        if (state != null && web.restoreState(state) != null) {
            if (!UrlPolicy.isAllowed(web.getUrl())) web.loadUrl(HOME);
        } else {
            String start = selftest ? getIntent().getStringExtra("browser.url") : null;
            web.loadUrl(start != null && UrlPolicy.isAllowed(start) ? start : HOME);
        }
    }

    // ---------- 화면 ----------

    private int dp(float v) {
        return Math.round(v * getResources().getDisplayMetrics().density);
    }

    private void buildLayout() {
        root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(BG);

        // 위: 주소 줄 하나 (주소 · 네이버 · 유튜브)
        topBar = new LinearLayout(this);
        topBar.setGravity(Gravity.CENTER_VERTICAL);
        topBar.setPadding(dp(6), 0, dp(2), 0);
        address = new EditText(this);
        address.setSingleLine(true);
        address.setTextColor(INK);
        address.setHintTextColor(INK_DIM);
        address.setHint("주소 또는 네이버 검색");
        address.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14);
        address.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_URI);
        address.setImeOptions(EditorInfo.IME_ACTION_GO | EditorInfo.IME_FLAG_NO_EXTRACT_UI);
        address.setSelectAllOnFocus(true);
        address.setPadding(dp(12), 0, dp(12), 0);
        GradientDrawable pill = new GradientDrawable();
        pill.setColor(FIELD);
        pill.setCornerRadius(dp(17));
        address.setBackground(pill);
        address.setOnEditorActionListener((v, action, event) -> {
            navigate(address.getText().toString());
            return true;
        });
        topBar.addView(address, new LinearLayout.LayoutParams(0, dp(34), 1f));
        topBar.addView(barButton("네이버", () -> navigate(HOME), ACCENT, 9, 13), new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, dp(40)));
        topBar.addView(barButton("유튜브", () -> navigate(WebLinkResolver.YOUTUBE_HOME), ACCENT, 9, 13), new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, dp(40)));
        root.addView(topBar, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(40)));

        // 차단 알림: 인증서 오류·유해 사이트일 때만 보입니다
        notice = new TextView(this);
        notice.setTextColor(Color.WHITE);
        notice.setBackgroundColor(0xFFB3261E);
        notice.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12);
        notice.setPadding(dp(12), dp(4), dp(12), dp(4));
        notice.setVisibility(View.GONE);
        root.addView(notice);

        // 가운데: 웹 화면 (+ 위에 겹친 가는 진행 표시)
        stage = new FrameLayout(this);
        web = new WebView(this);
        stage.addView(web, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progress.setMax(100);
        progress.setVisibility(View.GONE);
        stage.addView(progress, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(3), Gravity.TOP));
        root.addView(stage, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));

        // 아래: 뒤로 · 앞으로 · 홈 · 새로고침 · 즐겨찾기 · 설정
        bottomBar = new LinearLayout(this);
        addNav("◀", () -> { if (web.canGoBack()) web.goBack(); });
        addNav("▶", () -> { if (web.canGoForward()) web.goForward(); });
        addNav("홈", () -> web.loadUrl(HOME));
        addNav("새로고침", () -> web.reload());
        addNav("즐겨찾기", this::showBookmarks);
        addNav("설정", this::settings);
        root.addView(bottomBar, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(44)));

        // 동영상 전체 화면
        fullscreenHolder = new FrameLayout(this);
        fullscreenHolder.setBackgroundColor(Color.BLACK);
        fullscreenHolder.setVisibility(View.GONE);
        root.addView(fullscreenHolder, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));
    }

    /** 테두리·여백 없는 납작한 단추 (기본 단추는 안쪽 여백이 커서 줄이 높아집니다) */
    private TextView barButton(String text, Runnable action, int color, int sidePadDp, float textSp) {
        TextView b = new TextView(this);
        b.setText(text);
        b.setTextColor(color);
        b.setTextSize(TypedValue.COMPLEX_UNIT_SP, textSp);
        b.setGravity(Gravity.CENTER);
        b.setPadding(dp(sidePadDp), 0, dp(sidePadDp), 0);
        b.setSingleLine(true);
        b.setClickable(true);
        b.setFocusable(true);
        b.setFilterTouchesWhenObscured(true);
        TypedValue ripple = new TypedValue();
        getTheme().resolveAttribute(android.R.attr.selectableItemBackground, ripple, true);
        b.setBackgroundResource(ripple.resourceId);
        b.setOnClickListener(v -> {
            if (!clearingData) action.run();
        });
        return b;
    }

    private void addNav(String text, Runnable action) {
        bottomBar.addView(barButton(text, action, INK, 0, 12.5f), new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.MATCH_PARENT, 1f));
    }

    private void showNotice(String text) {
        notice.setText(text);
        notice.setVisibility(text == null ? View.GONE : View.VISIBLE);
    }

    // ---------- 웹 화면 설정 ----------

    @SuppressLint("SetJavaScriptEnabled")
    private void setupWeb() {
        WebSettings s = web.getSettings();
        Matcher m = CHROME.matcher(s.getUserAgentString());
        String chrome = m.find() ? m.group(1) : "130.0.0.0";
        s.setUserAgentString("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/" + chrome + " Safari/537.36");
        // 사용자 에이전트만 PC로 바꾸면 "모바일 기기"라는 별도 표시(클라이언트 힌트)가 그대로 나가
        // 모바일 화면을 주는 사이트가 있습니다 → 그 표시도 PC로 맞춥니다.
        if (WebViewFeature.isFeatureSupported(WebViewFeature.USER_AGENT_METADATA)) {
            try {
                UserAgentMetadata meta = new UserAgentMetadata.Builder(WebSettingsCompat.getUserAgentMetadata(s))
                        .setMobile(false).setPlatform("Linux").setPlatformVersion("").setArchitecture("x86")
                        .setModel("").setBitness(64).build();
                WebSettingsCompat.setUserAgentMetadata(s, meta);
            } catch (RuntimeException e) {
                Log.w(TAG, "클라이언트 힌트 설정 실패: " + e);
            }
        }
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(true);
        s.setSupportZoom(true);
        s.setBuiltInZoomControls(true);
        s.setDisplayZoomControls(false);
        s.setTextZoom(100);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setGeolocationEnabled(false);
        s.setSafeBrowsingEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(true);
        s.setSaveFormData(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setJavaScriptCanOpenWindowsAutomatically(false);
        if (Build.VERSION.SDK_INT >= 27) WebView.startSafeBrowsing(this, ok -> safeBrowsingReady = ok);
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(web, false);
        // 보이지 않을 때는 화면 그리는 프로세스의 우선순위를 낮춰 다른 앱에 메모리를 양보
        web.setRendererPriorityPolicy(WebView.RENDERER_PRIORITY_IMPORTANT, true);
        web.setFilterTouchesWhenObscured(true);
        installViewportScript();

        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (clearingData) return true;
                if (request.isForMainFrame()) return handle(request.getUrl());
                return !UrlPolicy.isAllowed(request.getUrl().toString());
            }

            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                String scheme = request.getUrl().getScheme();
                if ("http".equalsIgnoreCase(scheme) || "file".equalsIgnoreCase(scheme) || "content".equalsIgnoreCase(scheme)) {
                    return new WebResourceResponse("text/plain", "UTF-8", new ByteArrayInputStream(new byte[0]));
                }
                return null;
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                pageGeneration++;
                cancelUpload();
                if (!UrlPolicy.isAllowed(url) && !"about:blank".equals(url)) {
                    view.stopLoading();
                    return;
                }
                showNotice(null);
                if (!address.hasFocus()) address.setText(url);
            }

            @Override
            public void onPageCommitVisible(WebView view, String url) {
                if (!clearingData) applyViewport();
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                if (clearingData) {
                    if ("about:blank".equals(url)) finishClearWebData();
                    return;
                }
                if (!UrlPolicy.isAllowed(url)) return;
                applyViewport();
                if (!address.hasFocus()) address.setText(url);
                CookieManager.getInstance().flush();
                if (clearHistoryAfterLoad) {
                    web.clearHistory();
                    clearHistoryAfterLoad = false;
                }
                if (selftest) runSelftest(url);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (!request.isForMainFrame()) return;
                Toast.makeText(MainActivity.this, "페이지를 불러오지 못했습니다. 연결을 확인하고 새로고침하세요.", Toast.LENGTH_LONG).show();
                if (selftest && !selftestDone) {
                    selftestDone = true;
                    Log.i(TAG, "SKIP page load failed (" + error.getErrorCode() + " " + error.getDescription() + ")");
                    Log.i(TAG, "DONE");
                }
            }

            @Override
            public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
                handler.cancel();
                showNotice("인증서 오류 · 연결 차단");
                Toast.makeText(MainActivity.this, "인증서를 확인할 수 없어 연결을 차단했습니다.", Toast.LENGTH_LONG).show();
            }

            @Override
            public void onSafeBrowsingHit(WebView view, WebResourceRequest request, int threatType, SafeBrowsingResponse callback) {
                callback.backToSafety(false);
                showNotice("유해 사이트 감지 · 연결 차단");
                Toast.makeText(MainActivity.this, "유해 사이트로 감지되어 차단했습니다.", Toast.LENGTH_LONG).show();
            }

            @Override
            public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                // 메모리 부족 등으로 화면 그리는 프로세스가 꺼진 경우: 앱이 같이 꺼지지 않게 화면을 다시 만듭니다
                recreate();
                return true;
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int value) {
                progress.setProgress(value);
                progress.setVisibility(value >= 100 ? View.GONE : View.VISIBLE);
            }

            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (clearingData || pickerActive || upload != null || !UrlPolicy.isAllowed(view.getUrl())) {
                    callback.onReceiveValue(null);
                    return true;
                }
                cancelUpload();
                upload = callback;
                uploadGeneration = pageGeneration;
                final long generation = pageGeneration;
                new AlertDialog.Builder(MainActivity.this)
                        .setTitle("파일 제공 확인")
                        .setMessage("현재 페이지: " + UrlPolicy.origin(view.getUrl()) + "\n\n선택한 파일을 이 페이지의 웹 콘텐츠에 제공합니다. 신뢰하는 페이지에서만 선택하세요.")
                        .setNegativeButton("취소", (d, w) -> cancelUpload())
                        .setOnCancelListener(d -> cancelUpload())
                        .setPositiveButton("파일 선택", (d, w) -> pickFile(generation))
                        .show();
                return true;
            }

            @Override
            public void onShowCustomView(View view, CustomViewCallback callback) {
                // 동영상 "전체 화면": 주소 줄·아래 줄을 숨기고 화면 가득
                if (customView != null) {
                    callback.onCustomViewHidden();
                    return;
                }
                customView = view;
                customViewCallback = callback;
                fullscreenHolder.addView(view, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
                setFullscreen(true);
            }

            @Override
            public void onHideCustomView() {
                exitFullscreen();
            }
        });

        web.setDownloadListener((url, userAgent, disposition, mime, length) ->
                Toast.makeText(this, "이 브라우저는 파일 다운로드를 지원하지 않습니다.", Toast.LENGTH_LONG).show());
        // 링크를 길게 누르면: 주소 복사
        web.setOnLongClickListener(v -> {
            WebView.HitTestResult hit = web.getHitTestResult();
            int type = hit.getType();
            String extra = hit.getExtra();
            if (extra == null || type != WebView.HitTestResult.SRC_ANCHOR_TYPE) return false;
            new AlertDialog.Builder(this).setTitle(UrlPolicy.origin(extra).isEmpty() ? "링크" : UrlPolicy.origin(extra))
                    .setMessage(extra.length() > 300 ? extra.substring(0, 300) + "…" : extra)
                    .setPositiveButton("열기", (d, w) -> navigate(extra))
                    .setNeutralButton("주소 복사", (d, w) -> {
                        ClipboardManager cm = (ClipboardManager) getSystemService(CLIPBOARD_SERVICE);
                        if (cm != null) cm.setPrimaryClip(ClipData.newPlainText("링크", extra));
                    })
                    .setNegativeButton("닫기", null).show();
            return true;
        });
    }

    // ---------- PC 화면 폭 ----------

    /**
     * 화면 폭 설정(meta viewport)을 PC 폭으로 맞추는 스크립트.
     * 브라우저는 "가장 나중에 읽은" 설정을 따르므로, 사이트가 넣어 둔 설정까지 모두 PC 폭으로 바꿉니다.
     * 페이지를 읽는 동안에는 새로 나타나는 설정도 지켜보다가, 다 읽으면 지켜보기를 멈춥니다.
     */
    private String viewportJs() {
        return "(function(){var c='width=" + desktopWidth + ", user-scalable=yes';"
                + "function f(){var r=document.head||document.documentElement;if(!r)return;"
                + "var ms=document.querySelectorAll('meta[name=viewport]');"
                + "if(!ms.length){var m=document.createElement('meta');m.name='viewport';m.content=c;r.appendChild(m);return;}"
                + "for(var i=0;i<ms.length;i++)if(ms[i].content!==c)ms[i].content=c;}"
                + "f();"
                + "if(document.readyState==='loading'){var o=new MutationObserver(f);o.observe(document,{childList:true,subtree:true});"
                + "document.addEventListener('DOMContentLoaded',function(){f();o.disconnect();});}"
                + "window.addEventListener('load',f);})()";
    }

    /**
     * 페이지가 그려지기 전에 화면 폭을 PC 폭으로 정해 둡니다.
     * (다 불러온 뒤에 바꾸면 모바일 폭으로 한 번 그렸다가 다시 그려서 화면이 출렁이고 느립니다)
     */
    private void installViewportScript() {
        if (!WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) return;
        try {
            if (viewportScript != null) viewportScript.remove();
            viewportScript = WebViewCompat.addDocumentStartJavaScript(web, viewportJs(), Collections.singleton("*"));
        } catch (RuntimeException e) {
            Log.w(TAG, "화면 폭 스크립트 설치 실패: " + e);
        }
    }

    /** 사이트가 나중에 화면 폭 설정을 바꿔 놓은 경우를 위한 확인 */
    private void applyViewport() {
        web.evaluateJavascript(viewportJs(), null);
    }

    // ---------- 주소 이동 ----------

    /** 누른 링크를 직접 처리했으면 true (WebView가 그대로 열면 false) */
    private boolean handle(Uri uri) {
        if (clearingData) return true;
        String original = uri.toString();
        String resolved = WebLinkResolver.resolve(original);
        if (resolved == null) {
            String scheme = uri.getScheme();
            boolean webLink = "https".equalsIgnoreCase(scheme) || "http".equalsIgnoreCase(scheme);
            Toast.makeText(this, webLink ? "주소 형식을 확인하세요. 사용자 정보(@)가 포함되거나 잘못된 웹 주소입니다."
                    : "외부 앱 전용 링크입니다. 지원되는 HTTPS 웹 주소가 없어 열지 않았습니다.", Toast.LENGTH_LONG).show();
            return true;
        }
        if (!resolved.equals(original)) {
            web.loadUrl(resolved);
            return true;
        }
        if ("m.naver.com".equalsIgnoreCase(uri.getHost())) { // 네이버 모바일 첫 화면 → PC 첫 화면
            web.loadUrl(uri.buildUpon().authority("www.naver.com").build().toString());
            return true;
        }
        return false;
    }

    private void navigate(String input) {
        String text = input == null ? "" : input.trim();
        if (text.isEmpty()) return;
        if (!SCHEME.matcher(text).find()) {
            if (text.equalsIgnoreCase("youtube") || text.equals("유튜브")) text = WebLinkResolver.YOUTUBE_HOME;
            else if (text.startsWith("//")) text = "https:" + text;
            else if (text.contains(" ") || !text.contains(".") || text.contains(":")) text = "https://search.naver.com/search.naver?query=" + Uri.encode(text);
            else text = "https://" + text;
        }
        String resolved = WebLinkResolver.resolve(text);
        if (resolved == null) {
            Toast.makeText(this, "열 수 없는 주소입니다. HTTPS 웹 주소를 확인하세요.", Toast.LENGTH_LONG).show();
            return;
        }
        address.clearFocus();
        web.requestFocus();
        InputMethodManager imm = (InputMethodManager) getSystemService(INPUT_METHOD_SERVICE);
        if (imm != null) imm.hideSoftInputFromWindow(address.getWindowToken(), 0);
        if (!handle(Uri.parse(resolved))) web.loadUrl(resolved);
    }

    // ---------- 즐겨찾기 ----------

    private void loadBookmarks() {
        JSONArray saved;
        try {
            saved = new JSONArray(getPreferences(MODE_PRIVATE).getString("bookmarks", "[]"));
        } catch (JSONException e) {
            saved = new JSONArray();
        }
        bookmarks = new JSONArray();
        for (int i = 0; i < saved.length() && bookmarks.length() < MAX_BOOKMARKS; i++) {
            JSONObject o = saved.optJSONObject(i);
            if (o != null && UrlPolicy.isAllowed(o.optString("url"))) bookmarks.put(o);
        }
    }

    private void persistBookmarks() {
        getPreferences(MODE_PRIVATE).edit().putString("bookmarks", bookmarks.toString()).apply();
    }

    private void showBookmarks() {
        String[] items = new String[bookmarks.length() + 1];
        items[0] = "＋ 현재 페이지 저장";
        for (int i = 0; i < bookmarks.length(); i++) {
            JSONObject o = bookmarks.optJSONObject(i);
            items[i + 1] = o == null ? "잘못된 항목" : o.optString("title") + "\n" + UrlPolicy.origin(o.optString("url"));
        }
        new AlertDialog.Builder(this).setTitle("즐겨찾기 (" + bookmarks.length() + ")")
                .setItems(items, (d, which) -> {
                    if (which == 0) {
                        editBookmark(-1);
                        return;
                    }
                    final int index = which - 1;
                    JSONObject o = bookmarks.optJSONObject(index);
                    if (o == null) return;
                    new AlertDialog.Builder(this).setTitle(o.optString("title")).setMessage(o.optString("url"))
                            .setPositiveButton("열기", (d2, w) -> navigate(o.optString("url")))
                            .setNeutralButton("이름 수정", (d2, w) -> editBookmark(index))
                            .setNegativeButton("삭제", (d2, w) -> new AlertDialog.Builder(this).setMessage("이 즐겨찾기를 삭제할까요?")
                                    .setNegativeButton("취소", null)
                                    .setPositiveButton("삭제", (d3, w3) -> {
                                        bookmarks.remove(index);
                                        persistBookmarks();
                                        showBookmarks();
                                    }).show())
                            .show();
                })
                .setNegativeButton("닫기", null).show();
    }

    /** index < 0: 현재 페이지를 새로 저장 */
    private void editBookmark(int index) {
        final String url = index >= 0 ? bookmarks.optJSONObject(index).optString("url") : web.getUrl();
        if (!UrlPolicy.isAllowed(url)) {
            Toast.makeText(this, "저장할 HTTPS 페이지를 먼저 열어주세요.", Toast.LENGTH_SHORT).show();
            return;
        }
        int at = index;
        if (at < 0) {
            for (int i = 0; i < bookmarks.length(); i++) {
                JSONObject o = bookmarks.optJSONObject(i);
                if (o != null && url.equals(o.optString("url"))) {
                    at = i;
                    break;
                }
            }
        }
        if (at < 0 && bookmarks.length() >= MAX_BOOKMARKS) {
            Toast.makeText(this, "즐겨찾기는 최대 200개까지 저장합니다.", Toast.LENGTH_SHORT).show();
            return;
        }
        final int target = at;
        EditText name = new EditText(this);
        name.setSingleLine(true);
        name.setFilters(new InputFilter[]{new InputFilter.LengthFilter(100)});
        name.setText(target >= 0 ? bookmarks.optJSONObject(target).optString("title") : web.getTitle());
        new AlertDialog.Builder(this).setTitle(target >= 0 ? "즐겨찾기 수정" : "즐겨찾기 저장").setMessage(url).setView(name)
                .setNegativeButton("취소", null)
                .setPositiveButton("저장", (d, w) -> {
                    String title = name.getText().toString().trim();
                    if (title.isEmpty()) title = UrlPolicy.origin(url);
                    try {
                        JSONObject o = new JSONObject().put("title", title).put("url", url);
                        if (target >= 0) bookmarks.put(target, o);
                        else bookmarks.put(o);
                    } catch (JSONException e) {
                        return;
                    }
                    persistBookmarks();
                    Toast.makeText(this, "즐겨찾기에 저장했습니다.", Toast.LENGTH_SHORT).show();
                }).show();
    }

    // ---------- 설정 ----------

    private void settings() {
        String[] items = {"PC 화면 폭 설정 (현재 " + desktopWidth + ")", "웹 데이터 삭제", "보안 상태", "앱 정보"};
        new AlertDialog.Builder(this).setTitle("덜누름 브라우저").setItems(items, (d, which) -> {
            if (which == 0) {
                new AlertDialog.Builder(this).setTitle("PC 화면 폭")
                        .setItems(new String[]{"1024 px", "1280 px", "1600 px", "1920 px"}, (d2, w) -> {
                            desktopWidth = WIDTHS[w];
                            getPreferences(MODE_PRIVATE).edit().putInt("width", desktopWidth).apply();
                            installViewportScript();
                            web.reload();
                        }).show();
            } else if (which == 1) {
                new AlertDialog.Builder(this).setMessage("로그인·쿠키·캐시·웹 저장소·탐색 기록을 삭제할까요? 즐겨찾기는 유지됩니다.")
                        .setNegativeButton("취소", null).setPositiveButton("삭제", (d2, w) -> clearWebData()).show();
            } else if (which == 2) {
                new AlertDialog.Builder(this).setTitle("보안 상태")
                        .setMessage("• HTTPS 전용 / 인증서 오류 차단\n• HTTP 혼합 콘텐츠 차단\n• 로컬 파일·외부 앱 링크 차단\n• 제3자 쿠키 차단\n• 카메라·마이크·위치 권한 없음\n• 앱 백업·웹 디버깅 비활성화\n• 파일 제공 전 확인\n\nSafe Browsing: "
                                + (safeBrowsingReady ? "초기화 완료" : "활성화 요청됨 · 초기화 미확인")
                                + "\n탐지 범위는 기기의 WebView와 서비스 상태에 따라 다릅니다.\n\nWebView를 최신 버전으로 유지하세요. HTTPS만으로 사이트의 신뢰성이 보장되지는 않습니다.")
                        .setPositiveButton("확인", null).show();
            } else {
                new AlertDialog.Builder(this).setTitle("덜누름 브라우저 " + BuildConfig.VERSION_NAME)
                        .setMessage("네이버를 시작 페이지로 사용하는 독립 WebView 앱입니다. 네이버·웨일·유튜브 공식 앱이 아닙니다.\n\nPC 사용자 에이전트와 넓은 화면 폭을 항상 사용합니다. 사이트별 정책에 따라 PC 표시·로그인·결제가 제한될 수 있습니다. 동기화·확장 프로그램·다중 탭·파일 다운로드는 지원하지 않습니다.\n\n단축키(키보드 연결 시): Ctrl+L 주소, F5·Ctrl+R 새로고침, Alt+←/→ 뒤로·앞으로, Ctrl+D 즐겨찾기 저장")
                        .setPositiveButton("확인", null).show();
            }
        }).show();
    }

    private void clearWebData() {
        clearingData = true;
        cancelUpload();
        web.stopLoading();
        web.loadUrl("about:blank");
    }

    private void finishClearWebData() {
        CookieManager.getInstance().removeAllCookies(done -> {
            if (isFinishing() || isDestroyed()) return;
            CookieManager.getInstance().flush();
            web.clearCache(true);
            web.clearFormData();
            web.clearHistory();
            WebStorage.getInstance().deleteAllData();
            WebViewDatabase db = WebViewDatabase.getInstance(this);
            db.clearHttpAuthUsernamePassword();
            clearingData = false;
            clearHistoryAfterLoad = true;
            web.loadUrl(HOME);
            Toast.makeText(this, "웹 데이터 삭제 완료 · 즐겨찾기는 유지됩니다.", Toast.LENGTH_LONG).show();
        });
    }

    // ---------- 파일 올리기 ----------

    private void cancelUpload() {
        if (upload == null) return;
        ValueCallback<Uri[]> cb = upload;
        upload = null;
        cb.onReceiveValue(null);
    }

    private void pickFile(long generation) {
        if (upload == null || generation != pageGeneration) {
            cancelUpload();
            return;
        }
        Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*")
                .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        try {
            pickerActive = true;
            startActivityForResult(i, REQ_FILE);
        } catch (ActivityNotFoundException e) {
            pickerActive = false;
            cancelUpload();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != REQ_FILE) return;
        pickerActive = false;
        if (upload == null) return;
        Uri uri = data == null ? null : data.getData();
        boolean ok = resultCode == RESULT_OK && uri != null && "content".equals(uri.getScheme())
                && uploadGeneration == pageGeneration && uri.getAuthority() != null
                && !uri.getAuthority().startsWith(getPackageName());
        if (ok) {
            try (ParcelFileDescriptor fd = getContentResolver().openFileDescriptor(uri, "r")) {
                ok = fd != null;
            } catch (Exception e) {
                ok = false;
            }
        }
        if (!ok) {
            cancelUpload();
            return;
        }
        ValueCallback<Uri[]> cb = upload;
        upload = null;
        cb.onReceiveValue(new Uri[]{uri});
    }

    // ---------- 전체 화면 ----------

    private void setFullscreen(boolean on) {
        topBar.setVisibility(on ? View.GONE : View.VISIBLE);
        bottomBar.setVisibility(on ? View.GONE : View.VISIBLE);
        stage.setVisibility(on ? View.GONE : View.VISIBLE);
        fullscreenHolder.setVisibility(on ? View.VISIBLE : View.GONE);
        if (on) notice.setVisibility(View.GONE);
        WindowInsetsControllerCompat c = WindowCompat.getInsetsController(getWindow(), root);
        if (on) {
            c.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            c.hide(WindowInsetsCompat.Type.systemBars());
        } else {
            c.show(WindowInsetsCompat.Type.systemBars());
        }
        ViewCompat.requestApplyInsets(root);
    }

    private void exitFullscreen() {
        if (customView == null) return;
        fullscreenHolder.removeView(customView);
        customView = null;
        WebChromeClient.CustomViewCallback cb = customViewCallback;
        customViewCallback = null;
        setFullscreen(false);
        if (cb != null) cb.onCustomViewHidden();
    }

    // ---------- 키보드 (DeX·블루투스 키보드) ----------

    @Override
    public boolean dispatchKeyEvent(KeyEvent e) {
        if (e.getAction() == KeyEvent.ACTION_DOWN && e.getRepeatCount() == 0 && !clearingData) {
            int k = e.getKeyCode();
            boolean ctrl = e.isCtrlPressed(), alt = e.isAltPressed();
            if ((ctrl && k == KeyEvent.KEYCODE_L) || k == KeyEvent.KEYCODE_F6) {
                address.requestFocus();
                address.selectAll();
                return true;
            }
            if ((ctrl && k == KeyEvent.KEYCODE_R) || k == KeyEvent.KEYCODE_F5) {
                web.reload();
                return true;
            }
            if (alt && k == KeyEvent.KEYCODE_DPAD_LEFT) {
                if (web.canGoBack()) web.goBack();
                return true;
            }
            if (alt && k == KeyEvent.KEYCODE_DPAD_RIGHT) {
                if (web.canGoForward()) web.goForward();
                return true;
            }
            if (ctrl && k == KeyEvent.KEYCODE_D) {
                editBookmark(-1);
                return true;
            }
            if (k == KeyEvent.KEYCODE_ESCAPE && address.hasFocus()) {
                address.setText(web.getUrl());
                address.clearFocus();
                web.requestFocus();
                return true;
            }
        }
        return super.dispatchKeyEvent(e);
    }

    @Override
    public void onBackPressed() {
        if (clearingData) return;
        if (customView != null) exitFullscreen();
        else if (web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }

    // ---------- 수명 ----------

    @Override
    protected void onResume() {
        super.onResume();
        if (web != null) {
            web.onResume();
            web.resumeTimers();
        }
    }

    @Override
    protected void onPause() {
        // 안 보이는 동안에는 페이지의 타이머·애니메이션을 멈춰 배터리를 아낍니다
        if (customView != null) exitFullscreen();
        web.onPause();
        if (!pickerActive) web.pauseTimers();
        CookieManager.getInstance().flush();
        super.onPause();
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    protected void onDestroy() {
        cancelUpload();
        stage.removeView(web);
        web.destroy();
        super.onDestroy();
    }

    // ---------- 자동 점검 (시험용 빌드) ----------

    private void runSelftest(String url) {
        if (selftestDone) return;
        selftestDone = true;
        float d = getResources().getDisplayMetrics().density;
        int top = Math.round(topBar.getHeight() / d), bottom = Math.round(bottomBar.getHeight() / d);
        int above = Math.round((stage.getTop() - root.getPaddingTop()) / d);
        Log.i(TAG, (top == 40 && above == 40 && bottom == 44 ? "PASS" : "FAIL") + " layout topBar=" + top + "dp webStartsAt=" + above + "dp bottomBar=" + bottom + "dp");
        web.postDelayed(() -> web.evaluateJavascript("JSON.stringify({w:window.innerWidth,ua:navigator.userAgent,"
                + "mobile:navigator.userAgentData?navigator.userAgentData.mobile:null,"
                + "platform:navigator.userAgentData?navigator.userAgentData.platform:null,"
                + "vp:(document.querySelector('meta[name=viewport]')||{}).content||null})", v -> {
            try {
                JSONObject o = new JSONObject(new JSONArray("[" + v + "]").getString(0));
                String ua = o.optString("ua");
                boolean uaOk = ua.contains("X11; Linux x86_64") && !ua.contains("Android") && !ua.contains("Mobile");
                Log.i(TAG, (uaOk ? "PASS" : "FAIL") + " user agent " + ua);
                Log.i(TAG, (o.optInt("w") == desktopWidth ? "PASS" : "FAIL") + " page width " + o.optInt("w") + " (want " + desktopWidth + ") viewport=" + o.optString("vp") + " url=" + url);
                if (o.isNull("mobile")) Log.i(TAG, "SKIP client hints (이 WebView는 지원 안 함)");
                else Log.i(TAG, (!o.optBoolean("mobile") && "Linux".equals(o.optString("platform")) ? "PASS" : "FAIL") + " client hints mobile=" + o.opt("mobile") + " platform=" + o.optString("platform"));
            } catch (JSONException e) {
                Log.i(TAG, "FAIL selftest parse " + v);
            }
            Log.i(TAG, "DONE");
        }), 1500);
    }
}
