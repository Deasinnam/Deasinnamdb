package com.daesinnam.amp;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.drawable.Icon;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioFormat;
import android.media.AudioManager;
import android.media.AudioTrack;
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
    private AudioManager am;
    private AudioFocusRequest focusReq;
    private boolean hasFocus = false;
    private boolean pausedByFocus = false;
    private AudioTrack keepAlive;

    /** 핸들·이어폰 버튼 진단용: 마지막으로 받은 신호 */
    static volatile String lastKey = "";
    static volatile long lastKeyAt = 0;

    static void logKey(String k) {
        lastKey = k;
        lastKeyAt = System.currentTimeMillis();
    }

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

        am = getSystemService(AudioManager.class);
        session = new MediaSession(this, "DaesinnamAmp");
        Intent open = new Intent(this, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        session.setSessionActivity(PendingIntent.getActivity(this, 10, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT));
        session.setCallback(new MediaSession.Callback() {
            @Override public void onPlay() { logKey("재생"); send("play"); }
            @Override public void onPause() { logKey("일시정지"); send("pause"); }
            @Override public void onStop() { logKey("정지"); send("stop"); }
            @Override public void onSkipToNext() { logKey("다음 곡"); send("next"); }
            @Override public void onSkipToPrevious() { logKey("이전 곡"); send("prev"); }
            @Override public void onFastForward() { logKey("빨리감기"); send("ff"); }
            @Override public void onRewind() { logKey("되감기"); send("rw"); }
            @Override public void onSeekTo(long pos) { logKey("탐색"); send("seek:" + pos); }

            @Override
            public boolean onMediaButtonEvent(Intent mediaButtonIntent) {
                KeyEvent ev = mediaButtonIntent.getParcelableExtra(Intent.EXTRA_KEY_EVENT);
                if (ev != null && ev.getAction() == KeyEvent.ACTION_DOWN && ev.getRepeatCount() == 0) {
                    switch (ev.getKeyCode()) {
                        // 일부 차량·이어폰은 재생/일시정지 하나의 키만 보내므로 직접 토글합니다.
                        case KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE:
                        case KeyEvent.KEYCODE_HEADSETHOOK:
                            logKey("재생/일시정지");
                            send("toggle");
                            return true;
                        case KeyEvent.KEYCODE_MEDIA_NEXT:
                            logKey("다음 곡");
                            send("next");
                            return true;
                        case KeyEvent.KEYCODE_MEDIA_PREVIOUS:
                            logKey("이전 곡");
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

        if (own && NowPlaying.playing) {
            cpuLock.acquire(6 * 60 * 60 * 1000L);
            requestFocus();
            startKeepAlive();
        } else {
            if (cpuLock.isHeld()) cpuLock.release();
            stopKeepAlive();
            if (!own) abandonFocus();
        }
        return START_NOT_STICKY;
    }

    // ------------------------------------------------------------ 오디오 포커스 · 버튼 수신

    /**
     * 안드로이드는 핸들·이어폰 버튼을 "마지막으로 소리를 낸 앱"에 보냅니다.
     * 화면(WebView)이 내는 소리만으로는 이 앱이 그 대상으로 잡히지 않을 수 있어,
     * 재생하는 동안 오디오 포커스를 직접 잡고 들리지 않는 무음 트랙을 함께 재생합니다.
     */
    private void requestFocus() {
        if (hasFocus || am == null) return;
        AudioAttributes attrs = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                .build();
        focusReq = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                .setAudioAttributes(attrs)
                .setWillPauseWhenDucked(false)
                .setOnAudioFocusChangeListener(this::onFocusChange)
                .build();
        hasFocus = am.requestAudioFocus(focusReq) == AudioManager.AUDIOFOCUS_REQUEST_GRANTED;
    }

    private void abandonFocus() {
        if (focusReq != null && am != null) am.abandonAudioFocusRequest(focusReq);
        hasFocus = false;
    }

    private void onFocusChange(int change) {
        switch (change) {
            case AudioManager.AUDIOFOCUS_LOSS:
                // 다른 음악 앱이 재생을 시작함: 일시정지
                hasFocus = false;
                pausedByFocus = false;
                if (NowPlaying.playing) send("pause");
                break;
            case AudioManager.AUDIOFOCUS_LOSS_TRANSIENT:
                // 전화 등 잠깐 끊김: 일시정지했다가 끝나면 이어서 재생
                if (NowPlaying.playing) {
                    pausedByFocus = true;
                    send("pause");
                }
                break;
            case AudioManager.AUDIOFOCUS_GAIN:
                hasFocus = true;
                if (pausedByFocus) {
                    pausedByFocus = false;
                    send("play");
                }
                break;
            default:
                // 내비게이션 안내 음성(LOSS_TRANSIENT_CAN_DUCK)은 안드로이드가 소리를 줄여 줍니다.
                break;
        }
    }

    private void startKeepAlive() {
        if (keepAlive != null) return;
        try {
            int rate = 8000;
            short[] silence = new short[rate]; // 1초 무음
            AudioTrack t = new AudioTrack.Builder()
                    .setAudioAttributes(new AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_MEDIA)
                            .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                            .build())
                    .setAudioFormat(new AudioFormat.Builder()
                            .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                            .setSampleRate(rate)
                            .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                            .build())
                    .setTransferMode(AudioTrack.MODE_STATIC)
                    .setBufferSizeInBytes(silence.length * 2)
                    .build();
            t.write(silence, 0, silence.length);
            t.setLoopPoints(0, silence.length, -1);
            t.play();
            keepAlive = t;
        } catch (Exception ignored) {
            keepAlive = null;
        }
    }

    private void stopKeepAlive() {
        if (keepAlive == null) return;
        try {
            keepAlive.stop();
            keepAlive.release();
        } catch (Exception ignored) {}
        keepAlive = null;
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
        stopKeepAlive();
        abandonFocus();
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
