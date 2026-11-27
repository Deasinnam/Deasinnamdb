package com.daesinnam.work;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaRecorder;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.util.Log;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.ViewConfiguration;
import android.widget.FrameLayout;
import android.widget.TextView;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.core.content.ContextCompat;

import java.io.File;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * 녹음 · 음성 편집 (SoundCraft 웹 빌드, MIT/Apache-2.0 — 정보 화면 참고)
 *
 * 웹판 SoundCraft는 브라우저에서 마이크를 쓰지 못합니다(오디오 라이브러리 cpal의 웹 입력이 아직 없음).
 * 그래서 덜누름 워크가 안드로이드에서 직접 녹음(48kHz · 16비트 · 모노 WAV)하고,
 * 녹음을 멈추면 그 파일을 편집기에 새 트랙으로 넣습니다. 화면의 빨간 "녹음" 단추로 시작 · 멈춤.
 */
public class SoundActivity extends CraftActivity {
    @Override protected String assetDir() { return "sound"; }
    @Override protected String bridgeAsset() { return "egui-bridge.js"; }
    @Override protected String bridgeName() { return "SoundCraftAndroid"; }
    @Override protected String selftestName() { return "sound"; }
    @Override protected String closeQuestion() {
        return "녹음 편집을 닫을까요?\n저장하지 않은 작업은 사라집니다. 먼저 File › Save Session으로 저장해 두세요.";
    }

    private static final int RATE = 48000;
    private final Handler main = new Handler(Looper.getMainLooper());
    private TextView button;
    private volatile boolean recording;
    private Thread worker;
    private File current;
    private long startedAt;
    private ActivityResultLauncher<String> askMic;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        askMic = registerForActivityResult(new ActivityResultContracts.RequestPermission(), granted -> {
            if (granted) startRecording();
            else toastFromEditor("마이크 권한이 있어야 녹음할 수 있습니다");
        });
        super.onCreate(savedInstanceState);
        if (isSelftest()) main.postDelayed(this::selftestRecording, 45000);
    }

    @Override
    protected void onEditorViews(FrameLayout root) {
        float dp = getResources().getDisplayMetrics().density;
        int h = Math.round(46 * dp), margin = Math.round(10 * dp);
        button = new TextView(this);
        button.setTextColor(Color.WHITE);
        button.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14);
        button.setTypeface(Typeface.DEFAULT_BOLD);
        button.setGravity(Gravity.CENTER);
        button.setPadding(Math.round(14 * dp), 0, Math.round(14 * dp), 0);
        button.setElevation(8 * dp);
        button.setFocusable(true);
        showIdle();
        FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(FrameLayout.LayoutParams.WRAP_CONTENT, h);
        lp.gravity = Gravity.TOP | Gravity.START;
        root.addView(button, lp);
        // 기본 자리: 오른쪽 가장자리, 화면 높이의 42% 지점 ("홈" 단추 위)
        root.post(() -> {
            int w = root.getWidth() - root.getPaddingLeft() - root.getPaddingRight();
            int hh = root.getHeight() - root.getPaddingTop() - root.getPaddingBottom();
            button.setX(root.getPaddingLeft() + w - button.getWidth() - margin);
            button.setY(root.getPaddingTop() + Math.max(margin, 0.42f * hh - h / 2f));
        });
        makeDraggable(root, button);
        button.setOnClickListener(v -> {
            if (recording) stopRecording();
            else if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) startRecording();
            else askMic.launch(Manifest.permission.RECORD_AUDIO);
        });
    }

    private void showIdle() {
        button.setText("●  녹음");
        button.setContentDescription("녹음 시작");
        button.setBackground(pill(0xE6C62828));
    }

    private GradientDrawable pill(int color) {
        float dp = getResources().getDisplayMetrics().density;
        GradientDrawable bg = new GradientDrawable();
        bg.setCornerRadius(23 * dp);
        bg.setColor(color);
        bg.setStroke(Math.round(1.5f * dp), 0x66FFFFFF);
        return bg;
    }

    private final Runnable tick = new Runnable() {
        @Override
        public void run() {
            if (!recording) return;
            long s = (SystemClock.elapsedRealtime() - startedAt) / 1000;
            button.setText(String.format(Locale.ROOT, "■  %d:%02d  멈춤", s / 60, s % 60));
            main.postDelayed(this, 500);
        }
    };

    @SuppressLint("MissingPermission")
    private void startRecording() {
        if (recording) return;
        int min = AudioRecord.getMinBufferSize(RATE, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT);
        if (min <= 0) {
            toastFromEditor("이 기기에서 녹음을 시작할 수 없습니다");
            return;
        }
        AudioRecord rec;
        try {
            rec = new AudioRecord(MediaRecorder.AudioSource.MIC, RATE, AudioFormat.CHANNEL_IN_MONO,
                    AudioFormat.ENCODING_PCM_16BIT, Math.max(min, RATE));
            if (rec.getState() != AudioRecord.STATE_INITIALIZED) throw new IllegalStateException("마이크를 열 수 없습니다");
        } catch (RuntimeException e) {
            toastFromEditor("녹음을 시작하지 못했습니다: " + e.getMessage());
            log("rec fail " + e);
            return;
        }
        File dir = new File(getCacheDir(), "recordings");
        //noinspection ResultOfMethodCallIgnored
        dir.mkdirs();
        clean(dir);
        String name = "녹음 " + new SimpleDateFormat("yyyy-MM-dd HH.mm.ss", Locale.KOREA).format(new Date()) + ".wav";
        current = new File(dir, name);
        recording = true;
        startedAt = SystemClock.elapsedRealtime();
        button.setBackground(pill(0xE6111111));
        button.setContentDescription("녹음 멈춤");
        main.post(tick);
        File out = current;
        worker = new Thread(() -> writeWav(rec, out), "dn-record");
        worker.start();
    }

    private void writeWav(AudioRecord rec, File out) {
        long bytes = 0;
        try (RandomAccessFile f = new RandomAccessFile(out, "rw")) {
            f.setLength(0);
            f.write(new byte[44]); // 머리말 자리 (끝나고 채움)
            byte[] buf = new byte[RATE / 5 * 2];
            rec.startRecording();
            while (recording) {
                int n = rec.read(buf, 0, buf.length);
                if (n > 0) {
                    f.write(buf, 0, n);
                    bytes += n;
                } else if (n < 0) {
                    break;
                }
            }
            f.seek(0);
            f.write(wavHeader(bytes));
        } catch (IOException | RuntimeException e) {
            log("rec write fail " + e);
            main.post(() -> toastFromEditor("녹음 파일을 쓰지 못했습니다: " + e.getMessage()));
        } finally {
            try {
                rec.stop();
            } catch (RuntimeException ignored) {
            }
            rec.release();
        }
        long total = bytes;
        main.post(() -> finished(out, total));
    }

    private void stopRecording() {
        recording = false; // 쓰는 쪽이 끝나면 finished()
        main.removeCallbacks(tick);
        button.setText("넣는 중…");
    }

    private void finished(File out, long bytes) {
        showIdle();
        if (isSelftest()) Log.i(selftestTag(), "rec name=" + out.getName() + " bytes=" + bytes);
        if (bytes < RATE / 10) { // 0.05초도 안 되면 버림
            toastFromEditor("녹음된 소리가 없습니다");
            return;
        }
        toastFromEditor(out.getName() + " — 녹음 편집에 새 트랙으로 넣습니다");
        openInEditor(Uri.fromFile(out));
    }

    @Override
    protected void onStop() {
        // 안드로이드는 화면 밖 앱의 마이크를 막으므로, 화면을 떠나면 녹음을 끝내고 편집기에 넣음
        if (recording) stopRecording();
        super.onStop();
    }

    /** 자동 점검: 2초 녹음 → 편집기에 넣기 (에뮬레이터는 마이크가 없을 수 있어 결과만 기록) */
    private void selftestRecording() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            Log.i(selftestTag(), "rec skipped no-permission");
            return;
        }
        startRecording();
        main.postDelayed(() -> { if (recording) stopRecording(); }, 2000);
    }

    private static byte[] wavHeader(long dataBytes) {
        byte[] h = new byte[44];
        long riff = 36 + dataBytes;
        int byteRate = RATE * 2;
        put(h, 0, "RIFF"); le32(h, 4, riff); put(h, 8, "WAVE"); put(h, 12, "fmt ");
        le32(h, 16, 16); le16(h, 20, 1); le16(h, 22, 1); le32(h, 24, RATE); le32(h, 28, byteRate);
        le16(h, 32, 2); le16(h, 34, 16); put(h, 36, "data"); le32(h, 40, dataBytes);
        return h;
    }

    private static void put(byte[] b, int o, String s) {
        for (int i = 0; i < s.length(); i++) b[o + i] = (byte) s.charAt(i);
    }

    private static void le16(byte[] b, int o, int v) {
        b[o] = (byte) v; b[o + 1] = (byte) (v >> 8);
    }

    private static void le32(byte[] b, int o, long v) {
        b[o] = (byte) v; b[o + 1] = (byte) (v >> 8); b[o + 2] = (byte) (v >> 16); b[o + 3] = (byte) (v >> 24);
    }

    /** 앱 캐시의 지난 녹음 중 하루 지난 것은 지움 (편집기 안에는 이미 들어가 있음) */
    private static void clean(File dir) {
        File[] fs = dir.listFiles();
        if (fs == null) return;
        long cut = System.currentTimeMillis() - 24L * 3600 * 1000;
        //noinspection ResultOfMethodCallIgnored
        for (File f : fs) if (f.lastModified() < cut) f.delete();
    }

    private static void log(String m) {
        Log.i("Work-sound", m);
    }

    @SuppressLint("ClickableViewAccessibility")
    private static void makeDraggable(FrameLayout root, TextView b) {
        int slop = ViewConfiguration.get(root.getContext()).getScaledTouchSlop();
        float[] start = new float[4];
        boolean[] dragging = {false};
        b.setOnTouchListener((v, e) -> {
            switch (e.getActionMasked()) {
                case MotionEvent.ACTION_DOWN:
                    start[0] = e.getRawX(); start[1] = e.getRawY(); start[2] = v.getX(); start[3] = v.getY();
                    dragging[0] = false;
                    return true;
                case MotionEvent.ACTION_MOVE: {
                    float dx = e.getRawX() - start[0], dy = e.getRawY() - start[1];
                    if (!dragging[0] && Math.hypot(dx, dy) > slop) dragging[0] = true;
                    if (dragging[0]) {
                        v.setX(Math.max(root.getPaddingLeft(), Math.min(root.getWidth() - root.getPaddingRight() - v.getWidth(), start[2] + dx)));
                        v.setY(Math.max(root.getPaddingTop(), Math.min(root.getHeight() - root.getPaddingBottom() - v.getHeight(), start[3] + dy)));
                    }
                    return true;
                }
                case MotionEvent.ACTION_UP:
                    if (!dragging[0]) v.performClick();
                    return true;
                default:
                    return false;
            }
        });
    }
}
