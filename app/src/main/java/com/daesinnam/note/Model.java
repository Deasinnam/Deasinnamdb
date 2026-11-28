package com.daesinnam.note;

import android.graphics.Path;
import android.graphics.RectF;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

/**
 * 노트 자료 구조.
 *
 * 쪽 좌표는 "쪽 단위"로 저장합니다: 쪽 너비가 늘 1000이고 높이는 쪽 비율에 따릅니다(A4면 1414).
 * 그래서 화면 크기 · 확대와 상관없이 같은 자리에 남고, 내보낼 때도 크기만 바꾸면 됩니다.
 */
final class Model {
    private Model() { }

    static final float PAGE_W = 1000f;
    static final float A4_H = 1414f;

    /** 종이 무늬 */
    static final String PLAIN = "plain", LINED = "lined", GRID = "grid", DOT = "dot";

    static final int PEN = 0, MARKER = 1;

    static final class Stroke {
        int tool;        // PEN · MARKER(형광펜)
        int color;
        float width;     // 쪽 단위 굵기 (펜은 필압으로 0.35~1배)
        float[] pts;     // x, y, 필압(0~1) 세 개씩
        int n;           // 점 개수
        transient Path path;   // 그리기용 (한 번 만들어 둠)
        transient RectF box;   // 지우개 · 다시 그리기 범위

        Stroke(int tool, int color, float width) {
            this.tool = tool; this.color = color; this.width = width;
            pts = new float[3 * 64];
        }

        void add(float x, float y, float p) {
            if (n * 3 + 3 > pts.length) {
                float[] b = new float[pts.length * 2];
                System.arraycopy(pts, 0, b, 0, n * 3);
                pts = b;
            }
            pts[n * 3] = x; pts[n * 3 + 1] = y; pts[n * 3 + 2] = p;
            n++;
            path = null; box = null;
        }

        float x(int i) { return pts[i * 3]; }
        float y(int i) { return pts[i * 3 + 1]; }
        float p(int i) { return pts[i * 3 + 2]; }

        RectF bounds() {
            if (box == null) {
                RectF r = new RectF(x(0), y(0), x(0), y(0));
                for (int i = 1; i < n; i++) r.union(x(i), y(i));
                r.inset(-width, -width);
                box = r;
            }
            return box;
        }

        /** 내보내기용 사본 (점 배열은 함께 씀 — 끝난 획은 바뀌지 않음) */
        Stroke copy() {
            Stroke s = new Stroke(tool, color, width);
            s.pts = pts; s.n = n;
            return s;
        }

        JSONObject toJson() throws JSONException {
            JSONArray a = new JSONArray();
            for (int i = 0; i < n * 3; i++) a.put(Math.round(pts[i] * 10) / 10.0);
            return new JSONObject().put("t", tool).put("c", color).put("w", Math.round(width * 100) / 100.0).put("p", a);
        }

        static Stroke fromJson(JSONObject o) throws JSONException {
            Stroke s = new Stroke(o.getInt("t"), o.getInt("c"), (float) o.getDouble("w"));
            JSONArray a = o.getJSONArray("p");
            for (int i = 0; i + 2 < a.length(); i += 3)
                s.add((float) a.getDouble(i), (float) a.getDouble(i + 1), (float) a.getDouble(i + 2));
            return s;
        }
    }

    static final class Page {
        float h = A4_H;          // 쪽 높이 (너비는 늘 1000)
        String paper = LINED;
        int pdf = -1;            // PDF에서 가져온 쪽이면 원본 쪽 번호
        float ptW = 595, ptH = 842; // 내보낼 때 쪽 크기 (포인트, 1/72인치)
        final List<Stroke> strokes = new ArrayList<>();

        JSONObject toJson() throws JSONException {
            JSONArray s = new JSONArray();
            for (Stroke k : strokes) s.put(k.toJson());
            return new JSONObject().put("h", h).put("paper", paper).put("pdf", pdf).put("ptW", ptW).put("ptH", ptH).put("strokes", s);
        }

        static Page fromJson(JSONObject o) throws JSONException {
            Page p = new Page();
            p.h = (float) o.optDouble("h", A4_H);
            p.paper = o.optString("paper", LINED);
            p.pdf = o.optInt("pdf", -1);
            p.ptW = (float) o.optDouble("ptW", 595);
            p.ptH = (float) o.optDouble("ptH", 842);
            JSONArray s = o.optJSONArray("strokes");
            if (s != null) for (int i = 0; i < s.length(); i++) {
                Stroke k = Stroke.fromJson(s.getJSONObject(i));
                if (k.n > 0) p.strokes.add(k);
            }
            return p;
        }

        Page copy() {
            Page p = new Page();
            p.h = h; p.paper = paper; p.pdf = pdf; p.ptW = ptW; p.ptH = ptH;
            for (Stroke s : strokes) p.strokes.add(s.copy());
            return p;
        }

        static Page blank(String paper) {
            Page p = new Page();
            p.paper = paper;
            return p;
        }
    }

    static final class Note {
        String id;
        String title;
        long created, modified;
        boolean hasPdf;
        int lastPage;
        final List<Page> pages = new ArrayList<>();

        /** 다른 스레드에서 내보내기 · 저장할 때 쓰는 사본 (쓰는 중에도 안전) */
        Note snapshot() {
            Note n = new Note();
            n.id = id; n.title = title; n.created = created; n.modified = modified; n.hasPdf = hasPdf; n.lastPage = lastPage;
            for (Page p : pages) n.pages.add(p.copy());
            return n;
        }

        JSONObject toJson() throws JSONException {
            JSONArray p = new JSONArray();
            for (Page k : pages) p.put(k.toJson());
            return new JSONObject().put("v", 1).put("id", id).put("title", title).put("created", created)
                    .put("modified", modified).put("hasPdf", hasPdf).put("lastPage", lastPage).put("pages", p);
        }

        static Note fromJson(JSONObject o) throws JSONException {
            Note n = new Note();
            n.id = o.getString("id");
            n.title = o.optString("title", "노트");
            n.created = o.optLong("created");
            n.modified = o.optLong("modified");
            n.hasPdf = o.optBoolean("hasPdf");
            n.lastPage = o.optInt("lastPage");
            JSONArray p = o.optJSONArray("pages");
            if (p != null) for (int i = 0; i < p.length(); i++) n.pages.add(Page.fromJson(p.getJSONObject(i)));
            if (n.pages.isEmpty()) n.pages.add(Page.blank(LINED));
            n.lastPage = Math.max(0, Math.min(n.lastPage, n.pages.size() - 1));
            return n;
        }
    }
}
