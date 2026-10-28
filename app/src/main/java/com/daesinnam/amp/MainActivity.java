package com.daesinnam.amp;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.NotificationManager;
import android.content.ClipData;
import android.content.ComponentName;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.Insets;
import android.media.AudioManager;
import android.media.MediaMetadata;
import android.media.audiofx.Visualizer;
import android.media.session.MediaController;
import android.media.session.MediaSessionManager;
import android.media.session.PlaybackState;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.provider.Settings;
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

import androidx.webkit.WebViewAssetLoader;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.lang.ref.WeakReference;
import java.util.List;

public class MainActivity extends Activity {

    private static final int REQ_FILES = 41;
    private static final int REQ_MIC = 42;
    private static final int REQ_LOC = 43;
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

        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
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

    @Override
    protected void onDestroy() {
        main.removeCallbacksAndMessages(null);
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
