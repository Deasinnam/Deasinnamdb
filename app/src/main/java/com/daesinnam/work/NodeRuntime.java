package com.daesinnam.work;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.InetAddress;
import java.net.Proxy;
import java.net.ServerSocket;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.text.SimpleDateFormat;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
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
    /** 시작 방법. 앞의 것이 기기에서 막히면 다음 것으로 넘어갑니다. */
    private static final String[] MODES = {"direct", "copy", "linker"};
    private static NodeRuntime instance;

    private final Context context;
    private final File nativeDir;
    private final File homeDir;
    // 기기 안(127.0.0.1) 연결은 휴대폰에 설정된 프록시를 거치지 않게 합니다.
    private final OkHttpClient http = new OkHttpClient.Builder()
            .proxy(Proxy.NO_PROXY)
            .connectTimeout(8, TimeUnit.SECONDS)
            .readTimeout(0, TimeUnit.MILLISECONDS)
            .pingInterval(0, TimeUnit.MILLISECONDS)
            .build();

    private volatile Process process;
    private int port;
    private String token;
    private volatile boolean ready;
    private volatile String failure;
    private volatile String mode = "";
    private volatile long failedAt;
    private final Object lock = new Object();
    private int users;
    private final Handler main = new Handler(Looper.getMainLooper());
    private final Runnable idleStop = () -> {
        boolean still;
        synchronized (NodeRuntime.this) { still = users == 0; }
        // 멈추는 동안 화면이 굳지 않게 다른 스레드에서
        if (still) new Thread(this::stop, "ieum-node-stop").start();
    };

    /** 문제 진단용 기록 (최근 것만). 문서 내용은 담지 않습니다. */
    private final ArrayDeque<String> journal = new ArrayDeque<>();
    private final ArrayDeque<String> output = new ArrayDeque<>();

    interface Listener {
        void onState(String state, String detail);
    }

    /** 앱에 하나만 둡니다. 화면이 다시 만들어져도(창 크기·화면 전환) 문서 엔진은 그대로 씁니다. */
    static synchronized NodeRuntime get(Context context) {
        if (instance == null) instance = new NodeRuntime(context);
        return instance;
    }

    private NodeRuntime(Context context) {
        this.context = context.getApplicationContext();
        this.nativeDir = new File(context.getApplicationInfo().nativeLibraryDir);
        this.homeDir = new File(context.getFilesDir(), "node");
    }

    /** 문서 편집 화면이 열릴 때 */
    void acquire() {
        synchronized (this) { users++; }
        main.removeCallbacks(idleStop);
    }

    /** 문서 편집 화면이 닫힐 때. 곧바로 다시 열리는 경우가 있어 잠시 뒤에 멈춥니다. */
    void release() {
        boolean idle;
        synchronized (this) { users = Math.max(0, users - 1); idle = users == 0; }
        if (idle) {
            main.removeCallbacks(idleStop);
            main.postDelayed(idleStop, 20000);
        }
    }

    void note(String line) {
        String stamped = new SimpleDateFormat("HH:mm:ss.SSS", Locale.US).format(new Date()) + " " + line;
        synchronized (journal) {
            journal.addLast(stamped);
            while (journal.size() > 120) journal.removeFirst();
        }
        Log.i(TAG, line);
    }

    private void out(String line) {
        synchronized (output) {
            output.addLast(line.length() > 400 ? line.substring(0, 400) + "…" : line);
            while (output.size() > 80) output.removeFirst();
        }
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
            if (process != null && !process.isAlive()) note("엔진이 꺼져 있어 다시 시작");
            // 방금 실패했으면(기다리던 다른 요청) 같은 시도를 되풀이하지 않고 그 결과를 알려 줍니다
            if (failure != null && System.currentTimeMillis() - failedAt < 5000) {
                if (listener != null) listener.onState("failed", failure);
                return;
            }
            failure = null;
            ready = false;
            File project;
            try {
                if (!isAvailable()) throw new IOException("이 기기용 Node 런타임이 앱에 없습니다 (" + nativeDir + ")");
                killStale();
                long t0 = System.currentTimeMillis();
                project = prepareProject(listener);
                note("엔진 파일 준비 " + (System.currentTimeMillis() - t0) + "ms " + project.getName());
            } catch (Exception e) {
                failure = "문서 엔진 설치 실패: " + e;
                failedAt = System.currentTimeMillis();
                note(failure);
                Log.e(TAG, "Node 준비 실패", e);
                if (listener != null) listener.onState("failed", failure);
                return;
            }
            SharedPreferences prefs = context.getSharedPreferences("node_runtime", Context.MODE_PRIVATE);
            String preferred = prefs.getString("mode", MODES[0]);
            List<String> order = new ArrayList<>();
            order.add(preferred);
            for (String m : MODES) if (!order.contains(m)) order.add(m);
            StringBuilder why = new StringBuilder();
            for (String m : order) {
                long t0 = System.currentTimeMillis();
                try {
                    start(project, listener, m);
                    mode = m;
                    failure = null;
                    note("엔진 시작됨 방법=" + m + " " + (System.currentTimeMillis() - t0) + "ms 포트=" + port);
                    if (!m.equals(preferred)) prefs.edit().putString("mode", m).apply();
                    if (listener != null) listener.onState("ready", "");
                    return;
                } catch (Exception e) {
                    String msg = String.valueOf(e.getMessage());
                    note("엔진 시작 실패 방법=" + m + " " + (System.currentTimeMillis() - t0) + "ms: " + msg);
                    Log.e(TAG, "Node 시작 실패 (" + m + ")", e);
                    if (why.length() > 0) why.append(" / ");
                    why.append(m).append(": ").append(msg);
                    if (e instanceof InterruptedException) break;
                }
            }
            failure = why.toString();
            failedAt = System.currentTimeMillis();
            if (listener != null) listener.onState("failed", failure);
        }
    }

    /** 앱이 갑자기 꺼져 남아 있을 수 있는 예전 문서 엔진을 정리합니다 (같은 앱이 띄운 것만). */
    private void killStale() {
        File f = new File(context.getFilesDir(), "node.pid");
        try {
            if (!f.exists()) return;
            String text = new String(readAll(new java.io.FileInputStream(f)), StandardCharsets.UTF_8).trim();
            int pid = Integer.parseInt(text);
            File cmd = new File("/proc/" + pid + "/cmdline");
            if (pid > 1 && cmd.canRead()) {
                String line = new String(readAll(new java.io.FileInputStream(cmd)), StandardCharsets.UTF_8);
                if (line.contains("libnode.so") || line.contains("host.js")) {
                    android.os.Process.killProcess(pid);
                    note("남아 있던 문서 엔진 정리 pid=" + pid);
                }
            }
        } catch (Exception ignored) {
        } finally {
            //noinspection ResultOfMethodCallIgnored
            f.delete();
        }
    }

    private static byte[] readAll(InputStream in) throws IOException {
        try (InputStream i = in) {
            java.io.ByteArrayOutputStream bo = new java.io.ByteArrayOutputStream();
            byte[] b = new byte[4096];
            int n;
            while ((n = i.read(b)) > 0) bo.write(b, 0, n);
            return bo.toByteArray();
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

    private void start(File project, Listener listener, String how) throws IOException, InterruptedException {
        kill(process);
        process = null;
        try (ServerSocket s = new ServerSocket(0, 1, InetAddress.getByName("127.0.0.1"))) {
            port = s.getLocalPort();
        }
        byte[] r = new byte[24];
        new SecureRandom().nextBytes(r);
        StringBuilder sb = new StringBuilder();
        for (byte b : r) sb.append(String.format(Locale.US, "%02x", b));
        token = sb.toString();

        File data = new File(context.getFilesDir(), "nodedata");
        //noinspection ResultOfMethodCallIgnored
        data.mkdirs();
        File tmp = new File(context.getCacheDir(), "nodetmp");
        //noinspection ResultOfMethodCallIgnored
        tmp.mkdirs();

        File libs = prepareLibraries("copy".equals(how));
        String node = new File(nativeDir, "libnode.so").getAbsolutePath();
        List<String> cmd = new ArrayList<>();
        if ("linker".equals(how)) {
            // 실행 파일을 직접 띄우는 것이 막힌 기기: 시스템 로더에게 대신 띄워 달라고 합니다
            String linker = new File("/system/bin/linker64").exists() ? "/system/bin/linker64" : "/system/bin/linker";
            cmd.add(linker);
        }
        cmd.add(node);
        cmd.add("--max-old-space-size=1024");
        cmd.add(new File(project, "host.js").getAbsolutePath());
        ProcessBuilder pb = new ProcessBuilder(cmd);
        pb.directory(project);
        pb.redirectErrorStream(true);
        Map<String, String> env = pb.environment();
        env.put("LD_LIBRARY_PATH", libs.getAbsolutePath() + ":" + nativeDir.getAbsolutePath());
        env.put("IEUM_PORT", String.valueOf(port));
        env.put("IEUM_TOKEN", token);
        env.put("IEUM_DATA", data.getAbsolutePath());
        env.put("IEUM_RESOURCES", new File(project, "resources").getAbsolutePath());
        env.put("IEUM_SIDECAR", new File(nativeDir, "libxlsxsidecar.so").getAbsolutePath());
        env.put("HOME", data.getAbsolutePath());
        env.put("TMPDIR", tmp.getAbsolutePath());
        env.put("LANG", "ko_KR.UTF-8");
        // 앱이 꺼지면(입력 통로가 닫히면) 엔진도 스스로 끝나게 합니다
        env.put("IEUM_PARENT_WATCH", "1");
        // 기기 안에서만 주고받으므로 프록시 설정이 끼어들지 않게 합니다
        for (String k : new String[]{"http_proxy", "https_proxy", "HTTP_PROXY", "HTTPS_PROXY", "all_proxy", "ALL_PROXY"}) env.remove(k);
        if (listener != null) listener.onState("starting", "문서 엔진 시작 중");
        synchronized (output) { output.clear(); }
        final Process p = pb.start();
        process = p;
        writePid(p);
        final boolean[] up = {false};
        final Object readyLock = new Object();
        Thread reader = new Thread(() -> {
            try (BufferedReader in = new BufferedReader(new InputStreamReader(p.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = in.readLine()) != null) {
                    Log.i(TAG, line);
                    if (line.startsWith("IEUM_READY ")) {
                        synchronized (readyLock) { up[0] = true; readyLock.notifyAll(); }
                    } else {
                        out(line);
                    }
                }
            } catch (IOException ignored) {
            }
            synchronized (readyLock) { readyLock.notifyAll(); }
            // 지금 쓰는 엔진이 꺼진 경우에만 상태를 바꿉니다 (다시 시작한 뒤 예전 것이 늦게 꺼지는 경우 제외)
            if (process == p) {
                ready = false;
                note("엔진 종료 코드=" + waitExit(p));
            }
        }, "ieum-node-log");
        reader.setDaemon(true);
        reader.start();
        long deadline = System.currentTimeMillis() + 30000;
        synchronized (readyLock) {
            while (!up[0] && p.isAlive() && System.currentTimeMillis() < deadline) readyLock.wait(300);
            // 꺼지면서 남긴 마지막 줄(오류 설명)을 받을 시간을 조금 줍니다
            if (!up[0] && !p.isAlive()) readyLock.wait(400);
        }
        if (!up[0]) {
            boolean alive = p.isAlive();
            String msg = alive ? "30초 안에 시작하지 않음" : "시작하자마자 멈춤 (코드 " + waitExit(p) + ")";
            String last = lastOutput(3);
            if (!last.isEmpty()) msg += " — " + last;
            kill(p);
            if (process == p) process = null;
            throw new IOException(msg);
        }
        // 실제로 연결되는지까지 확인합니다
        String health = probe();
        if (health != null) {
            kill(p);
            if (process == p) process = null;
            throw new IOException("시작은 했지만 연결 안 됨: " + health);
        }
        ready = true;
    }

    /** 엔진에 실제로 붙어 보는 확인. 문제 없으면 null */
    private String probe() {
        IOException last = null;
        for (int i = 0; i < 5; i++) {
            try {
                HttpURLConnection c = (HttpURLConnection) new URL("http://127.0.0.1:" + port + "/health").openConnection(Proxy.NO_PROXY);
                c.setRequestProperty("x-ieum-token", token);
                c.setConnectTimeout(3000);
                c.setReadTimeout(5000);
                int code = c.getResponseCode();
                c.disconnect();
                if (code == 200) return null;
                last = new IOException("응답 " + code);
            } catch (IOException e) {
                last = e;
            }
            try {
                Thread.sleep(300);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
        return String.valueOf(last);
    }

    private void writePid(Process p) {
        try {
            // 안드로이드의 Process.toString(): "Process[pid=1234, hasExited=false]"
            java.util.regex.Matcher m = java.util.regex.Pattern.compile("pid=(\\d+)").matcher(String.valueOf(p));
            if (!m.find()) return;
            try (FileOutputStream o = new FileOutputStream(new File(context.getFilesDir(), "node.pid"))) {
                o.write(m.group(1).getBytes(StandardCharsets.UTF_8));
            }
        } catch (Throwable ignored) {
        }
    }

    private String lastOutput(int lines) {
        StringBuilder sb = new StringBuilder();
        synchronized (output) {
            int skip = Math.max(0, output.size() - lines);
            int i = 0;
            for (String l : output) {
                if (i++ < skip) continue;
                if (sb.length() > 0) sb.append(" | ");
                sb.append(l);
            }
        }
        return sb.toString();
    }

    /**
     * node가 찾는 원래 이름(libz.so.1 등)으로 라이브러리를 마련합니다.
     *  - 기본: 설치된 라이브러리(libz_1.so)를 가리키는 심볼릭 링크 (링크 대상은 앱 설치 폴더)
     *  - copy: 링크가 통하지 않는 기기를 위해 파일을 그대로 복사
     */
    private File prepareLibraries(boolean copy) throws IOException {
        File dir = new File(context.getFilesDir(), "nodelib");
        deleteTree(dir);
        if (!dir.mkdirs()) throw new IOException("라이브러리 폴더를 만들 수 없습니다");
        String map = new String(readAll(context.getAssets().open("nodelibs.txt")), StandardCharsets.UTF_8);
        for (String line : map.split("\n")) {
            int eq = line.indexOf('=');
            if (eq <= 0) continue;
            File target = new File(nativeDir, line.substring(eq + 1).trim());
            if (!target.exists()) continue;
            File link = new File(dir, line.substring(0, eq).trim());
            if (copy) {
                byte[] buf = new byte[1 << 16];
                try (InputStream in = new java.io.FileInputStream(target); OutputStream o = new FileOutputStream(link)) {
                    int n;
                    while ((n = in.read(buf)) > 0) o.write(buf, 0, n);
                }
                //noinspection ResultOfMethodCallIgnored
                link.setReadOnly();
                continue;
            }
            try {
                android.system.Os.symlink(target.getAbsolutePath(), link.getAbsolutePath());
            } catch (android.system.ErrnoException e) {
                throw new IOException("라이브러리 링크 실패: " + line, e);
            }
        }
        return dir;
    }

    /**
     * 문서 엔진을 확실히 끕니다. 편집기 코드가 "끝내기 신호(SIGTERM)"를 받아 스스로 처리하려 들기 때문에
     * 보통의 destroy()로는 꺼지지 않고 남습니다 → 강제 종료(SIGKILL)를 씁니다.
     */
    private static void kill(Process p) {
        if (p == null) return;
        try {
            p.destroyForcibly();
        } catch (Throwable t) {
            p.destroy();
        }
    }

    private static String waitExit(Process p) {
        try {
            for (int i = 0; i < 10 && p.isAlive(); i++) Thread.sleep(50);
            return String.valueOf(p.exitValue());
        } catch (Exception e) {
            return "?";
        }
    }

    void stop() {
        synchronized (lock) {
            ready = false;
            Process p = process;
            process = null;
            if (p != null) {
                kill(p);
                note("엔진 멈춤 (문서 편집 닫힘)");
            }
            //noinspection ResultOfMethodCallIgnored
            new File(context.getFilesDir(), "node.pid").delete();
        }
    }

    /** 엔진이 죽었거나 연결이 안 될 때: 다음 요청에서 새로 시작하게 합니다 */
    void markBroken(String why) {
        note("엔진 연결 문제: " + why);
        Process p = process;
        if (p != null && !p.isAlive()) ready = false;
    }

    /** 다시 시작 (연결이 계속 실패할 때) */
    void restart(Listener listener) {
        synchronized (lock) {
            ready = false;
            Process p = process;
            process = null;
            kill(p);
            note("엔진 다시 시작");
        }
        ensureStarted(listener);
    }

    // ---------- 문제 진단 ----------

    /** 기기에서 무엇이 안 되는지 알아보기 위한 정보. 문서 내용·파일 이름은 넣지 않습니다. */
    JSONObject diag() {
        JSONObject o = new JSONObject();
        try {
            Process p = process;
            o.put("available", isAvailable());
            o.put("ready", ready);
            o.put("alive", p != null && p.isAlive());
            o.put("mode", mode);
            if (failure != null) o.put("failure", failure);
            o.put("nativeDir", nativeDir.getAbsolutePath().replaceAll("/data/app/[^/]+/[^/]+/", "/data/app/…/"));
            JSONArray libs = new JSONArray();
            File[] files = nativeDir.listFiles();
            if (files != null) {
                java.util.Arrays.sort(files);
                for (File f : files) libs.put(f.getName() + ":" + f.length() + (f.canExecute() ? ":x" : ":-"));
            }
            o.put("libs", libs);
            String version = "";
            try { version = readAsset("node.zip.version").trim(); } catch (IOException ignored) { }
            o.put("project", version);
            o.put("installed", new File(new File(homeDir, "app-" + version), ".complete").exists());
            o.put("freeMB", context.getFilesDir().getUsableSpace() / (1024 * 1024));
            JSONArray j = new JSONArray();
            synchronized (journal) { for (String l : journal) j.put(l); }
            o.put("journal", j);
            JSONArray out = new JSONArray();
            synchronized (output) { for (String l : output) out.put(l); }
            o.put("output", out);
        } catch (Exception e) {
            try { o.put("error", String.valueOf(e)); } catch (Exception ignored) { }
        }
        return o;
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
        HttpURLConnection c = (HttpURLConnection) new URL("http://127.0.0.1:" + port + pathAndQuery).openConnection(Proxy.NO_PROXY);
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
