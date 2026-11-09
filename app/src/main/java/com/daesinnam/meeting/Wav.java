package com.daesinnam.meeting;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.RandomAccessFile;

/** 16kHz·모노·16비트 PCM WAV 파일 쓰기와 일부 구간 잘라내기 */
final class Wav {
    static final int RATE = 16000;
    static final int BYTES_PER_SEC = RATE * 2;

    private Wav() {}

    static byte[] header(long dataBytes) {
        long riff = 36 + dataBytes;
        byte[] h = new byte[44];
        put(h, 0, "RIFF");
        le32(h, 4, riff);
        put(h, 8, "WAVE");
        put(h, 12, "fmt ");
        le32(h, 16, 16);
        le16(h, 20, 1);             // PCM
        le16(h, 22, 1);             // 모노
        le32(h, 24, RATE);
        le32(h, 28, BYTES_PER_SEC);
        le16(h, 32, 2);
        le16(h, 34, 16);
        put(h, 36, "data");
        le32(h, 40, dataBytes);
        return h;
    }

    /** 녹음이 끝난 파일의 머리(크기 정보)를 실제 길이로 고칩니다 */
    static void fixHeader(File f) throws IOException {
        try (RandomAccessFile r = new RandomAccessFile(f, "rw")) {
            long data = Math.max(0, r.length() - 44);
            r.seek(0);
            r.write(header(data));
        }
    }

    static double seconds(File f) {
        return Math.max(0, f.length() - 44) / (double) BYTES_PER_SEC;
    }

    /** [start, end) 초 구간을 WAV 바이트로 */
    static byte[] clip(File f, double start, double end) throws IOException {
        long from = 44 + (long) (Math.max(0, start) * RATE) * 2;
        long to = Math.min(f.length(), 44 + (long) (end * RATE) * 2);
        if (to <= from) return null;
        int len = (int) (to - from);
        byte[] pcm = new byte[len];
        try (RandomAccessFile r = new RandomAccessFile(f, "r")) {
            r.seek(from);
            r.readFully(pcm);
        }
        ByteArrayOutputStream out = new ByteArrayOutputStream(44 + len);
        out.write(header(len), 0, 44);
        out.write(pcm, 0, len);
        return out.toByteArray();
    }

    private static void put(byte[] b, int at, String s) {
        for (int i = 0; i < 4; i++) b[at + i] = (byte) s.charAt(i);
    }

    private static void le16(byte[] b, int at, int v) {
        b[at] = (byte) v;
        b[at + 1] = (byte) (v >> 8);
    }

    private static void le32(byte[] b, int at, long v) {
        for (int i = 0; i < 4; i++) b[at + i] = (byte) (v >> (8 * i));
    }
}
