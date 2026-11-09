package com.daesinnam.meeting;

import android.content.Context;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

/**
 * 회의 기록 저장소: files/meetings/<id>/
 *   meta.json        제목, 시작 시각, 길이, 상태(recording·processing·done·error), 화자 이름, 등록한 일정 번호
 *   chunk-000.wav …  녹음 (10분씩)
 *   chunk-000.json … 조각별 받아쓰기 결과 (다시 분석할 때 재사용)
 *   transcript.json  합친 받아쓰기 (화자·시각)
 *   analysis.json    분석 결과
 */
final class Store {
    private final File root;

    Store(Context c) {
        root = new File(c.getFilesDir(), "meetings");
        //noinspection ResultOfMethodCallIgnored
        root.mkdirs();
    }

    synchronized String create(String title, long startedAt) throws IOException {
        String id = new SimpleDateFormat("yyyyMMdd-HHmmss", Locale.ROOT).format(new Date(startedAt));
        File d = new File(root, id);
        int n = 1;
        while (d.exists()) d = new File(root, id + "-" + (n++));
        if (!d.mkdirs()) throw new IOException("저장 폴더를 만들 수 없습니다");
        JSONObject m = new JSONObject();
        try {
            m.put("id", d.getName());
            m.put("title", title == null ? "" : title);
            m.put("titleSetByUser", title != null && !title.isEmpty());
            m.put("startedAt", startedAt);
            m.put("durationMs", 0);
            m.put("state", "recording");
            m.put("speakerNames", new JSONObject());
            m.put("events", new JSONObject());
        } catch (JSONException ignored) {
        }
        writeJson(new File(d, "meta.json"), m);
        return d.getName();
    }

    File dir(String id) {
        if (id == null || id.contains("/") || id.contains("..")) throw new IllegalArgumentException("잘못된 회의 번호");
        return new File(root, id);
    }

    synchronized JSONObject meta(String id) throws IOException {
        return readJson(new File(dir(id), "meta.json"));
    }

    synchronized void saveMeta(String id, JSONObject m) throws IOException {
        writeJson(new File(dir(id), "meta.json"), m);
    }

    /** 한 항목만 바꿔 저장 */
    synchronized void update(String id, String key, Object value) throws IOException {
        JSONObject m = meta(id);
        try {
            m.put(key, value);
        } catch (JSONException e) {
            throw new IOException(e);
        }
        saveMeta(id, m);
    }

    JSONObject optJson(String id, String name) {
        File f = new File(dir(id), name);
        if (!f.exists()) return null;
        try {
            return readJson(f);
        } catch (IOException e) {
            return null;
        }
    }

    void putJson(String id, String name, JSONObject o) throws IOException {
        writeJson(new File(dir(id), name), o);
    }

    List<File> chunks(String id) {
        List<File> out = new ArrayList<>();
        for (int i = 0; ; i++) {
            File f = new File(dir(id), String.format(Locale.ROOT, "chunk-%03d.wav", i));
            if (!f.exists()) break;
            out.add(f);
        }
        return out;
    }

    File chunkFile(String id, int i) {
        return new File(dir(id), String.format(Locale.ROOT, "chunk-%03d.wav", i));
    }

    JSONArray list() {
        File[] dirs = root.listFiles(File::isDirectory);
        JSONArray out = new JSONArray();
        if (dirs == null) return out;
        java.util.Arrays.sort(dirs, (a, b) -> b.getName().compareTo(a.getName()));
        for (File d : dirs) {
            try {
                JSONObject m = readJson(new File(d, "meta.json"));
                JSONObject row = new JSONObject();
                row.put("id", m.optString("id"));
                row.put("startedAt", m.optLong("startedAt"));
                row.put("durationMs", m.optLong("durationMs"));
                row.put("state", m.optString("state"));
                JSONObject a = optJson(d.getName(), "analysis.json");
                String title = m.optString("title");
                if (a != null) {
                    if (!m.optBoolean("titleSetByUser") && !a.optString("title").isEmpty()) title = a.optString("title");
                    row.put("summary", a.optString("summary"));
                    JSONArray r = a.optJSONArray("requestsToMe");
                    if (r != null && r.length() > 0) row.put("requestsToMe", r.length());
                }
                row.put("title", title);
                out.put(row);
            } catch (Exception ignored) {
                // 깨진 기록은 목록에서 뺌
            }
        }
        return out;
    }

    void delete(String id) {
        deleteTree(dir(id));
    }

    static void deleteTree(File f) {
        File[] kids = f.listFiles();
        if (kids != null) for (File k : kids) deleteTree(k);
        //noinspection ResultOfMethodCallIgnored
        f.delete();
    }

    static JSONObject readJson(File f) throws IOException {
        try (InputStream in = new FileInputStream(f)) {
            byte[] b = new byte[(int) f.length()];
            int off = 0;
            while (off < b.length) {
                int n = in.read(b, off, b.length - off);
                if (n < 0) break;
                off += n;
            }
            return new JSONObject(new String(b, 0, off, StandardCharsets.UTF_8));
        } catch (JSONException e) {
            throw new IOException("기록이 깨졌습니다: " + f.getName(), e);
        }
    }

    static void writeJson(File f, JSONObject o) throws IOException {
        File tmp = new File(f.getPath() + ".tmp");
        try (OutputStream out = new FileOutputStream(tmp)) {
            out.write(o.toString().getBytes(StandardCharsets.UTF_8));
        }
        if (!tmp.renameTo(f)) throw new IOException("저장하지 못했습니다: " + f.getName());
    }
}
