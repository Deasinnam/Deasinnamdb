package com.daesinnam.amp;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.drawable.Icon;
import android.media.MediaMetadata;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.os.SystemClock;
import android.view.KeyEvent;

/**
 * 포그라운드 서비스.
 * - 내 음악 재생 중: 미디어 세션을 열어 차량 핸들 버튼, 블루투스 이어폰, 키보드 미디어 키,
 *   잠금 화면, 알림창에서 조작할 수 있게 하고, 차량 화면에 곡 정보를 보냅니다.
 * - 외부 앱 연동 중: 앱이 백그라운드에 있어도 EQ 연결이 유지되도록 프로세스를 살려 둡니다.
 *   이때는 세션을 꺼서 핸들 버튼이 외부 앱(YouTube Music, Spotify)으로 가게 합니다.
 */
public class PlaybackService extends Service {

    static final String ACTION_UPDATE = "com.daesinnam.amp.UPDATE";
    static final String ACTION_REFRESH = "com.daesinnam.amp.REFRESH";
    static final String ACTION_OWN_STOP = "com.daesinnam.amp.OWN_STOP";
    static final String ACTION_EXT = "com.daesinnam.amp.EXT";
    static final String ACTION_PREV = "com.daesinnam.amp.PREV";
    static final String ACTION_TOGGLE = "com.daesinnam.amp.TOGGLE";
    static final String ACTION_NEXT = "com.daesinnam.amp.NEXT";
    private static final String CHANNEL = "playback";
    private static final int NOTI_ID = 1;

    static volatile boolean running = false;

    private boolean own = false;
    private boolean ext = false;
    private PowerManager.WakeLock cpuLock;
    private MediaSession session;

    @Override
    public void onCreate() {
        super.onCreate();
        running = true;
        NotificationManager nm = getSystemService(NotificationManager.class);
        NotificationChannel ch = new NotificationChannel(CHANNEL, getString(R.string.channel_name), NotificationManager.IMPORTANCE_LOW);
        ch.setShowBadge(false);
        nm.createNotificationChannel(ch);
        PowerManager pm = getSystemService(PowerManager.class);
        cpuLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "DaesinnamAmp:playback");
        cpuLock.setReferenceCounted(false);

        session = new MediaSession(this, "DaesinnamAmp");
        Intent open = new Intent(this, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        session.setSessionActivity(PendingIntent.getActivity(this, 10, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT));
        session.setCallback(new MediaSession.Callback() {
            @Override public void onPlay() { send("play"); }
            @Override public void onPause() { send("pause"); }
            @Override public void onStop() { send("stop"); }
            @Override public void onSkipToNext() { send("next"); }
            @Override public void onSkipToPrevious() { send("prev"); }
            @Override public void onFastForward() { send("ff"); }
            @Override public void onRewind() { send("rw"); }
            @Override public void onSeekTo(long pos) { send("seek:" + pos); }

            @Override
            public boolean onMediaButtonEvent(Intent mediaButtonIntent) {
                KeyEvent ev = mediaButtonIntent.getParcelableExtra(Intent.EXTRA_KEY_EVENT);
                if (ev != null && ev.getAction() == KeyEvent.ACTION_DOWN && ev.getRepeatCount() == 0) {
                    switch (ev.getKeyCode()) {
                        // 일부 차량·이어폰은 재생/일시정지 하나의 키만 보내므로 직접 토글합니다.
                        case KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE:
                        case KeyEvent.KEYCODE_HEADSETHOOK:
                            send("toggle");
                            return true;
                        case KeyEvent.KEYCODE_MEDIA_NEXT:
                            send("next");
                            return true;
                        case KeyEvent.KEYCODE_MEDIA_PREVIOUS:
                            send("prev");
                            return true;
                        default:
                            break;
                    }
                }
                return super.onMediaButtonEvent(mediaButtonIntent);
            }
        });
    }

    private void send(String cmd) {
        MainActivity act = MainActivity.current.get();
        if (act != null) act.control(cmd);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : null;
        if (ACTION_UPDATE.equals(action)) {
            own = true;
        } else if (ACTION_OWN_STOP.equals(action)) {
            own = false;
            NowPlaying.playing = false;
        } else if (ACTION_EXT.equals(action)) {
            ext = intent.getBooleanExtra("on", false);
            if (ext) own = false;
        } else if (ACTION_PREV.equals(action)) {
            send("prev");
        } else if (ACTION_NEXT.equals(action)) {
            send("next");
        } else if (ACTION_TOGGLE.equals(action)) {
            send("toggle");
        }

        updateSession();

        // startForegroundService로 시작된 경우 반드시 startForeground를 먼저 호출해야 합니다.
        Notification n = build();
        if (Build.VERSION.SDK_INT >= 29) {
            startForeground(NOTI_ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        } else {
            startForeground(NOTI_ID, n);
        }

        if (!own && !ext) {
            stopForeground(STOP_FOREGROUND_REMOVE);
            stopSelf();
            return START_NOT_STICKY;
        }

        if (own && NowPlaying.playing) cpuLock.acquire(6 * 60 * 60 * 1000L);
        else if (cpuLock.isHeld()) cpuLock.release();
        return START_NOT_STICKY;
    }

    private void updateSession() {
        if (session == null) return;
        if (!own) {
            session.setActive(false);
            return;
        }
        MediaMetadata.Builder md = new MediaMetadata.Builder()
                .putString(MediaMetadata.METADATA_KEY_TITLE, NowPlaying.title)
                .putString(MediaMetadata.METADATA_KEY_ARTIST, NowPlaying.artist)
                .putString(MediaMetadata.METADATA_KEY_ALBUM, "Daesinnam Amp")
                .putLong(MediaMetadata.METADATA_KEY_DURATION, NowPlaying.durationMs);
        if (NowPlaying.art != null) md.putBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART, NowPlaying.art);
        session.setMetadata(md.build());

        boolean pl = NowPlaying.playing;
        session.setPlaybackState(new PlaybackState.Builder()
                .setActions(PlaybackState.ACTION_PLAY | PlaybackState.ACTION_PAUSE | PlaybackState.ACTION_PLAY_PAUSE
                        | PlaybackState.ACTION_STOP | PlaybackState.ACTION_SKIP_TO_NEXT | PlaybackState.ACTION_SKIP_TO_PREVIOUS
                        | PlaybackState.ACTION_SEEK_TO | PlaybackState.ACTION_FAST_FORWARD | PlaybackState.ACTION_REWIND)
                .setState(pl ? PlaybackState.STATE_PLAYING : PlaybackState.STATE_PAUSED,
                        NowPlaying.positionMs, pl ? 1f : 0f, SystemClock.elapsedRealtime())
                .build());
        session.setActive(true);
    }

    private PendingIntent action(String a, int code) {
        Intent i = new Intent(this, PlaybackService.class).setAction(a);
        return PendingIntent.getService(this, code, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    private Notification build() {
        Intent open = new Intent(this, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent content = PendingIntent.getActivity(this, 0, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);

        Notification.Builder b = new Notification.Builder(this, CHANNEL)
                .setSmallIcon(R.drawable.ic_stat)
                .setContentIntent(content)
                .setColor(0xFF2F5BFF)
                .setOnlyAlertOnce(true)
                .setVisibility(Notification.VISIBILITY_PUBLIC);

        if (own) {
            boolean pl = NowPlaying.playing;
            String artist = NowPlaying.artist;
            b.setContentTitle(NowPlaying.title)
                    .setContentText(artist.isEmpty() ? (pl ? "재생 중" : "일시정지") : artist)
                    .setOngoing(pl)
                    .addAction(new Notification.Action.Builder(Icon.createWithResource(this, android.R.drawable.ic_media_previous), "이전", action(ACTION_PREV, 1)).build())
                    .addAction(new Notification.Action.Builder(Icon.createWithResource(this, pl ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play), pl ? "일시정지" : "재생", action(ACTION_TOGGLE, 2)).build())
                    .addAction(new Notification.Action.Builder(Icon.createWithResource(this, android.R.drawable.ic_media_next), "다음", action(ACTION_NEXT, 3)).build())
                    .setStyle(new Notification.MediaStyle().setMediaSession(session.getSessionToken()).setShowActionsInCompactView(0, 1, 2));
            if (NowPlaying.art != null) b.setLargeIcon(NowPlaying.art);
        } else {
            b.setContentTitle("외부 앱 연동 중")
                    .setContentText("EQ: " + ExternalEq.I.status())
                    .setOngoing(true);
        }
        return b.build();
    }

    @Override
    public void onDestroy() {
        running = false;
        if (cpuLock != null && cpuLock.isHeld()) cpuLock.release();
        if (session != null) {
            session.setActive(false);
            session.release();
            session = null;
        }
        stopForeground(STOP_FOREGROUND_REMOVE);
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
