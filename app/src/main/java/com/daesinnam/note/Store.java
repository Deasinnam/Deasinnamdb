package com.daesinnam.note;

import android.content.Context;
import android.graphics.pdf.PdfRenderer;
import android.net.Uri;
import android.os.ParcelFileDescriptor;

import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * 노트 보관: 앱 저장소 files/notes/&lt;id&gt;/ 안에
 *  - note.json   쪽 · 획
 *  - thumb.png   목록 그림
 *  - source.pdf  PDF에서 만든 노트의 원본
 */
final class Store {
    private Store() { }

    static File root(Context c) {
        File d = new File(c.getFilesDir(), "notes");
        if (!d.exists()) d.mkdirs();
        return d;
    }

    static File dir(Context c, String id) { return new File(root(c), id); }
    static File json(Context c, String id) { return new File(dir(c, id), "note.json"); }
    static File thumb(Context c, String id) { return new File(dir(c, id), "thumb.png"); }
    static File pdf(Context c, String id) { return new File(dir(c, id), "source.pdf"); }

    static String defaultTitle() {
        return "노트 " + new SimpleDateFormat("M월 d일 HH:mm", Locale.KOREA).format(new Date());
    }

    static Model.Note create(Context c, String paper) throws Exception {
        Model.Note n = new Model.Note();
        n.id = UUID.randomUUID().toString().substring(0, 12);
        n.title = defaultTitle();
        n.created = n.modified = System.currentTimeMillis();
        n.pages.add(Model.Page.blank(paper));
        dir(c, n.id).mkdirs();
        save(c, n);
        return n;
    }

    /** PDF를 노트로: 원본을 복사해 두고 쪽마다 쪽 크기를 맞춤 */
    static Model.Note importPdf(Context c, Uri uri, String name) throws Exception {
        Model.Note n = new Model.Note();
        n.id = UUID.randomUUID().toString().substring(0, 12);
        n.created = n.modified = System.currentTimeMillis();
        n.hasPdf = true;
        n.title = name != null && !name.isEmpty() ? name.replaceAll("(?i)\\.pdf$", "") : defaultTitle();
        File d = dir(c, n.id);
        d.mkdirs();
        File out = pdf(c, n.id);
        try (InputStream in = c.getContentResolver().openInputStream(uri); OutputStream o = new FileOutputStream(out)) {
            if (in == null) throw new IOException("파일을 열 수 없어요");
            byte[] b = new byte[64 * 1024];
            int k;
            while ((k = in.read(b)) > 0) o.write(b, 0, k);
        }
        try (ParcelFileDescriptor fd = ParcelFileDescriptor.open(out, ParcelFileDescriptor.MODE_READ_ONLY);
             PdfRenderer r = new PdfRenderer(fd)) {
            int count = r.getPageCount();
            if (count == 0) throw new IOException("쪽이 없는 PDF예요");
            for (int i = 0; i < count; i++) {
                try (PdfRenderer.Page p = r.openPage(i)) {
                    Model.Page pg = Model.Page.blank(Model.PLAIN);
                    pg.pdf = i;
                    pg.ptW = p.getWidth();
                    pg.ptH = p.getHeight();
                    pg.h = Model.PAGE_W * pg.ptH / Math.max(1f, pg.ptW);
                    n.pages.add(pg);
                }
            }
        } catch (Exception e) {
            delete(c, n.id);
            throw new IOException("PDF를 읽지 못했어요 (암호가 걸렸거나 손상된 파일일 수 있어요)", e);
        }
        save(c, n);
        return n;
    }

    static synchronized void save(Context c, Model.Note n) throws Exception {
        File d = dir(c, n.id);
        if (!d.exists()) d.mkdirs();
        File tmp = new File(d, "note.json.tmp");
        try (FileOutputStream o = new FileOutputStream(tmp)) {
            o.write(n.toJson().toString().getBytes(StandardCharsets.UTF_8));
            o.getFD().sync();
        }
        File f = json(c, n.id);
        if (!tmp.renameTo(f)) {
            Files.copy(tmp.toPath(), f.toPath(), java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            tmp.delete();
        }
    }

    static Model.Note load(Context c, String id) throws Exception {
        byte[] b = Files.readAllBytes(json(c, id).toPath());
        return Model.Note.fromJson(new JSONObject(new String(b, StandardCharsets.UTF_8)));
    }

    /** 목록용 요약 (획은 읽지 않음) */
    static final class Item {
        String id, title;
        long modified;
        int pages;
        boolean pdf;
    }

    static List<Item> list(Context c) {
        List<Item> out = new ArrayList<>();
        File[] ds = root(c).listFiles();
        if (ds == null) return out;
        for (File d : ds) {
            File f = new File(d, "note.json");
            if (!f.exists()) continue;
            try {
                JSONObject o = new JSONObject(new String(Files.readAllBytes(f.toPath()), StandardCharsets.UTF_8));
                Item it = new Item();
                it.id = o.getString("id");
                it.title = o.optString("title", "노트");
                it.modified = o.optLong("modified", f.lastModified());
                it.pdf = o.optBoolean("hasPdf");
                org.json.JSONArray p = o.optJSONArray("pages");
                it.pages = p == null ? 1 : p.length();
                out.add(it);
            } catch (Exception ignored) { }
        }
        Collections.sort(out, (a, b) -> Long.compare(b.modified, a.modified));
        return out;
    }

    static void rename(Context c, String id, String title) throws Exception {
        Model.Note n = load(c, id);
        n.title = title;
        n.modified = System.currentTimeMillis();
        save(c, n);
    }

    static void delete(Context c, String id) {
        File d = dir(c, id);
        File[] fs = d.listFiles();
        if (fs != null) for (File f : fs) f.delete();
        d.delete();
    }
}
