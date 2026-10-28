package com.daesinnam.amp;

import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.content.res.AssetFileDescriptor;
import android.database.Cursor;
import android.media.MediaMetadataRetriever;
import android.net.Uri;
import android.provider.DocumentsContract;
import android.provider.OpenableColumns;
import android.util.LruCache;
import android.webkit.WebResourceResponse;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * 기기의 음악 파일을 영구 권한으로 기억하고, 웹 화면 플레이어에 스트리밍합니다.
 * - /media?u=<content uri> : 음악 파일 (탐색을 위한 Range 요청 지원)
 * - /art?u=<content uri>   : 파일에 들어 있는 앨범 아트
 */
final class MediaLibrary {

    private static final int MAX_TRACKS = 3000;
    private static final LruCache<String, byte[]> ART = new LruCache<String, byte[]>(24 * 1024 * 1024) {
        @Override
        protected int sizeOf(String key, byte[] value) {
            return value.length;
        }
    };

    private MediaLibrary() {}

    /** 선택한 파일·폴더의 읽기 권한을 앱을 다시 켜도 유지되게 받습니다. */
    static void persist(ContentResolver cr, Uri uri) {
        try {
            cr.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
        } catch (Exception ignored) {
            // 일부 파일 앱은 영구 권한을 주지 않습니다. 그 경우 이번 실행 동안만 재생됩니다.
        }
    }

    static boolean isAudioName(String name) {
        String n = name == null ? "" : name.toLowerCase(Locale.ROOT);
        return n.endsWith(".mp3") || n.endsWith(".m4a") || n.endsWith(".aac") || n.endsWith(".ogg") || n.endsWith(".oga")
                || n.endsWith(".opus") || n.endsWith(".wav") || n.endsWith(".flac");
    }

    /** 폴더(트리) 안의 음악 파일을 하위 폴더까지 찾아 목록으로 돌려줍니다. */
    static List<Uri> scanTree(ContentResolver cr, Uri tree) {
        List<Uri> out = new ArrayList<>();
        String rootId = DocumentsContract.getTreeDocumentId(tree);
        List<String> stack = new ArrayList<>();
        stack.add(rootId);
        while (!stack.isEmpty() && out.size() < MAX_TRACKS) {
            String parent = stack.remove(stack.size() - 1);
            Uri children = DocumentsContract.buildChildDocumentsUriUsingTree(tree, parent);
            try (Cursor c = cr.query(children, new String[]{
                    DocumentsContract.Document.COLUMN_DOCUMENT_ID,
                    DocumentsContract.Document.COLUMN_MIME_TYPE,
                    DocumentsContract.Document.COLUMN_DISPLAY_NAME}, null, null, null)) {
                if (c == null) continue;
                List<String[]> files = new ArrayList<>();
                while (c.moveToNext()) {
                    String id = c.getString(0), mime = c.getString(1), name = c.getString(2);
                    if (DocumentsContract.Document.MIME_TYPE_DIR.equals(mime)) stack.add(id);
                    else if ((mime != null && mime.startsWith("audio/")) || isAudioName(name)) files.add(new String[]{id, name});
                }
                files.sort((a, b) -> String.CASE_INSENSITIVE_ORDER.compare(a[1] == null ? "" : a[1], b[1] == null ? "" : b[1]));
                for (String[] f : files) out.add(DocumentsContract.buildDocumentUriUsingTree(tree, f[0]));
            } catch (Exception ignored) {}
        }
        return out;
    }

    /** 파일 하나의 이름·크기·태그(제목/아티스트/길이/아트 유무)를 읽습니다. */
    static JSONObject describe(Context ctx, Uri uri) {
        JSONObject o = new JSONObject();
        try {
            o.put("uri", uri.toString());
            String name = null;
            long size = 0;
            try (Cursor c = ctx.getContentResolver().query(uri, new String[]{OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE}, null, null, null)) {
                if (c != null && c.moveToFirst()) {
                    name = c.getString(0);
                    size = c.isNull(1) ? 0 : c.getLong(1);
                }
            } catch (Exception ignored) {}
            o.put("name", name == null ? "" : name);
            o.put("size", size);
            MediaMetadataRetriever r = new MediaMetadataRetriever();
            try {
                r.setDataSource(ctx, uri);
                String t = r.extractMetadata(MediaMetadataRetriever.METADATA_KEY_TITLE);
                String a = r.extractMetadata(MediaMetadataRetriever.METADATA_KEY_ARTIST);
                if (a == null) a = r.extractMetadata(MediaMetadataRetriever.METADATA_KEY_ALBUMARTIST);
                String al = r.extractMetadata(MediaMetadataRetriever.METADATA_KEY_ALBUM);
                String d = r.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION);
                if (t != null) o.put("title", t);
                if (a != null) o.put("artist", a);
                if (al != null) o.put("album", al);
                if (d != null) o.put("duration", Long.parseLong(d) / 1000.0);
                byte[] pic = r.getEmbeddedPicture();
                o.put("hasArt", pic != null);
                if (pic != null) ART.put(uri.toString(), pic);
            } catch (Exception ignored) {
                o.put("hasArt", false);
            } finally {
                try { r.release(); } catch (Exception ignored) {}
            }
        } catch (Exception ignored) {}
        return o;
    }

    static JSONArray describeAll(Context ctx, List<Uri> uris) {
        JSONArray arr = new JSONArray();
        for (Uri u : uris) arr.put(describe(ctx, u));
        return arr;
    }

    // ------------------------------------------------------------ 웹 화면으로 스트리밍

    static WebResourceResponse serve(Context ctx, Uri reqUrl, Map<String, String> headers) {
        String path = reqUrl.getPath();
        String u = reqUrl.getQueryParameter("u");
        if (u == null) return null;
        Uri uri = Uri.parse(u);
        if ("/art".equals(path)) return art(ctx, uri);
        if ("/media".equals(path)) return media(ctx, uri, headers);
        return null;
    }

    private static Map<String, String> baseHeaders() {
        Map<String, String> h = new HashMap<>();
        h.put("Access-Control-Allow-Origin", "*");
        h.put("Cache-Control", "no-store");
        return h;
    }

    private static WebResourceResponse art(Context ctx, Uri uri) {
        byte[] pic = ART.get(uri.toString());
        if (pic == null) {
            MediaMetadataRetriever r = new MediaMetadataRetriever();
            try {
                r.setDataSource(ctx, uri);
                pic = r.getEmbeddedPicture();
                if (pic != null) ART.put(uri.toString(), pic);
            } catch (Exception ignored) {
            } finally {
                try { r.release(); } catch (Exception ignored) {}
            }
        }
        if (pic == null) return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", baseHeaders(), new ByteArrayInputStream(new byte[0]));
        String mime = (pic.length > 3 && (pic[0] & 0xff) == 0x89) ? "image/png" : "image/jpeg";
        return new WebResourceResponse(mime, null, 200, "OK", baseHeaders(), new ByteArrayInputStream(pic));
    }

    private static String mimeOf(Context ctx, Uri uri) {
        String m = null;
        try { m = ctx.getContentResolver().getType(uri); } catch (Exception ignored) {}
        return m != null ? m : "audio/mpeg";
    }

    private static WebResourceResponse media(Context ctx, Uri uri, Map<String, String> reqHeaders) {
        Map<String, String> h = baseHeaders();
        String mime = mimeOf(ctx, uri);
        try {
            AssetFileDescriptor afd = ctx.getContentResolver().openAssetFileDescriptor(uri, "r");
            if (afd == null) throw new IOException("no fd");
            long total = afd.getLength();
            InputStream in = afd.createInputStream();
            h.put("Accept-Ranges", "bytes");
            String range = null;
            if (reqHeaders != null) {
                for (Map.Entry<String, String> e : reqHeaders.entrySet()) {
                    if ("range".equalsIgnoreCase(e.getKey())) range = e.getValue();
                }
            }
            if (range != null && range.startsWith("bytes=") && total > 0) {
                String[] p = range.substring(6).split("-", 2);
                long start = p[0].isEmpty() ? 0 : Long.parseLong(p[0].trim());
                long end = (p.length > 1 && !p[1].trim().isEmpty()) ? Long.parseLong(p[1].trim()) : total - 1;
                if (start >= total) {
                    in.close();
                    h.put("Content-Range", "bytes */" + total);
                    return new WebResourceResponse(mime, null, 416, "Range Not Satisfiable", h, new ByteArrayInputStream(new byte[0]));
                }
                end = Math.min(end, total - 1);
                long skipped = 0;
                while (skipped < start) {
                    long n = in.skip(start - skipped);
                    if (n <= 0) break;
                    skipped += n;
                }
                long len = end - start + 1;
                h.put("Content-Range", "bytes " + start + "-" + end + "/" + total);
                h.put("Content-Length", String.valueOf(len));
                return new WebResourceResponse(mime, null, 206, "Partial Content", h, new Limited(in, len));
            }
            if (total > 0) h.put("Content-Length", String.valueOf(total));
            return new WebResourceResponse(mime, null, 200, "OK", h, in);
        } catch (Exception e) {
            return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", h,
                    new ByteArrayInputStream("파일을 열 수 없어요. 파일이 옮겨졌거나 지워졌을 수 있어요.".getBytes()));
        }
    }

    /** 정해진 길이만큼만 읽게 하는 스트림 (Range 응답용) */
    private static final class Limited extends FilterInputStream {
        private long left;

        Limited(InputStream in, long len) {
            super(in);
            left = len;
        }

        @Override
        public int read() throws IOException {
            if (left <= 0) return -1;
            int b = super.read();
            if (b >= 0) left--;
            return b;
        }

        @Override
        public int read(byte[] b, int off, int len) throws IOException {
            if (left <= 0) return -1;
            int n = super.read(b, off, (int) Math.min(len, left));
            if (n > 0) left -= n;
            return n;
        }
    }
}
