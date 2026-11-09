package com.daesinnam.ieum;

import android.content.Context;
import android.util.Log;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.ServerSocket;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;

/**
 * 앱 안의 Node.js (워드·엑셀·파워포인트·EPUB·마인드맵·다이어그램의 데스크톱 메인 코드를 돌림).
 *
 *  - node 실행 파일은 lib/<abi>/libnode.so 로 설치됩니다 (안드로이드는 여기 있는 파일만 실행을 허용).
 *  - 돌릴 코드(assets/node.zip)는 처음 한 번 앱 폴더에 풉니다. 내용이 바뀌면(버전 표시) 다시 풉니다.
 *  - Node는 127.0.0.1의 임의 포트에서 듣고, 앱만 아는 비밀값(token)이 있어야 응답합니다.
 */
final class NodeRuntime {
    private static final String TAG = "IeumNode";
    private final Context context;
    private final File nativeDir;
    private final File homeDir;
    private final OkHttpClient http = new OkHttpClient.Builder()
            .readTimeout(0, TimeUnit.MILLISECONDS)
            .pingInterval(0, TimeUnit.MILLISECONDS)
            .build();

    private Process process;
    private int port;
    private String token;
    private volatile boolean ready;
    private volatile String failure;
    private final Object lock = new Object();

    interface Listener {
        void onState(String state, String detail);
    }

    NodeRuntime(Context context) {
        this.context = context.getApplicationContext();
        this.nativeDir = new File(context.getApplicationInfo().nativeLibraryDir);
        this.homeDir = new File(context.getFilesDir(), "node");
    }

    boolean isAvailable() {
        return new File(nativeDir, "libnode.so").exists();
    }

    boolean isReady() {
        return ready;
    }

    String failure() {
        return failure;
    }

    /** 백그라운드에서 부릅니다. 이미 돌고 있으면 바로 돌아옵니다. */
    void ensureStarted(Listener listener) {
        synchronized (lock) {
            if (ready && process != null && process.isAlive()) return;
            failure = null;
            ready = false;
            try {
                if (!isAvailable()) throw new IOException("이 기기용 Node 런타임이 앱에 없습니다");
                File project = prepareProject(listener);
                start(project, listener);
            } catch (Exception e) {
                failure = e.getMessage();
                Log.e(TAG, "Node 시작 실패", e);
                if (listener != null) listener.onState("failed", failure);
            }
        }
    }

    private File prepareProject(Listener listener) throws IOException {
        String version = readAsset("node.zip.version").trim();
        File dir = new File(homeDir, "app-" + version);
        File done = new File(dir, ".complete");
        if (done.exists()) return dir;
        if (listener != null) listener.onState("extracting", "처음 실행 준비 중 (문서 엔진 설치)");
        deleteTree(homeDir);
        if (!dir.mkdirs() && !dir.isDirectory()) throw new IOException("폴더를 만들 수 없습니다: " + dir);
        String root = dir.getCanonicalPath() + File.separator;
        byte[] buf = new byte[1 << 16];
        try (ZipInputStream zin = new ZipInputStream(context.getAssets().open("node.zip"))) {
            ZipEntry e;
            while ((e = zin.getNextEntry()) != null) {
                File f = new File(dir, e.getName());
                if (!f.getCanonicalPath().startsWith(root)) throw new IOException("잘못된 경로: " + e.getName());
                if (e.isDirectory()) { f.mkdirs(); continue; }
                File parent = f.getParentFile();
                if (parent != null) parent.mkdirs();
                try (OutputStream out = new FileOutputStream(f)) {
                    int n;
                    while ((n = zin.read(buf)) > 0) out.write(buf, 0, n);
                }
            }
        }
        if (!done.createNewFile() && !done.exists()) throw new IOException("설치 표시를 남기지 못했습니다");
        return dir;
    }

    private void start(File project, Listener listener) throws IOException, InterruptedException {
        if (process != null) process.destroy();
        try (ServerSocket s = new ServerSocket(0)) {
            port = s.getLocalPort();
        }
        byte[] r = new byte[24];
        new SecureRandom().nextBytes(r);
        StringBuilder sb = new StringBuilder();
        for (byte b : r) sb.append(String.format("%02x", b));
        token = sb.toString();

        File data = new File(context.getFilesDir(), "nodedata");
        data.mkdirs();
        File tmp = new File(context.getCacheDir(), "nodetmp");
        tmp.mkdirs();

        File libLinks = linkLibraries();
        ProcessBuilder pb = new ProcessBuilder(
                new File(nativeDir, "libnode.so").getAbsolutePath(),
                "--max-old-space-size=1024",
                new File(project, "host.js").getAbsolutePath());
        pb.directory(project);
        pb.redirectErrorStream(true);
        Map<String, String> env = pb.environment();
        env.put("LD_LIBRARY_PATH", libLinks.getAbsolutePath() + ":" + nativeDir.getAbsolutePath());
        env.put("IEUM_PORT", String.valueOf(port));
        env.put("IEUM_TOKEN", token);
        env.put("IEUM_DATA", data.getAbsolutePath());
        env.put("IEUM_RESOURCES", new File(project, "resources").getAbsolutePath());
        env.put("IEUM_SIDECAR", new File(nativeDir, "libxlsxsidecar.so").getAbsolutePath());
        env.put("HOME", data.getAbsolutePath());
        env.put("TMPDIR", tmp.getAbsolutePath());
        env.put("LANG", "ko_KR.UTF-8");
        if (listener != null) listener.onState("starting", "문서 엔진 시작 중");
        process = pb.start();
        final Process p = process;
        final Object readyLock = new Object();
        Thread reader = new Thread(() -> {
            try (BufferedReader in = new BufferedReader(new InputStreamReader(p.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = in.readLine()) != null) {
                    Log.i(TAG, line);
                    if (line.startsWith("IEUM_READY ")) {
                        ready = true;
                        synchronized (readyLock) { readyLock.notifyAll(); }
                    }
                }
            } catch (IOException ignored) {
            }
            ready = false;
            synchronized (readyLock) { readyLock.notifyAll(); }
            Log.w(TAG, "Node 종료");
        }, "ieum-node-log");
        reader.setDaemon(true);
        reader.start();
        long deadline = System.currentTimeMillis() + 30000;
        synchronized (readyLock) {
            while (!ready && p.isAlive() && System.currentTimeMillis() < deadline) readyLock.wait(500);
        }
        if (!ready) {
            failure = p.isAlive() ? "문서 엔진이 제때 시작하지 않았습니다" : "문서 엔진이 시작하자마자 멈췄습니다 (코드 " + safeExit(p) + ")";
            p.destroy();
            throw new IOException(failure);
        }
        if (listener != null) listener.onState("ready", "");
    }

    /**
     * node가 찾는 원래 이름(libz.so.1 등)으로, 설치된 라이브러리(libz_1.so)를 가리키는 심볼릭 링크를 만듭니다.
     * 링크 대상은 앱 설치 폴더에 있으므로 안드로이드가 실행용으로 불러오는 것을 허용합니다.
     */
    private File linkLibraries() throws IOException {
        File dir = new File(context.getFilesDir(), "nodelib");
        deleteTree(dir);
        if (!dir.mkdirs()) throw new IOException("라이브러리 링크 폴더를 만들 수 없습니다");
        String map;
        try (InputStream in = context.getAssets().open("nodelibs.txt")) {
            java.io.ByteArrayOutputStream bo = new java.io.ByteArrayOutputStream();
            byte[] b = new byte[4096];
            int n;
            while ((n = in.read(b)) > 0) bo.write(b, 0, n);
            map = bo.toString("UTF-8");
        }
        for (String line : map.split("\n")) {
            int eq = line.indexOf('=');
            if (eq <= 0) continue;
            File target = new File(nativeDir, line.substring(eq + 1).trim());
            if (!target.exists()) continue;
            try {
                android.system.Os.symlink(target.getAbsolutePath(), new File(dir, line.substring(0, eq).trim()).getAbsolutePath());
            } catch (android.system.ErrnoException e) {
                throw new IOException("라이브러리 링크 실패: " + line, e);
            }
        }
        return dir;
    }

    private static String safeExit(Process p) {
        try {
            return String.valueOf(p.exitValue());
        } catch (Exception e) {
            return "?";
        }
    }

    void stop() {
        synchronized (lock) {
            ready = false;
            if (process != null) process.destroy();
            process = null;
        }
    }

    // ---------- 화면 ↔ Node 중계 ----------

    WebSocket openSocket(String query, WebSocketListener listener) {
        Request req = new Request.Builder()
                .url("http://127.0.0.1:" + port + "/ws?token=" + token + "&" + query)
                .build();
        return http.newWebSocket(req, listener);
    }

    /** /proto/... 요청을 Node로 넘깁니다. 결과: 상태 코드, 헤더, 본문 */
    static final class ProxyResult {
        int status;
        String reason = "OK";
        String mime = "application/octet-stream";
        String encoding;
        Map<String, String> headers = new HashMap<>();
        InputStream body;
    }

    ProxyResult proxy(String pathAndQuery, String method) throws IOException {
        if (!ready) throw new IOException("문서 엔진이 아직 준비되지 않았습니다");
        HttpURLConnection c = (HttpURLConnection) new URL("http://127.0.0.1:" + port + pathAndQuery).openConnection();
        c.setRequestMethod(method == null ? "GET" : method);
        c.setRequestProperty("x-ieum-token", token);
        c.setConnectTimeout(5000);
        c.setReadTimeout(60000);
        ProxyResult r = new ProxyResult();
        r.status = c.getResponseCode();
        String msg = c.getResponseMessage();
        if (msg != null && !msg.isEmpty()) r.reason = msg;
        for (Map.Entry<String, List<String>> h : c.getHeaderFields().entrySet()) {
            if (h.getKey() == null || h.getValue().isEmpty()) continue;
            String k = h.getKey().toLowerCase();
            if (k.equals("content-length") || k.equals("transfer-encoding") || k.equals("connection") || k.equals("keep-alive")) continue;
            r.headers.put(h.getKey(), h.getValue().get(0));
        }
        String type = c.getContentType();
        if (type != null) {
            String[] parts = type.split(";");
            r.mime = parts[0].trim();
            for (String p : parts) {
                p = p.trim();
                if (p.toLowerCase().startsWith("charset=")) r.encoding = p.substring(8);
            }
        }
        r.body = r.status >= 400 ? c.getErrorStream() : c.getInputStream();
        return r;
    }

    private String readAsset(String name) throws IOException {
        try (InputStream in = context.getAssets().open(name)) {
            byte[] b = new byte[256];
            int n = in.read(b);
            return new String(b, 0, Math.max(n, 0), StandardCharsets.UTF_8);
        }
    }

    private static void deleteTree(File f) {
        if (!f.exists()) return;
        File[] kids = f.listFiles();
        if (kids != null) for (File k : kids) deleteTree(k);
        //noinspection ResultOfMethodCallIgnored
        f.delete();
    }
}
