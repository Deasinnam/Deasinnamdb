package com.daesinnam.amp;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.ActivityOptions;
import android.app.NotificationManager;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothManager;
import android.content.ClipData;
import android.content.ComponentName;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.Insets;
import android.graphics.Rect;
import android.media.AudioDeviceCallback;
import android.media.AudioDeviceInfo;
import android.media.AudioManager;
import android.media.MediaMetadata;
import android.media.audiofx.Visualizer;
import android.media.MediaDescription;
import android.media.browse.MediaBrowser;
import android.media.session.MediaController;
import android.media.session.MediaSessionManager;
import android.media.session.PlaybackState;
import android.net.Uri;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.provider.ContactsContract;
import android.provider.Settings;
import android.database.Cursor;
import android.speech.tts.TextToSpeech;
import android.util.Base64;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.media3.common.Player;
import androidx.media3.session.SessionToken;
import androidx.webkit.WebViewAssetLoader;

import com.google.common.util.concurrent.ListenableFuture;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends Activity {

    private static final int REQ_FILES = 41;
    private static final int REQ_MIC = 42;
    private static final int REQ_LOC = 43;
    private static final int REQ_PICK = 44;
    private static final int REQ_TREE = 45;
    private static final int REQ_BT = 46;
    private static final int REQ_CALL = 47;
    private static final int REQ_CONTACT = 48;
    private static final int REQ_CAM = 49;
    private static final int REQ_REC = 50;
    private android.webkit.PermissionRequest pendingWebCam;
    private java.io.OutputStream recOut;
    private Uri recUri;
    private String recName;
    private String[] pendingCam;
    private String pendingCall;
    private boolean attWanted;
    // 보안: 앱 화면은 앱 전용 주소(.invalid는 실제 인터넷에 없는 이름)에서, 외부 지도 SDK는 지도 키에 등록한
    // 기존 주소(appassets.androidplatform.net)의 map.html에서만 돌립니다. 출처가 달라 지도 코드는 앱 화면과 기능에 손댈 수 없습니다.
    static final String APP_HOST = "app.daesinnam.invalid";
    static final String MAP_HOST = "appassets.androidplatform.net";
    private static final String START_URL = "https://" + APP_HOST + "/assets/index.html";
    private static final String MIGRATE_URL = "https://" + MAP_HOST + "/assets/migrate.html";
    /** 앱 기능(AndroidBridge) 열쇠: 앱 화면(최상위 문서)에만 심어 줍니다. 지도 등 다른 프레임은 몰라서 부를 수 없습니다. */
    static final String NBT = newToken();
    private static String newToken() {
        byte[] b = new byte[24];
        new java.security.SecureRandom().nextBytes(b);
        StringBuilder sb = new StringBuilder();
        for (byte x : b) sb.append(String.format(java.util.Locale.ROOT, "%02x", x));
        return sb.toString();
    }

    static WeakReference<MainActivity> current = new WeakReference<>(null);

    private WebView web;
    private ValueCallback<Uri[]> pendingChooser;
    private final Handler main = new Handler(Looper.getMainLooper());
    private boolean playing = false;
    private boolean resumed = false;

    // GPS 속도계
    private GpsTracker gps;
    // D1 DASHCAM: 블랙박스 와이파이(앱 전용) 연결
    private CamLink cam;
    private RadioPlayer radio;
    private volatile boolean gpsWanted = false;
    private boolean hudOn = false;
    private boolean landLock = false;   // 태블릿 모드 2: 가로 고정
    private boolean sideLock = false;   // TMAP 옆 창: 좌우로 나누려고 잠시 가로로 돌림
    private boolean screenAlways = true; // 앱 실행 중 화면 항상 켜 두기(기본)
    private boolean screenOnPlay = true; // 재생 중 화면 켜 두기(앱 설정: 자동이면 차량 스킨에서만)
    private boolean started = false;

    // 내 음악 표준 플레이어(Media3)와의 연결
    private ListenableFuture<androidx.media3.session.MediaController> natFuture;
    private androidx.media3.session.MediaController nat;
    private volatile String natSnap = "{\"connected\":false}";
    private Runnable natPending;
    private final Runnable natTick = new Runnable() {
        @Override
        public void run() {
            natSnap = buildNatSnap();
            if (started) main.postDelayed(this, 200);
        }
    };

    // 플레이리스트 · 차량 연결
    private final ExecutorService io = Executors.newSingleThreadExecutor();
    private volatile boolean pendingCarAutoplay = false;
    private long lastCarTrigger = 0;
    private boolean devCallbackReady = false;
    private final AudioDeviceCallback devCallback = new AudioDeviceCallback() {
        @Override
        public void onAudioDevicesAdded(AudioDeviceInfo[] added) {
            if (!devCallbackReady || !CarConnect.enabled(MainActivity.this)) return;
            for (AudioDeviceInfo d : added) {
                if (d.isSink() && d.getType() == AudioDeviceInfo.TYPE_BLUETOOTH_A2DP) {
                    String name = String.valueOf(d.getProductName());
                    if (CarConnect.matches(MainActivity.this, name)) onCarConnected(name);
                    return;
                }
            }
        }
    };

    // 외부 앱 연동
    private volatile boolean extMode = false;
    private volatile MediaController ctrl;
    private MediaSessionManager msm;
    private ComponentName listenerCn;
    private AudioManager am;
    private Visualizer viz;
    private final Object vizLock = new Object();
    private byte[] fft, wave;
    private volatile int vizRate = 44100;
    private volatile long vizTs = 0;
    private String artKey = "";
    private volatile String artData = "";
    private volatile int artVersion = 0;

    private final Runnable sessionTick = new Runnable() {
        @Override
        public void run() {
            if (!extMode) return;
            refreshSessions();
            if (resumed && viz == null) startViz();
            main.postDelayed(this, resumed ? 700 : 3000); // 화면이 안 보일 땐 천천히
        }
    };

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        current = new WeakReference<>(this);
        msm = getSystemService(MediaSessionManager.class);
        am = getSystemService(AudioManager.class);
        listenerCn = new ComponentName(this, MediaListener.class);
        gps = new GpsTracker(this);
        screenAlways = getSharedPreferences("app", MODE_PRIVATE).getBoolean("screenAlways", true);
        applyScreenOn();
        cam = new CamLink(this);
        radio = new RadioPlayer(this);

        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#05070D"));
        setContentView(web);
        applySystemBarPadding(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(true);
        s.setTextZoom(100);
        // TMAP 등 일부 지도 서버가 그림(타일)을 http로 보내도 표시되게 합니다(이미지 같은 수동 콘텐츠만 허용).
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);

        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .setDomain(APP_HOST)
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();
        final WebViewAssetLoader mapLoader = new WebViewAssetLoader.Builder()
                .setDomain(MAP_HOST)
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri u = request.getUrl();
                String host = u.getHost(), path = u.getPath() == null ? "" : u.getPath();
                if (MAP_HOST.equals(host)) {
                    // 지도 주소에서는 지도 페이지와 (처음 한 번) 설정 옮기기 페이지만 엽니다. 음악 파일·블랙박스 화면 등은 주지 않습니다.
                    if ("/assets/map.html".equals(path)) return mapLoader.shouldInterceptRequest(u);
                    if ("/assets/migrate.html".equals(path) && request.isForMainFrame()) return pageWithToken("migrate.html");
                    return denied();
                }
                if (!APP_HOST.equals(host)) return null; // 일반 인터넷 주소
                if ("/media".equals(path) || "/art".equals(path)) return MediaLibrary.serve(MainActivity.this, u, request.getRequestHeaders());
                if ("/cam/frame.jpg".equals(path)) return camFrame();
                if (path.startsWith("/tts/")) return ttsFile(u.getLastPathSegment());
                if (path.endsWith(".html") || path.endsWith(".htm")) {
                    // 앱 화면은 최상위 문서로만(다른 프레임 안에 앱 화면을 띄워 같은 출처로 들어오는 것을 막음).
                    // 지도 페이지 등 다른 html은 앱 주소에서 열지 않습니다.
                    if (request.isForMainFrame() && "/assets/index.html".equals(path)) return pageWithToken("index.html");
                    return denied();
                }
                WebResourceResponse r = loader.shouldInterceptRequest(u);
                return r != null ? r : denied(); // 앱 주소는 인터넷으로 나가지 않음
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            /** 주행 녹화: 앱 화면(자기 주소)만 카메라 사용 허가 — 소리는 쓰지 않음 */
            @Override
            public void onPermissionRequest(final android.webkit.PermissionRequest req) {
                main.post(() -> {
                    Uri o = req.getOrigin();
                    boolean ours = o != null && APP_HOST.equals(o.getHost());
                    boolean wantsCam = false;
                    for (String r : req.getResources()) if (android.webkit.PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(r)) wantsCam = true;
                    if (!ours || !wantsCam) { req.deny(); return; }
                    if (checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
                        req.grant(new String[]{android.webkit.PermissionRequest.RESOURCE_VIDEO_CAPTURE});
                    } else {
                        if (pendingWebCam != null) pendingWebCam.deny();
                        pendingWebCam = req;
                        requestPermissions(new String[]{Manifest.permission.CAMERA}, REQ_REC);
                    }
                });
            }

            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (pendingChooser != null) pendingChooser.onReceiveValue(null);
                pendingChooser = callback;
                Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType("audio/*");
                i.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
                try {
                    startActivityForResult(i, REQ_FILES);
                } catch (Exception e) {
                    pendingChooser = null;
                    return false;
                }
                return true;
            }
        });

        web.addJavascriptInterface(new Gate(new Bridge()), "AndroidBridge");

        SharedPreferences ap = getSharedPreferences("app", MODE_PRIVATE);
        if (!ap.getBoolean("origin2", false)) {
            // 1.15: 앱 화면 주소가 바뀌어 이전 주소에 저장된 설정·재생목록·즐겨찾기를 한 번 옮깁니다.
            web.loadUrl(MIGRATE_URL);
            main.postDelayed(() -> { if (!getSharedPreferences("app", MODE_PRIVATE).getBoolean("origin2", false)) finishMigrate(null); }, 6000);
        } else if (savedInstanceState != null && NBT.equals(savedInstanceState.getString("nbt"))) web.restoreState(savedInstanceState);
        else web.loadUrl(START_URL);

        connectPlayer();
        handleCarIntent(getIntent());
        am.registerAudioDeviceCallback(devCallback, main);
        // 등록 직후에는 이미 연결된 기기가 한꺼번에 전달되므로, 그 뒤에 새로 연결되는 것만 차량 연결로 봅니다.
        main.postDelayed(() -> devCallbackReady = true, 1500);

        if (Build.VERSION.SDK_INT >= 33
                && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 7);
        }
    }

    /** Android 15 이상에서는 화면이 상태바 아래까지 그려지므로, 시스템 바 높이만큼 여백을 줍니다. */
    private void applySystemBarPadding(View v) {
        v.setOnApplyWindowInsetsListener((view, insets) -> {
            int l, t, r, b;
            if (Build.VERSION.SDK_INT >= 30) {
                Insets in = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                l = in.left; t = in.top; r = in.right; b = in.bottom;
            } else {
                l = insets.getSystemWindowInsetLeft(); t = insets.getSystemWindowInsetTop();
                r = insets.getSystemWindowInsetRight(); b = insets.getSystemWindowInsetBottom();
            }
            view.setPadding(l, t, r, b);
            return insets;
        });
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQ_CONTACT) {
            onContactPicked(resultCode, data);
            return;
        }
        if (requestCode == REQ_PICK || requestCode == REQ_TREE) {
            onPicked(requestCode, resultCode, data);
            return;
        }
        if (requestCode != REQ_FILES || pendingChooser == null) return;
        Uri[] result = null;
        if (resultCode == RESULT_OK && data != null) {
            ClipData clip = data.getClipData();
            if (clip != null && clip.getItemCount() > 0) {
                result = new Uri[clip.getItemCount()];
                for (int k = 0; k < clip.getItemCount(); k++) result[k] = clip.getItemAt(k).getUri();
            } else if (data.getData() != null) {
                result = new Uri[]{data.getData()};
            }
        }
        pendingChooser.onReceiveValue(result);
        pendingChooser = null;
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(requestCode, permissions, results);
        if (requestCode == REQ_MIC && extMode) startViz();
        if (requestCode == REQ_LOC && gpsWanted) gps.start();
        if (requestCode == REQ_CALL && pendingCall != null) {
            String n = pendingCall;
            pendingCall = null;
            boolean ok = results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED;
            placeCall(n, ok);
        }
        if (requestCode == REQ_REC && pendingWebCam != null) {
            android.webkit.PermissionRequest r = pendingWebCam;
            pendingWebCam = null;
            if (results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED) r.grant(new String[]{android.webkit.PermissionRequest.RESOURCE_VIDEO_CAPTURE});
            else r.deny();
        }
        if (requestCode == REQ_CAM && pendingCam != null) {
            String[] a = pendingCam;
            pendingCam = null;
            camResult(cam.connect(a[0], a[1]));
        }
    }

    // ---------- D1 DASHCAM
    private WebResourceResponse camFrame() {
        byte[] f = cam.latestFrame();
        java.util.Map<String, String> h = new java.util.HashMap<>();
        h.put("Cache-Control", "no-store");
        h.put("Access-Control-Allow-Origin", "*");
        if (f == null) return new WebResourceResponse("image/jpeg", null, 404, "No Frame", h, new java.io.ByteArrayInputStream(new byte[0]));
        return new WebResourceResponse("image/jpeg", null, 200, "OK", h, new java.io.ByteArrayInputStream(f));
    }

    /** 와이파이 연결 요청에 필요한 권한: 13 이상은 근처 기기, 10~12는 정확한 위치 */
    private String camPermission() {
        if (Build.VERSION.SDK_INT >= 33) return "android.permission.NEARBY_WIFI_DEVICES";
        if (Build.VERSION.SDK_INT >= 29) return Manifest.permission.ACCESS_FINE_LOCATION;
        return null;
    }

    private void camResult(String r) {
        js("window.__camConnect && window.__camConnect(" + JSONObject.quote(r) + ")");
    }

    // ---------- 보안: 앱 화면에 열쇠 심기, 막힌 주소
    private WebResourceResponse denied() {
        return new WebResourceResponse("text/plain", "utf-8", 403, "Forbidden", null, new java.io.ByteArrayInputStream(new byte[0]));
    }

    private WebResourceResponse pageWithToken(String asset) {
        try (java.io.InputStream in = getAssets().open(asset)) {
            java.io.ByteArrayOutputStream b = new java.io.ByteArrayOutputStream();
            byte[] buf = new byte[16384];
            int n;
            while ((n = in.read(buf)) > 0) b.write(buf, 0, n);
            String html = b.toString("UTF-8").replace("\"__NBT__\"", "\"" + NBT + "\"");
            java.util.Map<String, String> h = new java.util.HashMap<>();
            h.put("Cache-Control", "no-store");
            h.put("Referrer-Policy", "strict-origin-when-cross-origin");
            return new WebResourceResponse("text/html", "utf-8", 200, "OK", h, new java.io.ByteArrayInputStream(html.getBytes("UTF-8")));
        } catch (Exception e) {
            return denied();
        }
    }

    /** 설정 옮기기 끝: 옮길 내용을 파일에 두고 앱 화면을 엶 */
    private void finishMigrate(String json) {
        try {
            if (json != null && json.length() > 2) {
                try (java.io.FileOutputStream o = openFileOutput("ls-migrate.json", MODE_PRIVATE)) { o.write(json.getBytes("UTF-8")); }
            }
        } catch (Exception ignored) {}
        getSharedPreferences("app", MODE_PRIVATE).edit().putBoolean("origin2", true).apply();
        if (web != null) web.loadUrl(START_URL);
    }

    private String takeMigrate() {
        java.io.File f = new java.io.File(getFilesDir(), "ls-migrate.json");
        if (!f.exists()) return "";
        String s = "";
        try (java.io.FileInputStream in = new java.io.FileInputStream(f)) {
            java.io.ByteArrayOutputStream b = new java.io.ByteArrayOutputStream();
            byte[] buf = new byte[16384];
            int n;
            while ((n = in.read(buf)) > 0) b.write(buf, 0, n);
            s = b.toString("UTF-8");
        } catch (Exception ignored) {}
        //noinspection ResultOfMethodCallIgnored
        f.delete();
        // 옛 주소의 사본은 지도 프레임과 같은 출처라 지웁니다(지도 SDK가 읽지 못하게).
        main.post(() -> { try { android.webkit.WebStorage.getInstance().deleteOrigin("https://" + MAP_HOST); } catch (Exception ignored) {} });
        return s;
    }

    /**
     * 화면에 드러나는 앱 기능은 이것 하나: 열쇠(NBT)가 맞을 때만 Bridge의 기능을 이름으로 불러 줍니다.
     * (안드로이드는 addJavascriptInterface 객체를 지도 iframe을 포함한 모든 프레임에 넣으므로, 열쇠로 앱 화면만 쓰게 합니다.)
     * 돌려주는 값: s글자 · b1/b0 · n숫자 · z(null) · u(없음) · e오류
     */
    private final class Gate {
        private final Object target;
        private final java.util.HashMap<String, java.lang.reflect.Method> map = new java.util.HashMap<>();
        private final String names;

        Gate(Object target) {
            this.target = target;
            StringBuilder sb = new StringBuilder();
            for (java.lang.reflect.Method m : target.getClass().getDeclaredMethods()) {
                if (!m.isAnnotationPresent(JavascriptInterface.class)) continue;
                m.setAccessible(true);
                map.put(m.getName(), m);
                if (sb.length() > 0) sb.append(',');
                sb.append(m.getName());
            }
            names = sb.toString();
        }

        @JavascriptInterface
        public String methods(String tok) {
            return NBT.equals(tok) ? names : "";
        }

        @JavascriptInterface
        public String call(String tok, String name, String args) {
            if (!NBT.equals(tok)) return "eDenied";
            java.lang.reflect.Method m = map.get(name);
            if (m == null) return "eNo method " + name;
            try {
                Class<?>[] ps = m.getParameterTypes();
                org.json.JSONArray a = args == null || args.isEmpty() ? new org.json.JSONArray() : new org.json.JSONArray(args);
                Object[] v = new Object[ps.length];
                for (int i = 0; i < ps.length; i++) {
                    Object x = i < a.length() ? a.opt(i) : null;
                    if (x == JSONObject.NULL) x = null;
                    Class<?> t = ps[i];
                    if (t == String.class) v[i] = x == null ? null : String.valueOf(x);
                    else if (t == boolean.class) v[i] = x instanceof Boolean ? (Boolean) x : x instanceof Number ? ((Number) x).doubleValue() != 0 : (x instanceof String && !((String) x).isEmpty());
                    else if (t == int.class) v[i] = x instanceof Number ? ((Number) x).intValue() : x instanceof String ? (int) parseNum((String) x) : 0;
                    else if (t == long.class) v[i] = x instanceof Number ? ((Number) x).longValue() : x instanceof String ? (long) parseNum((String) x) : 0L;
                    else if (t == double.class) v[i] = x instanceof Number ? ((Number) x).doubleValue() : x instanceof String ? parseNum((String) x) : 0d;
                    else if (t == float.class) v[i] = x instanceof Number ? ((Number) x).floatValue() : x instanceof String ? (float) parseNum((String) x) : 0f;
                    else v[i] = null;
                }
                Object r = m.invoke(target, v);
                if (r == null) return m.getReturnType() == void.class ? "u" : "z"; // z = null
                if (r instanceof String) return "s" + r;
                if (r instanceof Boolean) return (Boolean) r ? "b1" : "b0";
                if (r instanceof Number) return "n" + r;
                return "s" + r;
            } catch (java.lang.reflect.InvocationTargetException e) {
                Throwable c = e.getCause();
                return "e" + (c != null ? c : e);
            } catch (Exception e) {
                return "e" + e;
            }
        }

        private double parseNum(String s) {
            try { return Double.parseDouble(s.trim()); } catch (Exception e) { return 0; }
        }
    }

    // ---------- 콕핏 스킨 SOS: 정해 둔 연락처로 바로 전화
    private void placeCall(String number, boolean direct) {
        Uri u = Uri.parse("tel:" + Uri.encode(number));
        callArmed = true; // 앱에서 건 전화: 끝나면 앱으로 돌아옵니다.
        callAt = SystemClock.elapsedRealtime();
        main.removeCallbacks(callTick);
        main.postDelayed(callTick, 1500);
        // 전화 앱 화면을 이 앱 위에 열지 않고 통신 서비스로 바로 겁니다. 통화가 끝나면 통화 화면이 닫히고 이 앱이 다시 보입니다.
        if (direct && checkSelfPermission(Manifest.permission.CALL_PHONE) == PackageManager.PERMISSION_GRANTED) {
            try {
                android.telecom.TelecomManager tm = getSystemService(android.telecom.TelecomManager.class);
                if (tm != null) { tm.placeCall(u, new Bundle()); return; }
            } catch (Exception ignored) {}
        }
        try {
            startActivity(new Intent(direct ? Intent.ACTION_CALL : Intent.ACTION_DIAL, u));
        } catch (Exception e) {
            try { startActivity(new Intent(Intent.ACTION_DIAL, u)); } catch (Exception ignored) {}
        }
    }

    // ---------- 통화가 끝나면 통화 화면을 치우고 이 앱으로 돌아오기
    // 앱이 보이던 중에 전화가 오거나(받은 전화) 앱에서 건 전화일 때만 돌아옵니다. 통화 상태는 오디오 모드로 확인(전화 권한 불필요).
    private boolean callArmed = false, callSeen = false;
    private long callAt = 0, stopAt = 0;
    private static boolean inCallMode(int m) {
        return m == AudioManager.MODE_IN_CALL || m == AudioManager.MODE_IN_COMMUNICATION || m == AudioManager.MODE_RINGTONE
                || m == 4 /* MODE_CALL_SCREENING */;
    }
    private final Runnable callTick = new Runnable() {
        @Override
        public void run() {
            if (started && resumed && !callSeen) { callArmed = false; return; } // 이미 앱이 보이면 할 일 없음
            AudioManager am = (AudioManager) getSystemService(AUDIO_SERVICE);
            int m = am == null ? AudioManager.MODE_NORMAL : am.getMode();
            long now = SystemClock.elapsedRealtime();
            if (inCallMode(m)) {
                // 앱이 화면에 있다가 통화 때문에 가려진 경우(가려진 지 6초 안에 통화 시작)
                if (!callArmed && stopAt > 0 && now - stopAt < 6000) callArmed = true;
                if (callArmed) callSeen = true;
            } else if (callSeen) {
                callSeen = false;
                callArmed = false;
                main.postDelayed(MainActivity.this::returnAfterCall, 900); // "통화 종료" 표시를 잠깐 보여 준 뒤
                return;
            } else if (callArmed && now - callAt > 60000) {
                callArmed = false; // 전화가 연결되지 않음
                return;
            } else if (!callArmed && now - stopAt > 8000) {
                return; // 통화 때문에 가려진 것이 아님
            }
            main.postDelayed(this, 1000);
        }
    };

    private void returnAfterCall() {
        if (started && resumed) return;
        if (!getSharedPreferences("app", MODE_PRIVATE).getBoolean("callReturn", true)) return;
        try {
            Intent i = new Intent(this, MainActivity.class)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            startActivity(i);
        } catch (Exception ignored) {}
        try {
            android.app.ActivityManager am = (android.app.ActivityManager) getSystemService(ACTIVITY_SERVICE);
            if (am != null) am.moveTaskToFront(getTaskId(), 0);
        } catch (Exception ignored) {}
    }

    /** 연락처 앱에서 고른 번호 하나만 읽습니다(연락처 전체 읽기 권한 없이). */
    private void onContactPicked(int resultCode, Intent data) {
        if (resultCode != RESULT_OK || data == null || data.getData() == null) return;
        try (Cursor c = getContentResolver().query(data.getData(),
                new String[]{ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME, ContactsContract.CommonDataKinds.Phone.NUMBER}, null, null, null)) {
            if (c != null && c.moveToFirst()) {
                JSONObject o = new JSONObject();
                o.put("name", nz(c.getString(0)));
                o.put("number", nz(c.getString(1)));
                js("window.__sosPicked && window.__sosPicked(" + o + ")");
            }
        } catch (Exception ignored) {}
    }

    // ------------------------------------------------------------ 표준 플레이어(Media3)

    @androidx.annotation.OptIn(markerClass = androidx.media3.common.util.UnstableApi.class)
    private void connectPlayer() {
        SessionToken token = new SessionToken(this, new ComponentName(this, AmpPlayerService.class));
        natFuture = new androidx.media3.session.MediaController.Builder(this, token).buildAsync();
        natFuture.addListener(() -> {
            try {
                nat = natFuture.get();
                if (natPending != null) {
                    natPending.run();
                    natPending = null;
                }
                main.removeCallbacks(natTick);
                main.post(natTick);
            } catch (Exception ignored) {}
        }, main::post);
    }

    /** 연결 전이면 연결된 뒤에 실행 */
    private void withNat(Runnable r) {
        main.post(() -> {
            if (nat != null) r.run();
            else natPending = r;
        });
    }

    private String buildNatSnap() {
        JSONObject o = new JSONObject();
        try {
            androidx.media3.session.MediaController c = nat;
            o.put("connected", c != null);
            if (c != null) {
                o.put("count", c.getMediaItemCount());
                o.put("index", c.getCurrentMediaItemIndex());
                androidx.media3.common.MediaItem cur = c.getCurrentMediaItem();
                o.put("mid", cur != null ? cur.mediaId : "");
                o.put("playing", c.isPlaying());
                o.put("pwr", c.getPlayWhenReady());
                o.put("buffering", c.getPlaybackState() == Player.STATE_BUFFERING);
                o.put("ended", c.getPlaybackState() == Player.STATE_ENDED);
                o.put("pos", Math.max(0, c.getCurrentPosition()));
                long d = c.getDuration();
                o.put("dur", d > 0 ? d : 0);
                o.put("rate", AmpPlayerService.TAP.sampleRate);
                o.put("err", AmpPlayerService.lastError);
                o.put("errIndex", AmpPlayerService.errorIndex);
            }
        } catch (Exception ignored) {}
        return o.toString();
    }

    // ------------------------------------------------------------ 플레이리스트 저장용 파일 선택

    private void pickAudio(boolean folder) {
        Intent i;
        if (folder) {
            i = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        } else {
            i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
            i.addCategory(Intent.CATEGORY_OPENABLE);
            i.setType("audio/*");
            i.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
        }
        i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
        try {
            startActivityForResult(i, folder ? REQ_TREE : REQ_PICK);
        } catch (Exception e) {
            js("window.__onPicked && window.__onPicked(null)");
        }
    }

    private void onPicked(int req, int result, Intent data) {
        if (result != RESULT_OK || data == null) {
            js("window.__onPicked && window.__onPicked(null)");
            return;
        }
        final List<Uri> uris = new ArrayList<>();
        final Uri tree = req == REQ_TREE ? data.getData() : null;
        if (tree != null) {
            MediaLibrary.persist(getContentResolver(), tree);
        } else {
            ClipData clip = data.getClipData();
            if (clip != null) for (int k = 0; k < clip.getItemCount(); k++) uris.add(clip.getItemAt(k).getUri());
            else if (data.getData() != null) uris.add(data.getData());
            for (Uri u : uris) MediaLibrary.persist(getContentResolver(), u);
        }
        js("window.__onPickStart && window.__onPickStart()");
        io.execute(() -> {
            List<Uri> list = tree != null ? MediaLibrary.scanTree(getContentResolver(), tree) : uris;
            final String json = MediaLibrary.describeAll(this, list).toString();
            js("window.__onPicked && window.__onPicked(" + json + ")");
        });
    }

    @Override
    public void onConfigurationChanged(@androidx.annotation.NonNull android.content.res.Configuration c) {
        super.onConfigurationChanged(c);
        if (isInMultiWindowMode() || lastSplit) main.postDelayed(this::pushSplit, 200); // 가운데 막대를 끌어 비율이 바뀔 때
    }

    private boolean lastSplit = false;

    /** 분할 상태 {on, ratio(이 앱 창 높이 ÷ 화면 높이)} */
    private String splitState() {
        boolean on = Build.VERSION.SDK_INT >= 24 && isInMultiWindowMode();
        double ratio = 1;
        try {
            if (Build.VERSION.SDK_INT >= 30) {
                Rect cur = getWindowManager().getCurrentWindowMetrics().getBounds();
                Rect max = getWindowManager().getMaximumWindowMetrics().getBounds();
                if (max.height() > 0) ratio = cur.height() / (double) max.height();
            } else if (web != null && web.getRootView() != null) {
                android.util.DisplayMetrics dm = new android.util.DisplayMetrics();
                getWindowManager().getDefaultDisplay().getRealMetrics(dm);
                if (dm.heightPixels > 0) ratio = web.getRootView().getHeight() / (double) dm.heightPixels;
            }
        } catch (Exception ignored) {}
        return "{\"on\":" + on + ",\"ratio\":" + String.format(java.util.Locale.ROOT, "%.3f", ratio) + "}";
    }

    private void pushSplit() {
        lastSplit = Build.VERSION.SDK_INT >= 24 && isInMultiWindowMode();
        js("window.__split&&window.__split(" + splitState() + ")");
    }

    private void js(final String code) {
        main.post(() -> {
            if (web != null) web.evaluateJavascript(code, null);
        });
    }

    // ------------------------------------------------------------ 차량 연결 시 자동 재생

    private void handleCarIntent(Intent i) {
        if (i != null && i.getBooleanExtra(CarConnect.EXTRA_AUTOPLAY, false)) {
            i.removeExtra(CarConnect.EXTRA_AUTOPLAY);
            CarConnect.clearNotification(this);
            pendingCarAutoplay = true;
            // 화면이 이미 떠 있으면 바로 전달, 아직 로딩 중이면 화면이 takeCarAutoplay()로 가져갑니다.
            js("window.__carConnected && window.__carConnected('') && (window.__carTaken=1)");
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleCarIntent(intent);
    }

    void onCarConnected(final String name) {
        long now = SystemClock.elapsedRealtime();
        if (now - lastCarTrigger < 20000) return; // 같은 연결로 여러 신호가 와도 한 번만
        lastCarTrigger = now;
        CarConnect.clearNotification(this);
        // 블루투스 오디오 경로가 준비될 시간을 잠깐 줍니다.
        main.postDelayed(() -> js("window.__carConnected && window.__carConnected(" + JSONObject.quote(name == null ? "" : name) + ")"), 2500);
    }

    private List<String> connectedCarAudio() {
        List<String> out = new ArrayList<>();
        for (AudioDeviceInfo d : am.getDevices(AudioManager.GET_DEVICES_OUTPUTS)) {
            if (d.getType() == AudioDeviceInfo.TYPE_BLUETOOTH_A2DP) out.add(String.valueOf(d.getProductName()));
        }
        return out;
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent e) {
        // DeX 키보드·블루투스 키보드의 미디어 키 (앱 창에 초점이 있을 때)
        if (e.getAction() == KeyEvent.ACTION_DOWN && e.getRepeatCount() == 0) {
            String cmd = null, label = null;
            switch (e.getKeyCode()) {
                case KeyEvent.KEYCODE_MEDIA_NEXT: cmd = "next"; label = "다음 곡"; break;
                case KeyEvent.KEYCODE_MEDIA_PREVIOUS: cmd = "prev"; label = "이전 곡"; break;
                case KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE:
                case KeyEvent.KEYCODE_HEADSETHOOK: cmd = "toggle"; label = "재생/일시정지"; break;
                case KeyEvent.KEYCODE_MEDIA_PLAY: cmd = "play"; label = "재생"; break;
                case KeyEvent.KEYCODE_MEDIA_PAUSE: cmd = "pause"; label = "일시정지"; break;
                default: break;
            }
            if (cmd != null) {
                PlaybackService.logKey(label + " (키보드)");
                control(cmd);
                return true;
            }
        }
        return super.dispatchKeyEvent(e);
    }

    /** 알림의 재생 버튼을 누르면 웹 화면의 플레이어를 조작합니다. */
    void control(final String cmd) {
        main.post(() -> {
            if (web != null) web.evaluateJavascript("window.__ctl && window.__ctl('" + cmd + "')", null);
        });
    }

    @Override
    public void onMultiWindowModeChanged(boolean inMulti, android.content.res.Configuration cfg) {
        super.onMultiWindowModeChanged(inMulti, cfg);
        main.postDelayed(this::pushSplit, 250); // 화면 분할(TMAP 위·아래): 앱 화면을 남은 칸에 맞게 다시 배치
        // 옆 창 분할이 끝나면 회전 설정을 원래대로(태블릿 모드 2면 가로 고정 유지)
        if (!inMulti && sideLock) {
            sideLock = false;
            setRequestedOrientation(landLock ? android.content.pm.ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE : android.content.pm.ActivityInfo.SCREEN_ORIENTATION_FULL_USER);
        }
    }

    @Override
    protected void onStart() {
        super.onStart();
        started = true;
        if (nat != null) { main.removeCallbacks(natTick); main.post(natTick); } // 화면에 다시 보이면 상태 읽기 재개
        if (gpsWanted) gps.start();
        if (attWanted) gps.attStart();
    }

    @Override
    protected void onStop() {
        started = false;
        stopAt = SystemClock.elapsedRealtime();
        main.removeCallbacks(callTick);
        main.postDelayed(callTick, 1200); // 통화 화면 때문에 가려졌는지 확인
        main.removeCallbacks(natTick); // 화면이 꺼져 있을 땐 0.2초마다 상태 읽기를 멈춤(재생은 서비스가 계속)
        gps.stop(); // 화면에 안 보일 때는 GPS를 꺼서 배터리를 아낍니다.
        gps.attStop();
        super.onStop();
    }

    private void startGps() {
        gpsWanted = true;
        if (gps.hasPerm()) {
            gps.start();
            return;
        }
        SharedPreferences p = getSharedPreferences("perm", MODE_PRIVATE);
        if (p.getBoolean("loc", false) && !shouldShowRequestPermissionRationale(Manifest.permission.ACCESS_FINE_LOCATION)) {
            try { startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getPackageName()))); } catch (Exception ignored) {}
            return;
        }
        p.edit().putBoolean("loc", true).apply();
        requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION}, REQ_LOC);
    }

    private synchronized void recCloseQuiet() {
        if (recOut != null) try { recOut.close(); } catch (Exception ignored) {}
        if (recUri != null && Build.VERSION.SDK_INT >= 29) {
            try { android.content.ContentValues v = new android.content.ContentValues(); v.put(android.provider.MediaStore.Video.Media.IS_PENDING, 0); getContentResolver().update(recUri, v, null, null); } catch (Exception ignored) {}
        }
        recOut = null; recUri = null; recName = null;
    }

    private static JSONObject cap(String s, String t) {
        JSONObject j = new JSONObject();
        try { j.put("s", s); j.put("t", t); } catch (Exception ignored) {}
        return j;
    }

    /** 화면 켜 두기 결정은 한 곳에서: 항상 켜기 · HUD · 재생 중 켜기 */
    private void applyScreenOn() {
        if (screenAlways || hudOn || (playing && screenOnPlay)) getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }

    @Override
    protected void onResume() {
        super.onResume();
        resumed = true;
        if (extMode) {
            refreshSessions();
            startViz();
        }
    }

    @Override
    protected void onPause() {
        resumed = false;
        stopViz(); // 화면이 안 보일 때는 시각화를 멈춰 배터리를 아낍니다.
        super.onPause();
    }

    @Override
    public void onBackPressed() {
        // 재생 중이거나 외부 앱 연동 중이면 앱을 끄지 않고 뒤로 보냅니다.
        if (playing || extMode) moveTaskToBack(true);
        else super.onBackPressed();
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        if (web != null) web.saveState(out);
        out.putString("nbt", NBT); // 같은 열쇠일 때만(앱이 다시 시작되지 않았을 때만) 화면 상태를 되살림
    }

    // ---------- 콕핏 스킨: 관제탑 음성
    // 관제탑 무전: TTS를 파일로 만들어 화면(Web Audio)에서 무전기 소리(대역 제한·찌그러짐·잡음·스퀠치)로 재생합니다.
    private TextToSpeech tts;
    private boolean ttsReady;
    private final java.util.ArrayList<Runnable> ttsQueue = new java.util.ArrayList<>();

    private void withTts(Runnable r) {
        if (tts != null && ttsReady) { r.run(); return; }
        ttsQueue.add(r);
        if (tts != null) return;
        tts = new TextToSpeech(getApplicationContext(), status -> {
            ttsReady = status == TextToSpeech.SUCCESS;
            if (ttsReady) {
                tts.setLanguage(Locale.KOREAN);
                // 가장 자연스러운 한국어 목소리(품질이 높은 것)를 고릅니다.
                try {
                    android.speech.tts.Voice best = null;
                    for (android.speech.tts.Voice v : tts.getVoices()) {
                        if (v.getLocale() == null || !"ko".equals(v.getLocale().getLanguage())) continue;
                        if (v.getFeatures() != null && v.getFeatures().contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED)) continue;
                        if (best == null || v.getQuality() > best.getQuality()
                                || (v.getQuality() == best.getQuality() && v.isNetworkConnectionRequired() && !best.isNetworkConnectionRequired())) best = v;
                    }
                    if (best != null) tts.setVoice(best);
                } catch (Exception ignored) {}
                tts.setSpeechRate(1.0f);
                tts.setPitch(0.96f);
                tts.setOnUtteranceProgressListener(new android.speech.tts.UtteranceProgressListener() {
                    @Override public void onStart(String id) {}
                    @Override public void onDone(String id) { if (id != null && id.startsWith("rd")) js("window.__ttsFile && window.__ttsFile('" + id + "', true)"); }
                    @Override public void onError(String id) { if (id != null && id.startsWith("rd")) js("window.__ttsFile && window.__ttsFile('" + id + "', false)"); }
                });
            }
            java.util.ArrayList<Runnable> q = new java.util.ArrayList<>(ttsQueue);
            ttsQueue.clear();
            if (ttsReady) for (Runnable x : q) x.run();
        });
    }

    private void speak(String text) {
        withTts(() -> tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "atc"));
    }

    private java.io.File ttsDir() {
        java.io.File d = new java.io.File(getCacheDir(), "tts");
        if (!d.exists()) d.mkdirs();
        return d;
    }

    private void speakToFile(String text, String id) {
        withTts(() -> {
            java.io.File[] old = ttsDir().listFiles();
            if (old != null) for (java.io.File f : old) if (System.currentTimeMillis() - f.lastModified() > 60000) f.delete();
            int r = tts.synthesizeToFile(text, new Bundle(), new java.io.File(ttsDir(), id + ".wav"), id);
            if (r != TextToSpeech.SUCCESS) js("window.__ttsFile && window.__ttsFile('" + id + "', false)");
        });
    }

    private WebResourceResponse ttsFile(String name) {
        java.util.Map<String, String> h = new java.util.HashMap<>();
        h.put("Cache-Control", "no-store");
        try {
            if (name == null || !name.matches("rd[0-9a-z]+\\.wav")) throw new java.io.FileNotFoundException();
            java.io.File f = new java.io.File(ttsDir(), name);
            return new WebResourceResponse("audio/wav", null, 200, "OK", h, new java.io.FileInputStream(f));
        } catch (Exception e) {
            return new WebResourceResponse("audio/wav", null, 404, "Not Found", h, new java.io.ByteArrayInputStream(new byte[0]));
        }
    }

    private BluetoothAdapter btAdapter() {
        BluetoothManager bm = getSystemService(BluetoothManager.class);
        return bm == null ? null : bm.getAdapter();
    }

    @Override
    protected void onDestroy() {
        recCloseQuiet(); // 녹화 중 앱이 닫혀도 그때까지 찍은 파일은 남김
        main.removeCallbacksAndMessages(null);
        if (tts != null) { tts.shutdown(); tts = null; }
        try { am.unregisterAudioDeviceCallback(devCallback); } catch (Exception ignored) {}
        if (natFuture != null) androidx.media3.session.MediaController.releaseFuture(natFuture);
        nat = null;
        stopViz();
        gps.stop();
        cam.disconnect();
        if (radio != null) radio.release();
        ExternalEq.I.setActive(false);
        stopService(new Intent(this, PlaybackService.class));
        if (web != null) {
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }

    // ---------------------------------------------------------------- 외부 앱

    private static boolean notifSupported() {
        return "full".equals(BuildConfig.FLAVOR);
    }

    private boolean hasNotifAccess() {
        if (!notifSupported()) return false;
        if (Build.VERSION.SDK_INT >= 27) {
            NotificationManager nm = getSystemService(NotificationManager.class);
            return nm.isNotificationListenerAccessGranted(listenerCn);
        }
        String flat = Settings.Secure.getString(getContentResolver(), "enabled_notification_listeners");
        return flat != null && flat.contains(listenerCn.flattenToString());
    }

    private boolean hasMic() {
        return checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;
    }

    private void refreshSessions() {
        if (!hasNotifAccess()) {
            ctrl = null;
            updateArt(null); // 권한이 없어도 Spotify 방송 정보로 아트를 찾습니다.
            return;
        }
        try {
            List<MediaController> list = msm.getActiveSessions(listenerCn);
            MediaController pick = null;
            for (MediaController c : list) {
                if (getPackageName().equals(c.getPackageName())) continue;
                PlaybackState st = c.getPlaybackState();
                if (st != null && st.getState() == PlaybackState.STATE_PLAYING) {
                    pick = c;
                    break;
                }
                if (pick == null) pick = c;
            }
            ctrl = pick;
            updateArt(pick != null ? pick : null);
        } catch (SecurityException e) {
            ctrl = null;
        }
    }

    private boolean spotifyFallback() {
        return SpotifyInfo.known() && (SpotifyInfo.playing || !am.isMusicActive());
    }

    /**
     * 앨범 아트 갱신.
     * 재생 앱이 이미지를 주면 그대로 쓰고, 없으면 곡 정보로 인터넷에서 찾아옵니다(ArtLookup).
     */
    private void updateArt(MediaController c) {
        Bitmap bmp = null;
        String pkg = "", title = "", artist = "", sid = "";
        if (c != null) {
            pkg = c.getPackageName();
            MediaMetadata md = c.getMetadata();
            if (md != null) {
                bmp = md.getBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART);
                if (bmp == null) bmp = md.getBitmap(MediaMetadata.METADATA_KEY_ART);
                if (bmp == null) bmp = md.getBitmap(MediaMetadata.METADATA_KEY_DISPLAY_ICON);
                title = nz(md.getString(MediaMetadata.METADATA_KEY_TITLE));
                String ar = md.getString(MediaMetadata.METADATA_KEY_ARTIST);
                if (ar == null) ar = md.getString(MediaMetadata.METADATA_KEY_ALBUM_ARTIST);
                artist = nz(ar);
            }
        } else if (spotifyFallback()) {
            pkg = "com.spotify.music";
            title = SpotifyInfo.title;
            artist = SpotifyInfo.artist;
            sid = SpotifyInfo.trackId;
        }
        if ("com.spotify.music".equals(pkg) && sid.isEmpty() && title.equals(SpotifyInfo.title)) sid = SpotifyInfo.trackId;

        final String key = pkg + "|" + title + "|" + artist + "|" + System.identityHashCode(bmp);
        if (key.equals(artKey)) return;
        artKey = key;

        if (bmp != null) {
            String data = "";
            try {
                int w = bmp.getWidth(), h = bmp.getHeight();
                float sc = Math.min(1f, 480f / Math.max(w, h));
                Bitmap small = sc < 1f ? Bitmap.createScaledBitmap(bmp, Math.max(1, Math.round(w * sc)), Math.max(1, Math.round(h * sc)), true) : bmp;
                ByteArrayOutputStream out = new ByteArrayOutputStream();
                small.compress(Bitmap.CompressFormat.JPEG, 88, out);
                data = "data:image/jpeg;base64," + Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP);
            } catch (Throwable ignored) {}
            artData = data;
            artVersion++;
            return;
        }

        artData = "";
        artVersion++;
        if (title.isEmpty()) return;
        ArtLookup.find(sid, title, artist, url -> main.post(() -> {
            if (key.equals(artKey) && url != null) {
                artData = url;
                artVersion++;
            }
        }));
    }

    private void startViz() {
        if (viz != null || !extMode || !resumed || !hasMic()) return;
        try {
            Visualizer v = new Visualizer(0);
            int[] range = Visualizer.getCaptureSizeRange();
            v.setCaptureSize(Math.min(1024, range[1]));
            v.setScalingMode(Visualizer.SCALING_MODE_NORMALIZED);
            v.setDataCaptureListener(new Visualizer.OnDataCaptureListener() {
                @Override
                public void onWaveFormDataCapture(Visualizer vis, byte[] bytes, int rate) {
                    synchronized (vizLock) { wave = bytes.clone(); }
                }

                @Override
                public void onFftDataCapture(Visualizer vis, byte[] bytes, int rate) {
                    synchronized (vizLock) { fft = bytes.clone(); }
                    vizRate = rate / 1000;
                    vizTs = SystemClock.elapsedRealtime();
                }
            }, Visualizer.getMaxCaptureRate(), true, true);
            v.setEnabled(true);
            viz = v;
        } catch (Throwable t) {
            viz = null;
        }
    }

    private void stopViz() {
        if (viz == null) return;
        try {
            viz.setEnabled(false);
            viz.release();
        } catch (Throwable ignored) {}
        viz = null;
        synchronized (vizLock) { fft = null; wave = null; }
    }

    private void setExternal(boolean on) {
        if (extMode == on) return;
        extMode = on;
        ExternalEq.I.setActive(on);
        Intent i = new Intent(this, PlaybackService.class).setAction(PlaybackService.ACTION_EXT).putExtra("on", on);
        try {
            if (on) startForegroundService(i);
            else if (PlaybackService.running) startService(i);
        } catch (Exception ignored) {}
        main.removeCallbacks(sessionTick);
        if (on) {
            main.post(sessionTick);
        } else {
            stopViz();
            ctrl = null;
        }
    }

    private void openApp(String pkg) {
        Intent launch = getPackageManager().getLaunchIntentForPackage(pkg);
        try {
            if (launch != null) {
                startActivity(launch);
                return;
            }
            startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=" + pkg)));
        } catch (Exception e) {
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=" + pkg)));
            } catch (Exception ignored) {}
        }
    }

    private void openNotificationAccess() {
        try {
            if (Build.VERSION.SDK_INT >= 30) {
                Intent i = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_DETAIL_SETTINGS);
                i.putExtra(Settings.EXTRA_NOTIFICATION_LISTENER_COMPONENT_NAME, listenerCn.flattenToString());
                startActivity(i);
                return;
            }
        } catch (Exception ignored) {}
        try {
            startActivity(new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS));
        } catch (Exception ignored) {}
    }

    private void requestMic() {
        if (hasMic()) return;
        SharedPreferences p = getSharedPreferences("perm", MODE_PRIVATE);
        boolean askedBefore = p.getBoolean("mic", false);
        if (askedBefore && !shouldShowRequestPermissionRationale(Manifest.permission.RECORD_AUDIO)) {
            // 두 번 거절하면 시스템이 더 묻지 않으므로 앱 설정 화면을 엽니다.
            Intent i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getPackageName()));
            try { startActivity(i); } catch (Exception ignored) {}
            return;
        }
        p.edit().putBoolean("mic", true).apply();
        requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, REQ_MIC);
    }

    /** 알림 접근 권한이 없을 때: 현재 재생 중인 앱에 미디어 버튼 신호를 보냅니다. */
    private void sendMediaKey(String cmd) {
        int code;
        switch (cmd) {
            case "play": code = KeyEvent.KEYCODE_MEDIA_PLAY; break;
            case "pause": code = KeyEvent.KEYCODE_MEDIA_PAUSE; break;
            case "stop": code = KeyEvent.KEYCODE_MEDIA_STOP; break;
            case "next": code = KeyEvent.KEYCODE_MEDIA_NEXT; break;
            case "prev": code = KeyEvent.KEYCODE_MEDIA_PREVIOUS; break;
            default: return;
        }
        try {
            am.dispatchMediaKeyEvent(new KeyEvent(KeyEvent.ACTION_DOWN, code));
            am.dispatchMediaKeyEvent(new KeyEvent(KeyEvent.ACTION_UP, code));
        } catch (Exception ignored) {}
    }

    /** 특정 음악 앱(YouTube Music·Spotify)을 앱 화면을 열지 않고 재생: 활성 세션 → 미디어 버튼 → 마지막 플레이어 순서 */
    private void startMediaApp(String pkg) {
        try {
            if (hasNotifAccess()) {
                for (MediaController c : msm.getActiveSessions(listenerCn)) {
                    if (pkg.isEmpty() ? !getPackageName().equals(c.getPackageName()) : pkg.equals(c.getPackageName())) {
                        c.getTransportControls().play();
                        ctrl = c;
                        return;
                    }
                }
            }
        } catch (Exception ignored) {}
        if (!pkg.isEmpty()) {
            try {
                for (int a : new int[]{KeyEvent.ACTION_DOWN, KeyEvent.ACTION_UP}) {
                    Intent i = new Intent(Intent.ACTION_MEDIA_BUTTON).setPackage(pkg);
                    i.putExtra(Intent.EXTRA_KEY_EVENT, new KeyEvent(a, KeyEvent.KEYCODE_MEDIA_PLAY));
                    sendBroadcast(i);
                }
                return;
            } catch (Exception ignored) {}
        }
        sendMediaKey("play"); // 시스템이 마지막으로 소리 낸 앱에 재생 신호
    }

    /* ---------- 외부 음악 앱 둘러보기(자동차 화면용 MediaBrowser) ---------- */
    private MediaBrowser browser;
    private String browserPkg = "";
    private void browse(final String pkg, final String parent) {
        final Runnable fail = () -> js("window.__extBrowse && window.__extBrowse(" + JSONObject.quote("{\"pkg\":" + JSONObject.quote(pkg) + ",\"ok\":false}") + ")");
        try {
            if (browser != null && browserPkg.equals(pkg) && browser.isConnected()) { subscribe(pkg, parent.isEmpty() ? browser.getRoot() : parent); return; }
            if (browser != null) { try { browser.disconnect(); } catch (Exception ignored) {} browser = null; }
            Intent q = new Intent("android.media.browse.MediaBrowserService").setPackage(pkg);
            List<android.content.pm.ResolveInfo> rs = getPackageManager().queryIntentServices(q, 0);
            if (rs == null || rs.isEmpty()) { fail.run(); return; }
            ComponentName cn = new ComponentName(pkg, rs.get(0).serviceInfo.name);
            browserPkg = pkg;
            Bundle hints = new Bundle();
            hints.putBoolean("android.service.media.extra.RECENT", false);
            browser = new MediaBrowser(this, cn, new MediaBrowser.ConnectionCallback() {
                @Override public void onConnected() { subscribe(pkg, parent.isEmpty() ? browser.getRoot() : parent); }
                @Override public void onConnectionFailed() { fail.run(); }
                @Override public void onConnectionSuspended() { fail.run(); }
            }, hints);
            browser.connect();
        } catch (Exception e) { fail.run(); }
    }
    private void subscribe(final String pkg, final String id) {
        try {
            browser.subscribe(id, new MediaBrowser.SubscriptionCallback() {
                @Override public void onChildrenLoaded(String parentId, List<MediaBrowser.MediaItem> children) {
                    try {
                        JSONObject o = new JSONObject(); o.put("pkg", pkg); o.put("ok", true); o.put("parent", parentId);
                        org.json.JSONArray a = new org.json.JSONArray();
                        for (MediaBrowser.MediaItem it : children) {
                            if (a.length() >= 200) break;
                            MediaDescription d = it.getDescription(); JSONObject x = new JSONObject();
                            x.put("id", it.getMediaId()); x.put("title", String.valueOf(d.getTitle() == null ? "" : d.getTitle()));
                            x.put("sub", String.valueOf(d.getSubtitle() == null ? "" : d.getSubtitle()));
                            x.put("play", it.isPlayable()); x.put("folder", it.isBrowsable()); a.put(x);
                        }
                        o.put("items", a);
                        js("window.__extBrowse && window.__extBrowse(" + JSONObject.quote(o.toString()) + ")");
                    } catch (Exception ignored) {}
                }
                @Override public void onError(String parentId) {
                    js("window.__extBrowse && window.__extBrowse(" + JSONObject.quote("{\"pkg\":" + JSONObject.quote(pkg) + ",\"ok\":false}") + ")");
                }
            });
        } catch (Exception e) {
            js("window.__extBrowse && window.__extBrowse(" + JSONObject.quote("{\"pkg\":" + JSONObject.quote(pkg) + ",\"ok\":false}") + ")");
        }
    }
    private void browsePlay(String pkg, String mediaId) {
        try {
            if (browser != null && browser.isConnected() && browserPkg.equals(pkg)) {
                MediaController c = new MediaController(this, browser.getSessionToken());
                c.getTransportControls().playFromMediaId(mediaId, null);
                ctrl = c;
            }
        } catch (Exception ignored) {}
    }

    private int systemVolume() {
        int max = am.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
        return max > 0 ? Math.round(am.getStreamVolume(AudioManager.STREAM_MUSIC) * 100f / max) : 0;
    }

    private static String encode(byte[] src, boolean fftMode) {
        if (src == null) return "";
        if (fftMode) {
            int n = src.length / 2;
            char[] out = new char[n];
            out[0] = 32;
            for (int k = 1; k < n; k++) {
                int re = src[2 * k], im = src[2 * k + 1];
                double mag = Math.hypot(re, im);
                double db = 20 * Math.log10(mag / 128.0 + 1e-9);
                int v = (int) Math.round((db + 54) / 54 * 255);
                out[k] = (char) (Math.max(0, Math.min(255, v)) + 32);
            }
            return new String(out);
        }
        int n = Math.min(512, src.length);
        int step = Math.max(1, src.length / n);
        char[] out = new char[n];
        for (int i = 0; i < n; i++) out[i] = (char) ((src[i * step] & 0xff) + 32);
        return new String(out);
    }

    // ---------------------------------------------------------------- 웹 화면과 연결

    private class Bridge {
        /** 내 음악 재생 상태. state: "playing" | "paused" | "stopped" */
        @JavascriptInterface
        public void onPlayState(final String state, final String title, final String artist) {
            onNowPlaying(state, title, artist, NowPlaying.durationMs, NowPlaying.positionMs);
        }

        /** 내 음악 재생 상태. state: "playing" | "paused" | "stopped" */
        @JavascriptInterface
        public void onNowPlaying(final String state, final String title, final String artist, final double durMs, final double posMs) {
            NowPlaying.title = title == null || title.isEmpty() ? "Daesinnam Amp" : title;
            NowPlaying.artist = artist == null ? "" : artist;
            NowPlaying.durationMs = (long) durMs;
            NowPlaying.positionMs = (long) posMs;
            NowPlaying.playing = "playing".equals(state);
            main.post(() -> {
                playing = NowPlaying.playing;
                applyScreenOn();

                Intent i = new Intent(MainActivity.this, PlaybackService.class);
                try {
                    if ("stopped".equals(state)) {
                        if (PlaybackService.running) startService(i.setAction(PlaybackService.ACTION_OWN_STOP));
                        return;
                    }
                    i.setAction(PlaybackService.ACTION_UPDATE);
                    if (playing) startForegroundService(i);
                    else if (PlaybackService.running) startService(i);
                } catch (Exception ignored) {
                    // 백그라운드 시작 제한 등으로 실패해도 재생 자체는 계속됩니다.
                }
            });
        }

        /** 현재 곡의 앨범 아트(data URL). 차량 화면·잠금 화면·알림에 표시됩니다. */
        @JavascriptInterface
        public void onArt(final String dataUrl) {
            NowPlaying.setArt(dataUrl);
            main.post(() -> {
                if (PlaybackService.running) {
                    try { startService(new Intent(MainActivity.this, PlaybackService.class).setAction(PlaybackService.ACTION_REFRESH)); } catch (Exception ignored) {}
                }
            });
        }

        @JavascriptInterface
        public void setExternalMode(final boolean on) {
            main.post(() -> setExternal(on));
        }

        @JavascriptInterface
        public String extStatus() {
            JSONObject o = new JSONObject();
            try {
                o.put("notif", hasNotifAccess());
                o.put("mic", hasMic());
                o.put("viz", viz != null);
                o.put("rate", vizRate);
                o.put("eq", ExternalEq.I.status());
                o.put("vol", systemVolume());
                o.put("artV", artVersion);
                o.put("notifSupported", notifSupported());
                o.put("spotifyRx", SpotifyInfo.lastUpdate > 0);
                o.put("edition", BuildConfig.FLAVOR);
                o.put("version", BuildConfig.VERSION_NAME);
                MediaController c = ctrl;
                o.put("seekable", c != null);
                if (c == null) {
                    if (spotifyFallback()) {
                        o.put("pkg", "com.spotify.music");
                        o.put("app", "Spotify");
                        o.put("title", SpotifyInfo.title);
                        o.put("artist", SpotifyInfo.artist);
                        o.put("album", SpotifyInfo.album);
                        o.put("dur", SpotifyInfo.durationMs);
                        o.put("pos", SpotifyInfo.position());
                        o.put("playing", SpotifyInfo.playing);
                    } else {
                        boolean active = am.isMusicActive();
                        o.put("playing", active);
                        if (active) o.put("app", "외부 앱 재생 중");
                    }
                } else {
                    String pkg = c.getPackageName();
                    o.put("pkg", pkg);
                    o.put("app", appLabel(pkg));
                    MediaMetadata md = c.getMetadata();
                    if (md != null) {
                        o.put("title", nz(md.getString(MediaMetadata.METADATA_KEY_TITLE)));
                        String ar = md.getString(MediaMetadata.METADATA_KEY_ARTIST);
                        if (ar == null) ar = md.getString(MediaMetadata.METADATA_KEY_ALBUM_ARTIST);
                        o.put("artist", nz(ar));
                        o.put("album", nz(md.getString(MediaMetadata.METADATA_KEY_ALBUM)));
                        o.put("dur", Math.max(0, md.getLong(MediaMetadata.METADATA_KEY_DURATION)));
                    }
                    PlaybackState st = c.getPlaybackState();
                    if (st != null) {
                        boolean pl = st.getState() == PlaybackState.STATE_PLAYING;
                        long pos = st.getPosition();
                        if (pl && st.getLastPositionUpdateTime() > 0) {
                            pos += (long) ((SystemClock.elapsedRealtime() - st.getLastPositionUpdateTime()) * st.getPlaybackSpeed());
                        }
                        o.put("playing", pl);
                        o.put("pos", Math.max(0, pos));
                    }
                }
            } catch (Exception ignored) {}
            return o.toString();
        }

        @JavascriptInterface
        public String extArt() {
            return artData;
        }

        @JavascriptInterface
        public String extFft() {
            if (SystemClock.elapsedRealtime() - vizTs > 600) return "";
            byte[] f;
            synchronized (vizLock) { f = fft; }
            return encode(f, true);
        }

        @JavascriptInterface
        public String extWave() {
            byte[] w;
            synchronized (vizLock) { w = wave; }
            return encode(w, false);
        }

        @JavascriptInterface
        public void extCmd(final String cmd, final double arg) {
            main.post(() -> {
                MediaController c = ctrl;
                if (c == null) {
                    sendMediaKey(cmd);
                    return;
                }
                MediaController.TransportControls t = c.getTransportControls();
                switch (cmd) {
                    case "play": t.play(); break;
                    case "pause": t.pause(); break;
                    case "stop": t.stop(); break;
                    case "next": t.skipToNext(); break;
                    case "prev": t.skipToPrevious(); break;
                    case "seek": t.seekTo((long) arg); break;
                    default: break;
                }
            });
        }

        /** 음악 앱을 화면 전환 없이 재생(pkg 비우면 마지막으로 쓰던 음악) */
        @JavascriptInterface
        public void mediaPlay(final String pkg) { main.post(() -> startMediaApp(pkg == null ? "" : pkg)); }

        /** 외부 앱의 지금 재생 목록(대기열): {pkg, items:[{id,title,sub,cur}]} */
        @JavascriptInterface
        public String extQueue() {
            try {
                MediaController c = ctrl; JSONObject o = new JSONObject(); org.json.JSONArray a = new org.json.JSONArray();
                if (c != null) {
                    o.put("pkg", c.getPackageName());
                    List<android.media.session.MediaSession.QueueItem> q = c.getQueue();
                    PlaybackState st = c.getPlaybackState(); long act = st == null ? -1 : st.getActiveQueueItemId();
                    if (q != null) for (android.media.session.MediaSession.QueueItem it : q) {
                        if (a.length() >= 200) break;
                        MediaDescription d = it.getDescription(); JSONObject x = new JSONObject();
                        x.put("id", it.getQueueId()); x.put("title", String.valueOf(d.getTitle() == null ? "" : d.getTitle()));
                        x.put("sub", String.valueOf(d.getSubtitle() == null ? "" : d.getSubtitle())); x.put("cur", it.getQueueId() == act); a.put(x);
                    }
                }
                o.put("items", a);
                return o.toString();
            } catch (Exception e) { return "{\"items\":[]}"; }
        }

        @JavascriptInterface
        public void extPlayQueue(final double id) { main.post(() -> { try { if (ctrl != null) ctrl.getTransportControls().skipToQueueItem((long) id); } catch (Exception ignored) {} }); }

        /** 둘러보기: 결과는 window.__extBrowse(json)로 돌려줌 */
        @JavascriptInterface
        public void extBrowse(final String pkg, final String parent) { main.post(() -> browse(pkg, parent == null ? "" : parent)); }

        @JavascriptInterface
        public void extBrowsePlay(final String pkg, final String mediaId) { main.post(() -> browsePlay(pkg, mediaId)); }

        @JavascriptInterface
        public void setExtEq(String json) {
            try {
                JSONObject o = new JSONObject(json);
                JSONArray g = o.getJSONArray("gains");
                float[] gains = new float[10];
                for (int i = 0; i < 10 && i < g.length(); i++) gains[i] = (float) g.getDouble(i);
                ExternalEq.I.set(o.optBoolean("on", true), (float) o.optDouble("pre", 0), gains);
            } catch (Exception ignored) {}
        }

        @JavascriptInterface
        public void setSystemVolume(int pct) {
            int max = am.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
            am.setStreamVolume(AudioManager.STREAM_MUSIC, Math.round(Math.max(0, Math.min(100, pct)) * max / 100f), 0);
        }

        @JavascriptInterface
        public void openApp(final String pkg) {
            main.post(() -> MainActivity.this.openApp(pkg));
        }

        /**
         * TMAP 등을 이 앱 옆(좌우)에 띄웁니다.
         * 안드로이드 분할 화면은 세로 화면이면 무조건 위아래로 나누므로, 세로일 때는 먼저 가로로 돌린 뒤 붙입니다.
         * (분할이 끝나면 원래 회전 설정으로 돌아감) DeX·자유 창에서는 화면 오른쪽 절반 크기로 엽니다.
         * 반환: "side" | "rotated" | "missing"
         */
        @JavascriptInterface
        public String openAppSide(final String pkg) {
            final Intent launch = getPackageManager().getLaunchIntentForPackage(pkg);
            if (launch == null) {
                main.post(() -> MainActivity.this.openApp(pkg));
                return "missing";
            }
            final Rect full = new Rect();
            if (Build.VERSION.SDK_INT >= 30) full.set(getWindowManager().getMaximumWindowMetrics().getBounds());
            else { android.util.DisplayMetrics dm = new android.util.DisplayMetrics(); getWindowManager().getDefaultDisplay().getRealMetrics(dm); full.set(0, 0, dm.widthPixels, dm.heightPixels); }
            final boolean portrait = full.width() < full.height() && !isInMultiWindowMode();
            final Runnable go = () -> {
                launch.addFlags(Intent.FLAG_ACTIVITY_LAUNCH_ADJACENT | Intent.FLAG_ACTIVITY_NEW_TASK);
                Rect now = new Rect();
                if (Build.VERSION.SDK_INT >= 30) now.set(getWindowManager().getMaximumWindowMetrics().getBounds()); else now.set(full);
                ActivityOptions o = ActivityOptions.makeBasic();
                o.setLaunchBounds(new Rect(now.left + now.width() / 2, now.top, now.right, now.bottom));
                try { startActivity(launch, o.toBundle()); } catch (Exception e) { MainActivity.this.openApp(pkg); }
            };
            main.post(() -> {
                if (portrait) {
                    sideLock = true;
                    setRequestedOrientation(android.content.pm.ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);
                    main.postDelayed(go, 700); // 화면이 가로로 돈 뒤에 붙여야 좌우로 나뉨
                } else go.run();
            });
            return portrait ? "rotated" : "side";
        }

        /**
         * TMAP 등을 화면 아래쪽에 띄워 이 앱과 위아래로 나눠 봅니다.
         * 분할 화면에서는 세로 화면이면 아래, 가로 화면이면 안드로이드가 오른쪽에 붙입니다.
         * DeX·자유 창에서는 화면 아래쪽 절반 크기로 엽니다.
         * 반환: "bottom" | "landscape" | "missing"
         */
        @JavascriptInterface
        public String openAppBottom(final String pkg) {
            return openAppSplit(pkg, false);
        }

        /** 다른 앱(TMAP·네이버 지도)을 화면 위쪽(top) 또는 아래쪽 절반에 분할 창으로 엽니다. 이 앱은 나머지 절반으로 갑니다.
         *  "missing" 설치 안 됨 · "landscape" 가로 화면(안드로이드가 좌우로 나눔) · "top"/"bottom" */
        @JavascriptInterface
        public String openAppSplit(final String pkg, final boolean top) {
            final Intent launch = getPackageManager().getLaunchIntentForPackage(pkg);
            if (launch == null) {
                main.post(() -> MainActivity.this.openApp(pkg));
                return "missing";
            }
            final Rect full = new Rect();
            if (Build.VERSION.SDK_INT >= 30) full.set(getWindowManager().getMaximumWindowMetrics().getBounds());
            else { android.util.DisplayMetrics dm = new android.util.DisplayMetrics(); getWindowManager().getDefaultDisplay().getRealMetrics(dm); full.set(0, 0, dm.widthPixels, dm.heightPixels); }
            main.post(() -> {
                launch.addFlags(Intent.FLAG_ACTIVITY_LAUNCH_ADJACENT | Intent.FLAG_ACTIVITY_NEW_TASK);
                ActivityOptions o = ActivityOptions.makeBasic();
                // 내비 앱 60% · 대신남 원 40% (안드로이드·기기가 정해진 비율로 맞추면 그 비율을 따름)
                int cut = top ? full.top + Math.round(full.height() * .6f) : full.top + Math.round(full.height() * .4f);
                o.setLaunchBounds(top ? new Rect(full.left, full.top, full.right, cut) : new Rect(full.left, cut, full.right, full.bottom));
                try { startActivity(launch, o.toBundle()); } catch (Exception e) { MainActivity.this.openApp(pkg); }
            });
            return full.width() > full.height() ? "landscape" : (top ? "top" : "bottom");
        }

        @JavascriptInterface
        public void openNotificationAccess() {
            main.post(MainActivity.this::openNotificationAccess);
        }

        /** HUD 모드처럼 음악을 안 틀어도 화면을 켜 둬야 할 때 */
        @JavascriptInterface
        public void keepScreenOn(final boolean on) {
            main.post(() -> {
                hudOn = on;
                applyScreenOn();
            });
        }

        /** 인터넷 라디오(표준 플레이어: HLS·http·재생목록 지원) */
        @JavascriptInterface
        public void radioPlay(final String url) { main.post(() -> radio.play(url)); }

        @JavascriptInterface
        public void radioStop() { main.post(() -> radio.stop()); }

        @JavascriptInterface
        public void radioVolume(final double v) { main.post(() -> radio.volume((float) v)); }

        /** 배터리 잔량·충전 여부(절전 모드 자동 판단용) */
        /** 앱 정보 화면(⋮ → 제한된 설정 허용이 있는 곳) */
        @JavascriptInterface
        public void openAppInfo() {
            main.post(() -> {
                try { startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getPackageName()))); } catch (Exception ignored) {}
            });
        }

        @JavascriptInterface
        public String battery() {
            try {
                Intent b = registerReceiver(null, new android.content.IntentFilter(Intent.ACTION_BATTERY_CHANGED));
                int lv = b == null ? -1 : b.getIntExtra(android.os.BatteryManager.EXTRA_LEVEL, -1), sc = b == null ? 100 : b.getIntExtra(android.os.BatteryManager.EXTRA_SCALE, 100);
                int st = b == null ? -1 : b.getIntExtra(android.os.BatteryManager.EXTRA_STATUS, -1);
                boolean chg = st == android.os.BatteryManager.BATTERY_STATUS_CHARGING || st == android.os.BatteryManager.BATTERY_STATUS_FULL;
                int tp = b == null ? Integer.MIN_VALUE : b.getIntExtra(android.os.BatteryManager.EXTRA_TEMPERATURE, Integer.MIN_VALUE);
                return "{\"pct\":" + (lv < 0 ? 100 : Math.round(lv * 100f / Math.max(1, sc))) + ",\"chg\":" + chg + (tp == Integer.MIN_VALUE ? "" : ",\"temp\":" + (tp / 10.0)) + "}";
            } catch (Exception e) { return "{\"pct\":100,\"chg\":true}"; }
        }

        /** 태블릿 모드 2: 가로 화면으로 고정(끄면 원래대로 자동 회전) */
        @JavascriptInterface
        public void setLandscape(final boolean on) {
            main.post(() -> { landLock = on; if (!sideLock) setRequestedOrientation(on ? android.content.pm.ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE : android.content.pm.ActivityInfo.SCREEN_ORIENTATION_FULL_USER); });
        }

        /** 재생 중 화면을 켜 둘지(앱 설정) */
        @JavascriptInterface
        public void setScreenOnPlay(final boolean on) {
            main.post(() -> {
                screenOnPlay = on;
                applyScreenOn();
            });
        }

        /** 주행 녹화 파일 열기: 동영상(Movies)/DaesinnamOne/이름.webm — 녹화 조각을 이어 붙여 저장 */
        @JavascriptInterface
        public synchronized boolean recOpen(String name) {
            recCloseQuiet();
            String n = nz(name).replaceAll("[^A-Za-z0-9_.-]", "_");
            if (!n.endsWith(".webm")) n += ".webm";
            try {
                if (Build.VERSION.SDK_INT >= 29) {
                    android.content.ContentValues v = new android.content.ContentValues();
                    v.put(android.provider.MediaStore.Video.Media.DISPLAY_NAME, n);
                    v.put(android.provider.MediaStore.Video.Media.MIME_TYPE, "video/webm");
                    v.put(android.provider.MediaStore.Video.Media.RELATIVE_PATH, "Movies/DaesinnamOne");
                    v.put(android.provider.MediaStore.Video.Media.IS_PENDING, 1);
                    recUri = getContentResolver().insert(android.provider.MediaStore.Video.Media.EXTERNAL_CONTENT_URI, v);
                    if (recUri == null) return false;
                    recOut = getContentResolver().openOutputStream(recUri);
                    recName = "동영상/DaesinnamOne/" + n;
                } else {
                    java.io.File dir = new java.io.File(getExternalFilesDir(android.os.Environment.DIRECTORY_MOVIES), "DaesinnamOne");
                    if (!dir.exists() && !dir.mkdirs()) return false;
                    java.io.File f = new java.io.File(dir, n);
                    recOut = new java.io.FileOutputStream(f);
                    recUri = null;
                    recName = f.getAbsolutePath();
                }
                return recOut != null;
            } catch (Exception e) {
                recCloseQuiet();
                return false;
            }
        }

        @JavascriptInterface
        public synchronized boolean recWrite(String b64) {
            if (recOut == null || b64 == null) return false;
            try { recOut.write(android.util.Base64.decode(b64, android.util.Base64.DEFAULT)); return true; } catch (Exception e) { return false; }
        }

        /** 녹화 끝: 파일을 닫고 갤러리에 보이게. 저장된 위치를 돌려줌(실패하면 빈 글자) */
        @JavascriptInterface
        public synchronized String recClose() {
            if (recOut == null) return "";
            String name = recName;
            try {
                recOut.flush(); recOut.close();
                if (recUri != null && Build.VERSION.SDK_INT >= 29) {
                    android.content.ContentValues v = new android.content.ContentValues();
                    v.put(android.provider.MediaStore.Video.Media.IS_PENDING, 0);
                    getContentResolver().update(recUri, v, null, null);
                }
            } catch (Exception e) { name = ""; }
            recOut = null; recUri = null; recName = null;
            return name == null ? "" : name;
        }

        /** 기기 지원 확인(GPS·방향 센서·LTE·5G·Wi-Fi·블루투스): {키:{s:on|off|yes|no|unk, t:짧은 글}} — 새 권한 없이 확인 가능한 것만 */
        @JavascriptInterface
        public String deviceCaps() {
            JSONObject o = new JSONObject();
            PackageManager pm = getPackageManager();
            try {
                // GPS
                boolean gpsHw = pm.hasSystemFeature(PackageManager.FEATURE_LOCATION_GPS);
                boolean gpsOn = false;
                try { android.location.LocationManager lm = (android.location.LocationManager) getSystemService(LOCATION_SERVICE); gpsOn = lm != null && lm.isProviderEnabled(android.location.LocationManager.GPS_PROVIDER); } catch (Exception ignored) {}
                o.put("gps", cap(gpsHw ? (gpsOn ? "on" : "off") : "no", gpsHw ? (gpsOn ? "켜짐" : "꺼짐") : "없음"));
                // 방향 센서(나침반·회전)
                android.hardware.SensorManager sm = (android.hardware.SensorManager) getSystemService(SENSOR_SERVICE);
                boolean rot = sm != null && (sm.getDefaultSensor(android.hardware.Sensor.TYPE_ROTATION_VECTOR) != null
                        || (sm.getDefaultSensor(android.hardware.Sensor.TYPE_MAGNETIC_FIELD) != null && sm.getDefaultSensor(android.hardware.Sensor.TYPE_ACCELEROMETER) != null));
                boolean gyro = sm != null && sm.getDefaultSensor(android.hardware.Sensor.TYPE_GYROSCOPE) != null;
                o.put("compass", cap(rot ? "yes" : "no", rot ? (gyro ? "있음 · 자이로" : "있음") : "없음"));
                // 지금 쓰는 네트워크
                boolean cellNow = false, wifiNow = false;
                try {
                    android.net.ConnectivityManager cm = (android.net.ConnectivityManager) getSystemService(CONNECTIVITY_SERVICE);
                    android.net.NetworkCapabilities nc = cm == null ? null : cm.getNetworkCapabilities(cm.getActiveNetwork());
                    if (nc != null) { cellNow = nc.hasTransport(android.net.NetworkCapabilities.TRANSPORT_CELLULAR); wifiNow = nc.hasTransport(android.net.NetworkCapabilities.TRANSPORT_WIFI); }
                } catch (Exception ignored) {}
                // LTE · 5G
                boolean tel = pm.hasSystemFeature(PackageManager.FEATURE_TELEPHONY);
                String lte, lteT, nr, nrT;
                if (!tel) { lte = "no"; lteT = "없음(Wi-Fi 전용)"; nr = "no"; nrT = "없음"; }
                else {
                    long fam = -1;
                    try { android.telephony.TelephonyManager tm = (android.telephony.TelephonyManager) getSystemService(TELEPHONY_SERVICE); if (Build.VERSION.SDK_INT >= 29 && tm != null) fam = tm.getSupportedRadioAccessFamily(); } catch (Exception ignored) {}
                    boolean nrSeen = false;
                    try {
                        if (Build.VERSION.SDK_INT >= 29 && checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
                            android.telephony.TelephonyManager tm = (android.telephony.TelephonyManager) getSystemService(TELEPHONY_SERVICE);
                            List<android.telephony.CellInfo> cells = tm == null ? null : tm.getAllCellInfo();
                            if (cells != null) for (android.telephony.CellInfo c : cells) if (c instanceof android.telephony.CellInfoNr) { nrSeen = true; break; }
                        }
                    } catch (Exception ignored) {}
                    boolean lteOk = fam < 0 || (fam & android.telephony.TelephonyManager.NETWORK_TYPE_BITMASK_LTE) != 0;
                    lte = lteOk ? (cellNow ? "on" : "yes") : "no"; lteT = lteOk ? (cellNow ? "사용 중" : "지원") : "없음";
                    if (fam > 0) { boolean ok = (fam & android.telephony.TelephonyManager.NETWORK_TYPE_BITMASK_NR) != 0; nr = ok ? (nrSeen ? "on" : "yes") : "no"; nrT = ok ? (nrSeen ? "5G 신호 잡힘" : "지원") : "없음"; }
                    else if (nrSeen) { nr = "on"; nrT = "5G 신호 잡힘"; }
                    else { nr = "unk"; nrT = "확인 불가"; }
                }
                o.put("lte", cap(lte, lteT));
                o.put("nr", cap(nr, nrT));
                // Wi-Fi
                boolean wifiHw = pm.hasSystemFeature(PackageManager.FEATURE_WIFI);
                boolean wifiOn = false;
                try { WifiManager wm = (WifiManager) getApplicationContext().getSystemService(WIFI_SERVICE); wifiOn = wm != null && wm.isWifiEnabled(); } catch (Exception ignored) {}
                o.put("wifi", cap(!wifiHw ? "no" : wifiNow ? "on" : wifiOn ? "yes" : "off", !wifiHw ? "없음" : wifiNow ? "연결됨" : wifiOn ? "켜짐" : "꺼짐"));
                // 블루투스
                boolean btHw = pm.hasSystemFeature(PackageManager.FEATURE_BLUETOOTH);
                int btState = -1;
                try { BluetoothManager bm = (BluetoothManager) getSystemService(BLUETOOTH_SERVICE); BluetoothAdapter ba = bm == null ? null : bm.getAdapter(); if (ba != null) btState = ba.isEnabled() ? 1 : 0; } catch (Exception ignored) {}
                o.put("bt", cap(!btHw ? "no" : btState == 1 ? "on" : btState == 0 ? "off" : "yes", !btHw ? "없음" : btState == 1 ? "켜짐" : btState == 0 ? "꺼짐" : "지원"));
            } catch (Exception e) { /* 확인 못 한 것은 화면에서 '확인 불가' */ }
            return o.toString();
        }

        /** 앱이 켜져 있는 동안 화면을 계속 켜 둘지(기본: 켜 둠 — 수면 모드로 들어가지 않음) */
        @JavascriptInterface
        public void setScreenAlways(final boolean on) {
            main.post(() -> {
                screenAlways = on;
                getSharedPreferences("app", MODE_PRIVATE).edit().putBoolean("screenAlways", on).apply();
                applyScreenOn();
            });
        }

        /** 라디오 소리의 주파수 막대·파형(npFft와 같은 형식) */
        @JavascriptInterface
        public String radioFft() { return RadioPlayer.TAP.fft(); }

        @JavascriptInterface
        public String radioWave() { return RadioPlayer.TAP.wave(); }

        @JavascriptInterface
        public int radioRate() { return RadioPlayer.TAP.sampleRate; }

        @JavascriptInterface
        public String radioState() { return radio == null ? "{}" : radio.status(); }

        /** 관제탑 무전 음성: 파일로 만든 뒤 window.__ttsFile(id, ok)로 알려 줍니다. id는 rd로 시작 */
        @JavascriptInterface
        public boolean ttsToFile(final String text, final String id) {
            if (text == null || id == null || !id.matches("rd[0-9a-z]+")) return false;
            main.post(() -> speakToFile(text, id));
            return true;
        }

        /** 설정: 최근 앱에서 앱을 닫아도 음악을 계속 재생할지(기본 false = 모두 끔) */
        @JavascriptInterface
        public void setKeepPlaying(final boolean keep) {
            getSharedPreferences("app", MODE_PRIVATE).edit().putBoolean("keepPlay", keep).apply();
        }

        /** 1.15 주소 변경: 이전 주소의 저장 내용(migrate.html에서) 받기 */
        @JavascriptInterface
        public void migrateSave(final String json) {
            main.post(() -> { if (!getSharedPreferences("app", MODE_PRIVATE).getBoolean("origin2", false)) finishMigrate(json); });
        }

        /** 새 주소의 앱 화면이 시작할 때 한 번: 옮길 내용(JSON, 없으면 빈 글자) */
        @JavascriptInterface
        public String migrateTake() {
            return takeMigrate();
        }

        /** 화면 분할 상태(JSON {on, ratio}) — 앱 화면이 시작할 때 읽음 */
        @JavascriptInterface
        public String splitState() { return MainActivity.this.splitState(); }

        /** 설정: 통화가 끝나면 통화 화면을 닫고 이 앱으로 돌아오기(기본 true) */
        @JavascriptInterface
        public void setCallReturn(final boolean on) {
            getSharedPreferences("app", MODE_PRIVATE).edit().putBoolean("callReturn", on).apply();
        }

        /** 태블릿 가로모드 밝기 손잡이: 이 앱 창의 화면 밝기(10~100%). 음수면 시스템 밝기로 되돌림 */
        @JavascriptInterface
        public void setScreenBrightness(final int pct) {
            main.post(() -> {
                WindowManager.LayoutParams lp = getWindow().getAttributes();
                lp.screenBrightness = pct < 0 ? WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_NONE : Math.max(10, Math.min(100, pct)) / 100f;
                getWindow().setAttributes(lp);
            });
        }

        // ---------- 표준 플레이어 조작 (화면 → 플레이어)

        @JavascriptInterface
        public boolean natAvailable() {
            return true;
        }

        @JavascriptInterface
        public String npState() {
            return natSnap;
        }

        @JavascriptInterface
        public void npSetQueue(final String json, final int index, final double posMs, final boolean play) {
            try {
                AmpPlayerService.saveQueue(MainActivity.this, json, index, (long) posMs);
            } catch (Exception ignored) {}
            withNat(() -> {
                try {
                    List<androidx.media3.common.MediaItem> items = AmpPlayerService.toItems(new JSONArray(json));
                    if (items.isEmpty()) {
                        nat.stop();
                        nat.clearMediaItems();
                        return;
                    }
                    int i = Math.max(0, Math.min(index, items.size() - 1));
                    nat.setMediaItems(items, i, (long) Math.max(0, posMs));
                    nat.prepare();
                    if (play) nat.play();
                } catch (Exception ignored) {}
            });
        }

        @JavascriptInterface
        public void npCmd(final String cmd, final double arg) {
            withNat(() -> {
                switch (cmd) {
                    case "play":
                        if (nat.getPlaybackState() == Player.STATE_IDLE) nat.prepare();
                        if (nat.getPlaybackState() == Player.STATE_ENDED) nat.seekToDefaultPosition();
                        nat.play();
                        break;
                    case "pause": nat.pause(); break;
                    case "toggle": if (nat.isPlaying()) nat.pause(); else { if (nat.getPlaybackState() == Player.STATE_IDLE) nat.prepare(); nat.play(); } break;
                    case "next": nat.seekToNextMediaItem(); nat.play(); break;
                    case "prev": nat.seekToPrevious(); break;
                    case "index": nat.seekToDefaultPosition((int) arg); if (nat.getPlaybackState() == Player.STATE_IDLE) nat.prepare(); nat.play(); break;
                    case "seek": nat.seekTo((long) arg); break;
                    case "stop": nat.pause(); nat.seekTo(0); break;
                    default: break;
                }
            });
        }

        @JavascriptInterface
        public void npMode(final boolean shuffle, final String repeat) {
            withNat(() -> {
                nat.setShuffleModeEnabled(shuffle);
                nat.setRepeatMode("one".equals(repeat) ? Player.REPEAT_MODE_ONE : "off".equals(repeat) ? Player.REPEAT_MODE_OFF : Player.REPEAT_MODE_ALL);
            });
        }

        @JavascriptInterface
        public void npVolume(final double v) {
            withNat(() -> nat.setVolume((float) Math.max(0, Math.min(1, v))));
        }

        @JavascriptInterface
        public String npFft() {
            return AmpPlayerService.TAP.fft();
        }

        @JavascriptInterface
        public String npWave() {
            return AmpPlayerService.TAP.wave();
        }

        /** 음악 파일(여러 개) 또는 폴더를 고르고, 다시 켜도 재생할 수 있게 권한을 기억합니다. */
        @JavascriptInterface
        public void pickAudio(final boolean folder) {
            main.post(() -> MainActivity.this.pickAudio(folder));
        }

        @JavascriptInterface
        public boolean hasLibrary() {
            return true;
        }

        /** 차량 연결 설정과 상태 */
        @JavascriptInterface
        public String carStatus() {
            JSONObject o = new JSONObject();
            try {
                o.put("autoplay", CarConnect.enabled(MainActivity.this));
                o.put("carName", CarConnect.carName(MainActivity.this));
                o.put("btPerm", CarConnect.hasBtPerm(MainActivity.this));
                o.put("autoLaunch", CarConnect.canAutoLaunch(MainActivity.this));
                o.put("connected", new JSONArray(connectedCarAudio()));
                o.put("lastKey", PlaybackService.lastKey);
                o.put("lastKeyAt", PlaybackService.lastKeyAt);
            } catch (Exception ignored) {}
            return o.toString();
        }

        @JavascriptInterface
        public void setCarAutoplay(final boolean on) {
            CarConnect.prefs(MainActivity.this).edit().putBoolean("autoplay", on).apply();
            if (on && !CarConnect.hasBtPerm(MainActivity.this) && Build.VERSION.SDK_INT >= 31) {
                main.post(() -> requestPermissions(new String[]{Manifest.permission.BLUETOOTH_CONNECT}, REQ_BT));
            }
        }

        /** name이 비어 있으면 모든 블루투스 오디오, 아니면 그 기기에서만 자동 재생 */
        @JavascriptInterface
        public void setCarName(final String name) {
            CarConnect.prefs(MainActivity.this).edit().putString("carName", name == null ? "" : name).apply();
        }

        @JavascriptInterface
        public void requestAutoLaunch() {
            main.post(() -> {
                try {
                    startActivity(new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + getPackageName())));
                } catch (Exception ignored) {}
            });
        }

        @JavascriptInterface
        public boolean takeCarAutoplay() {
            boolean p = pendingCarAutoplay;
            pendingCarAutoplay = false;
            return p;
        }

        /** 간편 모드의 볼륨 버튼: 시스템 미디어 볼륨을 한 칸씩 */
        @JavascriptInterface
        public void adjustVolume(final int dir) {
            am.adjustStreamVolume(AudioManager.STREAM_MUSIC, dir > 0 ? AudioManager.ADJUST_RAISE : AudioManager.ADJUST_LOWER, AudioManager.FLAG_SHOW_UI);
        }

        @JavascriptInterface
        public void startGps() {
            main.post(MainActivity.this::startGps);
        }

        @JavascriptInterface
        public void stopGps() {
            main.post(() -> {
                gpsWanted = false;
                gps.stop();
            });
        }

        @JavascriptInterface
        public String gpsStatus() {
            return gps.status();
        }

        // 콕핏 PFD: 나침반·기울기
        @JavascriptInterface
        public void attStart() {
            main.post(() -> { attWanted = true; gps.attStart(); });
        }

        @JavascriptInterface
        public void attStop() {
            main.post(() -> { attWanted = false; gps.attStop(); });
        }

        @JavascriptInterface
        public String attitude() {
            return gps.attitude();
        }

        @JavascriptInterface
        public void openLocationSettings() {
            main.post(() -> {
                try { startActivity(new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS)); } catch (Exception ignored) {}
            });
        }

        @JavascriptInterface
        public void openUrl(final String url) {
            main.post(() -> {
                try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))); } catch (Exception ignored) {}
            });
        }

        @JavascriptInterface
        public void requestMic() {
            main.post(MainActivity.this::requestMic);
        }

        // ---------- 콕핏 스킨 조종 패널

        /** {"muted":bool,"volume":0~100,"wifi":bool,"wifiSupported":bool,"bt":bool,"hasBt":bool} — 읽을 수 없는 값은 빠짐 */
        @JavascriptInterface
        public String cockpitState() {
            JSONObject o = new JSONObject();
            try {
                o.put("muted", am.isStreamMute(AudioManager.STREAM_MUSIC) || am.getStreamVolume(AudioManager.STREAM_MUSIC) == 0);
                int max = Math.max(1, am.getStreamMaxVolume(AudioManager.STREAM_MUSIC));
                o.put("volume", am.isStreamMute(AudioManager.STREAM_MUSIC) ? 0 : Math.round(am.getStreamVolume(AudioManager.STREAM_MUSIC) * 100f / max));
                WifiManager wm = (WifiManager) getApplicationContext().getSystemService(WIFI_SERVICE);
                o.put("wifiSupported", wm != null);
                if (wm != null) o.put("wifi", wm.isWifiEnabled());
                BluetoothAdapter ba = btAdapter();
                o.put("hasBt", ba != null);
                o.put("bt", ba != null && ba.isEnabled());
            } catch (Exception ignored) {}
            return o.toString();
        }

        @JavascriptInterface
        public void setMuted(final boolean muted) {
            am.adjustStreamVolume(AudioManager.STREAM_MUSIC, muted ? AudioManager.ADJUST_MUTE : AudioManager.ADJUST_UNMUTE, 0);
            if (!muted && am.getStreamVolume(AudioManager.STREAM_MUSIC) == 0) {
                am.setStreamVolume(AudioManager.STREAM_MUSIC, Math.max(1, am.getStreamMaxVolume(AudioManager.STREAM_MUSIC) / 3), 0);
            }
        }

        /** 안드로이드 9 이하는 바로 바꾸고 "done", 10 이상은 앱이 바꿀 수 없어 와이파이 패널을 열고 "panel" */
        @SuppressWarnings("deprecation")
        @JavascriptInterface
        public String setWifi(final boolean on) {
            if (Build.VERSION.SDK_INT < 29) {
                WifiManager wm = (WifiManager) getApplicationContext().getSystemService(WIFI_SERVICE);
                if (wm != null && wm.setWifiEnabled(on)) return "done";
            }
            main.post(() -> {
                try {
                    startActivity(new Intent(Build.VERSION.SDK_INT >= 29 ? Settings.Panel.ACTION_WIFI : Settings.ACTION_WIFI_SETTINGS));
                } catch (Exception e) {
                    try { startActivity(new Intent(Settings.ACTION_WIFI_SETTINGS)); } catch (Exception ignored) {}
                }
            });
            return "panel";
        }

        /** "done" 바로 바뀜, "ask" 켜기 확인 창, "panel" 설정 화면, "perm" 권한 요청, "none" 블루투스 없음 */
        @SuppressWarnings({"deprecation", "MissingPermission"})
        @JavascriptInterface
        public String setBluetooth(final boolean on) {
            final BluetoothAdapter ba = btAdapter();
            if (ba == null) return "none";
            if (Build.VERSION.SDK_INT >= 31 && checkSelfPermission(Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
                main.post(() -> requestPermissions(new String[]{Manifest.permission.BLUETOOTH_CONNECT}, REQ_BT));
                return "perm";
            }
            if (!on && Build.VERSION.SDK_INT < 33) {
                try { if (ba.disable()) return "done"; } catch (Exception ignored) {}
            }
            if (on) {
                main.post(() -> {
                    try { startActivity(new Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE)); }
                    catch (Exception e) { try { startActivity(new Intent(Settings.ACTION_BLUETOOTH_SETTINGS)); } catch (Exception ignored) {} }
                });
                return "ask";
            }
            main.post(() -> {
                try { startActivity(new Intent(Settings.ACTION_BLUETOOTH_SETTINGS)); } catch (Exception ignored) {}
            });
            return "panel";
        }

        /** "call" 바로 걸기, "perm" 전화 권한 요청 후 걸기, "dial" 전화 앱에 번호만 띄움(전화 기능 없음) */
        @JavascriptInterface
        public String sosCall(final String number) {
            final String n = number == null ? "" : number.replaceAll("[^0-9+*#]", "");
            if (n.isEmpty()) return "none";
            if (!getPackageManager().hasSystemFeature(PackageManager.FEATURE_TELEPHONY)) {
                main.post(() -> placeCall(n, false));
                return "dial";
            }
            if (checkSelfPermission(Manifest.permission.CALL_PHONE) != PackageManager.PERMISSION_GRANTED) {
                pendingCall = n;
                main.post(() -> requestPermissions(new String[]{Manifest.permission.CALL_PHONE}, REQ_CALL));
                return "perm";
            }
            main.post(() -> placeCall(n, true));
            return "call";
        }

        @JavascriptInterface
        public void pickContact() {
            main.post(() -> {
                try { startActivityForResult(new Intent(Intent.ACTION_PICK, ContactsContract.CommonDataKinds.Phone.CONTENT_URI), REQ_CONTACT); }
                catch (Exception ignored) {}
            });
        }

        @JavascriptInterface
        public void speak(final String text) {
            main.post(() -> MainActivity.this.speak(text));
        }

        // ---------- D1 DASHCAM
        @JavascriptInterface
        public String camState() {
            return cam.status();
        }

        @JavascriptInterface
        public void camConnect(final String ssid, final String pass) {
            main.post(() -> {
                String perm = camPermission();
                if (perm != null && checkSelfPermission(perm) != PackageManager.PERMISSION_GRANTED) {
                    pendingCam = new String[]{nz(ssid), nz(pass)};
                    requestPermissions(new String[]{perm}, REQ_CAM);
                    return;
                }
                camResult(cam.connect(nz(ssid), nz(pass)));
            });
        }

        @JavascriptInterface
        public void camDisconnect() {
            cam.disconnect();
        }

        @JavascriptInterface
        public void camProbe() {
            cam.startProbe();
        }

        @JavascriptInterface
        public void camLive(boolean on) {
            if (on) cam.startLive(); else cam.stopLive();
        }

        @JavascriptInterface
        public void openWifiSettings() {
            main.post(() -> {
                try { startActivity(new Intent(Settings.ACTION_WIFI_SETTINGS)); } catch (Exception ignored) {}
            });
        }
    }

    private static String nz(String s) {
        return s == null ? "" : s;
    }

    private String appLabel(String pkg) {
        String f = ExternalEq.friendly(pkg);
        if (!f.equals(pkg)) return f;
        try {
            return getPackageManager().getApplicationLabel(getPackageManager().getApplicationInfo(pkg, 0)).toString();
        } catch (Exception e) {
            return pkg;
        }
    }
}
