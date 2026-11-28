package com.daesinnam.note;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.pdf.PdfDocument;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import java.io.File;
import java.io.FileOutputStream;

/**
 * 시험용 빌드에서만 도는 자동 점검 (에뮬레이터). 결과는 로그 NOTE_SELFTEST에 PASS/FAIL로 남깁니다.
 * 바깥 스크립트가 adb로 실제 스타일러스(펜) 획과 손가락 끌기를 보냅니다.
 */
final class SelfTest {
    private static final String T = "NOTE_SELFTEST";
    private final NoteActivity a;
    private final Handler h = new Handler(Looper.getMainLooper());
    private long started;

    SelfTest(NoteActivity a) { this.a = a; }

    private static void log(boolean ok, String what) { Log.i(T, (ok ? "PASS " : "FAIL ") + what); }

    void run() {
        started = System.currentTimeMillis();
        Log.i(T, "READY-PEN");
        waitPen();
    }

    /** 1. 스크립트가 보낸 펜 획을 기다림 */
    private void waitPen() {
        InkView ink = a.ink();
        if (ink.strokeCount() > 0) {
            Model.Stroke s = ink.cur().strokes.get(0);
            float pmin = 1, pmax = 0;
            for (int i = 0; i < s.n; i++) { pmin = Math.min(pmin, s.p(i)); pmax = Math.max(pmax, s.p(i)); }
            log(s.n >= 5, "stylus stroke drawn points=" + s.n + " tool=" + s.tool + " pressure=" + pmin + ".." + pmax);
            log(ink.penSeen, "pen detected -> penOnly=" + ink.penOnly);
            if (ink.penOnly) {
                Log.i(T, "READY-FINGER");
                h.postDelayed(this::afterFinger, 5000);
            } else {
                Log.i(T, "INFO stylus came as finger on this emulator; finger test skipped");
                h.post(this::rest);
            }
            return;
        }
        if (System.currentTimeMillis() - started > 25000) { log(false, "no stylus stroke arrived"); Log.i(T, "DONE"); return; }
        h.postDelayed(this::waitPen, 300);
    }

    /** 2. 펜을 쓴 뒤 손가락으로 끌면 쓰지 않아야 함 (손바닥 · 손가락 막기) */
    private void afterFinger() {
        log(a.ink().strokeCount() == 1, "finger drag does not draw when pen-only (strokes=" + a.ink().strokeCount() + ")");
        rest();
    }

    private void rest() {
        InkView ink = a.ink();
        try {
            // 3. 지우개 · 되돌리기 · 다시 하기
            Model.Stroke s = ink.cur().strokes.get(0);
            float[] at = ink.toScreen(s.x(s.n / 2), s.y(s.n / 2));
            int removed = ink.eraseOnceAt(at[0], at[1]);
            log(removed == 1 && ink.strokeCount() == 0, "eraser removes stroke");
            ink.undo();
            log(ink.strokeCount() == 1, "undo brings stroke back");
            ink.redo();
            log(ink.strokeCount() == 0, "redo erases again");
            ink.undo();

            // 4. 쪽 추가 · 저장 · 다시 읽기
            a.addPageForTest();
            log(a.note().pages.size() == 2 && ink.page == 1, "add page -> 2 pages, on page 2");
            ink.setPage(0);
            a.saveBlocking();
            Model.Note back = Store.load(a, a.note().id);
            log(back.pages.size() == 2 && back.pages.get(0).strokes.size() == 1 && back.pages.get(0).strokes.get(0).n == s.n,
                    "saved and reloaded (pages=" + back.pages.size() + ", strokes=" + back.pages.get(0).strokes.size() + ")");

            // 5. 내보내기
            File png = new File(a.getCacheDir(), "t.png"), pdf = new File(a.getCacheDir(), "t.pdf");
            try (FileOutputStream o = new FileOutputStream(png)) { Exporter.png(a.note().pages.get(0), null, o); }
            try (FileOutputStream o = new FileOutputStream(pdf)) { Exporter.pdf(a.note().snapshot(), null, o); }
            Bitmap b = android.graphics.BitmapFactory.decodeFile(png.getPath());
            boolean inkThere = false;
            if (b != null) {
                float sx = b.getWidth() / Model.PAGE_W;
                for (int i = 0; i < s.n && !inkThere; i++) {
                    int x = Math.round(s.x(i) * sx), y = Math.round(s.y(i) * sx);
                    if (x >= 0 && y >= 0 && x < b.getWidth() && y < b.getHeight() && (b.getPixel(x, y) & 0xFFFFFF) < 0x404040) inkThere = true;
                }
            }
            log(b != null && b.getWidth() == 2000 && inkThere, "PNG export has the ink (" + png.length() + " bytes)");
            log(pdf.length() > 800 && head(pdf).startsWith("%PDF"), "PDF export (" + pdf.length() + " bytes)");

            // 6. PDF 가져오기: 2쪽짜리 PDF를 만들어 노트로
            File src = new File(a.getCacheDir(), "src.pdf");
            PdfDocument d = new PdfDocument();
            Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
            p.setTextSize(28);
            for (int i = 1; i <= 2; i++) {
                PdfDocument.Page pg = d.startPage(new PdfDocument.PageInfo.Builder(612, 792, i).create());
                Canvas c = pg.getCanvas();
                c.drawText("Deolnureum Note test page " + i, 60, 100, p);
                c.drawRect(60, 140, 552, 160, p);
                d.finishPage(pg);
            }
            try (FileOutputStream o = new FileOutputStream(src)) { d.writeTo(o); }
            d.close();
            Model.Note imp = Store.importPdf(a, Uri.fromFile(src), "test.pdf");
            Pdf r = new Pdf(Store.pdf(a, imp.id));
            Bitmap pb = r.render(0, 600);
            boolean dark = false;
            if (pb != null) for (int x = 60; x < 540 && !dark; x += 10) if ((pb.getPixel(x, Math.round(150 * 600f / 612)) & 0xFFFFFF) < 0x404040) dark = true;
            r.close();
            log(imp.pages.size() == 2 && imp.title.equals("test") && Math.abs(imp.pages.get(0).h - 1000f * 792 / 612) < 1 && dark,
                    "PDF import 2 pages, renders (h=" + imp.pages.get(0).h + ")");
            Store.delete(a, imp.id);
        } catch (Throwable t) {
            Log.e(T, "FAIL exception " + t, t);
        }
        Log.i(T, "DONE");
    }

    private static String head(File f) {
        try (java.io.FileInputStream i = new java.io.FileInputStream(f)) {
            byte[] b = new byte[4];
            int n = i.read(b);
            return new String(b, 0, Math.max(0, n));
        } catch (Exception e) { return ""; }
    }
}
