package com.daesinnam.note;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RectF;

/**
 * 획 모양 만들기 · 종이 무늬 · 쪽 그리기 (화면과 내보내기가 같이 씀). 모든 좌표는 쪽 단위(너비 1000).
 */
final class Ink {
    private Ink() { }

    static final int PAPER = 0xFFFFFFFF;
    static final int LINE = 0xFFCBD5E3;   // 줄 · 모눈
    static final int MARGIN = 0xFFF2A3A3; // 줄 노트 왼쪽 여백 줄
    static final int DOTC = 0xFFB4BECC;

    /** 화면(주 스레드)과 내보내기(다른 스레드)가 같은 붓을 나눠 쓰지 않게 스레드마다 따로 */
    private static final ThreadLocal<Paint[]> PAINTS = ThreadLocal.withInitial(() -> {
        Paint fill = new Paint(Paint.ANTI_ALIAS_FLAG), marker = new Paint(Paint.ANTI_ALIAS_FLAG), line = new Paint(Paint.ANTI_ALIAS_FLAG);
        fill.setStyle(Paint.Style.FILL);
        marker.setStyle(Paint.Style.STROKE);
        marker.setStrokeCap(Paint.Cap.ROUND);
        marker.setStrokeJoin(Paint.Join.ROUND);
        return new Paint[]{fill, marker, line};
    });

    /** 펜 한 점의 반지름 (필압 0~1 → 굵기의 35~100%) */
    static float radius(Model.Stroke s, int i) {
        float p = s.p(i);
        if (p <= 0) p = 0.6f;
        return s.width * 0.5f * (0.35f + 0.65f * Math.min(1f, p));
    }

    /**
     * 펜 획: 필압에 따라 굵기가 바뀌는 채워진 모양. 점마다 좌우로 반지름만큼 벌린 테두리 + 양 끝 둥근 마개.
     * 형광펜 획: 일정한 굵기의 선(반투명).
     */
    static Path build(Model.Stroke s) {
        Path path = new Path();
        int n = s.n;
        if (n == 0) return path;
        if (s.tool == Model.MARKER) {
            path.moveTo(s.x(0), s.y(0));
            if (n == 1) { path.lineTo(s.x(0) + 0.1f, s.y(0)); return path; }
            for (int i = 1; i < n - 1; i++) { // 가운데 점으로 부드럽게
                float mx = (s.x(i) + s.x(i + 1)) / 2, my = (s.y(i) + s.y(i + 1)) / 2;
                path.quadTo(s.x(i), s.y(i), mx, my);
            }
            path.lineTo(s.x(n - 1), s.y(n - 1));
            return path;
        }
        path.setFillType(Path.FillType.WINDING);
        if (n == 1) {
            path.addCircle(s.x(0), s.y(0), radius(s, 0), Path.Direction.CW);
            return path;
        }
        float[] lx = new float[n], ly = new float[n], rx = new float[n], ry = new float[n];
        for (int i = 0; i < n; i++) {
            int a = Math.max(0, i - 1), b = Math.min(n - 1, i + 1);
            float dx = s.x(b) - s.x(a), dy = s.y(b) - s.y(a);
            float len = (float) Math.hypot(dx, dy);
            if (len < 1e-4f) { dx = 1; dy = 0; len = 1; }
            float nx = -dy / len, ny = dx / len, r = radius(s, i);
            lx[i] = s.x(i) + nx * r; ly[i] = s.y(i) + ny * r;
            rx[i] = s.x(i) - nx * r; ry[i] = s.y(i) - ny * r;
        }
        path.moveTo(lx[0], ly[0]);
        for (int i = 1; i < n; i++) {
            float mx = (lx[i - 1] + lx[i]) / 2, my = (ly[i - 1] + ly[i]) / 2;
            path.quadTo(lx[i - 1], ly[i - 1], mx, my);
        }
        path.lineTo(lx[n - 1], ly[n - 1]);
        path.lineTo(rx[n - 1], ry[n - 1]);
        for (int i = n - 2; i >= 0; i--) {
            float mx = (rx[i + 1] + rx[i]) / 2, my = (ry[i + 1] + ry[i]) / 2;
            path.quadTo(rx[i + 1], ry[i + 1], mx, my);
        }
        path.lineTo(rx[0], ry[0]);
        path.close();
        path.addCircle(s.x(0), s.y(0), radius(s, 0), Path.Direction.CW);
        path.addCircle(s.x(n - 1), s.y(n - 1), radius(s, n - 1), Path.Direction.CW);
        return path;
    }

    static void draw(Canvas c, Model.Stroke s) {
        Paint fill = PAINTS.get()[0], marker = PAINTS.get()[1];
        if (s.path == null) s.path = build(s);
        if (s.tool == Model.MARKER) {
            marker.setColor(s.color);
            marker.setAlpha(0x66);
            marker.setStrokeWidth(s.width);
            c.drawPath(s.path, marker);
        } else {
            fill.setColor(s.color);
            c.drawPath(s.path, fill);
        }
    }

    /** 형광펜을 펜 아래에 칠한 것처럼: 형광펜 먼저, 그다음 펜 */
    static void drawStrokes(Canvas c, java.util.List<Model.Stroke> list, RectF clip) {
        for (Model.Stroke s : list) if (s.tool == Model.MARKER && (clip == null || RectF.intersects(clip, s.bounds()))) draw(c, s);
        for (Model.Stroke s : list) if (s.tool != Model.MARKER && (clip == null || RectF.intersects(clip, s.bounds()))) draw(c, s);
    }

    /** 종이 바탕 + 무늬 (쪽 단위) */
    static void paper(Canvas c, Model.Page p, boolean white) {
        Paint fill = PAINTS.get()[0], line = PAINTS.get()[2];
        if (white) c.drawColor(PAPER);
        float w = Model.PAGE_W, h = p.h;
        switch (p.paper) {
            case Model.LINED: {
                line.setColor(LINE); line.setStrokeWidth(1.4f);
                for (float y = 120; y < h - 30; y += 40) c.drawLine(0, y, w, y, line);
                line.setColor(MARGIN); line.setStrokeWidth(1.6f);
                c.drawLine(100, 0, 100, h, line);
                break;
            }
            case Model.GRID: {
                line.setColor(LINE); line.setStrokeWidth(1f);
                for (float x = 25; x < w; x += 25) c.drawLine(x, 0, x, h, line);
                for (float y = 25; y < h; y += 25) c.drawLine(0, y, w, y, line);
                break;
            }
            case Model.DOT: {
                fill.setColor(DOTC);
                for (float y = 25; y < h; y += 25) for (float x = 25; x < w; x += 25) c.drawCircle(x, y, 1.9f, fill);
                break;
            }
            default:
        }
    }

    /** 쪽 하나를 그림으로 (내보내기 · 목록 그림). pdfBg: PDF 쪽 그림(없으면 null) */
    static Bitmap render(Model.Page p, Bitmap pdfBg, int widthPx) {
        int hPx = Math.max(1, Math.round(widthPx * p.h / Model.PAGE_W));
        Bitmap b = Bitmap.createBitmap(widthPx, hPx, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(b);
        c.drawColor(Color.WHITE);
        float k = widthPx / Model.PAGE_W;
        if (pdfBg != null) {
            c.drawBitmap(pdfBg, null, new RectF(0, 0, widthPx, hPx), new Paint(Paint.FILTER_BITMAP_FLAG));
        }
        c.save();
        c.scale(k, k);
        paper(c, p, false);
        drawStrokes(c, p.strokes, null);
        c.restore();
        return b;
    }

    /** 점 (x,y)에서 반지름 r 안에 닿는 획인가 (지우개) */
    static boolean hits(Model.Stroke s, float x, float y, float r) {
        RectF b = s.bounds();
        if (x < b.left - r || x > b.right + r || y < b.top - r || y > b.bottom + r) return false;
        float rr = r + (s.tool == Model.MARKER ? s.width / 2 : s.width * 0.35f);
        if (s.n == 1) return Math.hypot(s.x(0) - x, s.y(0) - y) <= rr;
        for (int i = 1; i < s.n; i++) {
            if (segDist(x, y, s.x(i - 1), s.y(i - 1), s.x(i), s.y(i)) <= rr) return true;
        }
        return false;
    }

    static float segDist(float px, float py, float ax, float ay, float bx, float by) {
        float dx = bx - ax, dy = by - ay;
        float l2 = dx * dx + dy * dy;
        float t = l2 < 1e-6f ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2));
        return (float) Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
    }
}
