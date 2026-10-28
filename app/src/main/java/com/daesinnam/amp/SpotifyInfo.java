package com.daesinnam.amp;

import android.content.Intent;
import android.os.SystemClock;

/**
 * Spotify의 "기기 브로드캐스트 상태" 기능이 보내는 재생 정보를 보관합니다.
 * Spotify 앱 설정에서 이 옵션을 켜면, 알림 접근 권한 없이도 곡 정보를 받을 수 있습니다.
 */
final class SpotifyInfo {
    static final String META = "com.spotify.music.metadatachanged";
    static final String STATE = "com.spotify.music.playbackstatechanged";

    static volatile String trackId = "";
    static volatile String title = "";
    static volatile String artist = "";
    static volatile String album = "";
    static volatile long durationMs = 0;
    static volatile boolean playing = false;
    static volatile long positionMs = 0;
    static volatile long positionAt = 0;   // elapsedRealtime 기준
    static volatile long lastUpdate = 0;

    private SpotifyInfo() {}

    static void onBroadcast(Intent i) {
        long now = SystemClock.elapsedRealtime();
        if (META.equals(i.getAction())) {
            String id = i.getStringExtra("id");
            if (id != null) trackId = id;
            String t = i.getStringExtra("track");
            if (t != null) title = t;
            String a = i.getStringExtra("artist");
            if (a != null) artist = a;
            String al = i.getStringExtra("album");
            if (al != null) album = al;
            durationMs = i.getIntExtra("length", (int) durationMs);
        } else if (STATE.equals(i.getAction())) {
            playing = i.getBooleanExtra("playing", playing);
            positionMs = i.getIntExtra("playbackPosition", (int) positionMs);
            positionAt = now;
        }
        lastUpdate = now;
    }

    static boolean known() {
        return lastUpdate > 0 && !title.isEmpty();
    }

    static long position() {
        long p = positionMs;
        if (playing && positionAt > 0) p += SystemClock.elapsedRealtime() - positionAt;
        return durationMs > 0 ? Math.min(p, durationMs) : p;
    }
}
