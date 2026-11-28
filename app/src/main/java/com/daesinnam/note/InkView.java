package com.daesinnam.note;

import android.annotation.SuppressLint;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.RectF;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.view.MotionEvent;
import android.view.View;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import java.util.concurrent.ExecutorService;

/**
 * 필기 화면 (한 번에 한 쪽).
 *
 * - S펜(스타일러스): 쓰기. 펜 옆 버튼을 누른 채 쓰거나 펜 뒤쪽(지우개 끝)으로 쓰면 지우개.
 * - 손가락: S펜을 한 번이라도 쓰면 "펜으로만 쓰기"가 되어 손가락은 화면 옮기기 · 두 손가락 확대만 (손바닥이 닿아도 안 써짐).
 *   S펜이 없을 때는 손가락 하나로 쓰고, 두 손가락으로 옮기기 · 확대.
 * - 마우스(DeX): 왼쪽 단추로 쓰기, 휠로 위아래, Ctrl+휠로 확대.
 * - 확대하지 않았을 때 손가락으로 옆으로 밀면 쪽 넘기기.
 */
public class InkView extends View {
    static final int ERASER = 2;

    interface Listener {
        void onInkChanged();
        void onPageChanged();
        void onPenSeen();
    }

    // ---- 노트 ----
    Model.Note note;
    int page;
    Pdf pdf;
    ExecutorService bg;
    Listener listener;

    // ---- 도구 ----
    int tool = Model.PEN;
    int penColor = 0xFF1A1A1A, markerColor = 0xFFFFE14D;
    float penWidth = 4f, markerWidth = 22f;
    boolean penOnly = false;
    boolean penSeen = false;

    // ---- 보기 (쪽 원점 ox,oy 화면 픽셀 · 확대) ----
    private float zoom = 1f, ox, oy;
    private boolean placed;
    private final float dp;
    private final Handler main = new Handler(Looper.getMainLooper());

    // ---- 지금 쓰는 획 ----
    private Model.Stroke cur;
    private boolean erasing;
    private int activeId = -1;
    private Op eraseOp;
    private float eraseX = Float.NaN, eraseY;

    // ---- 손가락 움직임 ----
    private boolean gesturing;
    private float gx, gy, gSpan, downX, downY;
    private int gCount;
    private float swipeDx;

    // ---- PDF 바탕 ----
    private Bitmap bgBmp;
    private int bgPage = -1, bgW;
    private boolean bgBusy;

    // ---- 되돌리기 ----
    static final class Op {
        Model.Page page;
        final List<Model.Stroke> added = new ArrayList<>();
        final List<Model.Stroke> removed = new ArrayList<>();
        final List<Integer> removedIdx = new ArrayList<>();
    }
    private final Deque<Op> undo = new ArrayDeque<>(), redo = new ArrayDeque<>();

    private final Paint shadow = new Paint(Paint.ANTI_ALIAS_FLAG), bmpPaint = new Paint(Paint.FILTER_BITMAP_FLAG), ring = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final RectF tmp = new RectF();

    public InkView(Context c) {
        super(c);
        dp = getResources().getDisplayMetrics().density;
        shadow.setColor(0x55000000);
        ring.setStyle(Paint.Style.STROKE);
        ring.setStrokeWidth(1.5f * dp);
        ring.setColor(0xCC888888);
        setFocusable(true);
        setFocusableInTouchMode(true);
    }

    Model.Page cur() { return note.pages.get(page); }

    // ================= 보기 =================

    private float base() {
        float w = getWidth(), m = 16 * dp;
        float fitW = (w - 2 * m) / Model.PAGE_W;
        // 아주 넓은 화면(DeX · 가로 태블릿)에서는 쪽이 너무 커지지 않게: 한 화면에 쪽 위쪽 절반 이상은 보이게
        float fitH = (getHeight() - 2 * m) * 1.9f / cur().h;
        return Math.max(0.05f, Math.min(fitW, fitH));
    }

    float scale() { return base() * zoom; }

    /** 쪽을 가운데 위에 맞춤 (확대 풀기) */
    void fit() {
        zoom = 1f;
        float s = scale();
        ox = (getWidth() - Model.PAGE_W * s) / 2;
        oy = 16 * dp;
        placed = true;
        invalidate();
    }

    private void clamp() {
        float s = scale(), pw = Model.PAGE_W * s, ph = cur().h * s, w = getWidth(), h = getHeight(), m = 16 * dp;
        if (pw <= w) ox = (w - pw) / 2;
        else ox = Math.min(m, Math.max(w - pw - m, ox));
        if (ph <= h - 2 * m) oy = Math.min(Math.max(m, oy), h - ph - m);
        else oy = Math.min(m, Math.max(h - ph - m, oy));
    }

    @Override
    protected void onSizeChanged(int w, int h, int ow, int oh) {
        super.onSizeChanged(w, h, ow, oh);
        if (note == null) return;
        if (!placed || ow == 0) fit();
        else { clamp(); invalidate(); }
    }

    void setPage(int p) {
        if (note == null) return;
        finishStroke(false);
        page = Math.max(0, Math.min(note.pages.size() - 1, p));
        note.lastPage = page;
        if (bgPage != page) { bgBmp = null; bgPage = -1; }
        fit();
        if (listener != null) listener.onPageChanged();
    }

    private float toX(float sx) { return (sx - ox) / scale(); }
    private float toY(float sy) { return (sy - oy) / scale(); }

    // ================= 그리기 =================

    @Override
    protected void onDraw(Canvas c) {
        c.drawColor(0xFF1B1C21);
        if (note == null || getWidth() == 0) return;
        if (!placed) fit();
        Model.Page p = cur();
        float s = scale();
        tmp.set(ox, oy, ox + Model.PAGE_W * s, oy + p.h * s);
        c.drawRect(tmp.left + 2 * dp, tmp.top + 3 * dp, tmp.right + 2 * dp, tmp.bottom + 3 * dp, shadow);
        c.save();
        c.clipRect(tmp);
        c.drawColor(Ink.PAPER);
        if (p.pdf >= 0) {
            if (bgBmp != null && bgPage == page) c.drawBitmap(bgBmp, null, tmp, bmpPaint);
            if (!gesturing) ensureBg(Math.round(Model.PAGE_W * s));
        }
        c.translate(ox, oy);
        c.scale(s, s);
        Ink.paper(c, p, false);
        Ink.drawStrokes(c, p.strokes, visible(s));
        if (cur != null && cur.n > 0) { cur.path = null; Ink.draw(c, cur); }
        c.restore();
        if ((erasing || erasingHover) && !Float.isNaN(eraseX)) c.drawCircle(eraseX, eraseY, eraserPx(), ring);
    }

    private RectF visible(float s) {
        return new RectF(toX(0), toY(0), toX(getWidth()), toY(getHeight()));
    }

    private float eraserPx() { return 14 * dp; }

    /** PDF 쪽 그림을 지금 크기에 맞게 (다른 스레드에서 그림) */
    private void ensureBg(int needW) {
        if (pdf == null || bg == null || bgBusy) return;
        needW = Math.min(needW, 3200);
        if (bgPage == page && bgBmp != null && Math.abs(bgW - needW) < needW * 0.3f) return;
        final int pg = page, idx = cur().pdf, w = needW;
        bgBusy = true;
        bg.execute(() -> {
            Bitmap b = pdf.render(idx, w);
            main.post(() -> {
                bgBusy = false;
                if (b == null || pg != page) return;
                bgBmp = b; bgPage = pg; bgW = w;
                invalidate();
            });
        });
    }

    // ================= 입력 =================

    private static boolean isPen(int tt) {
        return tt == MotionEvent.TOOL_TYPE_STYLUS || tt == MotionEvent.TOOL_TYPE_ERASER;
    }

    private boolean penButton(MotionEvent e) {
        int b = e.getButtonState();
        return (b & (MotionEvent.BUTTON_STYLUS_PRIMARY | MotionEvent.BUTTON_STYLUS_SECONDARY)) != 0;
    }

    @SuppressLint("ClickableViewAccessibility")
    @Override
    public boolean onTouchEvent(MotionEvent e) {
        if (note == null) return false;
        int a = e.getActionMasked(), i = e.getActionIndex();
        switch (a) {
            case MotionEvent.ACTION_DOWN:
            case MotionEvent.ACTION_POINTER_DOWN: {
                int tt = e.getToolType(i);
                if (activeId != -1) {
                    // 쓰는 중 손가락이 더 닿음: 손가락으로 쓰던 중이면 쓰기를 멈추고 두 손가락 움직임으로
                    if (!isPen(toolOfActive(e)) && !isPen(tt)) { finishStroke(false); startGesture(e); }
                    return true;
                }
                if (isPen(tt) || tt == MotionEvent.TOOL_TYPE_MOUSE) {
                    if (isPen(tt) && !penSeen) { penSeen = true; penOnly = true; if (listener != null) listener.onPenSeen(); }
                    if (tt == MotionEvent.TOOL_TYPE_MOUSE && (e.getButtonState() & MotionEvent.BUTTON_PRIMARY) == 0 && a == MotionEvent.ACTION_DOWN && e.getButtonState() != 0) return false;
                    if (gesturing) endGesture();
                    startStroke(e, i, tt == MotionEvent.TOOL_TYPE_ERASER || penButton(e) || tool == ERASER);
                    return true;
                }
                // 손가락
                if (gesturing || penOnly || e.getPointerCount() > 1) { startGesture(e); return true; }
                startStroke(e, i, tool == ERASER);
                return true;
            }
            case MotionEvent.ACTION_MOVE: {
                if (activeId != -1) { moveStroke(e); return true; }
                if (gesturing) { moveGesture(e); return true; }
                return true;
            }
            case MotionEvent.ACTION_POINTER_UP: {
                if (activeId != -1 && e.getPointerId(i) == activeId) { addPoint(e, i, -1); finishStroke(true); return true; }
                if (gesturing) startGesture(e, i);
                return true;
            }
            case MotionEvent.ACTION_UP: {
                if (activeId != -1) { addPoint(e, i, -1); finishStroke(true); }
                else if (gesturing) { swipe(); endGesture(); }
                return true;
            }
            case MotionEvent.ACTION_CANCEL: {
                finishStroke(false);
                endGesture();
                return true;
            }
            default:
                return true;
        }
    }

    private int toolOfActive(MotionEvent e) {
        int k = e.findPointerIndex(activeId);
        return k < 0 ? MotionEvent.TOOL_TYPE_UNKNOWN : e.getToolType(k);
    }

    private void startStroke(MotionEvent e, int i, boolean erase) {
        activeId = e.getPointerId(i);
        erasing = erase;
        if (Build.VERSION.SDK_INT >= 30) requestUnbufferedDispatch(e); // 펜 지연 줄이기
        getParent().requestDisallowInterceptTouchEvent(true);
        if (erase) {
            eraseOp = new Op();
            eraseOp.page = cur();
            eraseAt(e.getX(i), e.getY(i));
        } else {
            cur = tool == Model.MARKER ? new Model.Stroke(Model.MARKER, markerColor, markerWidth) : new Model.Stroke(Model.PEN, penColor, penWidth);
            addPoint(e, i, -1);
        }
        invalidate();
    }

    private void moveStroke(MotionEvent e) {
        int k = e.findPointerIndex(activeId);
        if (k < 0) return;
        // 쓰는 도중 펜 버튼을 누르면 지우개로 (막 쓰기 시작했을 때만)
        if (!erasing && cur != null && cur.n < 4 && penButton(e)) {
            cur = null;
            erasing = true;
            eraseOp = new Op();
            eraseOp.page = cur();
        }
        for (int h = 0; h < e.getHistorySize(); h++) addPoint(e, k, h);
        addPoint(e, k, -1);
        invalidate();
    }

    /** h = -1이면 지금 점, 아니면 그 사이에 모인 점(펜은 빠르게 많이 보냄) */
    private void addPoint(MotionEvent e, int k, int h) {
        float sx = h < 0 ? e.getX(k) : e.getHistoricalX(k, h), sy = h < 0 ? e.getY(k) : e.getHistoricalY(k, h);
        if (erasing) { eraseAt(sx, sy); return; }
        if (cur == null) return;
        float p;
        int tt = e.getToolType(k);
        if (isPen(tt)) p = h < 0 ? e.getPressure(k) : e.getHistoricalPressure(k, h);
        else p = 0.55f; // 손가락 · 마우스는 필압 없음
        float x = toX(sx), y = toY(sy);
        if (cur.n > 0) {
            float dx = x - cur.x(cur.n - 1), dy = y - cur.y(cur.n - 1);
            if (dx * dx + dy * dy < 0.36f / Math.max(0.2f, scale())) return; // 거의 같은 자리
        }
        cur.add(x, y, Math.max(0.05f, Math.min(1f, p)));
    }

    private void eraseAt(float sx, float sy) {
        eraseX = sx; eraseY = sy;
        float x = toX(sx), y = toY(sy), r = eraserPx() / scale();
        List<Model.Stroke> list = cur().strokes;
        for (int j = list.size() - 1; j >= 0; j--) {
            Model.Stroke s = list.get(j);
            if (Ink.hits(s, x, y, r)) {
                list.remove(j);
                eraseOp.removed.add(s);
                eraseOp.removedIdx.add(j);
            }
        }
    }

    /** keep=false면 쓰던 획을 버림 */
    private void finishStroke(boolean keep) {
        if (activeId == -1) return;
        activeId = -1;
        if (erasing) {
            if (eraseOp != null && !eraseOp.removed.isEmpty()) {
                if (!keep) undoOp(eraseOp);
                else push(eraseOp);
            }
            eraseOp = null;
            erasing = false;
            eraseX = Float.NaN;
        } else if (cur != null) {
            if (keep && cur.n > 0) {
                cur.path = null;
                cur().strokes.add(cur);
                Op op = new Op();
                op.page = cur();
                op.added.add(cur);
                push(op);
            }
            cur = null;
        }
        invalidate();
    }

    // ---- 손가락: 옮기기 · 확대 · 쪽 넘기기 ----

    private void startGesture(MotionEvent e) { startGesture(e, -1); }

    /** skip: 막 떨어지는 손가락(포함하지 않음) */
    private void startGesture(MotionEvent e, int skip) {
        if (!gesturing) { swipeDx = 0; downX = e.getX(e.getActionIndex()); downY = e.getY(e.getActionIndex()); }
        gesturing = true;
        float[] g = centroid(e, skip);
        gx = g[0]; gy = g[1]; gSpan = g[2]; gCount = (int) g[3];
    }

    private float[] centroid(MotionEvent e, int skip) {
        float x = 0, y = 0; int n = 0;
        for (int k = 0; k < e.getPointerCount() && n < 2; k++) {
            if (k == skip || isPen(e.getToolType(k))) continue;
            x += e.getX(k); y += e.getY(k); n++;
        }
        if (n == 0) return new float[]{gx, gy, 0, 0};
        x /= n; y /= n;
        float span = 0;
        if (n == 2) {
            int a = -1, b = -1;
            for (int k = 0; k < e.getPointerCount(); k++) {
                if (k == skip || isPen(e.getToolType(k))) continue;
                if (a < 0) a = k; else if (b < 0) b = k;
            }
            span = (float) Math.hypot(e.getX(a) - e.getX(b), e.getY(a) - e.getY(b));
        }
        return new float[]{x, y, span, n};
    }

    private void moveGesture(MotionEvent e) {
        float[] g = centroid(e, -1);
        if ((int) g[3] != gCount) { gx = g[0]; gy = g[1]; gSpan = g[2]; gCount = (int) g[3]; return; }
        float dx = g[0] - gx, dy = g[1] - gy;
        if (gCount == 2 && gSpan > 10 * dp && g[2] > 10 * dp) {
            float before = scale();
            zoom = Math.max(0.5f, Math.min(6f, zoom * g[2] / gSpan));
            float after = scale();
            // 손가락 사이의 점이 그 자리에 있게
            ox = g[0] - (gx - ox) * after / before;
            oy = g[1] - (gy - oy) * after / before;
        } else {
            ox += dx; oy += dy;
        }
        swipeDx += dx;
        gx = g[0]; gy = g[1]; gSpan = g[2];
        clamp();
        invalidate();
    }

    private void swipe() {
        if (zoom > 1.02f || gCount != 1) return;
        if (Math.abs(swipeDx) > getWidth() * 0.22f && Math.abs(swipeDx) > 2.2f * Math.abs(gy - downY)) {
            if (swipeDx < 0 && page < note.pages.size() - 1) setPage(page + 1);
            else if (swipeDx > 0 && page > 0) setPage(page - 1);
        }
    }

    private void endGesture() {
        if (!gesturing) return;
        gesturing = false;
        invalidate(); // 확대가 끝나면 PDF 바탕을 새 크기로
    }

    @Override
    public boolean onGenericMotionEvent(MotionEvent e) {
        if (e.getActionMasked() == MotionEvent.ACTION_SCROLL && note != null) {
            float v = e.getAxisValue(MotionEvent.AXIS_VSCROLL), hz = e.getAxisValue(MotionEvent.AXIS_HSCROLL);
            if (e.isCtrlPressed()) {
                float before = scale();
                zoom = Math.max(0.5f, Math.min(6f, zoom * (v > 0 ? 1.12f : 1 / 1.12f)));
                float after = scale();
                ox = e.getX() - (e.getX() - ox) * after / before;
                oy = e.getY() - (e.getY() - oy) * after / before;
            } else {
                oy += v * 64 * dp;
                ox -= hz * 64 * dp;
            }
            clamp();
            invalidate();
            return true;
        }
        if (e.getActionMasked() == MotionEvent.ACTION_HOVER_MOVE && isPen(e.getToolType(0))) {
            boolean er = e.getToolType(0) == MotionEvent.TOOL_TYPE_ERASER || penButton(e) || tool == ERASER;
            if (er) { eraseX = e.getX(); eraseY = e.getY(); erasingHover = true; invalidate(); }
            else if (erasingHover) { erasingHover = false; eraseX = Float.NaN; invalidate(); }
        } else if (e.getActionMasked() == MotionEvent.ACTION_HOVER_EXIT && erasingHover) {
            erasingHover = false; eraseX = Float.NaN; invalidate();
        }
        return super.onGenericMotionEvent(e);
    }

    private boolean erasingHover;

    @Override
    public boolean onHoverEvent(MotionEvent e) {
        onGenericMotionEvent(e);
        return true;
    }

    // ================= 되돌리기 =================

    private void push(Op op) {
        undo.push(op);
        while (undo.size() > 200) undo.removeLast();
        redo.clear();
        if (listener != null) listener.onInkChanged();
    }

    boolean canUndo() { return !undo.isEmpty(); }
    boolean canRedo() { return !redo.isEmpty(); }

    void undo() {
        finishStroke(true);
        if (undo.isEmpty()) return;
        Op op = undo.pop();
        undoOp(op);
        redo.push(op);
        show(op.page);
        if (listener != null) listener.onInkChanged();
        invalidate();
    }

    void redo() {
        if (redo.isEmpty()) return;
        Op op = redo.pop();
        List<Model.Stroke> l = op.page.strokes;
        l.removeAll(op.removed);
        l.addAll(op.added);
        undo.push(op);
        show(op.page);
        if (listener != null) listener.onInkChanged();
        invalidate();
    }

    private void undoOp(Op op) {
        List<Model.Stroke> l = op.page.strokes;
        l.removeAll(op.added);
        // 지운 획은 원래 자리에 (지운 순서의 반대로)
        for (int k = op.removed.size() - 1; k >= 0; k--) {
            int at = Math.min(op.removedIdx.get(k), l.size());
            l.add(at, op.removed.get(k));
        }
    }

    /** 되돌린 일이 다른 쪽이면 그 쪽으로 */
    private void show(Model.Page p) {
        int k = note.pages.indexOf(p);
        if (k >= 0 && k != page) setPage(k);
    }

    /** 쪽 전체 지우기 (되돌릴 수 있음) */
    void clearPage() {
        finishStroke(true);
        List<Model.Stroke> l = cur().strokes;
        if (l.isEmpty()) return;
        Op op = new Op();
        op.page = cur();
        for (int k = l.size() - 1; k >= 0; k--) { op.removed.add(l.get(k)); op.removedIdx.add(k); }
        l.clear();
        push(op);
        invalidate();
    }

    /** 쪽을 지우거나 노트를 바꾸면, 그 쪽에 대한 되돌리기 기록을 버림 */
    void forget(Model.Page p) {
        undo.removeIf(o -> o.page == p);
        redo.removeIf(o -> o.page == p);
        if (listener != null) listener.onInkChanged();
    }

    // ---- 자동 점검용 ----
    int strokeCount() { return note == null ? 0 : cur().strokes.size(); }

    /** 화면 좌표 한 점에서 지우개 한 번 (자동 점검) */
    int eraseOnceAt(float sx, float sy) {
        eraseOp = new Op();
        eraseOp.page = cur();
        eraseAt(sx, sy);
        int n = eraseOp.removed.size();
        if (n > 0) push(eraseOp);
        eraseOp = null;
        eraseX = Float.NaN;
        invalidate();
        return n;
    }

    float[] toScreen(float x, float y) { return new float[]{ox + x * scale(), oy + y * scale()}; }
}
