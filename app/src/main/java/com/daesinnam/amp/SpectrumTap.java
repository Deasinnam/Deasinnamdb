package com.daesinnam.amp;

import androidx.media3.common.C;
import androidx.media3.common.util.UnstableApi;
import androidx.media3.exoplayer.audio.TeeAudioProcessor;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;

/**
 * 표준 플레이어가 내보내는 소리(PCM)를 그대로 받아 스펙트럼과 파형을 만듭니다.
 * 마이크 권한 없이 내 음악의 시각화를 그립니다.
 */
@UnstableApi
final class SpectrumTap implements TeeAudioProcessor.AudioBufferSink {

    private static final int N = 1024;
    private final float[] ring = new float[N];
    private int pos = 0;
    private int channels = 2;
    private int encoding = C.ENCODING_PCM_16BIT;
    volatile int sampleRate = 44100;
    volatile long lastAt = 0;

    @Override
    public synchronized void flush(int sampleRateHz, int channelCount, int enc) {
        sampleRate = sampleRateHz > 0 ? sampleRateHz : 44100;
        channels = Math.max(1, channelCount);
        encoding = enc;
        java.util.Arrays.fill(ring, 0f);
        pos = 0;
    }

    @Override
    public synchronized void handleBuffer(ByteBuffer buffer) {
        ByteBuffer b = buffer.duplicate().order(ByteOrder.LITTLE_ENDIAN);
        if (encoding == C.ENCODING_PCM_FLOAT) {
            int frames = b.remaining() / (4 * channels);
            for (int f = 0; f < frames; f++) {
                float s = 0;
                for (int c = 0; c < channels; c++) s += b.getFloat();
                ring[pos] = s / channels;
                pos = (pos + 1) % N;
            }
        } else if (encoding == C.ENCODING_PCM_16BIT) {
            int frames = b.remaining() / (2 * channels);
            for (int f = 0; f < frames; f++) {
                float s = 0;
                for (int c = 0; c < channels; c++) s += b.getShort() / 32768f;
                ring[pos] = s / channels;
                pos = (pos + 1) % N;
            }
        } else {
            return;
        }
        lastAt = android.os.SystemClock.elapsedRealtime();
    }

    private synchronized float[] snapshot() {
        float[] out = new float[N];
        for (int i = 0; i < N; i++) out[i] = ring[(pos + i) % N];
        return out;
    }

    private boolean fresh() {
        return android.os.SystemClock.elapsedRealtime() - lastAt < 500;
    }

    /** 0~255 크기의 주파수 막대 512개(문자 코드 +32로 인코딩) — 화면의 extFft와 같은 형식 */
    String fft() {
        if (!fresh()) return "";
        float[] x = snapshot();
        double[] re = new double[N], im = new double[N];
        for (int i = 0; i < N; i++) {
            double w = 0.5 * (1 - Math.cos(2 * Math.PI * i / (N - 1))); // Hann 창
            re[i] = x[i] * w;
        }
        fftInPlace(re, im);
        char[] out = new char[N / 2];
        for (int k = 0; k < N / 2; k++) {
            double mag = Math.hypot(re[k], im[k]) / (N / 4.0);
            double db = 20 * Math.log10(mag + 1e-9);
            int v = (int) Math.round((db + 100) / 70 * 255); // 웹 AnalyserNode(-100~-30dB)와 같은 범위
            out[k] = (char) (Math.max(0, Math.min(255, v)) + 32);
        }
        out[0] = 32;
        return new String(out);
    }

    /** 파형 512개 (128이 0, 문자 코드 +32) */
    String wave() {
        if (!fresh()) return "";
        float[] x = snapshot();
        char[] out = new char[N / 2];
        for (int i = 0; i < N / 2; i++) {
            int v = Math.round(128 + x[i * 2] * 127);
            out[i] = (char) (Math.max(0, Math.min(255, v)) + 32);
        }
        return new String(out);
    }

    private static void fftInPlace(double[] re, double[] im) {
        int n = re.length;
        for (int i = 1, j = 0; i < n; i++) {
            int bit = n >> 1;
            for (; (j & bit) != 0; bit >>= 1) j ^= bit;
            j ^= bit;
            if (i < j) {
                double t = re[i]; re[i] = re[j]; re[j] = t;
                t = im[i]; im[i] = im[j]; im[j] = t;
            }
        }
        for (int len = 2; len <= n; len <<= 1) {
            double ang = -2 * Math.PI / len;
            double wr = Math.cos(ang), wi = Math.sin(ang);
            for (int i = 0; i < n; i += len) {
                double cr = 1, ci = 0;
                for (int k = 0; k < len / 2; k++) {
                    int a = i + k, b = i + k + len / 2;
                    double tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
                    re[b] = re[a] - tr; im[b] = im[a] - ti;
                    re[a] += tr; im[a] += ti;
                    double ncr = cr * wr - ci * wi;
                    ci = cr * wi + ci * wr;
                    cr = ncr;
                }
            }
        }
    }
}
