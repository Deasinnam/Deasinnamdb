package com.daesinnam.work;

import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.net.Uri;
import android.provider.OpenableColumns;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * 웹 화면에는 실제 content:// 주소 대신 짧은 문서 번호(id)만 넘깁니다.
 * 번호 → 주소 대응은 여기서 관리하고, 오래 쓸 수 있는 권한을 받은 문서만 기기에 기억합니다.
 */
final class DocStore {
    private static final String PREFS = "ieum.docs";
    private final Context context;
    private final SharedPreferences prefs;
    private final Map<String, Uri> session = new HashMap<>();
    private final Map<String, String> names = new HashMap<>();

    DocStore(Context context) {
        this.context = context.getApplicationContext();
        this.prefs = this.context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    /** 문서를 등록하고 번호를 돌려줍니다. 같은 주소는 같은 번호를 다시 씁니다. */
    synchronized String add(Uri uri, boolean persistable) {
        String key = uri.toString();
        for (Map.Entry<String, ?> e : prefs.getAll().entrySet()) {
            if (key.equals(e.getValue())) {
                session.put(e.getKey(), uri);
                return e.getKey();
            }
        }
        for (Map.Entry<String, Uri> e : session.entrySet()) {
            if (e.getValue().equals(uri)) return e.getKey();
        }
        String id = UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        session.put(id, uri);
        if (persistable && takePersistable(uri)) prefs.edit().putString(id, key).apply();
        return id;
    }

    synchronized Uri get(String id) {
        if (id == null) return null;
        Uri uri = session.get(id);
        if (uri != null) return uri;
        String saved = prefs.getString(id, null);
        if (saved == null) return null;
        uri = Uri.parse(saved);
        session.put(id, uri);
        return uri;
    }

    synchronized void forget(String id) {
        Uri uri = get(id);
        session.remove(id);
        names.remove(id);
        prefs.edit().remove(id).apply();
        if (uri != null) {
            try {
                context.getContentResolver().releasePersistableUriPermission(uri,
                        Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
            } catch (Exception ignored) {
            }
        }
    }

    String displayName(String id) {
        synchronized (this) {
            String cached = names.get(id);
            if (cached != null) return cached;
        }
        Uri uri = get(id);
        String name = uri == null ? null : queryName(uri);
        if (name == null) name = "문서";
        synchronized (this) { names.put(id, name); }
        return name;
    }

    // ---------- Node 편집기용: 문서를 앱 폴더에 실제 파일로 두고, 바뀌면 원래 위치에 옮겨 씀 ----------

    private File docsRoot() {
        return new File(context.getFilesDir(), "docs");
    }

    /** 문서 번호에 해당하는 앱 폴더 안 파일 경로 (아직 없을 수 있음) */
    File localFile(String id) {
        String name = displayName(id).replaceAll("[\\\\/:*?\"<>|\\u0000]", "_");
        File dir = new File(docsRoot(), id);
        //noinspection ResultOfMethodCallIgnored
        dir.mkdirs();
        return new File(dir, name);
    }

    /** 원본(content://)을 앱 폴더로 복사하고 그 경로를 돌려줍니다 */
    File materialize(String id) throws IOException {
        Uri uri = get(id);
        if (uri == null) throw new IOException("알 수 없는 문서");
        File f = localFile(id);
        File tmp = new File(f.getPath() + ".part");
        try (InputStream in = context.getContentResolver().openInputStream(uri);
             OutputStream out = new FileOutputStream(tmp)) {
            if (in == null) throw new IOException("파일을 열 수 없습니다");
            copy(in, out);
        }
        if (!tmp.renameTo(f)) throw new IOException("파일을 옮기지 못했습니다");
        return f;
    }

    /** 앱 폴더 안 파일 경로 → 문서 번호 (docs/<id>/이름) */
    String idForLocal(String path) {
        try {
            File f = new File(path).getCanonicalFile();
            File root = docsRoot().getCanonicalFile();
            File parent = f.getParentFile();
            if (parent == null || parent.getParentFile() == null) return null;
            if (!parent.getParentFile().equals(root)) return null;
            String id = parent.getName();
            return get(id) != null ? id : null;
        } catch (IOException e) {
            return null;
        }
    }

    /** 앱 폴더의 파일을 원래 위치(content://)에 씁니다 */
    void syncBack(String id, File f) throws IOException {
        Uri uri = get(id);
        if (uri == null) throw new IOException("알 수 없는 문서");
        try (InputStream in = new FileInputStream(f)) {
            OutputStream out;
            try {
                out = context.getContentResolver().openOutputStream(uri, "wt");
            } catch (Exception e) {
                out = context.getContentResolver().openOutputStream(uri, "w");
            }
            if (out == null) throw new IOException("원래 위치에 쓸 수 없습니다");
            try (OutputStream o = out) {
                copy(in, o);
            }
        } catch (SecurityException e) {
            throw new IOException("이 파일에는 쓸 권한이 없습니다");
        }
    }

    private static void copy(InputStream in, OutputStream out) throws IOException {
        byte[] buf = new byte[1 << 16];
        int n;
        while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
    }

    String queryName(Uri uri) {
        ContentResolver cr = context.getContentResolver();
        try (Cursor c = cr.query(uri, new String[]{OpenableColumns.DISPLAY_NAME}, null, null, null)) {
            if (c != null && c.moveToFirst()) {
                String n = c.getString(0);
                if (n != null && !n.isEmpty()) return n;
            }
        } catch (Exception ignored) {
        }
        String last = uri.getLastPathSegment();
        if (last == null) return null;
        int slash = last.lastIndexOf('/');
        return slash >= 0 ? last.substring(slash + 1) : last;
    }

    private boolean takePersistable(Uri uri) {
        ContentResolver cr = context.getContentResolver();
        try {
            cr.takePersistableUriPermission(uri,
                    Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
            return true;
        } catch (Exception e) {
            try {
                cr.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
                return true;
            } catch (Exception ignored) {
                return false;
            }
        }
    }
}
