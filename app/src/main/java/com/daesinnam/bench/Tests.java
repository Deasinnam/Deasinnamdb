package com.daesinnam.bench;

import android.app.ActivityManager;
import android.content.Context;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.RadialGradient;
import android.graphics.Shader;
import android.graphics.pdf.PdfDocument;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.location.LocationManager;
import android.media.AudioManager;
import android.media.Image;
import android.media.MediaCodec;
import android.media.MediaCodecInfo;
import android.media.MediaCodecList;
import android.media.MediaFormat;
import android.os.Build;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.SystemClock;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;
import android.text.Layout;
import android.text.StaticLayout;
import android.text.TextPaint;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.ByteBuffer;
import java.util.Arrays;
import java.util.Locale;
import java.util.Random;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

/**
 * 기기에서 직접 재는 측정들. 값만 재서 돌려주고, 점수와 판정(✓ △ ✕)은 화면 쪽(bench.js)의 기준표가 정합니다.
 * 각 항목: {"k": 항목 키, "v": 잰 값} — 잴 수 없으면 "v" 대신 "na": 이유.
 */
final class Tests {
    interface Prog { void on(String msg); }
    interface Stop { boolean is(); }

    private Tests() { }

    static JSONObject run(Context c, String id, String mode, Prog p, Stop stop) throws Exception {
        JSONObject r = new JSONObject();
        r.put("id", id);
        JSONArray items = new JSONArray();
        switch (id) {
            case "doc": doc(c, items, p); break;
            case "photo": photo(items, p); break;
            case "audio": audio(c, items, p); break;
            case "video": video(items, p, stop); break;
            case "ai": ai(c, items, p); break;
            case "sensors": sensors(c, items, p); break;
            case "memory": memory(c, items); break;
            case "sustain": sustain(c, r, "full".equals(mode) ? 600_000 : 60_000, p, stop); break;
            default: throw new IllegalArgumentException("unknown test " + id);
        }
        r.put("items", items);
        return r;
    }

    private static void put(JSONArray a, String k, double v) throws Exception {
        JSONObject o = new JSONObject(); o.put("k", k); o.put("v", Math.round(v * 100) / 100.0); a.put(o);
    }

    private static void na(JSONArray a, String k, String why) throws Exception {
        JSONObject o = new JSONObject(); o.put("k", k); o.put("na", why); a.put(o);
    }

    private static double ms(long t0) { return (System.nanoTime() - t0) / 1e6; }

    private static int threads() { return Math.max(1, Math.min(8, Runtime.getRuntime().availableProcessors())); }

    // ───────────────────────── 01 문서 · 워크 ─────────────────────────
    static void doc(Context c, JSONArray a, Prog p) throws Exception {
        p.on("{\"step\":\"PDF 50쪽 만들기\"}");
        String line = "덜누름 벤치 문서 시험 — 보고서 · 회의록 · 계약서처럼 글이 빼곡한 쪽. Quarterly report 2026, 매출 1,234,567원 (+12.5%).";
        TextPaint tp = new TextPaint(Paint.ANTI_ALIAS_FLAG);
        tp.setTextSize(10.5f);
        Paint box = new Paint(); box.setColor(0xFFDDDDDD);
        long t0 = System.nanoTime();
        PdfDocument pdf = new PdfDocument();
        for (int i = 0; i < 50; i++) {
            PdfDocument.Page pg = pdf.startPage(new PdfDocument.PageInfo.Builder(595, 842, i + 1).create());
            Canvas cv = pg.getCanvas();
            cv.drawRect(36, 36, 559, 70, box);
            for (int y = 90; y < 800; y += 13) cv.drawText(line, 36, y, tp);
            pdf.finishPage(pg);
        }
        File f = new File(c.getCacheDir(), "bench-doc.pdf");
        try (FileOutputStream o = new FileOutputStream(f)) { pdf.writeTo(o); }
        pdf.close();
        put(a, "doc.pdf", ms(t0));
        //noinspection ResultOfMethodCallIgnored
        f.delete();

        p.on("{\"step\":\"표 1만 행 정렬 · 계산\"}");
        Random rnd = new Random(7);
        final int rows = 10_000, cols = 12;
        double[][] t = new double[rows][cols];
        for (double[] r : t) for (int j = 0; j < cols; j++) r[j] = rnd.nextDouble() * 1e6;
        t0 = System.nanoTime();
        double check = 0;
        for (int pass = 0; pass < 4; pass++) {
            double[] sums = new double[rows];
            for (int i = 0; i < rows; i++) { double s = 0; for (int j = 0; j < cols; j++) s += t[i][j] * (1 + j * 0.01); sums[i] = s; }
            final int col = pass + 2;
            Integer[] idx = new Integer[rows];
            for (int i = 0; i < rows; i++) idx[i] = i;
            Arrays.sort(idx, (x, y) -> Double.compare(t[x][col], t[y][col]));
            StringBuilder sb = new StringBuilder(rows * 16);
            for (int i = 0; i < rows; i++) sb.append(idx[i]).append(',').append((long) sums[idx[i]]).append('\n');
            check += sb.length();
        }
        put(a, "doc.table", ms(t0));
        if (check < 0) put(a, "never", 0);

        p.on("{\"step\":\"100쪽 문서 줄 나누기\"}");
        StringBuilder text = new StringBuilder(220_000);
        while (text.length() < 200_000) text.append(line).append(' ').append("문단을 바꿔 가며 글자 배치를 다시 계산합니다. ");
        TextPaint lp = new TextPaint(Paint.ANTI_ALIAS_FLAG);
        lp.setTextSize(30f);
        t0 = System.nanoTime();
        int lines = 0;
        for (int w : new int[]{1000, 760, 1400}) {
            StaticLayout sl = StaticLayout.Builder.obtain(text, 0, text.length(), lp, w)
                    .setAlignment(Layout.Alignment.ALIGN_NORMAL).build();
            lines += sl.getLineCount();
        }
        put(a, "doc.layout", ms(t0));
        if (lines < 0) put(a, "never", 0);
    }

    // ───────────────────────── 02 사진 ─────────────────────────
    static void photo(JSONArray a, Prog p) throws Exception {
        p.on("{\"step\":\"2400만 화소 사진 준비\"}");
        final int W = 6000, H = 4000;
        Bitmap tmp;
        try {
            tmp = Bitmap.createBitmap(W, H, Bitmap.Config.ARGB_8888);
        } catch (OutOfMemoryError e) {
            na(a, "photo.adjust", "메모리 부족"); na(a, "photo.jpeg", "메모리 부족"); na(a, "photo.thumbs", "메모리 부족");
            return;
        }
        final Bitmap b = tmp;
        Canvas cv = new Canvas(b);
        Paint pt = new Paint(Paint.ANTI_ALIAS_FLAG);
        pt.setShader(new LinearGradient(0, 0, W, H, new int[]{0xFF1E3A5F, 0xFFE2583E, 0xFFFFC21A}, null, Shader.TileMode.CLAMP));
        cv.drawRect(0, 0, W, H, pt);
        Random rnd = new Random(3);
        for (int i = 0; i < 300; i++) {
            float x = rnd.nextFloat() * W, y = rnd.nextFloat() * H, r = 40 + rnd.nextFloat() * 400;
            pt.setShader(new RadialGradient(x, y, r, Color.argb(200, rnd.nextInt(256), rnd.nextInt(256), rnd.nextInt(256)), 0, Shader.TileMode.CLAMP));
            cv.drawCircle(x, y, r, pt);
        }

        // 실제 사진처럼 잔무늬(노이즈)를 깔아 둡니다. 매끈한 그림은 JPEG 저장이 비현실적으로 빨라서. (시간에 안 넣음)
        ExecutorService prep = Executors.newFixedThreadPool(threads());
        Future<?>[] ps = new Future<?>[H / 200];
        for (int s = 0; s < ps.length; s++) {
            final int y0 = s * 200;
            ps[s] = prep.submit(() -> {
                int[] px = new int[W * 200];
                b.getPixels(px, 0, W, 0, y0, W, 200);
                int seed = y0 * 7919 + 1;
                for (int i = 0; i < px.length; i++) {
                    seed = seed * 1103515245 + 12345;
                    int n = ((seed >>> 16) & 31) - 16, c0 = px[i];
                    px[i] = (c0 & 0xFF000000) | (clamp(((c0 >> 16) & 255) + n) << 16) | (clamp(((c0 >> 8) & 255) + n) << 8) | clamp((c0 & 255) + n);
                }
                b.setPixels(px, 0, W, 0, y0, W, 200);
            });
        }
        for (Future<?> f : ps) f.get();
        prep.shutdown();

        p.on("{\"step\":\"2400만 화소 노출 · 대비 · 채도 보정\"}");
        final int[] lut = new int[256];
        for (int i = 0; i < 256; i++) {
            double v = i / 255.0;
            v = Math.min(1, v * 1.15);                         // 노출 +0.2
            v = 0.5 + (v - 0.5) * 1.12;                        // 대비
            v = Math.pow(Math.max(0, Math.min(1, v)), 0.95);   // 감마
            lut[i] = (int) Math.round(v * 255);
        }
        final int strip = 100;
        ExecutorService ex = Executors.newFixedThreadPool(threads());
        long t0 = System.nanoTime();
        Future<?>[] fs = new Future<?>[(H + strip - 1) / strip];
        for (int s = 0; s < fs.length; s++) {
            final int y0 = s * strip;
            fs[s] = ex.submit(() -> {
                int h = Math.min(strip, H - y0);
                int[] px = new int[W * h];
                b.getPixels(px, 0, W, 0, y0, W, h);
                for (int i = 0; i < px.length; i++) {
                    int c0 = px[i];
                    int r = lut[(c0 >> 16) & 255], g = lut[(c0 >> 8) & 255], bl = lut[c0 & 255];
                    int l = (r * 77 + g * 150 + bl * 29) >> 8;           // 채도 +20%
                    r = clamp(l + ((r - l) * 6 >> 2) - ((r - l) >> 1));
                    g = clamp(l + ((g - l) * 6 >> 2) - ((g - l) >> 1));
                    bl = clamp(l + ((bl - l) * 6 >> 2) - ((bl - l) >> 1));
                    px[i] = (c0 & 0xFF000000) | (r << 16) | (g << 8) | bl;
                }
                b.setPixels(px, 0, W, 0, y0, W, h);
            });
        }
        for (Future<?> f : fs) f.get();
        ex.shutdown();
        put(a, "photo.adjust", ms(t0));

        p.on("{\"step\":\"2400만 화소 JPEG 저장\"}");
        ByteArrayOutputStream bo = new ByteArrayOutputStream(12 << 20);
        t0 = System.nanoTime();
        b.compress(Bitmap.CompressFormat.JPEG, 90, bo);
        put(a, "photo.jpeg", ms(t0));

        p.on("{\"step\":\"보관함 미리보기 40장 만들기\"}");
        t0 = System.nanoTime();
        for (int i = 0; i < 40; i++) {
            Bitmap s = Bitmap.createScaledBitmap(b, 480 + (i % 3), 320, true);
            s.recycle();
        }
        put(a, "photo.thumbs", ms(t0) / 40.0);
        b.recycle();
    }

    private static int clamp(int v) { return v < 0 ? 0 : (v > 255 ? 255 : v); }

    // ───────────────────────── 03 오디오 ─────────────────────────
    static void audio(Context c, JSONArray a, Prog p) throws Exception {
        p.on("{\"step\":\"실시간으로 섞을 수 있는 트랙 수\"}");
        final int frames = 480;                 // 48kHz에서 10ms
        final int tracks = 16;
        float[][] in = new float[tracks][frames * 2];
        Random rnd = new Random(5);
        for (float[] t : in) for (int i = 0; i < t.length; i++) t[i] = rnd.nextFloat() * 2 - 1;
        float[][] z = new float[tracks][8];
        float[] mix = new float[frames * 2];
        // 트랙마다: 볼륨 → 저음 · 고음 EQ(바이쿼드 2단) → 압축기 → 좌우 위치 → 합치기
        final float b0 = 0.98f, b1 = -1.9f, b2 = 0.93f, a1 = -1.9f, a2 = 0.91f;
        int rounds = 0;
        long t0 = System.nanoTime(), budget = 1_500_000_000L;
        while (System.nanoTime() - t0 < budget) {
            Arrays.fill(mix, 0);
            for (int t = 0; t < tracks; t++) {
                float[] x = in[t], s = z[t];
                float gain = 0.6f + t * 0.01f, pan = (t % 5) * 0.2f, env = s[6];
                for (int i = 0; i < frames * 2; i += 2) {
                    for (int ch = 0; ch < 2; ch++) {
                        float v = x[i + ch] * gain;
                        int o = ch * 2;
                        float y = b0 * v + b1 * s[o] + b2 * s[o + 1] - a1 * s[4] - a2 * s[5];
                        s[o + 1] = s[o]; s[o] = v; s[5] = s[4]; s[4] = y;
                        float lv = Math.abs(y);
                        env = lv > env ? env + (lv - env) * 0.3f : env + (lv - env) * 0.002f;
                        float g = env > 0.5f ? 0.5f / env : 1f;
                        mix[i + ch] += y * g * (ch == 0 ? 1 - pan : pan);
                    }
                }
                s[6] = env;
            }
            rounds++;
        }
        double perTrackNs = (System.nanoTime() - t0) / (double) (rounds * tracks);
        double cap = Math.min(256, Math.floor(0.5 * 10_000_000 / perTrackNs));   // 10ms 중 절반만 써야 끊김 없음
        put(a, "audio.tracks", cap);
        if (mix[0] == 12345f) put(a, "never", 0);

        p.on("{\"step\":\"녹음 · 재생 지연\"}");
        AudioManager am = c.getSystemService(AudioManager.class);
        String fpb = am.getProperty(AudioManager.PROPERTY_OUTPUT_FRAMES_PER_BUFFER);
        String sr = am.getProperty(AudioManager.PROPERTY_OUTPUT_SAMPLE_RATE);
        PackageManager pm = c.getPackageManager();
        boolean low = pm.hasSystemFeature(PackageManager.FEATURE_AUDIO_LOW_LATENCY);
        boolean pro = pm.hasSystemFeature(PackageManager.FEATURE_AUDIO_PRO);
        if (fpb != null && sr != null) {
            double bufMs = Integer.parseInt(fpb) * 1000.0 / Integer.parseInt(sr);
            // 버퍼 두 개(출력) + 저지연 미지원이면 시스템 믹서 몫으로 더 큼
            double est = bufMs * 2 + (pro ? 0 : low ? 4 : 20);
            put(a, "audio.latency", est);
        } else na(a, "audio.latency", "정보 없음");
    }

    // ───────────────────────── 05 영상 ─────────────────────────
    static void video(JSONArray a, Prog p, Stop stop) throws Exception {
        p.on("{\"step\":\"1080p 영상 내보내기 속도\"}");
        double f1 = encodeFps(1920, 1080, 90, stop);
        if (f1 > 0) put(a, "video.enc1080", f1); else na(a, "video.enc1080", "인코더 없음");
        p.on("{\"step\":\"4K 영상 내보내기 속도\"}");
        double f4 = encodeFps(3840, 2160, 40, stop);
        if (f4 > 0) put(a, "video.enc4k", f4); else na(a, "video.enc4k", "4K 인코딩 안 됨");
        p.on("{\"step\":\"4K 영상 재생 · 미리보기 지원\"}");
        put(a, "video.dec4k", decodeSupport(3840, 2160));
    }

    /** 이 크기 · 프레임을 하드웨어 디코더가 낼 수 있다고 알리는 최고 fps (60 / 30 / 0) */
    static double decodeSupport(int w, int h) {
        MediaCodecList l = new MediaCodecList(MediaCodecList.REGULAR_CODECS);
        int best = 0;
        for (MediaCodecInfo info : l.getCodecInfos()) {
            if (info.isEncoder()) continue;
            for (String type : info.getSupportedTypes()) {
                if (!type.equalsIgnoreCase(MediaFormat.MIMETYPE_VIDEO_AVC) && !type.equalsIgnoreCase(MediaFormat.MIMETYPE_VIDEO_HEVC)) continue;
                try {
                    MediaCodecInfo.VideoCapabilities vc = info.getCapabilitiesForType(type).getVideoCapabilities();
                    if (vc == null) continue;
                    if (vc.areSizeAndRateSupported(w, h, 60)) best = Math.max(best, 60);
                    else if (vc.areSizeAndRateSupported(w, h, 30)) best = Math.max(best, 30);
                } catch (Exception ignored) { }
            }
        }
        return best;
    }

    /** H.264로 frames장을 인코딩하는 데 든 시간으로 초당 프레임을 잽니다 (화면 그리기 → 인코더 → 출력까지 전부) */
    static double encodeFps(int w, int h, int frames, Stop stop) {
        MediaFormat fmt = MediaFormat.createVideoFormat(MediaFormat.MIMETYPE_VIDEO_AVC, w, h);
        fmt.setInteger(MediaFormat.KEY_COLOR_FORMAT, MediaCodecInfo.CodecCapabilities.COLOR_FormatYUV420Flexible);
        fmt.setInteger(MediaFormat.KEY_BIT_RATE, Math.min(80_000_000, w * h * 5));
        fmt.setInteger(MediaFormat.KEY_FRAME_RATE, 30);
        fmt.setInteger(MediaFormat.KEY_I_FRAME_INTERVAL, 1);
        String name = new MediaCodecList(MediaCodecList.REGULAR_CODECS).findEncoderForFormat(fmt);
        if (name == null) return 0;
        MediaCodec codec = null;
        try {
            codec = MediaCodec.createByCodecName(name);
            codec.configure(fmt, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE);
            codec.start();
            byte[] row = new byte[w];
            byte[] uvRow = new byte[w];
            Arrays.fill(uvRow, (byte) 128);
            MediaCodec.BufferInfo info = new MediaCodec.BufferInfo();
            int sent = 0, got = 0;
            boolean eosSent = false, eos = false;
            long t0 = SystemClock.elapsedRealtime(), deadline = t0 + 25_000;
            while (!eos) {
                if (stop.is() || SystemClock.elapsedRealtime() > deadline) return got > 0 ? got * 1000.0 / (SystemClock.elapsedRealtime() - t0) : 0;
                if (!eosSent) {
                    int in = codec.dequeueInputBuffer(5_000);
                    if (in >= 0) {
                        if (sent >= frames) {
                            codec.queueInputBuffer(in, 0, 0, sent * 33_333L, MediaCodec.BUFFER_FLAG_END_OF_STREAM);
                            eosSent = true;
                        } else {
                            Image img = codec.getInputImage(in);
                            if (img == null) return 0;
                            fill(img, sent, row, uvRow);
                            codec.queueInputBuffer(in, 0, w * h * 3 / 2, sent * 33_333L, 0);
                            sent++;
                        }
                    }
                }
                int out = codec.dequeueOutputBuffer(info, 5_000);
                if (out >= 0) {
                    if (info.size > 0 && (info.flags & MediaCodec.BUFFER_FLAG_CODEC_CONFIG) == 0) got++;
                    if ((info.flags & MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0) eos = true;
                    codec.releaseOutputBuffer(out, false);
                }
            }
            long el = SystemClock.elapsedRealtime() - t0;
            return got * 1000.0 / Math.max(1, el);
        } catch (Exception e) {
            android.util.Log.w(MainActivity.TAG, "encode " + w + "x" + h, e);
            return 0;
        } finally {
            if (codec != null) {
                try { codec.stop(); } catch (Exception ignored) { }
                codec.release();
            }
        }
    }

    /** 움직이는 줄무늬 그림을 YUV 입력에 채웁니다 (Y: 매 프레임 바뀜, U · V: 회색) */
    private static void fill(Image img, int frame, byte[] row, byte[] uvRow) {
        Image.Plane[] pl = img.getPlanes();
        int w = img.getWidth(), h = img.getHeight();
        ByteBuffer y = pl[0].getBuffer();
        int rs = pl[0].getRowStride();
        for (int r = 0; r < h; r++) {
            int shift = (frame * 6 + r / 8) & 255;
            for (int x = 0; x < w; x += 16) {
                byte v = (byte) ((x / 4 + shift) & 255);
                int e = Math.min(w, x + 16);
                for (int i = x; i < e; i++) row[i] = v;
            }
            y.position(r * rs);
            y.put(row, 0, w);
        }
        for (int p = 1; p <= 2; p++) {
            ByteBuffer b = pl[p].getBuffer();
            int prs = pl[p].getRowStride(), ps = pl[p].getPixelStride();
            for (int r = 0; r < h / 2; r++) {
                if (ps == 1) {
                    b.position(r * prs);
                    b.put(uvRow, 0, w / 2);
                } else {
                    int base = r * prs;
                    for (int x = 0; x < w / 2; x++) {
                        int idx = base + x * ps;
                        if (idx < b.limit()) b.put(idx, (byte) 128);
                    }
                }
            }
        }
    }

    // ───────────────────────── 08 AI 보이스 자비스 (기본 측정) ─────────────────────────
    static void ai(Context c, JSONArray a, Prog p) throws Exception {
        p.on("{\"step\":\"AI 연산 속도 (행렬 곱)\"}");
        put(a, "ai.gflops", gflops(2_000));

        p.on("{\"step\":\"기기 안 음성 인식\"}");
        int speech = 0;
        if (SpeechRecognizer.isRecognitionAvailable(c)) speech = 1;
        if (Build.VERSION.SDK_INT >= 31) {
            try { if (SpeechRecognizer.isOnDeviceRecognitionAvailable(c)) speech = 2; } catch (Throwable ignored) { }
        }
        put(a, "ai.speech", speech);

        p.on("{\"step\":\"한국어 음성 합성 준비\"}");
        CountDownLatch done = new CountDownLatch(1);
        AtomicInteger status = new AtomicInteger(-99);
        AtomicReference<TextToSpeech> ref = new AtomicReference<>();
        long t0 = System.nanoTime();
        // 음성 합성 엔진은 화면 스레드에서 만들어야 연결 알림을 제대로 받습니다
        new Handler(android.os.Looper.getMainLooper()).post(() ->
                ref.set(new TextToSpeech(c.getApplicationContext(), st -> { status.set(st); done.countDown(); })));
        boolean ok = done.await(8, TimeUnit.SECONDS);
        double initMs = ms(t0);
        TextToSpeech tts = ref.get();
        if (ok && tts != null && status.get() == TextToSpeech.SUCCESS) {
            int lang = tts.setLanguage(Locale.KOREAN);
            if (lang >= TextToSpeech.LANG_AVAILABLE) put(a, "ai.tts", initMs);
            else na(a, "ai.tts", "한국어 음성 없음");
        } else na(a, "ai.tts", "음성 합성 엔진 없음");
        if (tts != null) new Handler(android.os.Looper.getMainLooper()).post(() -> { try { tts.shutdown(); } catch (Exception ignored) { } });

        ActivityManager am = c.getSystemService(ActivityManager.class);
        ActivityManager.MemoryInfo mi = new ActivityManager.MemoryInfo();
        am.getMemoryInfo(mi);
        put(a, "ai.ram", mi.totalMem / 1073741824.0);
    }

    /** 여러 코어로 384×384 행렬 곱을 durMs 동안 되풀이한 속도 (초당 십억 번 계산) */
    static double gflops(long durMs) throws Exception {
        final int n = 384, th = threads();
        final float[][] A = new float[th][n * n], B = new float[th][n * n], C = new float[th][n * n];
        Random rnd = new Random(11);
        for (int t = 0; t < th; t++) for (int i = 0; i < n * n; i++) { A[t][i] = rnd.nextFloat(); B[t][i] = rnd.nextFloat(); }
        ExecutorService ex = Executors.newFixedThreadPool(th);
        final long end = System.nanoTime() + durMs * 1_000_000L;
        AtomicInteger reps = new AtomicInteger();
        long t0 = System.nanoTime();
        Future<?>[] fs = new Future<?>[th];
        for (int t = 0; t < th; t++) {
            final int k = t;
            fs[t] = ex.submit(() -> {
                float[] a = A[k], b = B[k], c = C[k];
                while (System.nanoTime() < end) {
                    Arrays.fill(c, 0);
                    for (int i = 0; i < n; i++) {
                        int ai = i * n;
                        for (int kk = 0; kk < n; kk++) {
                            float av = a[ai + kk];
                            int bk = kk * n;
                            for (int j = 0; j < n; j++) c[ai + j] += av * b[bk + j];
                        }
                    }
                    reps.incrementAndGet();
                }
            });
        }
        for (Future<?> f : fs) f.get();
        ex.shutdown();
        double sec = (System.nanoTime() - t0) / 1e9;
        return 2.0 * n * n * n * reps.get() / sec / 1e9;
    }

    // ───────────────────────── 09 스피드미터 (센서 · GPS) ─────────────────────────
    static void sensors(Context c, JSONArray a, Prog p) throws Exception {
        p.on("{\"step\":\"움직임 센서 속도\"}");
        SensorManager sm = c.getSystemService(SensorManager.class);
        Sensor acc = sm.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
        Sensor gyr = sm.getDefaultSensor(Sensor.TYPE_GYROSCOPE);
        sensorItem(a, sm, acc, "speed.accel", "가속도 센서 없음");
        sensorItem(a, sm, gyr, "speed.gyro", "자이로 센서 없음");
        // GPS: 위치 권한을 쓰지 않고, 기기에 GPS(위성 수신기)가 있는지만 봅니다
        boolean gps = c.getPackageManager().hasSystemFeature(PackageManager.FEATURE_LOCATION_GPS);
        int bands = 0;
        if (gps && Build.VERSION.SDK_INT >= 28) {
            LocationManager lm = c.getSystemService(LocationManager.class);
            try { if (lm != null && lm.getGnssHardwareModelName() != null) bands = 1; } catch (Throwable ignored) { }
        }
        put(a, "speed.gps", gps ? 1 : 0);
        if (bands < 0) put(a, "never", 0);
    }

    private static void sensorItem(JSONArray a, SensorManager sm, Sensor s, String k, String none) throws Exception {
        if (s == null) { na(a, k, none); return; }
        try { put(a, k, rate(sm, s)); } catch (Exception e) { na(a, k, "읽기 실패"); }
    }

    private static double rate(SensorManager sm, Sensor s) throws Exception {
        HandlerThread ht = new HandlerThread("bench-sensor");
        ht.start();
        AtomicInteger n = new AtomicInteger();
        long[] first = {0}, last = {0};
        SensorEventListener l = new SensorEventListener() {
            @Override public void onSensorChanged(SensorEvent e) {
                if (first[0] == 0) first[0] = e.timestamp;
                last[0] = e.timestamp;
                n.incrementAndGet();
            }
            @Override public void onAccuracyChanged(Sensor sensor, int accuracy) { }
        };
        sm.registerListener(l, s, SensorManager.SENSOR_DELAY_FASTEST, new Handler(ht.getLooper()));
        Thread.sleep(1500);
        sm.unregisterListener(l);
        ht.quitSafely();
        if (n.get() < 2 || last[0] <= first[0]) return 0;
        return (n.get() - 1) / ((last[0] - first[0]) / 1e9);
    }

    // ───────────────────────── 06 브라우저 (메모리) ─────────────────────────
    static void memory(Context c, JSONArray a) throws Exception {
        ActivityManager am = c.getSystemService(ActivityManager.class);
        ActivityManager.MemoryInfo mi = new ActivityManager.MemoryInfo();
        am.getMemoryInfo(mi);
        // 지금 남은 메모리로 무거운 탭(약 180MB)을 몇 개 더 열어 둘 수 있는지 어림합니다 (추정)
        double free = (mi.availMem - mi.threshold) / 1048576.0;
        put(a, "web.tabs", Math.max(0, Math.min(60, Math.floor(free / 180))));
    }

    // ───────────────────────── 연속 부하 (발열 · 배터리) ─────────────────────────
    static void sustain(Context c, JSONObject r, long durMs, Prog p, Stop stop) throws Exception {
        JSONObject b0 = DeviceInfo.battery(c);
        double first = -1, lastV = 0, maxT = b0.optDouble("tempC", 0);
        JSONArray series = new JSONArray();
        long t0 = SystemClock.elapsedRealtime();
        while (SystemClock.elapsedRealtime() - t0 < durMs && !stop.is()) {
            double g = gflops(5_000);
            if (first < 0) first = g;
            lastV = g;
            JSONObject b = DeviceInfo.battery(c);
            maxT = Math.max(maxT, b.optDouble("tempC", 0));
            series.put(Math.round(g * 10) / 10.0);
            long left = durMs - (SystemClock.elapsedRealtime() - t0);
            JSONObject msg = new JSONObject();
            msg.put("step", "연속 부하 · 남은 시간 " + Math.max(0, left / 60000) + "분 " + Math.max(0, (left / 1000) % 60) + "초");
            msg.put("perf", Math.round(g / first * 100));
            msg.put("tempC", b.optDouble("tempC", 0));
            p.on(msg.toString());
        }
        JSONObject b1 = DeviceInfo.battery(c);
        r.put("keep", first > 0 ? Math.round(lastV / first * 100) : 0);
        r.put("maxTempC", maxT);
        r.put("startTempC", b0.optDouble("tempC", 0));
        r.put("batteryDrop", b0.optInt("pct", 0) - b1.optInt("pct", 0));
        r.put("charging", b1.optBoolean("charging"));
        r.put("series", series);
        r.put("minutes", Math.round((SystemClock.elapsedRealtime() - t0) / 6000.0) / 10.0);
        r.put("stopped", stop.is());
    }
}
