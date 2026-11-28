package com.daesinnam.note;

import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.pdf.PdfRenderer;
import android.os.ParcelFileDescriptor;
import android.util.Log;

import java.io.Closeable;
import java.io.File;

/** 노트의 원본 PDF 쪽을 그림으로 (PdfRenderer는 한 번에 한 쪽만 열 수 있어 모두 synchronized) */
final class Pdf implements Closeable {
    private ParcelFileDescriptor fd;
    private PdfRenderer r;

    Pdf(File f) {
        try {
            fd = ParcelFileDescriptor.open(f, ParcelFileDescriptor.MODE_READ_ONLY);
            r = new PdfRenderer(fd);
        } catch (Exception e) {
            Log.w("Note", "PDF 열기 실패", e);
            close();
        }
    }

    boolean ok() { return r != null; }

    /** 쪽 그림 (너비 widthPx, 흰 바탕). 실패하면 null */
    synchronized Bitmap render(int index, int widthPx) {
        if (r == null || index < 0 || index >= r.getPageCount()) return null;
        try (PdfRenderer.Page p = r.openPage(index)) {
            int w = Math.max(16, Math.min(widthPx, 4096));
            int h = Math.max(16, Math.round(w * (float) p.getHeight() / Math.max(1, p.getWidth())));
            if ((long) w * h > 24_000_000L) { // 너무 큰 그림은 줄임 (메모리)
                float k = (float) Math.sqrt(24_000_000.0 / ((long) w * h));
                w = Math.round(w * k); h = Math.round(h * k);
            }
            Bitmap b = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
            b.eraseColor(Color.WHITE);
            p.render(b, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY);
            return b;
        } catch (Throwable t) {
            Log.w("Note", "PDF 쪽 그리기 실패 " + index, t);
            return null;
        }
    }

    @Override
    public synchronized void close() {
        try { if (r != null) r.close(); } catch (Exception ignored) { }
        try { if (fd != null) fd.close(); } catch (Exception ignored) { }
        r = null; fd = null;
    }
}
