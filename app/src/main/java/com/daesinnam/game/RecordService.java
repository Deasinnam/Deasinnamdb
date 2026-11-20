package com.daesinnam.game;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.Rect;
import android.hardware.display.DisplayManager;
import android.hardware.display.VirtualDisplay;
import android.media.MediaRecorder;
import android.media.projection.MediaProjection;
import android.media.projection.MediaProjectionManager;
import android.net.Uri;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.ParcelFileDescriptor;
import android.provider.MediaStore;
import android.util.Log;
import android.view.WindowManager;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * 게임 녹화: 안드로이드 화면 녹화(MediaProjection) → MediaRecorder(H.264, 마이크 선택) →
 * 동영상/덜누름 게임 폴더에 MP4로 저장. 알림의 "녹화 멈추기"로 끝냅니다.
 */
public class RecordService extends Service {
    static final String TAG = "GameRec";
    static final String ACTION_START = "com.daesinnam.game.REC_START";
    static final String ACTION_STOP = "com.daesinnam.game.REC_STOP";
    private static final String CHANNEL = "rec";
    private static final int NOTI_ID = 7;

    static volatile boolean running;
    static volatile String lastSaved;

    private MediaProjection projection;
    private VirtualDisplay display;
    private MediaRecorder recorder;
    private ParcelFileDescriptor pfd;
    private Uri uri;
    private String fileName;
    private final Handler main = new Handler(Looper.getMainLooper());

    @Override
    public IBinder onBind(Intent intent) { return null; }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent == null ? null : intent.getAction();
        if (ACTION_STOP.equals(action)) {
            stopRecording(true);
            return START_NOT_STICKY;
        }
        if (ACTION_START.equals(action) && !running) {
            boolean mic = intent.getBooleanExtra("mic", false);
            int type = ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION;
            if (mic) type |= ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE;
            try {
                if (Compat.SDK >= 29) startForeground(NOTI_ID, notification(), type); else startForeground(NOTI_ID, notification());
            } catch (Exception e) {
                Log.w(TAG, "REC-FAIL foreground " + e);
                stopSelf();
                return START_NOT_STICKY;
            }
            int code = intent.getIntExtra("code", 0);
            @SuppressWarnings("deprecation") Intent data = intent.getParcelableExtra("data");
            if (!start(code, data, mic)) {
                stopRecording(false);
            }
        }
        return START_NOT_STICKY;
    }

    private Notification notification() {
        NotificationManager nm = getSystemService(NotificationManager.class);
        if (nm.getNotificationChannel(CHANNEL) == null) {
            NotificationChannel ch = new NotificationChannel(CHANNEL, "게임 녹화", NotificationManager.IMPORTANCE_LOW);
            nm.createNotificationChannel(ch);
        }
        PendingIntent stop = PendingIntent.getService(this, 1,
            new Intent(this, RecordService.class).setAction(ACTION_STOP), PendingIntent.FLAG_IMMUTABLE);
        PendingIntent open = PendingIntent.getActivity(this, 2,
            new Intent(this, MainActivity.class), PendingIntent.FLAG_IMMUTABLE);
        return new Notification.Builder(this, CHANNEL)
            .setSmallIcon(R.drawable.ic_stat_rec)
            .setContentTitle("게임 녹화 중")
            .setContentText("멈추려면 '녹화 멈추기'를 누르세요")
            .setContentIntent(open)
            .setOngoing(true)
            .addAction(new Notification.Action.Builder(null, "녹화 멈추기", stop).build())
            .build();
    }

    private boolean start(int code, Intent data, boolean mic) {
        if (data == null) return false;
        MediaProjectionManager mpm = getSystemService(MediaProjectionManager.class);
        try {
            projection = mpm.getMediaProjection(code, data);
        } catch (Exception e) {
            Log.w(TAG, "REC-FAIL projection " + e);
            return false;
        }
        if (projection == null) return false;
        projection.registerCallback(new MediaProjection.Callback() {
            @Override
            public void onStop() { main.post(() -> stopRecording(true)); }
        }, main);

        Rect b = Compat.maxBounds(getSystemService(WindowManager.class));
        int dpi = getResources().getDisplayMetrics().densityDpi;
        // 큰 화면 그대로 → 안 되면 긴 쪽 1280, 30프레임으로 다시 시도 (기기 인코더마다 한계가 다름)
        // 게임 최적화 단계에 맞춘 화질(긴 쪽·프레임)을 먼저 시도
        android.content.SharedPreferences prefs = getSharedPreferences("game", MODE_PRIVATE);
        int[][] tries = {{prefs.getInt("recSide", 1920), prefs.getInt("recFps", 60)}, {1280, 30}};
        for (int[] t : tries) {
            int[] size = fit(b.width(), b.height(), t[0]);
            if (prepare(size[0], size[1], t[1], mic)) {
                try {
                    display = projection.createVirtualDisplay("DeolnureumGameRec", size[0], size[1], dpi,
                        DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR, recorder.getSurface(), null, null);
                    recorder.start();
                    running = true;
                    Log.i(TAG, "REC-START " + size[0] + "x" + size[1] + "@" + t[1] + (mic ? " mic" : ""));
                    return true;
                } catch (Exception e) {
                    Log.w(TAG, "REC-RETRY start " + e);
                    cleanupRecorder(true);
                }
            }
        }
        Log.w(TAG, "REC-FAIL no encoder setting worked");
        return false;
    }

    private static int[] fit(int w, int h, int maxSide) {
        float s = Math.min(1f, (float) maxSide / Math.max(w, h));
        int nw = Math.round(w * s) & ~15;
        int nh = Math.round(h * s) & ~15;
        return new int[]{Math.max(nw, 16), Math.max(nh, 16)};
    }

    private boolean prepare(int w, int h, int fps, boolean mic) {
        try {
            fileName = "덜누름게임_" + new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.KOREA).format(new Date()) + ".mp4";
            ContentValues v = new ContentValues();
            v.put(MediaStore.Video.Media.DISPLAY_NAME, fileName);
            v.put(MediaStore.Video.Media.MIME_TYPE, "video/mp4");
            v.put(MediaStore.Video.Media.RELATIVE_PATH, "Movies/덜누름 게임");
            v.put(MediaStore.Video.Media.IS_PENDING, 1);
            ContentResolver cr = getContentResolver();
            uri = cr.insert(MediaStore.Video.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY), v);
            if (uri == null) return false;
            pfd = cr.openFileDescriptor(uri, "rw");

            recorder = Compat.SDK >= 31 ? new MediaRecorder(this) : new MediaRecorder();
            if (mic) recorder.setAudioSource(MediaRecorder.AudioSource.MIC);
            recorder.setVideoSource(MediaRecorder.VideoSource.SURFACE);
            recorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);
            recorder.setVideoEncoder(MediaRecorder.VideoEncoder.H264);
            if (mic) {
                recorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC);
                recorder.setAudioSamplingRate(44100);
                recorder.setAudioEncodingBitRate(128_000);
            }
            recorder.setVideoSize(w, h);
            recorder.setVideoFrameRate(fps);
            recorder.setVideoEncodingBitRate(Math.min(16_000_000, w * h * fps / 8));
            recorder.setOutputFile(pfd.getFileDescriptor());
            recorder.prepare();
            return true;
        } catch (Exception e) {
            Log.w(TAG, "REC-RETRY prepare " + w + "x" + h + "@" + fps + " " + e);
            cleanupRecorder(true);
            return false;
        }
    }

    private void cleanupRecorder(boolean deleteFile) {
        if (recorder != null) { try { recorder.release(); } catch (Exception ignored) { } recorder = null; }
        if (display != null) { display.release(); display = null; }
        if (pfd != null) { try { pfd.close(); } catch (Exception ignored) { } pfd = null; }
        if (deleteFile && uri != null) { try { getContentResolver().delete(uri, null, null); } catch (Exception ignored) { } uri = null; }
    }

    private void stopRecording(boolean save) {
        boolean ok = false;
        if (running && recorder != null) {
            try { recorder.stop(); ok = save; } catch (Exception e) { Log.w(TAG, "REC-STOP too short " + e); }
        }
        running = false;
        Uri saved = uri;
        uri = null; // 아래 정리에서 지우지 않도록
        cleanupRecorder(false);
        if (saved != null) {
            if (ok) {
                ContentValues v = new ContentValues();
                v.put(MediaStore.Video.Media.IS_PENDING, 0);
                getContentResolver().update(saved, v, null, null);
                lastSaved = "동영상/덜누름 게임/" + fileName;
                long size = 0;
                try (ParcelFileDescriptor p = getContentResolver().openFileDescriptor(saved, "r")) { size = p.getStatSize(); } catch (Exception ignored) { }
                Log.i(TAG, "REC-SAVED " + fileName + " " + size);
            } else {
                try { getContentResolver().delete(saved, null, null); } catch (Exception ignored) { }
            }
        }
        if (projection != null) { try { projection.stop(); } catch (Exception ignored) { } projection = null; }
        stopForeground(STOP_FOREGROUND_REMOVE);
        stopSelf();
    }

    @Override
    public void onDestroy() {
        if (running) stopRecording(true);
        super.onDestroy();
    }
}
