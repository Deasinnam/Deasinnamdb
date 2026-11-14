package com.daesinnam.browser;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.app.DownloadManager;
import android.content.ActivityNotFoundException;
import android.content.BroadcastReceiver;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.net.http.SslError;
import android.os.Build;
import android.media.MediaScannerConnection;
import android.os.Bundle;
import android.os.Environment;
import android.os.ParcelFileDescriptor;
import android.provider.MediaStore;
import android.text.InputFilter;
import android.text.InputType;
import android.text.format.Formatter;
import android.util.Base64;
import android.util.Log;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputMethodManager;
import android.webkit.CookieManager;
import android.webkit.MimeTypeMap;
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

import androidx.core.content.ContextCompat;
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
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.Collections;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 덜누름 브라우저 — 언제나 PC 화면으로 여는 가벼운 브라우저.
 *
 *  - PC용 사용자 에이전트와 넓은 화면 폭(1024~1920)을 항상 씁니다.
 *  - HTTPS만 엽니다. 인증서 오류·유해 사이트·로컬 파일·외부 앱 링크는 막습니다.
 *  - 위쪽은 주소 줄 한 줄만 둡니다(40dp). 진행 표시는 화면 위에 겹쳐 그려 자리를 차지하지 않습니다.
 *  - 파일 받기: 확인을 받은 뒤 휴대폰의 "다운로드" 폴더에 저장합니다.
 */
public class MainActivity extends Activity {
    private static final String TAG = "BROWSER_SELFTEST";
    private static final String HOME = "https://www.naver.com/";
    private static final String STUDIO = "https://studio.youtube.com/";
    private static final int REQ_FILE = 42;
    private static final int REQ_STORAGE = 43;
    /** 페이지가 스크립트로 만든 파일(blob·data 주소)은 앱 메모리를 거쳐 저장하므로 크기를 제한합니다 */
    private static final long MAX_INLINE_BYTES = 40L * 1024 * 1024;
    private static final String DL_BRIDGE = "__dnDownload";
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
    private ScriptHandler downloadScript;
    private boolean bridgeReady;
    private String blobToken, blobName, blobMime;
    private Runnable afterStoragePermission;
    private final Set<Long> myDownloads = new HashSet<>();
    private final ExecutorService io = Executors.newSingleThreadExecutor();
    private BroadcastReceiver downloadDone;
    private int selftestDownloadsLeft;
    private boolean selftest;
    private boolean googleTest;
    private boolean googleTestStarted;
    private boolean selftestDone;
    private int selftestRetries;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    public void onCreate(Bundle state) {
        super.onCreate(state);
        selftest = BuildConfig.DEBUG && getIntent() != null && getIntent().hasExtra("browser.selftest");
        googleTest = selftest && getIntent().getBooleanExtra("browser.google", false);
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
        registerDownloadReceiver();
        if (selftest) root.postDelayed(this::layoutSelftest, 2500);
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
        topBar.addView(barButton("스튜디오", () -> navigate(STUDIO), ACCENT, 9, 13), new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, dp(40)));
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
                // 브랜드 목록에 "Android WebView"가 있으면 구글 로그인이 "안전하지 않은 브라우저"로 막습니다 → Chromium만 남김
                String major = chrome.split("\\.")[0];
                java.util.List<UserAgentMetadata.BrandVersion> brands = new java.util.ArrayList<>();
                brands.add(new UserAgentMetadata.BrandVersion.Builder().setBrand("Chromium").setMajorVersion(major).setFullVersion(chrome).build());
                brands.add(new UserAgentMetadata.BrandVersion.Builder().setBrand("Not:A-Brand").setMajorVersion("24").setFullVersion("24.0.0.0").build());
                UserAgentMetadata meta = new UserAgentMetadata.Builder(WebSettingsCompat.getUserAgentMetadata(s))
                        .setBrandVersionList(brands).setFullVersion(chrome)
                        .setMobile(false).setPlatform("Linux").setPlatformVersion("").setArchitecture("x86")
                        .setModel("").setBitness(64).build();
                WebSettingsCompat.setUserAgentMetadata(s, meta);
            } catch (RuntimeException e) {
                Log.w(TAG, "클라이언트 힌트 설정 실패: " + e);
            }
        }
        // 요청마다 붙는 "이 앱 이름(X-Requested-With)" 표시를 끕니다. 구글은 이 표시가 있으면 앱 속 브라우저로 보고 로그인을 막습니다.
        if (WebViewFeature.isFeatureSupported(WebViewFeature.REQUESTED_WITH_HEADER_ALLOW_LIST)) {
            try {
                WebSettingsCompat.setRequestedWithHeaderOriginAllowList(s, Collections.emptySet());
            } catch (RuntimeException e) {
                Log.w(TAG, "앱 이름 표시 끄기 실패: " + e);
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
                updateThirdPartyCookies(url);
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
                if (googleTest) runGoogleTest(url);
                else if (selftest) runSelftest(url);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (!request.isForMainFrame()) return;
                Toast.makeText(MainActivity.this, "페이지를 불러오지 못했습니다. 연결을 확인하고 새로고침하세요.", Toast.LENGTH_LONG).show();
                if (selftest && !selftestDone) {
                    // 에뮬레이터가 막 켜져 인터넷이 아직 안 될 수 있음 → 몇 번 다시 시도
                    if (selftestRetries++ < 8) {
                        web.postDelayed(() -> web.reload(), 5000);
                    } else {
                        selftestDone = true;
                        Log.i(TAG, "SKIP page load failed (" + error.getErrorCode() + " " + error.getDescription() + ")");
                        Log.i(TAG, "DONE");
                    }
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

        web.setDownloadListener((url, userAgent, disposition, mime, length) -> onDownload(url, disposition, mime, length));
        installDownloadBridge();
        // 링크를 길게 누르면: 주소 복사 / 이미지를 길게 누르면: 이미지 저장
        web.setOnLongClickListener(v -> {
            WebView.HitTestResult hit = web.getHitTestResult();
            int type = hit.getType();
            String extra = hit.getExtra();
            if (extra == null) return false;
            if (type == WebView.HitTestResult.IMAGE_TYPE || type == WebView.HitTestResult.SRC_IMAGE_ANCHOR_TYPE) {
                final String img = extra;
                new AlertDialog.Builder(this).setTitle("이미지")
                        .setItems(new String[]{"이미지 저장", "이미지 주소 복사"}, (d, w) -> {
                            if (w == 0) {
                                String mime = guessMime(DownloadNames.fromUrl(img), null);
                                startDownload(img, DownloadNames.choose(null, img, null, extensionFor(mime)), mime);
                            } else {
                                ClipboardManager cm = (ClipboardManager) getSystemService(CLIPBOARD_SERVICE);
                                if (cm != null) cm.setPrimaryClip(ClipData.newPlainText("이미지 주소", img));
                            }
                        }).setNegativeButton("닫기", null).show();
                return true;
            }
            if (type != WebView.HitTestResult.SRC_ANCHOR_TYPE) return false;
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

    // ---------- 구글·유튜브 로그인 ----------

    /** 구글·유튜브 사이트인지 (주소의 호스트로 판단) */
    static boolean isGoogleSite(String url) {
        UrlPolicy.Parts p = UrlPolicy.parse(url);
        if (p == null) return false;
        String h = p.host.toLowerCase(Locale.ROOT);
        for (String d : new String[]{"google.com", "google.co.kr", "youtube.com"}) {
            if (h.equals(d) || h.endsWith("." + d)) return true;
        }
        return false;
    }

    /**
     * 구글 로그인은 accounts.google.com ↔ youtube.com 사이를 오가며 로그인 상태를 맞추므로
     * 구글·유튜브 페이지를 볼 때만 제3자 쿠키를 허용합니다 (다른 사이트에서는 계속 차단).
     */
    private void updateThirdPartyCookies(String url) {
        CookieManager.getInstance().setAcceptThirdPartyCookies(web, isGoogleSite(url));
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
            else if (text.equalsIgnoreCase("studio") || text.equals("스튜디오") || text.equals("유튜브 스튜디오")) text = STUDIO;
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
        String[] items = {"PC 화면 폭 설정 (현재 " + desktopWidth + ")", "받은 파일 보기", "웹 데이터 삭제", "보안 상태", "앱 정보"};
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
                openDownloads();
            } else if (which == 2) {
                new AlertDialog.Builder(this).setMessage("로그인·쿠키·캐시·웹 저장소·탐색 기록을 삭제할까요? 즐겨찾기는 유지됩니다.")
                        .setNegativeButton("취소", null).setPositiveButton("삭제", (d2, w) -> clearWebData()).show();
            } else if (which == 3) {
                new AlertDialog.Builder(this).setTitle("보안 상태")
                        .setMessage("• HTTPS 전용 / 인증서 오류 차단\n• HTTP 혼합 콘텐츠 차단\n• 로컬 파일·외부 앱 링크 차단\n• 제3자 쿠키 차단 (구글·유튜브 페이지에서만 로그인 유지를 위해 허용)\n• 카메라·마이크·위치 권한 없음\n• 앱 백업·웹 디버깅 비활성화\n• 파일 제공 전 확인\n• 파일 받기 전 확인 · HTTPS 파일만\n\nSafe Browsing: "
                                + (safeBrowsingReady ? "초기화 완료" : "활성화 요청됨 · 초기화 미확인")
                                + "\n탐지 범위는 기기의 WebView와 서비스 상태에 따라 다릅니다.\n\nWebView를 최신 버전으로 유지하세요. HTTPS만으로 사이트의 신뢰성이 보장되지는 않습니다.")
                        .setPositiveButton("확인", null).show();
            } else {
                new AlertDialog.Builder(this).setTitle("덜누름 브라우저 " + BuildConfig.VERSION_NAME)
                        .setMessage("네이버를 시작 페이지로 사용하는 독립 WebView 앱입니다. 네이버·웨일·유튜브 공식 앱이 아닙니다.\n\nPC 사용자 에이전트와 넓은 화면 폭을 항상 사용합니다. 사이트별 정책에 따라 PC 표시·로그인·결제가 제한될 수 있습니다. 받은 파일은 휴대폰의 \"다운로드\" 폴더에 저장됩니다. 동기화·확장 프로그램·다중 탭은 지원하지 않습니다.\n\n단축키(키보드 연결 시): Ctrl+L 주소, F5·Ctrl+R 새로고침, Alt+←/→ 뒤로·앞으로, Ctrl+D 즐겨찾기 저장, Ctrl+J 받은 파일")
                        .setPositiveButton("확인", null).show();
            }
        }).show();
    }

    private void clearWebData() {
        clearingData = true;
        blobToken = null;
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

    // ---------- 파일 받기 ----------

    /**
     * 페이지에 미리 넣어 두는 받기 도우미:
     *  - 사이트가 파일을 넘기자마자 blob 주소를 지워 버리면(revokeObjectURL) 받을 수가 없어 1분 늦춰 지웁니다.
     *  - &lt;a download="이름"&gt;으로 정한 파일 이름을 기억해 둡니다.
     */
    private static final String DOWNLOAD_HELPER_JS = "(function(){if(window.__dnNames)return;var n=window.__dnNames={};"
            + "try{var rv=URL.revokeObjectURL.bind(URL);URL.revokeObjectURL=function(u){setTimeout(function(){rv(u);},60000);};}catch(e){}"
            + "function rec(a){try{if(a&&a.hasAttribute&&a.hasAttribute('download')&&a.href)n[a.href]=a.getAttribute('download');}catch(e){}}"
            + "try{var ck=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){rec(this);return ck.apply(this,arguments);};}catch(e){}"
            + "document.addEventListener('click',function(e){rec(e.target&&e.target.closest?e.target.closest('a[download]'):null);},true);})()";

    private void installDownloadBridge() {
        if (WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) {
            try {
                downloadScript = WebViewCompat.addDocumentStartJavaScript(web, DOWNLOAD_HELPER_JS, Collections.singleton("*"));
            } catch (RuntimeException e) {
                Log.w(TAG, "받기 도우미 설치 실패: " + e);
            }
        }
        // blob 주소의 내용을 페이지에서 꺼내 앱으로 건네받는 통로 (앱이 요청한 받기에만 응답)
        if (WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
            try {
                WebViewCompat.addWebMessageListener(web, DL_BRIDGE, Collections.singleton("*"),
                        (view, message, sourceOrigin, isMainFrame, reply) -> {
                            if (isMainFrame) onBlobMessage(message.getData());
                        });
                bridgeReady = true;
            } catch (RuntimeException e) {
                Log.w(TAG, "받기 통로 설치 실패: " + e);
            }
        }
    }

    private void onDownload(String url, String disposition, String mime, long length) {
        if (clearingData || url == null) return;
        String lower = url.toLowerCase(Locale.ROOT);
        boolean https = UrlPolicy.isAllowed(url);
        boolean blob = lower.startsWith("blob:https://");
        boolean data = lower.startsWith("data:");
        if (!https && !blob && !data) {
            Toast.makeText(this, "HTTPS로 제공되는 파일만 받을 수 있습니다.", Toast.LENGTH_LONG).show();
            return;
        }
        if (data && url.length() > MAX_INLINE_BYTES * 4 / 3 + 1024) {
            Toast.makeText(this, "파일이 너무 커서 받을 수 없습니다.", Toast.LENGTH_LONG).show();
            return;
        }
        String type = cleanMime(mime);
        if (data && type == null) type = cleanMime(dataUrlMime(url));
        String name = DownloadNames.choose(disposition, url, null, extensionFor(type));
        final String finalType = guessMime(name, type);
        String from = UrlPolicy.origin(https ? url : blob ? url.substring(5) : web.getUrl());
        String size = length > 0 ? Formatter.formatShortFileSize(this, length) : "크기 알 수 없음";
        Runnable go = () -> startDownload(url, name, finalType);
        if (selftest) {
            go.run();
            return;
        }
        new AlertDialog.Builder(this).setTitle("파일 받기")
                .setMessage(name + "\n" + size + "\n보낸 곳: " + (from.isEmpty() ? "알 수 없음" : from)
                        + "\n\n휴대폰의 \"다운로드\" 폴더에 저장합니다. 모르는 사이트에서 받은 파일은 열기 전에 주의하세요.")
                .setNegativeButton("취소", null)
                .setPositiveButton("받기", (d, w) -> go.run())
                .show();
    }

    /** 확인이 끝난 받기를 실제로 시작합니다 (주소 종류에 따라 방법이 다름) */
    private void startDownload(String url, String name, String mime) {
        if (clearingData) return;
        withStoragePermission(() -> {
            String lower = url.toLowerCase(Locale.ROOT);
            if (lower.startsWith("data:")) saveDataUrl(url, name, mime);
            else if (lower.startsWith("blob:")) fetchBlob(url, name, mime);
            else if (UrlPolicy.isAllowed(url)) systemDownload(url, name, mime);
            else Toast.makeText(this, "HTTPS로 제공되는 파일만 받을 수 있습니다.", Toast.LENGTH_LONG).show();
        });
    }

    /** 일반 파일: 안드로이드 다운로드 관리자에 맡깁니다 (앱을 닫아도 계속 받고, 알림에 진행이 보임) */
    private void systemDownload(String url, String name, String mime) {
        DownloadManager dm = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
        if (dm == null) {
            downloadFailed(name, "다운로드 관리자를 쓸 수 없습니다.");
            return;
        }
        try {
            DownloadManager.Request r = new DownloadManager.Request(Uri.parse(url));
            if (mime != null) r.setMimeType(mime);
            // 로그인해야 받을 수 있는 파일을 위해 이 사이트의 쿠키와 같은 사용자 에이전트를 함께 보냅니다
            String cookie = CookieManager.getInstance().getCookie(url);
            if (cookie != null && !cookie.isEmpty()) r.addRequestHeader("Cookie", cookie);
            r.addRequestHeader("User-Agent", web.getSettings().getUserAgentString());
            String page = web.getUrl();
            if (UrlPolicy.isAllowed(page)) {
                // 같은 사이트면 전체 주소, 다른 사이트면 사이트 주소만 (일반 브라우저와 같은 방식)
                r.addRequestHeader("Referer", UrlPolicy.origin(page).equals(UrlPolicy.origin(url)) ? page : UrlPolicy.origin(page) + "/");
            }
            r.setTitle(name);
            r.setDescription("덜누름 브라우저");
            r.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            r.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, name);
            myDownloads.add(dm.enqueue(r));
            Toast.makeText(this, "받는 중: " + name + "\n알림에서 진행 상황을 볼 수 있습니다.", Toast.LENGTH_SHORT).show();
        } catch (RuntimeException e) {
            Log.w(TAG, "다운로드 시작 실패: " + e);
            downloadFailed(name, "받기를 시작하지 못했습니다.");
        }
    }

    private void registerDownloadReceiver() {
        downloadDone = new BroadcastReceiver() {
            @Override
            public void onReceive(Context c, Intent i) {
                long id = i.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
                if (!myDownloads.remove(id)) return;
                DownloadManager dm = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
                if (dm == null) return;
                int status = -1, reason = 0;
                String title = "파일";
                try (Cursor cur = dm.query(new DownloadManager.Query().setFilterById(id))) {
                    if (cur != null && cur.moveToFirst()) {
                        status = cur.getInt(cur.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS));
                        reason = cur.getInt(cur.getColumnIndexOrThrow(DownloadManager.COLUMN_REASON));
                        String t = cur.getString(cur.getColumnIndexOrThrow(DownloadManager.COLUMN_TITLE));
                        if (t != null) title = t;
                    }
                } catch (RuntimeException e) {
                    Log.w(TAG, "다운로드 상태 확인 실패: " + e);
                }
                if (status == DownloadManager.STATUS_SUCCESSFUL) downloadSaved(title, "https");
                else if (status == -1) downloadFailed(title, "받기가 취소되었습니다.");
                else downloadFailed(title, reason >= 400 && reason < 600
                        ? "사이트가 파일을 주지 않았습니다 (" + reason + "). 로그인이 필요하거나 기간이 지난 링크일 수 있습니다."
                        : "받지 못했습니다. 연결과 저장 공간을 확인하세요.");
            }
        };
        ContextCompat.registerReceiver(this, downloadDone, new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE), ContextCompat.RECEIVER_EXPORTED);
    }

    /** blob 주소: 페이지 안에서 내용을 꺼내(data 주소로) 앱에 건네받은 뒤 저장합니다 */
    private void fetchBlob(String url, String name, String mime) {
        if (!bridgeReady) {
            downloadFailed(name, "이 기기의 WebView가 오래되어 이 방식의 파일은 받을 수 없습니다. Android System WebView를 업데이트하세요.");
            return;
        }
        blobToken = UUID.randomUUID().toString();
        blobName = name;
        blobMime = mime;
        String js = "(function(){var u=" + JSONObject.quote(url) + ",t=" + JSONObject.quote(blobToken) + ";"
                + "function p(o){o.t=t;try{" + DL_BRIDGE + ".postMessage(JSON.stringify(o));}catch(e){}}"
                + "var n=(window.__dnNames||{})[u]||null;"
                + "if(!n){try{var as=document.querySelectorAll('a[download]');for(var i=0;i<as.length;i++)if(as[i].href===u){n=as[i].getAttribute('download');break;}}catch(e){}}"
                + "fetch(u).then(function(r){return r.blob();}).then(function(b){"
                + "if(b.size>" + MAX_INLINE_BYTES + "){p({err:'big'});return;}"
                + "var f=new FileReader();f.onload=function(){p({data:f.result,type:b.type,name:n});};"
                + "f.onerror=function(){p({err:'read'});};f.readAsDataURL(b);"
                + "}).catch(function(e){p({err:String(e)});});})()";
        web.evaluateJavascript(js, null);
        final String token = blobToken;
        web.postDelayed(() -> {
            if (token.equals(blobToken)) {
                blobToken = null;
                downloadFailed(name, "파일을 꺼내지 못했습니다. 페이지를 새로고침한 뒤 다시 받아 보세요.");
            }
        }, 60000);
    }

    private void onBlobMessage(String raw) {
        if (raw == null || blobToken == null) return;
        JSONObject o;
        try {
            o = new JSONObject(raw);
        } catch (JSONException e) {
            return;
        }
        if (!blobToken.equals(o.optString("t"))) return; // 앱이 요청하지 않은 메시지는 무시
        blobToken = null;
        String name = blobName, mime = blobMime;
        String err = o.optString("err", "");
        if (!err.isEmpty()) {
            downloadFailed(name, "big".equals(err) ? "파일이 너무 커서(40MB 초과) 받을 수 없습니다."
                    : "파일을 꺼내지 못했습니다. 페이지를 새로고침한 뒤 다시 받아 보세요.");
            return;
        }
        String hint = o.optString("name", "");
        if (!hint.isEmpty() && !"null".equals(hint)) {
            String type = cleanMime(o.optString("type", null));
            if (type == null) type = mime;
            name = DownloadNames.choose(null, null, hint, extensionFor(type));
            mime = guessMime(name, type);
        } else if (mime == null) {
            mime = cleanMime(o.optString("type", null));
        }
        saveDataUrl(o.optString("data", ""), name, mime);
    }

    private void saveDataUrl(String dataUrl, String name, String mime) {
        final String n = name;
        io.execute(() -> {
            try {
                int comma = dataUrl.indexOf(',');
                if (!dataUrl.regionMatches(true, 0, "data:", 0, 5) || comma < 0) throw new IOException("data 주소 아님");
                String head = dataUrl.substring(5, comma);
                byte[] bytes = head.toLowerCase(Locale.ROOT).endsWith(";base64")
                        ? Base64.decode(dataUrl.substring(comma + 1), Base64.DEFAULT)
                        : Uri.decode(dataUrl.substring(comma + 1)).getBytes(java.nio.charset.StandardCharsets.UTF_8);
                if (bytes.length > MAX_INLINE_BYTES) throw new IOException("너무 큼");
                String type = mime != null ? mime : guessMime(n, cleanMime(head.split(";")[0]));
                writeToDownloads(n, type, bytes);
                runOnUiThread(() -> downloadSaved(n, "inline"));
            } catch (IOException | RuntimeException e) {
                Log.w(TAG, "파일 저장 실패: " + e);
                runOnUiThread(() -> downloadFailed(n, "파일을 저장하지 못했습니다. 저장 공간을 확인하세요."));
            }
        });
    }

    /** "다운로드" 폴더에 저장 (같은 이름이 있으면 시스템이 번호를 붙입니다) */
    private void writeToDownloads(String name, String mime, byte[] bytes) throws IOException {
        if (Build.VERSION.SDK_INT >= 29) {
            ContentResolver cr = getContentResolver();
            ContentValues v = new ContentValues();
            v.put(MediaStore.MediaColumns.DISPLAY_NAME, name);
            v.put(MediaStore.MediaColumns.MIME_TYPE, mime != null ? mime : "application/octet-stream");
            v.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
            v.put(MediaStore.MediaColumns.IS_PENDING, 1);
            Uri item = cr.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
            if (item == null) throw new IOException("저장 위치를 만들지 못함");
            try (OutputStream os = cr.openOutputStream(item)) {
                if (os == null) throw new IOException("열지 못함");
                os.write(bytes);
            } catch (IOException | RuntimeException e) {
                cr.delete(item, null, null);
                throw e;
            }
            v.clear();
            v.put(MediaStore.MediaColumns.IS_PENDING, 0);
            cr.update(item, v, null, null);
        } else {
            File dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
            if (!dir.isDirectory() && !dir.mkdirs()) throw new IOException("다운로드 폴더 없음");
            File f = new File(dir, name);
            int dot = name.lastIndexOf('.');
            String base = dot > 0 ? name.substring(0, dot) : name, ext = dot > 0 ? name.substring(dot) : "";
            for (int i = 1; f.exists() && i < 1000; i++) f = new File(dir, base + " (" + i + ")" + ext);
            try (FileOutputStream os = new FileOutputStream(f)) {
                os.write(bytes);
            }
            MediaScannerConnection.scanFile(this, new String[]{f.getAbsolutePath()}, new String[]{mime}, null);
        }
    }

    private void downloadSaved(String name, String kind) {
        if (selftest) selftestDownloadResult(true, kind + " " + name);
        if (isFinishing() || isDestroyed()) return;
        Toast.makeText(this, "받기 완료: " + name + "\n\"다운로드\" 폴더에 저장했습니다.", Toast.LENGTH_LONG).show();
    }

    private void downloadFailed(String name, String why) {
        if (selftest) selftestDownloadResult(false, name + " " + why);
        if (isFinishing() || isDestroyed()) return;
        Toast.makeText(this, name + "\n" + why, Toast.LENGTH_LONG).show();
    }

    private void openDownloads() {
        try {
            startActivity(new Intent(DownloadManager.ACTION_VIEW_DOWNLOADS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        } catch (ActivityNotFoundException e) {
            Toast.makeText(this, "파일 앱에서 \"다운로드\" 폴더를 열어 보세요.", Toast.LENGTH_LONG).show();
        }
    }

    /** 안드로이드 9 이하는 다운로드 폴더에 쓰려면 저장 권한이 필요합니다 */
    private void withStoragePermission(Runnable r) {
        if (Build.VERSION.SDK_INT >= 29 || checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED) {
            r.run();
            return;
        }
        afterStoragePermission = r;
        requestPermissions(new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE}, REQ_STORAGE);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(requestCode, permissions, results);
        if (requestCode != REQ_STORAGE) return;
        Runnable r = afterStoragePermission;
        afterStoragePermission = null;
        if (r != null && results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED) r.run();
        else Toast.makeText(this, "저장 권한이 없어 파일을 받을 수 없습니다.", Toast.LENGTH_LONG).show();
    }

    private static String cleanMime(String mime) {
        if (mime == null) return null;
        String m = mime.split(";")[0].trim().toLowerCase(Locale.ROOT);
        if (m.isEmpty() || m.equals("application/octet-stream") || m.equals("binary/octet-stream") || !m.contains("/")) return null;
        return m;
    }

    private static String dataUrlMime(String url) {
        int comma = url.indexOf(',');
        return comma > 5 ? url.substring(5, comma) : null;
    }

    private static String extensionFor(String mime) {
        return mime == null ? null : MimeTypeMap.getSingleton().getExtensionFromMimeType(mime);
    }

    /** 파일 종류: 사이트가 알려 준 값이 없으면 확장자로 짐작 */
    private static String guessMime(String name, String mime) {
        if (mime != null) return mime;
        if (name == null) return null;
        int dot = name.lastIndexOf('.');
        return dot < 0 ? null : MimeTypeMap.getSingleton().getMimeTypeFromExtension(name.substring(dot + 1).toLowerCase(Locale.ROOT));
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
            if (ctrl && k == KeyEvent.KEYCODE_J) {
                openDownloads();
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
        if (downloadDone != null) unregisterReceiver(downloadDone);
        io.shutdown();
        stage.removeView(web);
        web.destroy();
        super.onDestroy();
    }

    // ---------- 자동 점검 (시험용 빌드) ----------

    private void layoutSelftest() {
        float d = getResources().getDisplayMetrics().density;
        int top = Math.round(topBar.getHeight() / d), bottom = Math.round(bottomBar.getHeight() / d);
        int above = Math.round((stage.getTop() - root.getPaddingTop()) / d);
        Log.i(TAG, (top == 40 && above == 40 && bottom == 44 ? "PASS" : "FAIL") + " layout topBar=" + top + "dp webStartsAt=" + above + "dp bottomBar=" + bottom + "dp");
    }

    private void runSelftest(String url) {
        if (selftestDone) return;
        selftestDone = true;
        web.postDelayed(() -> web.evaluateJavascript("JSON.stringify({w:window.innerWidth,ua:navigator.userAgent,"
                + "mobile:navigator.userAgentData?navigator.userAgentData.mobile:null,"
                + "platform:navigator.userAgentData?navigator.userAgentData.platform:null,"
                + "brands:navigator.userAgentData?navigator.userAgentData.brands.map(function(b){return b.brand;}).join(','):null,"
                + "vp:(document.querySelector('meta[name=viewport]')||{}).content||null})", v -> {
            try {
                JSONObject o = new JSONObject(new JSONArray("[" + v + "]").getString(0));
                String ua = o.optString("ua");
                boolean uaOk = ua.contains("X11; Linux x86_64") && !ua.contains("Android") && !ua.contains("Mobile");
                Log.i(TAG, (uaOk ? "PASS" : "FAIL") + " user agent " + ua);
                Log.i(TAG, (o.optInt("w") == desktopWidth ? "PASS" : "FAIL") + " page width " + o.optInt("w") + " (want " + desktopWidth + ") viewport=" + o.optString("vp") + " url=" + url);
                if (o.isNull("mobile")) Log.i(TAG, "SKIP client hints (이 WebView는 지원 안 함)");
                else {
                    Log.i(TAG, (!o.optBoolean("mobile") && "Linux".equals(o.optString("platform")) ? "PASS" : "FAIL") + " client hints mobile=" + o.opt("mobile") + " platform=" + o.optString("platform"));
                    Log.i(TAG, (o.optString("brands").contains("WebView") ? "FAIL" : "PASS") + " brands " + o.optString("brands"));
                }
            } catch (JSONException e) {
                Log.i(TAG, "FAIL selftest parse " + v);
            }
            selftestDownloads();
        }), 1500);
    }

    /**
     * 구글 로그인 점검: 로그인 화면에 없는 주소를 넣고 "다음"을 눌러,
     * "안전하지 않은 브라우저" 차단 화면이 아니라 "계정을 찾을 수 없음"(= 로그인 진행 가능)이 나오는지 봅니다.
     */
    private void runGoogleTest(String url) {
        if (!url.contains("accounts.google.com") || googleTestStarted) {
            if (!googleTestStarted) Log.i(TAG, "INFO google page " + url);
            return;
        }
        googleTestStarted = true;
        googleTypeAttempt(0);
    }

    /** 입력칸이 뜰 때까지(최대 약 40초) 기다렸다가 없는 주소를 넣고 "다음" */
    private void googleTypeAttempt(int n) {
        web.postDelayed(() -> web.evaluateJavascript("(function(){var i=document.querySelector('#identifierId,input[name=identifier],input[type=email],input[autocomplete=username]');if(!i)return 'noinput';"
                + "i.focus();i.value='dn.selftest.nobody.73914@gmail.com';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));i.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',code:'Enter',keyCode:13,which:13,bubbles:true}));"
                + "var b=document.querySelector('#identifierNext button')||document.querySelector('#identifierNext');if(!b)return 'nobutton';b.click();return 'ok';})()",
                v -> {
                    Log.i(TAG, "INFO google typed " + v + " (" + n + ")");
                    if ("\"noinput\"".equals(v) && n < 20) googleTypeAttempt(n + 1);
                    else googleCheckAttempt(0);
                }), 2000);
    }

    /** 결과 화면이 나올 때까지(최대 약 30초) 확인 */
    private void googleCheckAttempt(int n) {
        web.postDelayed(() -> web.evaluateJavascript("JSON.stringify({u:location.href,t:(document.body?document.body.innerText:'').slice(0,800)})", v -> {
            String text = v == null ? "" : v.replace("\\n", " ");
            String low = text.toLowerCase(Locale.ROOT);
            boolean blocked = low.contains("may not be secure") || low.contains("안전하지 않") || low.contains("disallowed_useragent") || low.contains("browser or app");
            boolean through = low.contains("couldn") || low.contains("찾을 수 없") || low.contains("enter your password") || low.contains("비밀번호") || low.contains("valid email") || low.contains("올바른");
            if (!blocked && !through && n < 10) {
                googleCheckAttempt(n + 1);
                return;
            }
            Log.i(TAG, (blocked ? "FAIL" : through ? "PASS" : "INFO") + " google sign-in " + text.substring(0, Math.min(500, text.length())));
            Log.i(TAG, "DONE");
        }), 3000);
    }

    /**
     * 받기 점검: (1) 페이지가 스크립트로 만든 파일(blob + download 속성) (2) 일반 HTTPS 파일.
     * 시험용 빌드에서는 확인 창 없이 바로 받습니다.
     */
    private void selftestDownloads() {
        selftestDownloadsLeft = 2;
        web.evaluateJavascript("(function(){var b=new Blob(['덜누름 브라우저 받기 점검'],{type:'text/plain'});"
                + "var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='덜누름-점검.txt';"
                + "document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(a.href);})()", null);
        web.postDelayed(() -> startDownload("https://example.com/", "dn-selftest.html", "text/html"), 3000);
        web.postDelayed(() -> {
            if (selftestDownloadsLeft > 0) {
                Log.i(TAG, "FAIL download timeout (" + selftestDownloadsLeft + "개 끝나지 않음)");
                selftestDownloadsLeft = 0;
                Log.i(TAG, "DONE");
            }
        }, 60000);
    }

    private void selftestDownloadResult(boolean ok, String what) {
        if (selftestDownloadsLeft <= 0) return;
        Log.i(TAG, (ok ? "PASS" : "FAIL") + " download " + what);
        if (--selftestDownloadsLeft == 0) Log.i(TAG, "DONE");
    }
}
