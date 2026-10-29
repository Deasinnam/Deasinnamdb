package com.daesinnam.amp;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
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
import android.media.AudioDeviceCallback;
import android.media.AudioDeviceInfo;
import android.media.AudioManager;
import android.media.MediaMetadata;
import android.media.audiofx.Visualizer;
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
import android.provider.Settings;
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
    private static final String START_URL = "https://appassets.androidplatform.net/assets/index.html";

    static WeakReference<MainActivity> current = new WeakReference<>(null);

    private WebView web;
    private ValueCallback<Uri[]> pendingChooser;
    private final Handler main = new Handler(Looper.getMainLooper());
    private boolean playing = false;
    private boolean resumed = false;

    // GPS 속도계
    private GpsTracker gps;
    private volatile boolean gpsWanted = false;
    private boolean hudOn = false;

    // 내 음악 표준 플레이어(Media3)와의 연결
    private ListenableFuture<androidx.media3.session.MediaController> natFuture;
    private androidx.media3.session.MediaController nat;
    private volatile String natSnap = "{\"connected\":false}";
    private Runnable natPending;
    private final Runnable natTick = new Runnable() {
        @Override
        public void run() {
            natSnap = buildNatSnap();
            main.postDelayed(this, 200);
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
            main.postDelayed(this, 700);
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
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri u = request.getUrl();
                if ("appassets.androidplatform.net".equals(u.getHost()) && ("/media".equals(u.getPath()) || "/art".equals(u.getPath()))) {
                    return MediaLibrary.serve(MainActivity.this, u, request.getRequestHeaders());
                }
                return loader.shouldInterceptRequest(u);
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
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

        web.addJavascriptInterface(new Bridge(), "AndroidBridge");

        if (savedInstanceState != null) web.restoreState(savedInstanceState);
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
    protected void onStart() {
        super.onStart();
        if (gpsWanted) gps.start();
    }

    @Override
    protected void onStop() {
        gps.stop(); // 화면에 안 보일 때는 GPS를 꺼서 배터리를 아낍니다.
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
    }

    // ---------- 콕핏 스킨: 관제탑 음성
    private TextToSpeech tts;
    private boolean ttsReady;
    private String ttsPending;

    private void speak(String text) {
        if (tts == null) {
            ttsPending = text;
            tts = new TextToSpeech(getApplicationContext(), status -> {
                ttsReady = status == TextToSpeech.SUCCESS;
                if (ttsReady) {
                    tts.setLanguage(Locale.KOREAN);
                    tts.setSpeechRate(1.05f);
                    if (ttsPending != null) tts.speak(ttsPending, TextToSpeech.QUEUE_FLUSH, null, "atc");
                }
                ttsPending = null;
            });
            return;
        }
        if (ttsReady) tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "atc");
        else ttsPending = text;
    }

    private BluetoothAdapter btAdapter() {
        BluetoothManager bm = getSystemService(BluetoothManager.class);
        return bm == null ? null : bm.getAdapter();
    }

    @Override
    protected void onDestroy() {
        main.removeCallbacksAndMessages(null);
        if (tts != null) { tts.shutdown(); tts = null; }
        try { am.unregisterAudioDeviceCallback(devCallback); } catch (Exception ignored) {}
        if (natFuture != null) androidx.media3.session.MediaController.releaseFuture(natFuture);
        nat = null;
        stopViz();
        gps.stop();
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
                if (playing) getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                else if (!hudOn) getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

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

        /** DeX·분할 화면에서 다른 앱(TMAP 등)을 이 앱 옆 창으로 엽니다. 전체 화면일 때는 그냥 열립니다. */
        @JavascriptInterface
        public void openAppSide(final String pkg) {
            main.post(() -> {
                Intent launch = getPackageManager().getLaunchIntentForPackage(pkg);
                if (launch == null) {
                    MainActivity.this.openApp(pkg);
                    return;
                }
                launch.addFlags(Intent.FLAG_ACTIVITY_LAUNCH_ADJACENT | Intent.FLAG_ACTIVITY_NEW_TASK);
                try { startActivity(launch); } catch (Exception e) { MainActivity.this.openApp(pkg); }
            });
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
                if (on || playing) getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
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

        /** {"muted":bool,"wifi":bool,"bt":bool,"hasBt":bool} */
        @JavascriptInterface
        public String cockpitState() {
            JSONObject o = new JSONObject();
            try {
                o.put("muted", am.isStreamMute(AudioManager.STREAM_MUSIC) || am.getStreamVolume(AudioManager.STREAM_MUSIC) == 0);
                WifiManager wm = (WifiManager) getApplicationContext().getSystemService(WIFI_SERVICE);
                o.put("wifi", wm != null && wm.isWifiEnabled());
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

        @JavascriptInterface
        public void speak(final String text) {
            main.post(() -> MainActivity.this.speak(text));
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
