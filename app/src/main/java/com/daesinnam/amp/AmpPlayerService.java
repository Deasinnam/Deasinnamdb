package com.daesinnam.amp;

import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.media3.common.AudioAttributes;
import androidx.media3.common.C;
import androidx.media3.common.MediaItem;
import androidx.media3.common.MediaMetadata;
import androidx.media3.common.PlaybackException;
import androidx.media3.common.Player;
import androidx.media3.common.audio.AudioProcessor;
import androidx.media3.common.util.UnstableApi;
import androidx.media3.common.util.Util;
import androidx.media3.exoplayer.DefaultRenderersFactory;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.exoplayer.audio.AudioSink;
import androidx.media3.exoplayer.audio.DefaultAudioSink;
import androidx.media3.exoplayer.audio.TeeAudioProcessor;
import androidx.media3.session.DefaultMediaNotificationProvider;
import androidx.media3.session.MediaSession;
import androidx.media3.session.MediaSessionService;

import com.google.common.util.concurrent.Futures;
import com.google.common.util.concurrent.ListenableFuture;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

/**
 * 내 음악을 재생하는 안드로이드 표준 플레이어(Media3).
 * 차량 핸들 버튼, 블루투스 이어폰, 잠금 화면, 차량 화면 곡 정보, 오디오 포커스를
 * 안드로이드 표준 방식으로 처리합니다. 앱이 꺼져 있어도 핸들의 재생 버튼으로 이어서 재생할 수 있습니다.
 */
@UnstableApi
public class AmpPlayerService extends MediaSessionService {

    static volatile AmpPlayerService instance;
    static final SpectrumTap TAP = new SpectrumTap();

    private ExoPlayer player;
    private MediaSession session;
    private int audioSessionId = C.AUDIO_SESSION_ID_UNSET;
    private final Handler main = new Handler(Looper.getMainLooper());

    private final Runnable saveTick = new Runnable() {
        @Override
        public void run() {
            savePosition();
            main.postDelayed(this, 5000);
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;

        DefaultRenderersFactory renderers = new DefaultRenderersFactory(this) {
            @Override
            protected AudioSink buildAudioSink(@NonNull Context ctx, boolean floatOutput, boolean audioTrackPlaybackParams) {
                return new DefaultAudioSink.Builder(ctx)
                        .setAudioProcessors(new AudioProcessor[]{new TeeAudioProcessor(TAP)})
                        .build();
            }
        };
        player = new ExoPlayer.Builder(this, renderers)
                .setAudioAttributes(new AudioAttributes.Builder()
                        .setUsage(C.USAGE_MEDIA)
                        .setContentType(C.AUDIO_CONTENT_TYPE_MUSIC)
                        .build(), /* handleAudioFocus= */ true)
                .setHandleAudioBecomingNoisy(true) // 이어폰·블루투스가 끊기면 일시정지
                .setWakeMode(C.WAKE_MODE_LOCAL)
                .build();
        audioSessionId = Util.generateAudioSessionIdV21(this);
        player.setAudioSessionId(audioSessionId);
        ExternalEq.I.setLocalSession(audioSessionId);

        player.addListener(new Player.Listener() {
            @Override
            public void onPlayerError(@NonNull PlaybackException error) {
                // 파일이 옮겨졌거나 지워진 곡은 건너뜁니다.
                lastError = error.getMessage();
                errorIndex = player.getCurrentMediaItemIndex();
                if (player.hasNextMediaItem()) {
                    player.seekToNextMediaItem();
                    player.prepare();
                    player.play();
                }
            }

            @Override
            public void onMediaItemTransition(@Nullable MediaItem item, int reason) {
                savePosition();
            }

            @Override
            public void onIsPlayingChanged(boolean isPlaying) {
                if (!isPlaying) savePosition();
            }
        });

        Intent open = new Intent(this, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        session = new MediaSession.Builder(this, player)
                .setSessionActivity(PendingIntent.getActivity(this, 11, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT))
                .setCallback(new MediaSession.Callback() {
                    @NonNull
                    @Override
                    public ListenableFuture<List<MediaItem>> onAddMediaItems(
                            @NonNull MediaSession mediaSession, @NonNull MediaSession.ControllerInfo controller, @NonNull List<MediaItem> mediaItems) {
                        // 화면에서 보낸 곡은 mediaId에 파일 주소(content://)가 들어 있습니다.
                        List<MediaItem> out = new ArrayList<>();
                        for (MediaItem m : mediaItems) {
                            out.add(m.buildUpon().setUri(Uri.parse(m.mediaId)).build());
                        }
                        return Futures.immediateFuture(out);
                    }


                    @NonNull
                    @Override
                    public ListenableFuture<MediaSession.MediaItemsWithStartPosition> onPlaybackResumption(
                            @NonNull MediaSession mediaSession, @NonNull MediaSession.ControllerInfo controller) {
                        // 앱이 꺼져 있을 때 핸들·이어폰의 재생 버튼: 저장된 목록의 마지막 곡부터
                        SavedQueue q = loadQueue(AmpPlayerService.this);
                        return Futures.immediateFuture(new MediaSession.MediaItemsWithStartPosition(q.items, q.index, q.positionMs));
                    }
                })
                .build();

        DefaultMediaNotificationProvider np = new DefaultMediaNotificationProvider.Builder(this).build();
        np.setSmallIcon(R.drawable.ic_stat);
        setMediaNotificationProvider(np);
        main.postDelayed(saveTick, 5000);
    }

    @Nullable
    @Override
    public MediaSession onGetSession(@NonNull MediaSession.ControllerInfo controllerInfo) {
        return session;
    }

    @Override
    public void onTaskRemoved(@Nullable Intent rootIntent) {
        // 최근 앱에서 지워도, 재생 중이면 계속 재생합니다. 멈춰 있으면 서비스를 끝냅니다.
        if (player == null || !player.getPlayWhenReady() || player.getMediaItemCount() == 0) stopSelf();
    }

    @Override
    public void onDestroy() {
        main.removeCallbacks(saveTick);
        savePosition();
        ExternalEq.I.setLocalSession(0);
        if (session != null) {
            session.release();
            session = null;
        }
        if (player != null) {
            player.release();
            player = null;
        }
        instance = null;
        super.onDestroy();
    }

    // ------------------------------------------------------------ 화면(WebView)과 주고받는 값

    static volatile String lastError = "";
    static volatile int errorIndex = -1;

    ExoPlayer player() {
        return player;
    }

    /** 화면이 보낸 재생 목록으로 큐를 바꿉니다. */
    void setQueue(JSONArray arr, int index, long posMs, boolean play) {
        List<MediaItem> items = toItems(arr);
        saveQueue(this, arr.toString(), index, posMs);
        if (items.isEmpty()) {
            player.stop();
            player.clearMediaItems();
            return;
        }
        index = Math.max(0, Math.min(index, items.size() - 1));
        player.setMediaItems(items, index, Math.max(0, posMs));
        player.prepare();
        if (play) player.play();
    }

    void savePosition() {
        if (player == null || player.getMediaItemCount() == 0) return;
        SharedPreferences p = getSharedPreferences("queue", MODE_PRIVATE);
        p.edit().putInt("index", player.getCurrentMediaItemIndex())
                .putLong("pos", Math.max(0, player.getCurrentPosition())).apply();
    }

    static List<MediaItem> toItems(JSONArray arr) {
        List<MediaItem> items = new ArrayList<>();
        for (int i = 0; i < arr.length(); i++) {
            JSONObject o = arr.optJSONObject(i);
            if (o == null) continue;
            String uri = o.optString("uri", "");
            if (uri.isEmpty()) continue;
            MediaMetadata md = new MediaMetadata.Builder()
                    .setTitle(o.optString("title", ""))
                    .setArtist(o.optString("artist", ""))
                    .setAlbumTitle(o.optString("album", ""))
                    .build();
            items.add(new MediaItem.Builder().setMediaId(uri).setUri(Uri.parse(uri)).setMediaMetadata(md).build());
        }
        return items;
    }

    static void saveQueue(Context c, String json, int index, long pos) {
        c.getSharedPreferences("queue", MODE_PRIVATE).edit()
                .putString("items", json).putInt("index", index).putLong("pos", pos).apply();
    }

    static final class SavedQueue {
        List<MediaItem> items = new ArrayList<>();
        int index = 0;
        long positionMs = 0;
    }

    static SavedQueue loadQueue(Context c) {
        SavedQueue q = new SavedQueue();
        SharedPreferences p = c.getSharedPreferences("queue", MODE_PRIVATE);
        try {
            q.items = toItems(new JSONArray(p.getString("items", "[]")));
        } catch (Exception ignored) {}
        q.index = Math.max(0, Math.min(p.getInt("index", 0), Math.max(0, q.items.size() - 1)));
        q.positionMs = p.getLong("pos", 0);
        return q;
    }
}
