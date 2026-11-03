package com.daesinnam.amp;

import android.content.Context;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;

import androidx.annotation.NonNull;
import androidx.media3.common.AudioAttributes;
import androidx.media3.common.C;
import androidx.media3.common.MediaItem;
import androidx.media3.common.MediaMetadata;
import androidx.media3.common.MimeTypes;
import androidx.media3.common.PlaybackException;
import androidx.media3.common.Player;
import androidx.media3.common.util.UnstableApi;
import androidx.media3.datasource.DefaultDataSource;
import androidx.media3.datasource.DefaultHttpDataSource;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 인터넷 라디오 재생(앱 화면과 별개인 안드로이드 표준 플레이어).
 * - WebView의 audio 태그로는 재생되지 않던 HLS(.m3u8)·http 방송·재생목록(.pls/.m3u)을 처리합니다.
 * - 모든 호출은 메인 스레드에서 합니다(MainActivity가 main.post로 넘김).
 */
@UnstableApi
final class RadioPlayer {
    private static final String UA = "Mozilla/5.0 (Linux; Android) DaesinnamOne/1.4 ExoPlayer";
    private final Context ctx;
    private final Handler main = new Handler(Looper.getMainLooper());
    private ExoPlayer p;
    private volatile String state = "idle"; // idle | resolving | buffering | playing | error
    private volatile String err = "";
    private volatile String url = "";
    private volatile String title = "";   // 방송이 보내 주는 지금 곡·프로그램 이름(ICY/ID3)
    private String src = "";               // 처음 받은 주소(api:… 이면 재생할 때마다 새 주소를 받아 옴)
    private int retries = 0;               // 끊겼을 때 다시 잇기 횟수
    private boolean triedHls = false;
    private int gen = 0;
    private float vol = .8f;

    RadioPlayer(Context c) { ctx = c.getApplicationContext(); }

    private ExoPlayer player() {
        if (p != null) return p;
        DefaultHttpDataSource.Factory http = new DefaultHttpDataSource.Factory()
                .setUserAgent(UA).setAllowCrossProtocolRedirects(true)
                .setConnectTimeoutMs(12000).setReadTimeoutMs(15000);
        p = new ExoPlayer.Builder(ctx)
                .setMediaSourceFactory(new DefaultMediaSourceFactory(new DefaultDataSource.Factory(ctx, http)))
                .setAudioAttributes(new AudioAttributes.Builder().setUsage(C.USAGE_MEDIA).setContentType(C.AUDIO_CONTENT_TYPE_MUSIC).build(), true)
                .setHandleAudioBecomingNoisy(true)
                .setWakeMode(C.WAKE_MODE_NETWORK)
                .build();
        p.setVolume(vol);
        p.addListener(new Player.Listener() {
            @Override public void onPlaybackStateChanged(int s) {
                // 생방송이 끝났다고 나오면(방송사 임시 주소 만료 등) 새 주소로 다시 이음
                if (s == Player.STATE_ENDED && !src.isEmpty() && retries < 4) { reconnect(); return; }
                sync();
            }
            @Override public void onIsPlayingChanged(boolean playing) { if (playing) retries = 0; sync(); }
            @Override public void onMediaMetadataChanged(@NonNull MediaMetadata m) {
                CharSequence t = m.title != null ? m.title : m.displayTitle;
                if (t != null && t.length() > 0) title = t.toString().trim();
            }
            @Override public void onPlayerError(@NonNull PlaybackException e) {
                // 주소에 m3u8이 없어도 HLS인 방송이 있어 한 번은 HLS로 다시 시도
                if (!triedHls && !url.isEmpty()) { triedHls = true; start(url, true); return; }
                // 잘 나오다 끊긴 경우(임시 주소 만료·순간 끊김)는 몇 번 새로 받아 다시 이음
                if (!src.isEmpty() && retries < 4 && "playing".equals(lastGood)) { reconnect(); return; }
                state = "error";
                err = e.getErrorCodeName();
            }
        });
        return p;
    }

    private String lastGood = "";
    private void reconnect() {
        retries++;
        state = "buffering";
        final int my = gen;
        main.postDelayed(() -> { if (my == gen) open(src); }, 1200L * retries);
    }

    private void sync() {
        if (p == null) return;
        if (p.isPlaying()) { state = "playing"; lastGood = "playing"; }
        else if (p.getPlaybackState() == Player.STATE_BUFFERING) state = "buffering";
        else if (!"error".equals(state) && !"resolving".equals(state) && p.getPlaybackState() == Player.STATE_IDLE) state = "idle";
    }

    void play(String u) {
        if (u == null || u.isEmpty()) return;
        src = u;
        retries = 0;
        lastGood = "";
        title = "";
        ++gen;
        open(u);
    }

    private void open(String u) {
        triedHls = false;
        err = "";
        final int my = gen;
        String low = u.toLowerCase(Locale.ROOT);
        if (low.startsWith("api:")) {
            // 방송사 공식 주소: 재생할 때마다 임시(토큰) 주소를 새로 받아 옴
            state = "resolving";
            final String api = u.substring(4);
            new Thread(() -> {
                String s = resolveApi(api);
                main.post(() -> {
                    if (my != gen) return;
                    if (s == null) { state = "error"; err = "API"; return; }
                    start(s, false);
                });
            }, "radio-api").start();
        } else if (low.contains(".pls") || (low.contains(".m3u") && !low.contains(".m3u8"))) {
            // 재생목록 파일이면 안의 첫 방송 주소를 꺼내서 재생
            state = "resolving";
            new Thread(() -> {
                String s = resolvePlaylist(u);
                main.post(() -> { if (my == gen) start(s != null ? s : u, false); });
            }, "radio-pls").start();
        } else start(u, false);
    }

    private void start(String u, boolean asHls) {
        url = u;
        ExoPlayer x = player();
        MediaItem.Builder b = new MediaItem.Builder().setUri(Uri.parse(u));
        if (asHls || u.toLowerCase(Locale.ROOT).contains(".m3u8")) { b.setMimeType(MimeTypes.APPLICATION_M3U8); triedHls = true; }
        x.setMediaItem(b.build());
        x.prepare();
        x.play();
        state = "buffering";
    }

    private static final Pattern URL_RE = Pattern.compile("https?://[^\\s\"'<>]+");

    /** 방송사 API 응답(글자·JSON)에서 실제 재생 주소(m3u8 우선)를 꺼냄 */
    static String resolveApi(String api) {
        try {
            HttpURLConnection c = (HttpURLConnection) new URL(api).openConnection();
            c.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36");
            String host = new URL(api).getHost();
            String ref = host.endsWith("imbc.com") ? "https://www.imbc.com/" : host.endsWith("kbs.co.kr") ? "https://onair.kbs.co.kr/" : host.endsWith("sbs.co.kr") ? "https://www.sbs.co.kr/" : null;
            if (ref != null) c.setRequestProperty("Referer", ref);
            c.setConnectTimeout(8000);
            c.setReadTimeout(8000);
            c.setInstanceFollowRedirects(true);
            StringBuilder b = new StringBuilder();
            try (BufferedReader r = new BufferedReader(new InputStreamReader(c.getInputStream(), "UTF-8"))) {
                String line;
                while ((line = r.readLine()) != null && b.length() < 200000) b.append(line).append('\n');
            }
            String body = b.toString().replace("\\/", "/").replace("\\u0026", "&").replace("&amp;", "&");
            Matcher m = URL_RE.matcher(body);
            String first = null;
            while (m.find()) {
                String x = m.group();
                while (x.endsWith(",") || x.endsWith(")") || x.endsWith(";")) x = x.substring(0, x.length() - 1);
                if (x.toLowerCase(Locale.ROOT).contains(".m3u8")) return x;
                if (first == null) first = x;
            }
            return first;
        } catch (Exception e) {
            return null;
        }
    }

    private static String resolvePlaylist(String u) {
        try {
            HttpURLConnection c = (HttpURLConnection) new URL(u).openConnection();
            c.setRequestProperty("User-Agent", UA);
            c.setConnectTimeout(8000);
            c.setReadTimeout(8000);
            c.setInstanceFollowRedirects(true);
            try (BufferedReader r = new BufferedReader(new InputStreamReader(c.getInputStream()))) {
                String line;
                for (int n = 0; n < 200 && (line = r.readLine()) != null; n++) {
                    line = line.trim();
                    int eq = line.indexOf('=');
                    if (line.toLowerCase(Locale.ROOT).startsWith("file") && eq > 0) line = line.substring(eq + 1).trim();
                    if (line.startsWith("http://") || line.startsWith("https://")) return line;
                }
            }
        } catch (Exception ignored) {}
        return null;
    }

    void stop() {
        gen++;
        src = "";
        title = "";
        if (p != null) { p.stop(); p.clearMediaItems(); }
        state = "idle";
        err = "";
    }

    void volume(float v) { vol = Math.max(0f, Math.min(1f, v)); if (p != null) p.setVolume(vol); }

    boolean isPlaying() { return p != null && p.isPlaying(); }

    String status() {
        try {
            sync();
            JSONObject o = new JSONObject();
            o.put("state", state);
            o.put("err", err);
            o.put("url", url);
            o.put("title", title);
            o.put("retry", retries);
            return o.toString();
        } catch (Exception e) { return "{}"; }
    }

    void release() {
        gen++;
        if (p != null) { p.release(); p = null; }
        state = "idle";
    }
}
