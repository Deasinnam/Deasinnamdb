package com.daesinnam.meeting;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaRecorder;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.os.SystemClock;
import android.util.Log;

import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;

/**
 * 회의 녹음과 분석을 맡는 포그라운드 서비스.
 *  - 녹음: 16kHz 모노 WAV, 10분마다 새 조각 (OpenAI 파일 한도 25MB 안쪽, 긴 회의도 끊기지 않게)
 *  - 종료하면 같은 서비스가 분석까지 이어서 하고, 끝나면 알림을 띄웁니다.
 *  화면을 끄거나 다른 앱을 써도 계속됩니다.
 */
public class RecorderService extends Service {
    static final String ACTION_START = "start";
    static final String ACTION_STOP = "stop";
    static final String ACTION_CANCEL = "cancel";
    static final String ACTION_PROCESS = "process";
    static final String EXTRA_TITLE = "title";
    static final String EXTRA_ID = "id";
    static final String EXTRA_REANALYZE = "reanalyze";

    private static final String TAG = "MeetingRecorder";
    private static final String CH_REC = "recording";
    private static final String CH_DONE = "done";
    private static final int NOTI_ID = 7;
    static final long CHUNK_MS = 10 * 60 * 1000L;

    // 화면이 0.7초마다 읽어 가는 상태
    static volatile String state = "idle";      // idle · recording · processing
    static volatile String meetingId;
    static volatile String title = "";
    static volatile long startedElapsed;
    static volatile float level;
    static volatile String step = "";
    static volatile Runnable onChange;

    private volatile boolean recording;
    private volatile boolean cancelled;
    private Thread worker;
    private PowerManager.WakeLock wake;

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent == null ? null : intent.getAction();
        if (ACTION_START.equals(action)) startRecording(intent.getStringExtra(EXTRA_TITLE));
        else if (ACTION_STOP.equals(action)) stopRecording(false);
        else if (ACTION_CANCEL.equals(action)) stopRecording(true);
        else if (ACTION_PROCESS.equals(action)) process(intent.getStringExtra(EXTRA_ID), intent.getBooleanExtra(EXTRA_REANALYZE, false));
        return START_NOT_STICKY;
    }

    // ---------- 녹음 ----------

    @SuppressLint("MissingPermission")
    private void startRecording(String t) {
        if (recording || "processing".equals(state)) return;
        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            stopSelf();
            return;
        }
        Store store = new Store(this);
        long now = System.currentTimeMillis();
        try {
            meetingId = store.create(t == null ? "" : t, now);
        } catch (IOException e) {
            Log.e(TAG, "기록 폴더 실패", e);
            stopSelf();
            return;
        }
        title = t == null ? "" : t;
        startedElapsed = SystemClock.elapsedRealtime();
        state = "recording";
        level = 0;
        recording = true;
        cancelled = false;
        foreground(recordingNotification(), ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE);
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        wake = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "meeting:recording");
        wake.acquire(6 * 60 * 60 * 1000L);
        final String id = meetingId;
        worker = new Thread(() -> recordLoop(id, store), "meeting-record");
        worker.start();
        changed();
    }

    @SuppressLint("MissingPermission")
    private void recordLoop(String id, Store store) {
        int min = AudioRecord.getMinBufferSize(Wav.RATE, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT);
        int bufSize = Math.max(min * 2, Wav.RATE); // 0.5초 분량 이상
        AudioRecord rec;
        try {
            rec = new AudioRecord(MediaRecorder.AudioSource.MIC, Wav.RATE, AudioFormat.CHANNEL_IN_MONO,
                    AudioFormat.ENCODING_PCM_16BIT, bufSize);
            rec.startRecording();
        } catch (Exception e) {
            Log.e(TAG, "마이크를 열 수 없음", e);
            fail(id, "마이크를 열 수 없습니다: " + e.getMessage());
            return;
        }
        byte[] buf = new byte[bufSize];
        int chunk = 0;
        File file = store.chunkFile(id, chunk);
        OutputStream out = null;
        long chunkBytes = 0;
        long maxChunkBytes = CHUNK_MS / 1000 * Wav.BYTES_PER_SEC;
        try {
            out = open(file);
            while (recording) {
                int n = rec.read(buf, 0, buf.length);
                if (n <= 0) continue;
                out.write(buf, 0, n);
                chunkBytes += n;
                level = rms(buf, n);
                if (chunkBytes >= maxChunkBytes) {
                    out.close();
                    Wav.fixHeader(file);
                    chunk++;
                    file = store.chunkFile(id, chunk);
                    out = open(file);
                    chunkBytes = 0;
                }
            }
        } catch (IOException e) {
            Log.e(TAG, "녹음 저장 실패", e);
        } finally {
            try {
                rec.stop();
            } catch (Exception ignored) {
            }
            rec.release();
            try {
                if (out != null) out.close();
                Wav.fixHeader(file);
                if (Wav.seconds(file) < 0.2 && chunk > 0) //noinspection ResultOfMethodCallIgnored
                    file.delete();
            } catch (IOException ignored) {
            }
        }
    }

    private static OutputStream open(File f) throws IOException {
        OutputStream o = new BufferedOutputStream(new FileOutputStream(f), 1 << 16);
        o.write(Wav.header(0));
        return o;
    }

    private static float rms(byte[] b, int n) {
        long sum = 0;
        int count = n / 2;
        for (int i = 0; i + 1 < n; i += 2) {
            int s = (short) ((b[i] & 0xff) | (b[i + 1] << 8));
            sum += (long) s * s;
        }
        double r = Math.sqrt(sum / (double) Math.max(1, count)) / 32768.0;
        return (float) Math.min(1.0, r * 4);
    }

    private void stopRecording(boolean cancel) {
        if (!recording) {
            if (cancel && !"processing".equals(state)) finishIdle();
            return;
        }
        cancelled = cancel;
        recording = false;
        String id = meetingId;
        long durationMs = SystemClock.elapsedRealtime() - startedElapsed;
        new Thread(() -> {
            try {
                if (worker != null) worker.join(5000);
            } catch (InterruptedException ignored) {
            }
            releaseWake();
            Store store = new Store(this);
            if (cancel) {
                store.delete(id);
                finishIdle();
                return;
            }
            try {
                store.update(id, "durationMs", durationMs);
                store.update(id, "state", "processing");
            } catch (IOException ignored) {
            }
            process(id, false);
        }, "meeting-stop").start();
    }

    // ---------- 분석 ----------

    private synchronized void process(String id, boolean reanalyze) {
        if (id == null || "processing".equals(state) || recording) return;
        meetingId = id;
        state = "processing";
        step = "분석 준비 중…";
        foreground(progressNotification(step), Build.VERSION.SDK_INT >= 29 ? ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC : 0);
        changed();
        new Thread(() -> {
            Store store = new Store(this);
            try {
                store.update(id, "state", "processing");
                new Pipeline(this).run(id, false, text -> {
                    step = text;
                    try {
                        store.update(id, "step", text);
                    } catch (IOException ignored) {
                    }
                    notifyProgress(text);
                    changed();
                });
                notifyDone(id, true, null);
            } catch (Exception e) {
                Log.e(TAG, "분석 실패", e);
                fail(id, e.getMessage() == null ? e.toString() : e.getMessage());
                notifyDone(id, false, e.getMessage());
            } finally {
                finishIdle();
            }
        }, "meeting-process").start();
        // 다시 분석(reanalyze)도 같은 흐름입니다. 받아쓰기는 저장해 둔 조각 결과를 다시 씁니다.
        if (reanalyze) Log.i(TAG, "다시 분석: " + id);
    }

    private void fail(String id, String message) {
        try {
            Store store = new Store(this);
            store.update(id, "state", "error");
            store.update(id, "error", message);
        } catch (IOException ignored) {
        }
        if (recording) {
            recording = false;
            releaseWake();
            finishIdle();
        }
    }

    private void finishIdle() {
        state = "idle";
        step = "";
        level = 0;
        changed();
        stopForeground(STOP_FOREGROUND_REMOVE);
        stopSelf();
    }

    private void releaseWake() {
        if (wake != null && wake.isHeld()) wake.release();
        wake = null;
    }

    private static void changed() {
        Runnable r = onChange;
        if (r != null) r.run();
    }

    // ---------- 알림 ----------

    private void channels() {
        NotificationManager nm = getSystemService(NotificationManager.class);
        nm.createNotificationChannel(new NotificationChannel(CH_REC, "녹음·분석 중", NotificationManager.IMPORTANCE_LOW));
        nm.createNotificationChannel(new NotificationChannel(CH_DONE, "분석 완료", NotificationManager.IMPORTANCE_DEFAULT));
    }

    private void foreground(Notification n, int type) {
        channels();
        if (Build.VERSION.SDK_INT >= 29 && type != 0) startForeground(NOTI_ID, n, type);
        else startForeground(NOTI_ID, n);
    }

    private PendingIntent openApp(String id) {
        Intent i = new Intent(this, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        if (id != null) i.putExtra(EXTRA_ID, id);
        return PendingIntent.getActivity(this, id == null ? 0 : id.hashCode(), i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    private Notification recordingNotification() {
        Intent stop = new Intent(this, RecorderService.class).setAction(ACTION_STOP);
        PendingIntent stopPi = PendingIntent.getService(this, 1, stop, PendingIntent.FLAG_IMMUTABLE);
        return new Notification.Builder(this, CH_REC)
                .setSmallIcon(android.R.drawable.ic_btn_speak_now)
                .setContentTitle("회의 녹음 중")
                .setContentText(title.isEmpty() ? "종료하면 바로 분석합니다" : title)
                .setUsesChronometer(true)
                .setWhen(System.currentTimeMillis())
                .setOngoing(true)
                .setContentIntent(openApp(null))
                .addAction(new Notification.Action.Builder(null, "회의 종료 · 분석", stopPi).build())
                .build();
    }

    private Notification progressNotification(String text) {
        return new Notification.Builder(this, CH_REC)
                .setSmallIcon(android.R.drawable.stat_notify_sync)
                .setContentTitle("회의 분석 중")
                .setContentText(text)
                .setProgress(0, 0, true)
                .setOngoing(true)
                .setContentIntent(openApp(meetingId))
                .build();
    }

    private void notifyProgress(String text) {
        getSystemService(NotificationManager.class).notify(NOTI_ID, progressNotification(text));
    }

    private void notifyDone(String id, boolean ok, String error) {
        String body;
        if (ok) {
            body = "요약과 요청 사항을 확인하세요";
            try {
                Store store = new Store(this);
                org.json.JSONObject a = store.optJson(id, "analysis.json");
                org.json.JSONObject m = store.meta(id);
                int req = a == null ? 0 : a.optJSONArray("requestsToMe").length();
                int ev = m.optInt("eventsAdded");
                body = (req > 0 ? "나에게 요청된 일 " + req + "건" : "요약을 확인하세요") + (ev > 0 ? " · 일정 " + ev + "건 캘린더 등록" : "");
            } catch (Exception ignored) {
            }
        } else {
            body = error == null ? "다시 분석을 눌러 주세요" : error;
        }
        Notification n = new Notification.Builder(this, CH_DONE)
                .setSmallIcon(ok ? android.R.drawable.stat_sys_download_done : android.R.drawable.stat_notify_error)
                .setContentTitle(ok ? "회의 분석이 끝났습니다" : "회의를 분석하지 못했습니다")
                .setContentText(body)
                .setStyle(new Notification.BigTextStyle().bigText(body))
                .setAutoCancel(true)
                .setContentIntent(openApp(id))
                .build();
        if (Build.VERSION.SDK_INT < 33 || checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) {
            getSystemService(NotificationManager.class).notify(id.hashCode(), n);
        }
    }

    // ---------- 다른 곳에서 부르기 ----------

    static void start(Context c, String title) {
        c.startForegroundService(new Intent(c, RecorderService.class).setAction(ACTION_START).putExtra(EXTRA_TITLE, title));
    }

    static void stop(Context c, boolean cancel) {
        c.startService(new Intent(c, RecorderService.class).setAction(cancel ? ACTION_CANCEL : ACTION_STOP));
    }

    static void analyze(Context c, String id, boolean reanalyze) {
        c.startForegroundService(new Intent(c, RecorderService.class).setAction(ACTION_PROCESS)
                .putExtra(EXTRA_ID, id).putExtra(EXTRA_REANALYZE, reanalyze));
    }

    static long elapsedMs() {
        return "recording".equals(state) ? SystemClock.elapsedRealtime() - startedElapsed : 0;
    }
}
