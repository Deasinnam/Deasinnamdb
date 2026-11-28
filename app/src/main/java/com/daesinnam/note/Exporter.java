package com.daesinnam.note;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.pdf.PdfDocument;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

/** 그림(PNG) · PDF로 내보내기, 목록 그림 만들기 */
final class Exporter {
    private Exporter() { }

    /** 한 쪽을 PNG로 (너비 2000픽셀) */
    static void png(Model.Page p, Pdf pdf, OutputStream out) throws Exception {
        int w = 2000;
        Bitmap bg = p.pdf >= 0 && pdf != null ? pdf.render(p.pdf, w) : null;
        Bitmap b = Ink.render(p, bg, w);
        b.compress(Bitmap.CompressFormat.PNG, 100, out);
        b.recycle();
        if (bg != null) bg.recycle();
    }

    /**
     * 노트 전체를 PDF로. 필기는 선(벡터)으로 들어가 확대해도 깨끗합니다.
     * PDF에서 만든 노트의 원본 쪽은 고해상도 그림으로 넣습니다.
     */
    static void pdf(Model.Note n, Pdf pdf, OutputStream out) throws Exception {
        PdfDocument doc = new PdfDocument();
        try {
            int no = 1;
            for (Model.Page p : n.pages) {
                int pw = Math.max(72, Math.round(p.ptW)), ph = Math.max(72, Math.round(p.ptH));
                if (p.pdf < 0) ph = Math.round(pw * p.h / Model.PAGE_W);
                PdfDocument.Page pg = doc.startPage(new PdfDocument.PageInfo.Builder(pw, ph, no++).create());
                Canvas c = pg.getCanvas();
                c.drawColor(Ink.PAPER);
                if (p.pdf >= 0 && pdf != null) {
                    Bitmap bg = pdf.render(p.pdf, Math.min(2400, Math.round(pw * 3f)));
                    if (bg != null) {
                        c.drawBitmap(bg, null, new RectF(0, 0, pw, ph), new Paint(Paint.FILTER_BITMAP_FLAG));
                        bg.recycle();
                    }
                }
                float k = pw / Model.PAGE_W;
                c.save();
                c.scale(k, k);
                Ink.paper(c, p, false);
                Ink.drawStrokes(c, p.strokes, null);
                c.restore();
                doc.finishPage(pg);
            }
            doc.writeTo(out);
        } finally {
            doc.close();
        }
    }

    /** 목록에 보일 첫 쪽 그림 */
    static void thumb(Model.Note n, Pdf pdf, File f) {
        try {
            Model.Page p = n.pages.get(0);
            Bitmap bg = p.pdf >= 0 && pdf != null ? pdf.render(p.pdf, 420) : null;
            Bitmap b = Ink.render(p, bg, 420);
            try (FileOutputStream o = new FileOutputStream(f)) { b.compress(Bitmap.CompressFormat.PNG, 90, o); }
            b.recycle();
            if (bg != null) bg.recycle();
        } catch (Throwable ignored) { }
    }
}
