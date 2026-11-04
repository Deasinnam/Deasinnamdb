package com.daesinnam.amp;

import android.net.Uri;
import android.security.NetworkSecurityPolicy;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.media3.common.C;
import androidx.media3.common.util.UnstableApi;
import androidx.media3.datasource.BaseDataSource;
import androidx.media3.datasource.DataSource;
import androidx.media3.datasource.DataSpec;
import androidx.media3.datasource.DefaultHttpDataSource;

import java.io.BufferedInputStream;
import java.io.ByteArrayOutputStream;
import java.io.EOFException;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;

/**
 * 인터넷 라디오 전용 http 읽기.
 * 앱 전체는 암호화되지 않은 http 통신을 막아 두었고(network_security_config), 공개 라디오 목록의 방송 중에는
 * http로만 나오는 것이 많아 라디오 소리(공개 음성 방송)만 이 클래스로 받습니다.
 * - https 주소, 또는 정책에서 허용한 http 주소는 표준 클라이언트(DefaultHttpDataSource)를 그대로 씁니다.
 * - 그 밖의 http 주소만 소켓으로 직접 GET 합니다(리다이렉트·chunked·ICY 응답·Range 처리).
 */
@UnstableApi
final class RadioHttpDataSource extends BaseDataSource {

    /** 라디오 재생기에 넘기는 공장 */
    static final class Maker implements DataSource.Factory {
        private final DefaultHttpDataSource.Factory std;
        private final String ua;
        Maker(DefaultHttpDataSource.Factory std, String ua) { this.std = std; this.ua = ua; }
        @NonNull @Override public DataSource createDataSource() { return new RadioHttpDataSource(std, ua); }
    }

    private static final int MAX_REDIRECTS = 6;
    private final DefaultHttpDataSource.Factory stdFactory;
    private final String ua;
    @Nullable private DataSource delegate;
    @Nullable private Socket sock;
    @Nullable private InputStream in;
    @Nullable private Uri uri;
    private Map<String, List<String>> headers = Collections.emptyMap();
    private long remaining = C.LENGTH_UNSET;
    private boolean chunked, chunkEnd;
    private long chunkLeft;
    private boolean opened;

    RadioHttpDataSource(DefaultHttpDataSource.Factory std, String ua) {
        super(/* isNetwork= */ true);
        this.stdFactory = std;
        this.ua = ua;
    }

    /** 정책상 이 주소를 표준 클라이언트로 받을 수 있는지 */
    static boolean stdAllowed(Uri u) {
        if (u == null || !"http".equalsIgnoreCase(u.getScheme())) return true;
        String h = u.getHost();
        try { return h != null && NetworkSecurityPolicy.getInstance().isCleartextTrafficPermitted(h); }
        catch (Throwable t) { return false; }
    }

    @Override
    public long open(@NonNull DataSpec spec) throws IOException {
        transferInitializing(spec);
        if (stdAllowed(spec.uri)) return openStd(spec);
        URL u = new URL(spec.uri.toString());
        for (int hop = 0; ; hop++) {
            Resp r = request(u, spec.httpRequestHeaders, spec.position, spec.length, ua);
            if (r.code >= 300 && r.code < 400 && r.location != null) {
                r.close();
                if (hop >= MAX_REDIRECTS) throw new IOException("Too many redirects");
                u = new URL(u, r.location);
                if (!"http".equalsIgnoreCase(u.getProtocol()) || stdAllowed(Uri.parse(u.toString())))
                    return openStd(spec.buildUpon().setUri(Uri.parse(u.toString())).build());
                continue;
            }
            if (r.code < 200 || r.code >= 300) {
                r.close();
                throw new IOException("HTTP " + r.code);
            }
            sock = r.sock;
            in = r.in;
            headers = r.headers;
            uri = Uri.parse(u.toString());
            chunked = r.chunked;
            chunkLeft = 0;
            chunkEnd = false;
            remaining = r.length;
            // 서버가 Range를 무시하고 처음부터 보내면 앞부분을 건너뜀
            if (spec.position > 0 && r.code == 200) skipFully(spec.position);
            if (remaining != C.LENGTH_UNSET && spec.length != C.LENGTH_UNSET) remaining = Math.min(remaining, spec.length);
            else if (spec.length != C.LENGTH_UNSET) remaining = spec.length;
            opened = true;
            transferStarted(spec);
            return remaining;
        }
    }

    private long openStd(DataSpec spec) throws IOException {
        delegate = stdFactory.createDataSource();
        long n = delegate.open(spec);
        opened = true;
        transferStarted(spec);
        return n;
    }

    @Override
    public int read(@NonNull byte[] buf, int off, int len) throws IOException {
        if (len == 0) return 0;
        if (delegate != null) {
            int n = delegate.read(buf, off, len);
            if (n > 0) bytesTransferred(n);
            return n;
        }
        int n = readRaw(buf, off, len);
        if (n > 0) bytesTransferred(n);
        return n;
    }

    private int readRaw(byte[] buf, int off, int len) throws IOException {
        if (in == null || remaining == 0 || chunkEnd) return C.RESULT_END_OF_INPUT;
        int want = len;
        if (remaining != C.LENGTH_UNSET) want = (int) Math.min(want, remaining);
        if (chunked) {
            if (chunkLeft == 0) {
                chunkLeft = readChunkSize();
                if (chunkLeft == 0) { chunkEnd = true; return C.RESULT_END_OF_INPUT; }
            }
            want = (int) Math.min(want, chunkLeft);
        }
        int n = in.read(buf, off, want);
        if (n < 0) return C.RESULT_END_OF_INPUT;
        if (chunked) {
            chunkLeft -= n;
            if (chunkLeft == 0) readLine(in); // 조각 끝의 CRLF
        }
        if (remaining != C.LENGTH_UNSET) remaining -= n;
        return n;
    }

    private long readChunkSize() throws IOException {
        String line = readLine(in);
        if (line == null) return 0;
        int semi = line.indexOf(';');
        if (semi >= 0) line = line.substring(0, semi);
        try { return Long.parseLong(line.trim(), 16); } catch (NumberFormatException e) { throw new IOException("Bad chunk"); }
    }

    private void skipFully(long n) throws IOException {
        byte[] tmp = new byte[8192];
        while (n > 0) {
            int r = readRaw(tmp, 0, (int) Math.min(tmp.length, n));
            if (r == C.RESULT_END_OF_INPUT) throw new EOFException();
            n -= r;
        }
    }

    @Nullable @Override public Uri getUri() { return delegate != null ? delegate.getUri() : uri; }

    @NonNull @Override
    public Map<String, List<String>> getResponseHeaders() {
        return delegate != null ? delegate.getResponseHeaders() : headers;
    }

    @Override
    public void close() throws IOException {
        try {
            if (delegate != null) delegate.close();
            if (sock != null) sock.close();
        } finally {
            delegate = null;
            sock = null;
            in = null;
            uri = null;
            if (opened) { opened = false; transferEnded(); }
        }
    }

    // ---------- 소켓 GET
    static final class Resp {
        int code;
        String location;
        long length = C.LENGTH_UNSET;
        boolean chunked;
        Socket sock;
        InputStream in;
        Map<String, List<String>> headers = new TreeMap<>(String.CASE_INSENSITIVE_ORDER);
        void close() { try { if (sock != null) sock.close(); } catch (IOException ignored) {} }
    }

    static Resp request(URL u, Map<String, String> extra, long pos, long len, String ua) throws IOException {
        if (!"http".equalsIgnoreCase(u.getProtocol())) throw new IOException("http only");
        String host = u.getHost();
        int port = u.getPort() > 0 ? u.getPort() : 80;
        String path = (u.getPath() == null || u.getPath().isEmpty()) ? "/" : u.getPath();
        if (u.getQuery() != null) path += "?" + u.getQuery();
        Socket s = new Socket();
        Resp r = new Resp();
        r.sock = s;
        try {
            s.connect(new InetSocketAddress(host, port), 12000);
            s.setSoTimeout(15000);
            StringBuilder q = new StringBuilder();
            q.append("GET ").append(path).append(" HTTP/1.1\r\n");
            q.append("Host: ").append(host).append(u.getPort() > 0 ? ":" + port : "").append("\r\n");
            q.append("User-Agent: ").append(ua).append("\r\n");
            q.append("Accept: */*\r\nConnection: close\r\n");
            if (extra != null) for (Map.Entry<String, String> e : extra.entrySet()) {
                String k = e.getKey(), v = e.getValue();
                if (k == null || v == null || k.indexOf('\n') >= 0 || v.indexOf('\n') >= 0 || k.indexOf('\r') >= 0 || v.indexOf('\r') >= 0) continue;
                if (k.equalsIgnoreCase("Host") || k.equalsIgnoreCase("Connection")) continue;
                q.append(k).append(": ").append(v).append("\r\n");
            }
            if (pos > 0 || len != C.LENGTH_UNSET)
                q.append("Range: bytes=").append(pos).append('-').append(len != C.LENGTH_UNSET ? String.valueOf(pos + len - 1) : "").append("\r\n");
            q.append("\r\n");
            OutputStream os = s.getOutputStream();
            os.write(q.toString().getBytes(StandardCharsets.ISO_8859_1));
            os.flush();
            InputStream in = new BufferedInputStream(s.getInputStream(), 16384);
            r.in = in;
            String status = readLine(in);
            if (status == null) throw new IOException("No response");
            // "HTTP/1.1 200 OK" 또는 SHOUTcast의 "ICY 200 OK"
            String[] p = status.trim().split("\\s+");
            if (p.length < 2) throw new IOException("Bad status");
            try { r.code = Integer.parseInt(p[1]); } catch (NumberFormatException e) { throw new IOException("Bad status"); }
            String line;
            int n = 0;
            while ((line = readLine(in)) != null && !line.isEmpty() && n++ < 200) {
                int c = line.indexOf(':');
                if (c <= 0) continue;
                String k = line.substring(0, c).trim(), v = line.substring(c + 1).trim();
                List<String> l = r.headers.get(k);
                if (l == null) { l = new ArrayList<>(); r.headers.put(k, l); }
                l.add(v);
                String kl = k.toLowerCase(Locale.ROOT);
                if (kl.equals("location")) r.location = v;
                else if (kl.equals("content-length")) { try { r.length = Long.parseLong(v); } catch (NumberFormatException ignored) {} }
                else if (kl.equals("transfer-encoding") && v.toLowerCase(Locale.ROOT).contains("chunked")) r.chunked = true;
            }
            if (r.chunked) r.length = C.LENGTH_UNSET;
            return r;
        } catch (IOException e) {
            r.close();
            throw e;
        }
    }

    /** CRLF(또는 LF)까지 한 줄(최대 8KB) */
    @Nullable
    static String readLine(InputStream in) throws IOException {
        ByteArrayOutputStream b = new ByteArrayOutputStream(128);
        int c;
        while ((c = in.read()) != -1) {
            if (c == '\n') break;
            if (c != '\r') b.write(c);
            if (b.size() > 8192) throw new IOException("Header too long");
        }
        if (c == -1 && b.size() == 0) return null;
        return b.toString("ISO-8859-1");
    }

    /** 재생목록(.pls/.m3u)처럼 짧은 글을 읽음 — https·허용된 http는 표준, 그 밖의 http는 소켓 */
    @Nullable
    static String getText(String url, String ua, int max) {
        DataSource d = new RadioHttpDataSource(new DefaultHttpDataSource.Factory().setUserAgent(ua)
                .setAllowCrossProtocolRedirects(true).setConnectTimeoutMs(8000).setReadTimeoutMs(8000), ua);
        try {
            d.open(new DataSpec(Uri.parse(url)));
            ByteArrayOutputStream b = new ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            int n;
            while (b.size() < max && (n = d.read(buf, 0, buf.length)) != C.RESULT_END_OF_INPUT) b.write(buf, 0, n);
            return b.toString("UTF-8");
        } catch (Exception e) {
            return null;
        } finally {
            try { d.close(); } catch (Exception ignored) {}
        }
    }
}
