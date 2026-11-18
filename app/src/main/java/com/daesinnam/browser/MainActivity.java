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
import android.os.SystemClock;
import android.provider.MediaStore;
import android.text.Editable;
import android.text.InputFilter;
import android.text.InputType;
import android.text.TextWatcher;
import android.text.format.Formatter;
import android.util.Base64;
import android.util.Log;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
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
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
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
 *  - 파일 받기: 확인을 받은 뒤 휴대폰의 "다운로드" 폴더에 저장합니다. 앱 설치 파일은 따로 경고합니다.
 *  - 탭(최대 10개) · 마지막에 보던 탭 복구 · 페이지 안에서 찾기 · 방문 기록 · 크롬에서 열기.
 */
public class MainActivity extends Activity {
    private static final String TAG = "BROWSER_SELFTEST";
    private static final String HOME = "https://www.naver.com/";
    private static final String STUDIO = "https://studio.youtube.com/";
    private static final String CHROME_PKG = "com.android.chrome";
    private static final int REQ_FILE = 42;
    private static final int REQ_STORAGE = 43;
    /** 페이지가 스크립트로 만든 파일(blob·data 주소)은 앱 메모리를 거쳐 저장하므로 크기를 제한합니다 */
    private static final long MAX_INLINE_BYTES = 40L * 1024 * 1024;
    private static final String DL_BRIDGE = "__dnDownload";
    private static final int MAX_BOOKMARKS = 200;
    private static final int MAX_TABS = 10;
    private static final int MAX_HISTORY = 100;
    private static final int[] WIDTHS = {1024, 1280, 1600, 1920};
    private static final Pattern SCHEME = Pattern.compile("^[a-zA-Z][a-zA-Z0-9+.-]*:");
    private static final Pattern CHROME = Pattern.compile("Chrome/([0-9.]+)");

    private static final int BG = Color.rgb(16, 24, 34);
    private static final int FIELD = Color.rgb(30, 41, 56);
    private static final int ACCENT = Color.rgb(80, 230, 170);
    private static final int INK = Color.WHITE;
    private static final int INK_DIM = 0xFFB8C2CF;

    /** 탭 하나. 복구한 탭은 처음 볼 때 불러옵니다(pending). */
    private static final class Tab {
        WebView view;
        String pending;
        String title;
        ScriptHandler viewport;
        ScriptHandler download;
    }

    private final List<Tab> tabs = new ArrayList<>();
    private Tab current;
    /** 지금 보이는 탭의 웹 화면 */
    private WebView web;
    private EditText address;
    private LinearLayout findBar;
    private EditText findField;
    private TextView findCount;
    private TextView tabButton;
    private JSONArray history;
    /** 최근 앱 목록 미리보기·화면 캡처 막기 */
    private boolean secureScreen;
    /** 앱을 닫으면(다음에 열 때) 로그인·쿠키·기록을 지움 */
    private boolean autoClear;
    private TextView notice;
    private ProgressBar progress;
    private LinearLayout root, topBar, bottomBar;
    private FrameLayout stage, fullscreenHolder;
    private View customView;
    private WebChromeClient.CustomViewCallback customViewCallback;

    private JSONArray bookmarks;
    private int desktopWidth = 1280;
    private boolean clearingData;
    private boolean clearHistoryAfterLoad;
    /** 뒤로·앞으로 이동이 끝나기 전에 또 누르면 무시합니다 (이 시각까지) */
    private long historyLockUntil;
    private static final long HISTORY_LOCK_MS = 2500;
    private boolean safeBrowsingReady;
    private boolean pickerActive;
    private ValueCallback<Uri[]> upload;
    private long pageGeneration;
    private long uploadGeneration;
    private boolean bridgeReady;
    private String blobToken, blobName, blobMime;
    private Runnable afterStoragePermission;
    private final Set<Long> myDownloads = new HashSet<>();
    private final ExecutorService io = Executors.newSingleThreadExecutor();
    private BroadcastReceiver downloadDone;
    private int selftestDownloadsLeft;
    private boolean selftest;
    private boolean selftestDone;
    private int selftestRetries;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    public void onCreate(Bundle state) {
        super.onCreate(state);
        selftest = BuildConfig.DEBUG && getIntent() != null && getIntent().hasExtra("browser.selftest");
        desktopWidth = getPreferences(MODE_PRIVATE).getInt("width", 1280);
        secureScreen = getPreferences(MODE_PRIVATE).getBoolean("secureScreen", false);
        autoClear = getPreferences(MODE_PRIVATE).getBoolean("autoClear", false);
        applySecureScreen();
        loadBookmarks();
        loadHistory();
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

        if (Build.VERSION.SDK_INT >= 27) WebView.startSafeBrowsing(this, ok -> safeBrowsingReady = ok);
        CookieManager.getInstance().setAcceptCookie(true);
        registerDownloadReceiver();
        if (selftest) {
            root.postDelayed(this::layoutSelftest, 2500);
            String start = getIntent().getStringExtra("browser.url");
            openNewTab(start != null && UrlPolicy.isAllowed(start) ? start : HOME);
        } else if (autoClear) {
            // 지난번 로그인·쿠키·기록을 지운 뒤 새로 시작
            Tab t = addTab(null);
            switchTo(t);
            clearingData = true;
            wipeWebData(() -> {
                clearingData = false;
                web.loadUrl(HOME);
            });
        } else {
            restoreTabs();
        }
    }

    // ---------- 탭 ----------

    /** 탭을 만들어 목록에 넣습니다 (아직 보이지 않음). pending이 있으면 처음 볼 때 그 주소를 엽니다. */
    private Tab addTab(String pending) {
        Tab t = new Tab();
        t.view = new WebView(this);
        t.pending = pending;
        t.view.setVisibility(View.GONE);
        stage.addView(t.view, 0, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        setupWeb(t);
        tabs.add(t);
        updateTabButton();
        return t;
    }

    private void switchTo(Tab t) {
        if (t == null) return;
        if (current != null && current != t) {
            if (customView != null) exitFullscreen();
            current.view.onPause();
            current.view.setVisibility(View.GONE);
        }
        closeFind();
        cancelUpload();
        pageGeneration++;
        historyLockUntil = 0;
        current = t;
        web = t.view;
        web.setVisibility(View.VISIBLE);
        web.onResume();
        web.requestFocus();
        showNotice(null);
        progress.setVisibility(View.GONE);
        if (t.pending != null) {
            String url = t.pending;
            t.pending = null;
            web.loadUrl(url);
            address.setText(url);
        } else {
            address.setText(web.getUrl());
        }
        updateTabButton();
    }

    /** 새 탭을 열어 바로 보여 줍니다 */
    private void openNewTab(String url) {
        if (tabs.size() >= MAX_TABS) {
            Toast.makeText(this, "탭은 최대 " + MAX_TABS + "개까지 열 수 있습니다. 쓰지 않는 탭을 닫아 주세요.", Toast.LENGTH_LONG).show();
            return;
        }
        switchTo(addTab(url == null || !UrlPolicy.isAllowed(url) ? HOME : url));
    }

    /** 링크를 새 탭으로: 크롬으로 보내야 하는 주소나 열 수 없는 주소는 지금 탭의 처리 규칙을 따릅니다 */
    private void openLinkInNewTab(String link) {
        String r = WebLinkResolver.resolve(link);
        if (r == null || !UrlPolicy.isAllowed(r) || needsChrome(Uri.parse(r))) {
            navigate(link);
            return;
        }
        openNewTab(r);
    }

    private void closeTab(Tab t) {
        int i = tabs.indexOf(t);
        if (i < 0) return;
        if (tabs.size() == 1) { // 마지막 탭은 닫지 않고 첫 화면으로
            t.view.loadUrl(HOME);
            return;
        }
        if (t == current) {
            Tab next = tabs.get(i + 1 < tabs.size() ? i + 1 : i - 1);
            switchTo(next);
        }
        tabs.remove(t);
        stage.removeView(t.view);
        t.view.destroy();
        updateTabButton();
    }

    private void closeOtherTabs() {
        for (Tab t : new ArrayList<>(tabs)) {
            if (t == current) continue;
            tabs.remove(t);
            stage.removeView(t.view);
            t.view.destroy();
        }
        updateTabButton();
    }

    private void nextTab() {
        if (tabs.size() < 2) return;
        switchTo(tabs.get((tabs.indexOf(current) + 1) % tabs.size()));
    }

    private String tabTitle(Tab t) {
        String title = t.pending == null ? t.view.getTitle() : t.title;
        String url = t.pending == null ? t.view.getUrl() : t.pending;
        if (title == null || title.trim().isEmpty()) title = UrlPolicy.origin(url);
        return title == null || title.isEmpty() ? "새 탭" : title;
    }

    private String tabUrl(Tab t) {
        return t.pending != null ? t.pending : t.view.getUrl();
    }

    private void updateTabButton() {
        if (tabButton != null) tabButton.setText("탭 " + tabs.size());
    }

    private void showTabs() {
        String[] items = new String[tabs.size() + 1];
        items[0] = "＋ 새 탭";
        for (int i = 0; i < tabs.size(); i++) {
            Tab t = tabs.get(i);
            items[i + 1] = (t == current ? "● " : "") + tabTitle(t) + "\n" + UrlPolicy.origin(tabUrl(t));
        }
        new AlertDialog.Builder(this).setTitle("탭 (" + tabs.size() + "/" + MAX_TABS + ")")
                .setItems(items, (d, which) -> {
                    if (which == 0) openNewTab(HOME);
                    else switchTo(tabs.get(which - 1));
                })
                .setNeutralButton("지금 탭 닫기", (d, w) -> closeTab(current))
                .setNegativeButton("닫기", null)
                .show();
    }

    /** 열린 탭 주소를 저장해 두었다가 다음에 앱을 열 때 이어서 보여 줍니다 (복구한 탭은 볼 때 불러옴) */
    private void persistTabs() {
        if (selftest || current == null) return;
        if (autoClear) {
            getPreferences(MODE_PRIVATE).edit().remove("tabs").remove("tabIndex").apply();
            return;
        }
        JSONArray a = new JSONArray();
        int index = 0;
        for (Tab t : tabs) {
            String url = tabUrl(t);
            if (!UrlPolicy.isAllowed(url)) continue;
            if (t == current) index = a.length();
            try {
                a.put(new JSONObject().put("url", url).put("title", tabTitle(t)));
            } catch (JSONException ignored) {
            }
        }
        getPreferences(MODE_PRIVATE).edit().putString("tabs", a.toString()).putInt("tabIndex", index).apply();
    }

    private void restoreTabs() {
        JSONArray a;
        try {
            a = new JSONArray(getPreferences(MODE_PRIVATE).getString("tabs", "[]"));
        } catch (JSONException e) {
            a = new JSONArray();
        }
        for (int i = 0; i < a.length() && tabs.size() < MAX_TABS; i++) {
            JSONObject o = a.optJSONObject(i);
            if (o == null || !UrlPolicy.isAllowed(o.optString("url"))) continue;
            Tab t = addTab(o.optString("url"));
            t.title = o.optString("title", null);
        }
        if (tabs.isEmpty()) addTab(HOME);
        int index = getPreferences(MODE_PRIVATE).getInt("tabIndex", 0);
        switchTo(tabs.get(index >= 0 && index < tabs.size() ? index : 0));
    }

    // ---------- 페이지 안에서 찾기 ----------

    private void openFind() {
        if (customView != null) return;
        findBar.setVisibility(View.VISIBLE);
        findField.requestFocus();
        findField.selectAll();
        InputMethodManager imm = (InputMethodManager) getSystemService(INPUT_METHOD_SERVICE);
        if (imm != null) imm.showSoftInput(findField, 0);
        if (findField.length() > 0) web.findAllAsync(findField.getText().toString());
    }

    private void closeFind() {
        if (findBar == null || findBar.getVisibility() != View.VISIBLE) return;
        findBar.setVisibility(View.GONE);
        findCount.setText("");
        if (web != null) {
            web.clearMatches();
            web.requestFocus();
        }
        InputMethodManager imm = (InputMethodManager) getSystemService(INPUT_METHOD_SERVICE);
        if (imm != null) imm.hideSoftInputFromWindow(findField.getWindowToken(), 0);
    }

    // ---------- 방문 기록 ----------

    private void loadHistory() {
        try {
            history = new JSONArray(getPreferences(MODE_PRIVATE).getString("history", "[]"));
        } catch (JSONException e) {
            history = new JSONArray();
        }
    }

    private void persistHistory() {
        getPreferences(MODE_PRIVATE).edit().putString("history", history.toString()).apply();
    }

    private void recordHistory(String url, String title) {
        if (selftest || clearingData || !UrlPolicy.isAllowed(url)) return;
        JSONArray next = new JSONArray();
        try {
            next.put(new JSONObject().put("url", url).put("title", title == null || title.trim().isEmpty() ? UrlPolicy.origin(url) : title));
        } catch (JSONException e) {
            return;
        }
        for (int i = 0; i < history.length() && next.length() < MAX_HISTORY; i++) {
            JSONObject o = history.optJSONObject(i);
            if (o != null && !url.equals(o.optString("url"))) next.put(o);
        }
        history = next;
        persistHistory();
    }

    private void showHistory() {
        if (history.length() == 0) {
            Toast.makeText(this, "방문 기록이 없습니다.", Toast.LENGTH_SHORT).show();
            return;
        }
        String[] items = new String[history.length()];
        for (int i = 0; i < history.length(); i++) {
            JSONObject o = history.optJSONObject(i);
            items[i] = o == null ? "잘못된 항목" : o.optString("title") + "\n" + UrlPolicy.origin(o.optString("url"));
        }
        new AlertDialog.Builder(this).setTitle("방문 기록 (최근 " + history.length() + "개)")
                .setItems(items, (d, which) -> {
                    JSONObject o = history.optJSONObject(which);
                    if (o != null) navigate(o.optString("url"));
                })
                .setNeutralButton("기록 모두 삭제", (d, w) -> new AlertDialog.Builder(this).setMessage("방문 기록을 모두 삭제할까요?")
                        .setNegativeButton("취소", null)
                        .setPositiveButton("삭제", (d2, w2) -> {
                            history = new JSONArray();
                            persistHistory();
                        }).show())
                .setNegativeButton("닫기", null).show();
    }

    // ---------- 화면 보호 · 자동 삭제 ----------

    private void applySecureScreen() {
        if (secureScreen) getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);
        else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE);
    }

    /** 로그인·쿠키·캐시·웹 저장소·방문 기록을 지운 뒤 done을 부릅니다 */
    private void wipeWebData(Runnable done) {
        CookieManager.getInstance().removeAllCookies(ok -> {
            if (isFinishing() || isDestroyed()) return;
            CookieManager.getInstance().flush();
            web.clearCache(true);
            web.clearFormData();
            web.clearHistory();
            WebStorage.getInstance().deleteAllData();
            WebViewDatabase.getInstance(this).clearHttpAuthUsernamePassword();
            history = new JSONArray();
            persistHistory();
            done.run();
        });
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
        topBar.addView(barButton("스튜디오", () -> openInChrome(STUDIO), ACCENT, 9, 13), new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, dp(40)));
        root.addView(topBar, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(40)));

        // 차단 알림: 인증서 오류·유해 사이트일 때만 보입니다
        notice = new TextView(this);
        notice.setTextColor(Color.WHITE);
        notice.setBackgroundColor(0xFFB3261E);
        notice.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12);
        notice.setPadding(dp(12), dp(4), dp(12), dp(4));
        notice.setVisibility(View.GONE);
        root.addView(notice);

        // 페이지 안에서 찾기 (설정 메뉴 · Ctrl+F 로 열 때만 보입니다)
        findBar = new LinearLayout(this);
        findBar.setGravity(Gravity.CENTER_VERTICAL);
        findBar.setPadding(dp(6), 0, dp(2), 0);
        findBar.setVisibility(View.GONE);
        findField = new EditText(this);
        findField.setSingleLine(true);
        findField.setTextColor(INK);
        findField.setHintTextColor(INK_DIM);
        findField.setHint("페이지에서 찾기");
        findField.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14);
        findField.setImeOptions(EditorInfo.IME_ACTION_SEARCH | EditorInfo.IME_FLAG_NO_EXTRACT_UI);
        findField.setPadding(dp(12), 0, dp(12), 0);
        GradientDrawable findPill = new GradientDrawable();
        findPill.setColor(FIELD);
        findPill.setCornerRadius(dp(17));
        findField.setBackground(findPill);
        findField.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int a, int b, int c) {
            }

            @Override
            public void onTextChanged(CharSequence s, int a, int b, int c) {
            }

            @Override
            public void afterTextChanged(Editable s) {
                if (web == null) return;
                if (s.length() == 0) {
                    web.clearMatches();
                    findCount.setText("");
                } else {
                    web.findAllAsync(s.toString());
                }
            }
        });
        findField.setOnEditorActionListener((v, action, event) -> {
            if (web != null) web.findNext(true);
            return true;
        });
        findBar.addView(findField, new LinearLayout.LayoutParams(0, dp(34), 1f));
        findCount = new TextView(this);
        findCount.setTextColor(INK_DIM);
        findCount.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12);
        findCount.setPadding(dp(8), 0, dp(4), 0);
        findBar.addView(findCount);
        findBar.addView(barButton("▲", () -> web.findNext(false), INK, 10, 13), new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, dp(40)));
        findBar.addView(barButton("▼", () -> web.findNext(true), INK, 10, 13), new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, dp(40)));
        findBar.addView(barButton("닫기", this::closeFind, ACCENT, 9, 13), new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, dp(40)));
        root.addView(findBar, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(40)));

        // 가운데: 웹 화면(탭마다 하나, 지금 탭만 보임) + 위에 겹친 가는 진행 표시
        stage = new FrameLayout(this);
        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progress.setMax(100);
        progress.setVisibility(View.GONE);
        stage.addView(progress, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(3), Gravity.TOP));
        root.addView(stage, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));

        // 아래: 뒤로 · 앞으로 · 홈 · 새로고침 · 탭 · 즐겨찾기 · 설정
        bottomBar = new LinearLayout(this);
        addNav("◀", () -> stepHistory(-1, true), 0.7f);
        addNav("▶", () -> stepHistory(1, true), 0.7f);
        addNav("홈", () -> web.loadUrl(HOME), 0.8f);
        addNav("새로고침", () -> web.reload(), 1.1f);
        tabButton = addNav("탭 1", this::showTabs, 0.9f);
        addNav("즐겨찾기", this::showBookmarks, 1.1f);
        addNav("설정", this::settings, 0.9f);
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

    private TextView addNav(String text, Runnable action, float weight) {
        TextView b = barButton(text, action, INK, 0, 12.5f);
        bottomBar.addView(b, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.MATCH_PARENT, weight));
        return b;
    }

    /**
     * 뒤로(-1)·앞으로(+1) 한 칸 이동.
     * WebView는 아직 끝나지 않은 이동을 기준으로 다시 세기 때문에, 페이지가 뜨기 전에 ◀를 여러 번 누르면
     * 여러 칸을 한꺼번에 넘어가 첫 페이지(네이버 홈)까지 가 버립니다. 그래서 이동이 끝날 때까지 다음 누름은 무시합니다.
     */
    private void stepHistory(int offset, boolean tellAtEnd) {
        if (historyLocked()) return;
        if (!web.canGoBackOrForward(offset)) {
            if (tellAtEnd) Toast.makeText(this, offset < 0 ? "첫 페이지입니다." : "마지막 페이지입니다.", Toast.LENGTH_SHORT).show();
            return;
        }
        historyLockUntil = SystemClock.uptimeMillis() + HISTORY_LOCK_MS;
        web.goBackOrForward(offset);
    }

    private boolean historyLocked() {
        return SystemClock.uptimeMillis() < historyLockUntil;
    }

    private void showNotice(String text) {
        notice.setText(text);
        notice.setVisibility(text == null ? View.GONE : View.VISIBLE);
    }

    // ---------- 웹 화면 설정 ----------

    @SuppressLint("SetJavaScriptEnabled")
    private void setupWeb(Tab tab) {
        final WebView w = tab.view;
        WebSettings s = w.getSettings();
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
        CookieManager.getInstance().setAcceptThirdPartyCookies(w, false);
        // 보이지 않을 때는 화면 그리는 프로세스의 우선순위를 낮춰 다른 앱에 메모리를 양보
        w.setRendererPriorityPolicy(WebView.RENDERER_PRIORITY_IMPORTANT, true);
        w.setFilterTouchesWhenObscured(true);
        installViewportScript(tab);
        w.setFindListener((active, count, done) -> {
            if (w == web && done) findCount.setText(count == 0 ? "0/0" : (active + 1) + "/" + count);
        });

        w.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (clearingData) return true;
                if (request.isForMainFrame()) return view != web ? !UrlPolicy.isAllowed(request.getUrl().toString()) : handle(request.getUrl());
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
                if (!UrlPolicy.isAllowed(url) && !"about:blank".equals(url)) {
                    view.stopLoading();
                    return;
                }
                if (view != web) return;
                pageGeneration++;
                cancelUpload();
                showNotice(null);
                if (!address.hasFocus()) address.setText(url);
            }

            @Override
            public void doUpdateVisitedHistory(WebView view, String url, boolean isReload) {
                if (view == web) historyLockUntil = 0; // 이동이 끝남 → 다음 뒤로·앞으로를 받음
            }

            @Override
            public void onPageCommitVisible(WebView view, String url) {
                if (!clearingData) applyViewport(view);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                if (clearingData) {
                    if (view == web && "about:blank".equals(url)) finishClearWebData();
                    return;
                }
                if (!UrlPolicy.isAllowed(url)) return;
                applyViewport(view);
                CookieManager.getInstance().flush();
                recordHistory(url, view.getTitle());
                if (view != web) return;
                if (!address.hasFocus()) address.setText(url);
                if (clearHistoryAfterLoad) {
                    web.clearHistory();
                    clearHistoryAfterLoad = false;
                }
                if (selftest) runSelftest(url);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (!request.isForMainFrame() || view != web) return;
                historyLockUntil = 0;
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
                if (view != web) return;
                showNotice("인증서 오류 · 연결 차단");
                Toast.makeText(MainActivity.this, "인증서를 확인할 수 없어 연결을 차단했습니다.", Toast.LENGTH_LONG).show();
            }

            @Override
            public void onSafeBrowsingHit(WebView view, WebResourceRequest request, int threatType, SafeBrowsingResponse callback) {
                callback.backToSafety(false);
                if (view != web) return;
                showNotice("유해 사이트 감지 · 연결 차단");
                Toast.makeText(MainActivity.this, "유해 사이트로 감지되어 차단했습니다.", Toast.LENGTH_LONG).show();
            }

            @Override
            public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                // 메모리 부족 등으로 화면 그리는 프로세스가 꺼진 경우: 앱이 같이 꺼지지 않게 열린 탭을 저장하고 화면을 다시 만듭니다
                if (!isFinishing() && !isDestroyed()) {
                    persistTabs();
                    recreate();
                }
                return true;
            }
        });

        w.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int value) {
                if (view != web) return;
                progress.setProgress(value);
                progress.setVisibility(value >= 100 ? View.GONE : View.VISIBLE);
            }

            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (view != web || clearingData || pickerActive || upload != null || !UrlPolicy.isAllowed(view.getUrl())) {
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
                        .setNegativeButton("취소", (d, x) -> cancelUpload())
                        .setOnCancelListener(d -> cancelUpload())
                        .setPositiveButton("파일 선택", (d, x) -> pickFile(generation))
                        .show();
                return true;
            }

            @Override
            public void onShowCustomView(View view, CustomViewCallback callback) {
                // 동영상 "전체 화면": 주소 줄·아래 줄을 숨기고 화면 가득
                if (customView != null || w != web) {
                    callback.onCustomViewHidden();
                    return;
                }
                closeFind();
                customView = view;
                customViewCallback = callback;
                fullscreenHolder.addView(view, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
                setFullscreen(true);
            }

            @Override
            public void onHideCustomView() {
                if (w == web) exitFullscreen();
            }
        });

        w.setDownloadListener((url, userAgent, disposition, mime, length) -> {
            if (w == web) onDownload(url, disposition, mime, length);
        });
        installDownloadBridge(tab);
        // 링크를 길게 누르면: 열기 / 새 탭에서 열기 / 주소 복사, 이미지를 길게 누르면: 이미지 저장
        w.setOnLongClickListener(v -> {
            WebView.HitTestResult hit = w.getHitTestResult();
            int type = hit.getType();
            String extra = hit.getExtra();
            if (extra == null) return false;
            if (type == WebView.HitTestResult.IMAGE_TYPE || type == WebView.HitTestResult.SRC_IMAGE_ANCHOR_TYPE) {
                final String img = extra;
                new AlertDialog.Builder(this).setTitle("이미지")
                        .setItems(new String[]{"이미지 저장", "이미지 주소 복사"}, (d, x) -> {
                            if (x == 0) {
                                String mime = guessMime(DownloadNames.fromUrl(img), null);
                                String name = DownloadNames.choose(null, img, null, extensionFor(mime));
                                if (DownloadNames.isInstallFile(name, mime)) confirmDownload(img, name, mime, UrlPolicy.origin(img), "크기 알 수 없음");
                                else startDownload(img, name, mime);
                            } else {
                                ClipboardManager cm = (ClipboardManager) getSystemService(CLIPBOARD_SERVICE);
                                if (cm != null) cm.setPrimaryClip(ClipData.newPlainText("이미지 주소", img));
                            }
                        }).setNegativeButton("닫기", null).show();
                return true;
            }
            if (type != WebView.HitTestResult.SRC_ANCHOR_TYPE) return false;
            String shown = extra.length() > 200 ? extra.substring(0, 200) + "…" : extra;
            new AlertDialog.Builder(this).setTitle(shown)
                    .setItems(new String[]{"열기", "새 탭에서 열기", "주소 복사"}, (d, x) -> {
                        if (x == 0) navigate(extra);
                        else if (x == 1) openLinkInNewTab(extra);
                        else {
                            ClipboardManager cm = (ClipboardManager) getSystemService(CLIPBOARD_SERVICE);
                            if (cm != null) cm.setPrimaryClip(ClipData.newPlainText("링크", extra));
                        }
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
    private void installViewportScript(Tab t) {
        if (!WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) return;
        try {
            if (t.viewport != null) t.viewport.remove();
            t.viewport = WebViewCompat.addDocumentStartJavaScript(t.view, viewportJs(), Collections.singleton("*"));
        } catch (RuntimeException e) {
            Log.w(TAG, "화면 폭 스크립트 설치 실패: " + e);
        }
    }

    /** 사이트가 나중에 화면 폭 설정을 바꿔 놓은 경우를 위한 확인 */
    private void applyViewport(WebView view) {
        view.evaluateJavascript(viewportJs(), null);
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
        String host = Uri.parse(resolved).getHost();
        if ("studio.youtube.com".equalsIgnoreCase(host)) { // 유튜브 스튜디오는 구글 로그인이 필요해 크롬으로
            openInChrome(resolved);
            return true;
        }
        if (isGoogleSignIn(Uri.parse(resolved))) {
            askGoogleSignIn(resolved);
            return true;
        }
        if ("m.naver.com".equalsIgnoreCase(uri.getHost())) { // 네이버 모바일 첫 화면 → PC 첫 화면
            web.loadUrl(uri.buildUpon().authority("www.naver.com").build().toString());
            return true;
        }
        return false;
    }

    // ---------- 구글 로그인 · 유튜브 스튜디오 → 크롬 ----------
    //
    // 구글은 안드로이드 WebView로 만든 앱 안에서의 로그인을 막습니다("이 브라우저나 앱은 안전하지 않을 수 있음").
    // 그래서 로그인이 필요한 유튜브 스튜디오와 구글 로그인 화면은 크롬에서 엽니다.

    /** 이 브라우저 안에서는 로그인이 막혀 크롬으로 보내는 주소 */
    private static boolean needsChrome(Uri u) {
        return u != null && ("studio.youtube.com".equalsIgnoreCase(u.getHost()) || isGoogleSignIn(u));
    }

    private static boolean isGoogleSignIn(Uri u) {
        if (u == null || !"accounts.google.com".equalsIgnoreCase(u.getHost())) return false;
        String path = u.getPath() == null ? "" : u.getPath().toLowerCase(Locale.ROOT);
        return path.startsWith("/v3/signin") || path.startsWith("/signin") || path.startsWith("/servicelogin")
                || path.startsWith("/accountchooser") || path.startsWith("/o/oauth2") || path.startsWith("/addsession");
    }

    private void askGoogleSignIn(String url) {
        new AlertDialog.Builder(this).setTitle("구글 로그인")
                .setMessage("구글은 이 브라우저 같은 앱 안의 화면에서 로그인을 막습니다.\n\n크롬에서 로그인할까요? 유튜브 스튜디오도 위쪽 \"스튜디오\" 단추를 누르면 크롬에서 열립니다.")
                .setNegativeButton("취소", null)
                .setPositiveButton("크롬에서 열기", (d, w) -> openInChrome(url))
                .show();
    }

    /** 크롬에서 엽니다 (크롬이 없으면 다른 브라우저를 고르게 함). 처음 한 번은 PC 버전 사이트 켜는 법을 안내 */
    private void openInChrome(String url) {
        if (!UrlPolicy.isAllowed(url)) return;
        if (!getPreferences(MODE_PRIVATE).getBoolean("chromeTip", false)) {
            new AlertDialog.Builder(this).setTitle("크롬에서 열기")
                    .setMessage("유튜브 스튜디오·구글 로그인처럼 이 브라우저에서 막히는 사이트(증권·결제 등)는 크롬에서 엽니다.\n\nPC 화면으로 보려면 크롬에서 처음 한 번만 오른쪽 위 메뉴(⋮) → \"PC 버전 사이트\"를 켜 두세요. 크롬이 사이트별로 기억합니다. (DeX에서는 처음부터 PC 화면으로 열립니다.)")
                    .setNegativeButton("취소", null)
                    .setPositiveButton("열기", (d, w) -> {
                        getPreferences(MODE_PRIVATE).edit().putBoolean("chromeTip", true).apply();
                        launchChrome(url);
                    }).show();
            return;
        }
        launchChrome(url);
    }

    private void launchChrome(String url) {
        Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(url)).addCategory(Intent.CATEGORY_BROWSABLE)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK).setPackage(CHROME_PKG);
        try {
            startActivity(i);
            return;
        } catch (ActivityNotFoundException ignored) {
        }
        i.setPackage(null);
        try {
            startActivity(Intent.createChooser(i, "열 브라우저 선택 (크롬 권장)"));
        } catch (ActivityNotFoundException e) {
            Toast.makeText(this, "크롬을 설치하면 유튜브 스튜디오와 구글 로그인을 쓸 수 있습니다.", Toast.LENGTH_LONG).show();
        }
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
        seedSiteBookmark();
    }

    /** 덜누름 사이트(새 버전 · 다른 앱)를 즐겨찾기 맨 앞에 한 번만 넣음. 지우면 다시 넣지 않음 */
    private void seedSiteBookmark() {
        if (getPreferences(MODE_PRIVATE).getBoolean("seed_site_v1", false)) return;
        getPreferences(MODE_PRIVATE).edit().putBoolean("seed_site_v1", true).apply();
        for (int i = 0; i < bookmarks.length(); i++) {
            JSONObject o = bookmarks.optJSONObject(i);
            if (o != null && o.optString("url").contains("deolnureum.com")) return;
        }
        try {
            JSONArray next = new JSONArray().put(new JSONObject().put("title", "덜누름 — 앱 · 업데이트").put("url", "https://deolnureum.com/"));
            for (int i = 0; i < bookmarks.length() && next.length() < MAX_BOOKMARKS; i++) next.put(bookmarks.get(i));
            bookmarks = next;
            persistBookmarks();
        } catch (JSONException ignored) { }
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
        String[] items = {
                "PC 화면 폭 설정 (현재 " + desktopWidth + ")",
                "페이지에서 찾기",
                "이 페이지 크롬에서 열기",
                "방문 기록",
                "받은 파일 보기",
                "화면 보호: " + (secureScreen ? "켜짐" : "꺼짐") + " (최근 앱 미리보기·캡처 막기)",
                "닫을 때 웹 데이터 삭제: " + (autoClear ? "켜짐" : "꺼짐"),
                "웹 데이터 지금 삭제",
                "보안 상태",
                "앱 정보"};
        new AlertDialog.Builder(this).setTitle("덜누름 브라우저").setItems(items, (d, which) -> {
            switch (which) {
                case 0:
                    new AlertDialog.Builder(this).setTitle("PC 화면 폭")
                            .setItems(new String[]{"1024 px", "1280 px", "1600 px", "1920 px"}, (d2, w) -> {
                                desktopWidth = WIDTHS[w];
                                getPreferences(MODE_PRIVATE).edit().putInt("width", desktopWidth).apply();
                                for (Tab t : tabs) installViewportScript(t);
                                web.reload();
                            }).show();
                    break;
                case 1:
                    openFind();
                    break;
                case 2:
                    if (UrlPolicy.isAllowed(web.getUrl())) openInChrome(web.getUrl());
                    else Toast.makeText(this, "크롬에서 열 HTTPS 페이지가 없습니다.", Toast.LENGTH_SHORT).show();
                    break;
                case 3:
                    showHistory();
                    break;
                case 4:
                    openDownloads();
                    break;
                case 5:
                    secureScreen = !secureScreen;
                    getPreferences(MODE_PRIVATE).edit().putBoolean("secureScreen", secureScreen).apply();
                    applySecureScreen();
                    Toast.makeText(this, secureScreen
                            ? "화면 보호를 켰습니다. 최근 앱 목록에 화면이 보이지 않고, 화면 캡처·녹화가 막힙니다."
                            : "화면 보호를 껐습니다.", Toast.LENGTH_LONG).show();
                    break;
                case 6:
                    if (autoClear) {
                        autoClear = false;
                        getPreferences(MODE_PRIVATE).edit().putBoolean("autoClear", false).apply();
                        Toast.makeText(this, "닫을 때 웹 데이터 삭제를 껐습니다. 다음부터 열린 탭을 이어서 보여 줍니다.", Toast.LENGTH_LONG).show();
                    } else {
                        new AlertDialog.Builder(this).setTitle("닫을 때 웹 데이터 삭제")
                                .setMessage("앱을 닫았다가 다시 열 때마다 로그인·쿠키·캐시·웹 저장소·방문 기록을 지우고 첫 화면에서 시작합니다. 열려 있던 탭도 이어서 보여 주지 않습니다.\n\n여러 사람이 쓰는 기기에 알맞습니다. 즐겨찾기는 유지됩니다.")
                                .setNegativeButton("취소", null)
                                .setPositiveButton("켜기", (d2, w) -> {
                                    autoClear = true;
                                    getPreferences(MODE_PRIVATE).edit().putBoolean("autoClear", true).apply();
                                    persistTabs();
                                }).show();
                    }
                    break;
                case 7:
                    new AlertDialog.Builder(this).setMessage("로그인·쿠키·캐시·웹 저장소·탐색 기록·방문 기록을 삭제하고 다른 탭을 닫을까요? 즐겨찾기는 유지됩니다.")
                            .setNegativeButton("취소", null).setPositiveButton("삭제", (d2, w) -> clearWebData()).show();
                    break;
                case 8:
                    new AlertDialog.Builder(this).setTitle("보안 상태")
                            .setMessage("• HTTPS 전용 / 인증서 오류 차단\n• HTTP 혼합 콘텐츠 차단\n• 로컬 파일·외부 앱 링크 차단 (유튜브 스튜디오·구글 로그인은 크롬으로)\n• 제3자 쿠키 차단\n• 카메라·마이크·위치 권한 없음\n• 앱 백업·웹 디버깅 비활성화\n• 파일 제공 전 확인\n• 파일 받기 전 확인 · HTTPS 파일만 · 확인한 이름 그대로 저장\n• 앱 설치 파일(APK) 별도 경고\n• 화면 보호: " + (secureScreen ? "켜짐" : "꺼짐")
                                    + "\n• 닫을 때 웹 데이터 삭제: " + (autoClear ? "켜짐" : "꺼짐")
                                    + "\n\nSafe Browsing: " + (safeBrowsingReady ? "초기화 완료" : "활성화 요청됨 · 초기화 미확인")
                                    + "\n탐지 범위는 기기의 WebView와 서비스 상태에 따라 다릅니다.\n\nWebView를 최신 버전으로 유지하세요. HTTPS만으로 사이트의 신뢰성이 보장되지는 않습니다.")
                            .setPositiveButton("확인", null).show();
                    break;
                default:
                    new AlertDialog.Builder(this).setTitle("덜누름 브라우저 " + BuildConfig.VERSION_NAME)
                            .setMessage("네이버를 시작 페이지로 사용하는 독립 WebView 앱입니다. 네이버·웨일·유튜브 공식 앱이 아닙니다.\n\nPC 사용자 에이전트와 넓은 화면 폭을 항상 사용합니다. 사이트별 정책에 따라 PC 표시·로그인·결제가 제한될 수 있습니다. 막히는 사이트는 설정 → \"이 페이지 크롬에서 열기\"로 크롬에서 이어 볼 수 있습니다. 받은 파일은 휴대폰의 \"다운로드\" 폴더에 저장됩니다. 탭은 " + MAX_TABS + "개까지 열 수 있고, 앱을 다시 열면 보던 탭을 이어서 보여 줍니다. 동기화·확장 프로그램은 지원하지 않습니다.\n\n단축키(키보드 연결 시): Ctrl+L 주소, F5·Ctrl+R 새로고침, Alt+←/→ 뒤로·앞으로, Ctrl+T 새 탭, Ctrl+W 탭 닫기, Ctrl+Tab 다음 탭, Ctrl+F 찾기, Ctrl+H 방문 기록, Ctrl+D 즐겨찾기 저장, Ctrl+J 받은 파일")
                            .setPositiveButton("확인", null).show();
                    break;
            }
        }).show();
    }

    private void clearWebData() {
        clearingData = true;
        blobToken = null;
        cancelUpload();
        closeFind();
        closeOtherTabs();
        web.stopLoading();
        web.loadUrl("about:blank");
    }

    private void finishClearWebData() {
        wipeWebData(() -> {
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

    private void installDownloadBridge(Tab t) {
        if (WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) {
            try {
                t.download = WebViewCompat.addDocumentStartJavaScript(t.view, DOWNLOAD_HELPER_JS, Collections.singleton("*"));
            } catch (RuntimeException e) {
                Log.w(TAG, "받기 도우미 설치 실패: " + e);
            }
        }
        // blob 주소의 내용을 페이지에서 꺼내 앱으로 건네받는 통로 (앱이 요청한 받기에만 응답)
        if (WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
            try {
                WebViewCompat.addWebMessageListener(t.view, DL_BRIDGE, Collections.singleton("*"),
                        (view, message, sourceOrigin, isMainFrame, reply) -> {
                            if (isMainFrame && view == web) onBlobMessage(message.getData());
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
        final String type = data && cleanMime(mime) == null ? cleanMime(dataUrlMime(url)) : cleanMime(mime);
        String from = UrlPolicy.origin(https ? url : blob ? url.substring(5) : web.getUrl());
        String size = length > 0 ? Formatter.formatShortFileSize(this, length) : "크기 알 수 없음";
        if (blob) {
            // 사이트가 정한 파일 이름(<a download>)을 확인 창을 띄우기 전에 받아 두고, 저장할 때도 그 이름을 그대로 씁니다
            if (!bridgeReady) {
                downloadFailed("파일", "이 기기의 WebView가 오래되어 이 방식의 파일은 받을 수 없습니다. Android System WebView를 업데이트하세요.");
                return;
            }
            final WebView page = web;
            page.evaluateJavascript("(function(){var u=" + JSONObject.quote(url) + ";var n=(window.__dnNames||{})[u]||null;"
                    + "if(!n){try{var as=document.querySelectorAll('a[download]');for(var i=0;i<as.length;i++)if(as[i].href===u){n=as[i].getAttribute('download');break;}}catch(e){}}"
                    + "return n;})()", v -> {
                if (page != web || clearingData) return;
                String hint = null;
                try {
                    JSONArray a = new JSONArray("[" + v + "]");
                    if (!a.isNull(0)) hint = a.optString(0, null);
                } catch (JSONException ignored) {
                }
                String name = hint != null && !hint.isEmpty()
                        ? DownloadNames.choose(null, null, hint, extensionFor(type))
                        : DownloadNames.choose(disposition, url, null, extensionFor(type));
                confirmDownload(url, name, guessMime(name, type), from, size);
            });
            return;
        }
        String name = DownloadNames.choose(disposition, url, null, extensionFor(type));
        confirmDownload(url, name, guessMime(name, type), from, size);
    }

    /** 받기 전 확인. 앱 설치 파일은 경고를 따로 보여 주고 기본 선택을 "취소"로 둡니다. */
    private void confirmDownload(String url, String name, String mime, String from, String size) {
        Runnable go = () -> startDownload(url, name, mime);
        if (selftest) {
            go.run();
            return;
        }
        String where = from == null || from.isEmpty() ? "알 수 없음" : from;
        if (DownloadNames.isInstallFile(name, mime)) {
            new AlertDialog.Builder(this).setTitle("⚠ 앱 설치 파일")
                    .setMessage(name + "\n" + size + "\n보낸 곳: " + where
                            + "\n\n이 파일은 휴대폰에 앱을 설치하는 파일(APK)입니다. 출처가 확실한 경우에만 받으세요.\n"
                            + "모르는 사이트나 문자·메신저 링크로 받은 설치 파일은 개인정보·금융 정보를 빼 가는 악성 앱일 수 있습니다.")
                    .setNegativeButton("받지 않기", null)
                    .setPositiveButton("그래도 받기", (d, w) -> go.run())
                    .show();
            return;
        }
        new AlertDialog.Builder(this).setTitle("파일 받기")
                .setMessage(name + "\n" + size + "\n보낸 곳: " + where
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
                + "fetch(u).then(function(r){return r.blob();}).then(function(b){"
                + "if(b.size>" + MAX_INLINE_BYTES + "){p({err:'big'});return;}"
                + "var f=new FileReader();f.onload=function(){p({data:f.result});};"
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
        // 이름·종류는 사용자가 확인한 그대로 씁니다 (페이지가 보낸 값으로 바꾸지 않음)
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
        // 종류는 확인한 파일 이름의 확장자로만 정합니다. 이름과 다른 종류를 주면 시스템이 확장자를 덧붙여
        // 확인한 것과 다른 파일(예: .apk)이 될 수 있습니다.
        mime = guessMime(name, null);
        if (mime == null) mime = "application/octet-stream";
        if (Build.VERSION.SDK_INT >= 29) {
            ContentResolver cr = getContentResolver();
            ContentValues v = new ContentValues();
            v.put(MediaStore.MediaColumns.DISPLAY_NAME, name);
            v.put(MediaStore.MediaColumns.MIME_TYPE, mime);
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
                stepHistory(-1, false);
                return true;
            }
            if (alt && k == KeyEvent.KEYCODE_DPAD_RIGHT) {
                stepHistory(1, false);
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
            if (ctrl && k == KeyEvent.KEYCODE_F) {
                openFind();
                return true;
            }
            if (ctrl && k == KeyEvent.KEYCODE_T) {
                openNewTab(HOME);
                return true;
            }
            if (ctrl && k == KeyEvent.KEYCODE_W) {
                closeTab(current);
                return true;
            }
            if (ctrl && k == KeyEvent.KEYCODE_TAB) {
                nextTab();
                return true;
            }
            if (ctrl && k == KeyEvent.KEYCODE_H) {
                showHistory();
                return true;
            }
            if (k == KeyEvent.KEYCODE_ESCAPE && findBar.getVisibility() == View.VISIBLE) {
                closeFind();
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
        else if (findBar.getVisibility() == View.VISIBLE) closeFind();
        else if (historyLocked()) return; // 앞의 뒤로 가기가 아직 끝나지 않음: 앱이 닫히거나 여러 칸 넘어가지 않게
        else if (web.canGoBack()) stepHistory(-1, false);
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
        persistTabs();
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        cancelUpload();
        if (downloadDone != null) unregisterReceiver(downloadDone);
        io.shutdown();
        if (autoClear && isFinishing() && !selftest) {
            // 다음에 열 때도 지우지만, 닫는 순간에도 한 번 지웁니다
            CookieManager.getInstance().removeAllCookies(null);
            WebStorage.getInstance().deleteAllData();
        }
        for (Tab t : tabs) {
            stage.removeView(t.view);
            t.view.destroy();
        }
        tabs.clear();
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
            selftestDownloads();
        }), 1500);
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
        if (--selftestDownloadsLeft == 0) selftestHistory();
    }

    /**
     * 뒤로 가기 점검: 실제 페이지 3개를 차례로 연 뒤 ◀를 빠르게 세 번 눌러도 한 칸(dn=2)만 돌아가야 합니다.
     * (고치기 전에는 세 칸을 한꺼번에 넘어가 첫 페이지까지 갔음)
     * 스크립트로 만든 기록(pushState)은 크롬이 뒤로 가기에서 건너뛰므로 실제 이동으로 시험합니다.
     */
    /** 탭 점검: 새 탭을 열고 → 페이지 안에서 찾기 → 탭을 닫으면 앞의 탭(?dn=2)으로 돌아와야 합니다 */
    private void selftestTabs() {
        openNewTab("https://example.com/?dn=tab");
        web.postDelayed(() -> {
            String url = web.getUrl();
            Log.i(TAG, (tabs.size() == 2 && url != null && url.endsWith("?dn=tab") ? "PASS" : "FAIL") + " new tab (tabs=" + tabs.size() + ", url=" + url + ")");
            openFind();
            findField.setText("Example");
            web.postDelayed(() -> {
                String found = findCount.getText().toString();
                Log.i(TAG, (found.matches("[1-9][0-9]*/[1-9][0-9]*") ? "PASS" : "FAIL") + " find in page (" + found + ")");
                closeFind();
                closeTab(current);
                web.postDelayed(() -> {
                    String back = web.getUrl();
                    Log.i(TAG, (tabs.size() == 1 && back != null && back.endsWith("?dn=2") ? "PASS" : "FAIL") + " close tab returns to previous (tabs=" + tabs.size() + ", url=" + back + ")");
                    Log.i(TAG, "DONE");
                }, 2000);
            }, 3000);
        }, 6000);
    }

    private void selftestHistory() {
        String base = "https://example.com/?dn=";
        web.loadUrl(base + 1);
        web.postDelayed(() -> web.loadUrl(base + 2), 5000);
        web.postDelayed(() -> web.loadUrl(base + 3), 10000);
        web.postDelayed(() -> {
            stepHistory(-1, true);
            stepHistory(-1, true);
            stepHistory(-1, true);
            web.postDelayed(() -> {
                String url = web.getUrl();
                Log.i(TAG, (url != null && url.endsWith("?dn=2") ? "PASS" : "FAIL") + " back button repeated taps step one page (url=" + url + ", want ?dn=2)");
                selftestTabs();
            }, 6000);
        }, 15000);
    }
}
