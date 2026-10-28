package com.daesinnam.amp;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Base64;

/** 내 음악의 현재 곡 정보. 화면(WebView)이 채우고, 재생 서비스가 미디어 세션으로 내보냅니다. */
final class NowPlaying {
    static volatile boolean playing = false;
    static volatile String title = "Daesinnam Amp";
    static volatile String artist = "";
    static volatile long durationMs = 0;
    static volatile long positionMs = 0;
    static volatile Bitmap art = null;
    static volatile int artVersion = 0;

    private NowPlaying() {}

    static void setArt(String dataUrl) {
        Bitmap b = null;
        try {
            if (dataUrl != null && dataUrl.startsWith("data:")) {
                byte[] bytes = Base64.decode(dataUrl.substring(dataUrl.indexOf(',') + 1), Base64.DEFAULT);
                b = BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
                if (b != null && Math.max(b.getWidth(), b.getHeight()) > 512) {
                    float sc = 512f / Math.max(b.getWidth(), b.getHeight());
                    b = Bitmap.createScaledBitmap(b, Math.round(b.getWidth() * sc), Math.round(b.getHeight() * sc), true);
                }
            }
        } catch (Throwable ignored) {}
        art = b;
        artVersion++;
    }
}
