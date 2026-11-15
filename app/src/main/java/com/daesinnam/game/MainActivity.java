package com.daesinnam.game;

import android.Manifest;
import android.app.Activity;
import android.app.NotificationManager;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import android.media.projection.MediaProjectionManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.MediaStore;
import android.provider.Settings;
import android.util.Base64;
import android.util.Log;
import android.view.Display;
import android.webkit.ConsoleMessage;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 덜누름 게임 — 게임과 게임 앱을 한곳에 모으고, 게임 녹화·게임 최적화 도구를 붙인 허브 앱.
 * 화면은 assets/ui/ (WebView), 기기 기능은 아래 Bridge가 맡습니다.
 * 다른 게임 앱(DroidDeck 등)은 원작 그대로 공식 배포처로 안내하고 실행만 합니다.
 */
public class MainActivity extends Activity {
    static final String TAG = "Game";
    static final String SELFTEST_TAG = "GAME_SELFTEST";
    private static final int REQ_RECORD = 11;
    private static final int REQ_PERMS = 12;

    private WebView web;
    private boolean selftest;
    private boolean pendingMic;
    private boolean dndByUs;
    private SharedPreferences prefs;
    private Optimizer optimizer;
    private final Handler main = new Handler(Looper.getMainLooper());
    private final Map<String, String> iconCache = new HashMap<>();

    /** 연결해 두는 게임 앱: 패키지, 이름, 설명, 공식 배포처 */
    static final String[][] GAME_APPS = {
        {"com.droiddeck.launcher", "DroidDeck", "스팀 · 배틀넷 · 에픽 · GOG 등 PC 게임을 폰에서", "https://github.com/Droid-Deck/DroidDeck/releases/latest"},
        {"com.limelight", "Moonlight", "집 PC 게임을 폰으로 스트리밍", "https://play.google.com/store/apps/details?id=com.limelight"},
        {"com.valvesoftware.steamlink", "Steam Link", "스팀 PC 게임 원격 플레이", "https://play.google.com/store/apps/details?id=com.valvesoftware.steamlink"},
        {"com.valvesoftware.android.steam.community", "Steam", "스팀 상점 · 친구 · 원격 설치", "https://play.google.com/store/apps/details?id=com.valvesoftware.android.steam.community"},
        {"com.gamepass", "Xbox Game Pass", "엑스박스 클라우드 게임", "https://play.google.com/store/apps/details?id=com.gamepass"},
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        prefs = getSharedPreferences("game", MODE_PRIVATE);
        optimizer = new Optimizer(this, prefs);
        selftest = getIntent().getBooleanExtra("game.selftest", false);
        web = new WebView(this);
        WebSettings ws = web.getSettings();
        ws.setJavaScriptEnabled(true);
        ws.setDomStorageEnabled(true);
        ws.setAllowFileAccess(true);
        web.setBackgroundColor(0xFF0F1222);
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(ConsoleMessage m) {
                Log.i("GameConsole", m.message() + " (" + m.sourceId() + ":" + m.lineNumber() + ")");
                return true;
            }
        });
        web.addJavascriptInterface(new Bridge(), "Android");
        setContentView(web);
        web.loadUrl("file:///android_asset/ui/index.html" + (selftest ? "?selftest=1" : ""));
    }

    @Override
    protected void onResume() {
        super.onResume();
        // 게임하러 나가며 켠 방해 금지는 돌아오면 끕니다
        if (dndByUs) {
            dndByUs = false;
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm.isNotificationPolicyAccessGranted()) nm.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_ALL);
        }
        if (web != null) web.evaluateJavascript("window.onResumeApp && onResumeApp()", null);
    }

    @Override
    public void onBackPressed() {
        web.evaluateJavascript("window.goBack ? goBack() : false", v -> {
            if (!"true".equals(v)) MainActivity.super.onBackPressed();
        });
    }

    // ---------- 앱 목록 ----------

    private String iconOf(ApplicationInfo ai) {
        String cached = iconCache.get(ai.packageName);
        if (cached != null) return cached;
        try {
            Drawable d = ai.loadIcon(getPackageManager());
            int size = 112;
            Bitmap b = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
            Canvas c = new Canvas(b);
            d.setBounds(0, 0, size, size);
            d.draw(c);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            b.compress(Bitmap.CompressFormat.PNG, 100, out);
            String s = "data:image/png;base64," + Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP);
            iconCache.put(ai.packageName, s);
            return s;
        } catch (Throwable t) {
            return "";
        }
    }

    private boolean isGame(ApplicationInfo ai) {
        return ai.category == ApplicationInfo.CATEGORY_GAME || (ai.flags & ApplicationInfo.FLAG_IS_GAME) != 0;
    }

    private Set<String> gameAppPackages() {
        Set<String> s = new HashSet<>();
        for (String[] a : GAME_APPS) s.add(a[0]);
        return s;
    }

    private List<ApplicationInfo> launcherApps() {
        PackageManager pm = getPackageManager();
        Intent i = new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER);
        List<ResolveInfo> list = pm.queryIntentActivities(i, 0);
        List<ApplicationInfo> out = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (ResolveInfo r : list) {
            ApplicationInfo ai = r.activityInfo.applicationInfo;
            if (ai.packageName.equals(getPackageName()) || !seen.add(ai.packageName)) continue;
            out.add(ai);
        }
        return out;
    }

    private JSONObject appJson(ApplicationInfo ai, boolean withIcon) throws Exception {
        JSONObject o = new JSONObject();
        o.put("pkg", ai.packageName);
        o.put("label", String.valueOf(ai.loadLabel(getPackageManager())));
        if (withIcon) o.put("icon", iconOf(ai));
        return o;
    }

    private void launchPackage(String pkg) {
        Intent i = getPackageManager().getLaunchIntentForPackage(pkg);
        if (i == null) throw new ActivityNotFoundException(pkg);
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        startActivity(i);
    }

    // ---------- 녹화 ----------

    private void requestRecording(boolean mic) {
        pendingMic = mic;
        List<String> need = new ArrayList<>();
        if (mic && checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED)
            need.add(Manifest.permission.RECORD_AUDIO);
        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED)
            need.add(Manifest.permission.POST_NOTIFICATIONS);
        if (!need.isEmpty()) {
            requestPermissions(need.toArray(new String[0]), REQ_PERMS);
            return;
        }
        askCapture();
    }

    private void askCapture() {
        MediaProjectionManager mpm = getSystemService(MediaProjectionManager.class);
        startActivityForResult(mpm.createScreenCaptureIntent(), REQ_RECORD);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        if (requestCode != REQ_PERMS) return;
        if (pendingMic && checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            pendingMic = false; // 마이크를 허용하지 않으면 화면만 녹화
            notifyJs("toast", "마이크를 허용하지 않아 화면만 녹화해요");
        }
        askCapture();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode != REQ_RECORD) return;
        if (resultCode != RESULT_OK || data == null) {
            notifyJs("toast", "녹화를 취소했어요");
            log("REC-CANCELLED");
            return;
        }
        Intent svc = new Intent(this, RecordService.class)
            .setAction(RecordService.ACTION_START)
            .putExtra("code", resultCode)
            .putExtra("data", data)
            .putExtra("mic", pendingMic);
        startForegroundService(svc);
    }

    // ---------- 그 밖 ----------

    void notifyJs(String type, String msg) {
        String js = "window.onNative && onNative(" + JSONObject.quote(type) + "," + JSONObject.quote(msg) + ")";
        main.post(() -> { if (web != null) web.evaluateJavascript(js, null); });
    }

    void log(String msg) {
        Log.i(selftest ? SELFTEST_TAG : TAG, msg);
    }

    private void openUrl(String url) {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        } catch (ActivityNotFoundException e) {
            notifyJs("toast", "주소를 열 앱이 없어요");
        }
    }

    private Set<String> addedGames() {
        return new HashSet<>(prefs.getStringSet("added", Collections.emptySet()));
    }

    /** 화면(WebView)에서 부르는 기능 */
    class Bridge {
        @JavascriptInterface
        public String games() {
            try {
                Set<String> added = addedGames();
                Set<String> hidden = new HashSet<>(prefs.getStringSet("hidden", Collections.emptySet()));
                Set<String> apps = gameAppPackages();
                JSONArray arr = new JSONArray();
                for (ApplicationInfo ai : launcherApps()) {
                    if (apps.contains(ai.packageName) || hidden.contains(ai.packageName)) continue;
                    boolean auto = isGame(ai);
                    if (!auto && !added.contains(ai.packageName)) continue;
                    JSONObject o = appJson(ai, true);
                    o.put("auto", auto);
                    arr.put(o);
                }
                return arr.toString();
            } catch (Exception e) {
                Log.w(TAG, "games", e);
                return "[]";
            }
        }

        @JavascriptInterface
        public String allApps() {
            try {
                Set<String> apps = gameAppPackages();
                JSONArray arr = new JSONArray();
                for (ApplicationInfo ai : launcherApps()) {
                    if (apps.contains(ai.packageName)) continue;
                    JSONObject o = appJson(ai, true);
                    o.put("game", isGame(ai));
                    arr.put(o);
                }
                return arr.toString();
            } catch (Exception e) {
                return "[]";
            }
        }

        @JavascriptInterface
        public void setGame(String pkg, boolean on) {
            Set<String> added = addedGames();
            Set<String> hidden = new HashSet<>(prefs.getStringSet("hidden", Collections.emptySet()));
            if (on) { added.add(pkg); hidden.remove(pkg); } else { added.remove(pkg); hidden.add(pkg); }
            prefs.edit().putStringSet("added", added).putStringSet("hidden", hidden).apply();
        }

        @JavascriptInterface
        public String gameApps() {
            try {
                JSONArray arr = new JSONArray();
                PackageManager pm = getPackageManager();
                for (String[] a : GAME_APPS) {
                    JSONObject o = new JSONObject();
                    o.put("pkg", a[0]);
                    o.put("label", a[1]);
                    o.put("desc", a[2]);
                    o.put("url", a[3]);
                    try {
                        ApplicationInfo ai = pm.getApplicationInfo(a[0], 0);
                        o.put("installed", true);
                        o.put("icon", iconOf(ai));
                    } catch (PackageManager.NameNotFoundException e) {
                        o.put("installed", false);
                    }
                    arr.put(o);
                }
                return arr.toString();
            } catch (Exception e) {
                return "[]";
            }
        }

        @JavascriptInterface
        public boolean launch(String pkg, boolean optimize) {
            try {
                if (optimize && prefs.getBoolean("dnd", false)) {
                    NotificationManager nm = getSystemService(NotificationManager.class);
                    if (nm.isNotificationPolicyAccessGranted()
                        && nm.getCurrentInterruptionFilter() == NotificationManager.INTERRUPTION_FILTER_ALL) {
                        nm.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_PRIORITY);
                        dndByUs = true;
                    }
                }
                if (optimize) {
                    Display d = getDisplay();
                    int maxHz = 60;
                    if (d != null) for (Display.Mode m : d.getSupportedModes()) maxHz = Math.max(maxHz, Math.round(m.getRefreshRate()));
                    int level = optimizer.effectiveLevel(pkg, d);
                    optimizer.applyRecording(level, maxHz);
                    // 다른 앱 설정(FPS 상한·해상도·게임 모드)은 고급 기능(Shizuku) 연결 뒤 적용
                    log("OPT " + pkg + " level " + level + " " + Optimizer.shellCommands(pkg, Optimizer.settings(level, maxHz)));
                }
                launchPackage(pkg);
                log("LAUNCH ok " + pkg);
                return true;
            } catch (Exception e) {
                log("LAUNCH fail " + pkg + " " + e);
                return false;
            }
        }

        @JavascriptInterface
        public void openUrl(String url) { MainActivity.this.openUrl(url); }

        @JavascriptInterface
        public void startRecording(boolean mic) { main.post(() -> requestRecording(mic)); }

        @JavascriptInterface
        public void stopRecording() {
            startService(new Intent(MainActivity.this, RecordService.class).setAction(RecordService.ACTION_STOP));
        }

        @JavascriptInterface
        public boolean isRecording() { return RecordService.running; }

        @JavascriptInterface
        public String lastSaved() { return RecordService.lastSaved == null ? "" : RecordService.lastSaved; }

        @JavascriptInterface
        public void openRecordings() {
            // 녹화 영상은 동영상/덜누름 게임 폴더에 있습니다. 갤러리(동영상 보기)를 엽니다.
            Intent i = new Intent(Intent.ACTION_VIEW, MediaStore.Video.Media.EXTERNAL_CONTENT_URI)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            try { startActivity(i); } catch (Exception e) { notifyJs("toast", "동영상을 볼 앱이 없어요"); }
        }

        @JavascriptInterface
        public String status() {
            try {
                JSONObject o = new JSONObject();
                NotificationManager nm = getSystemService(NotificationManager.class);
                o.put("dndAccess", nm.isNotificationPolicyAccessGranted());
                o.put("dnd", prefs.getBoolean("dnd", false));
                Display d = getDisplay();
                if (d != null) {
                    o.put("hz", Math.round(d.getRefreshRate()));
                    JSONArray modes = new JSONArray();
                    Set<Integer> seen = new HashSet<>();
                    for (Display.Mode m : d.getSupportedModes()) {
                        int hz = Math.round(m.getRefreshRate());
                        if (seen.add(hz)) modes.put(hz);
                    }
                    o.put("modes", modes);
                }
                o.put("recording", RecordService.running);
                boolean shizuku;
                try { getPackageManager().getApplicationInfo("moe.shizuku.privileged.api", 0); shizuku = true; }
                catch (PackageManager.NameNotFoundException e) { shizuku = false; }
                o.put("shizukuInstalled", shizuku);
                boolean gameBooster;
                try { getPackageManager().getApplicationInfo("com.samsung.android.game.gamehome", 0); gameBooster = true; }
                catch (PackageManager.NameNotFoundException e) { gameBooster = false; }
                o.put("samsungGame", gameBooster);
                o.put("version", BuildConfig.VERSION_NAME);
                return o.toString();
            } catch (Exception e) {
                return "{}";
            }
        }

        @JavascriptInterface
        public void setDnd(boolean on) {
            prefs.edit().putBoolean("dnd", on).apply();
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (on && !nm.isNotificationPolicyAccessGranted()) {
                try {
                    startActivity(new Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS));
                } catch (Exception ignored) { }
            }
        }

        @JavascriptInterface
        public void openSamsungGame() {
            try { launchPackage("com.samsung.android.game.gamehome"); } catch (Exception e) { notifyJs("toast", "삼성 게임 런처가 없어요"); }
        }

        /** 기기 정보 + 지금 추천 + 저장된 선택 (pkg가 비면 기본값) */
        @JavascriptInterface
        public String optimize(String pkg) {
            try {
                JSONObject d = optimizer.device(getDisplay());
                JSONObject r = Optimizer.recommend(d);
                JSONObject o = new JSONObject();
                o.put("device", d);
                o.put("recommend", r);
                int chosen = optimizer.chosenLevel(pkg == null || pkg.isEmpty() ? null : pkg);
                o.put("chosen", chosen);
                o.put("perGame", pkg != null && !pkg.isEmpty() && prefs.contains("level." + pkg));
                int maxHz = d.optInt("maxHz", 60);
                JSONArray levels = new JSONArray();
                for (int i = 0; i < 3; i++) {
                    JSONObject l = Optimizer.settings(i, maxHz);
                    l.put("name", Optimizer.LEVEL_NAMES[i]);
                    levels.put(l);
                }
                o.put("levels", levels);
                return o.toString();
            } catch (Exception e) {
                Log.w(TAG, "optimize", e);
                return "{}";
            }
        }

        /** level: -1 자동 추천, 0~2 단계, -2 게임별 값 지우기 */
        @JavascriptInterface
        public void chooseLevel(String pkg, int level) {
            optimizer.choose(pkg, level);
            if (pkg == null || pkg.isEmpty()) {
                Display d = getDisplay();
                int maxHz = 60;
                if (d != null) for (Display.Mode m : d.getSupportedModes()) maxHz = Math.max(maxHz, Math.round(m.getRefreshRate()));
                optimizer.applyRecording(optimizer.effectiveLevel(null, d), maxHz);
            }
        }

        @JavascriptInterface
        public void log(String msg) { MainActivity.this.log(msg); }
    }
}
