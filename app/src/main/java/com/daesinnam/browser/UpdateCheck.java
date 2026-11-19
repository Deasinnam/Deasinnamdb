package com.daesinnam.browser;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * 새 버전 알림: 하루 한 번 덜누름 사이트의 /versions.json 을 읽어 지금 버전과 비교합니다.
 * 보내는 정보는 없습니다(파일 하나를 읽기만 함). 사용자가 닫은 버전은 다음 새 버전이 나올 때까지 다시 알리지 않습니다.
 */
final class UpdateCheck {
    static final String URL_VERSIONS = "https://deolnureum.com/versions.json";
    private static final long DAY = 24L * 60 * 60 * 1000;

    /** 확인 결과. newer = 지금 버전보다 새 버전이 있음 */
    static final class Result {
        String latest = "", date = "", note = "", page = "", changes = "";
        boolean newer, dismissed;
        long checkedAt;
    }

    interface Callback { void done(Result r); }

    private UpdateCheck() { }

    private static SharedPreferences prefs(Context c) { return c.getSharedPreferences("update_check", Context.MODE_PRIVATE); }

    /** 마지막으로 확인한 결과(인터넷 없이) */
    static Result cached(Context c, String current) {
        SharedPreferences p = prefs(c);
        Result r = new Result();
        r.latest = p.getString("latest", "");
        r.date = p.getString("date", "");
        r.note = p.getString("note", "");
        r.page = p.getString("page", "");
        r.changes = p.getString("changes", "");
        r.checkedAt = p.getLong("checkedAt", 0);
        r.newer = !r.latest.isEmpty() && compare(r.latest, current) > 0;
        r.dismissed = r.latest.equals(p.getString("dismissed", ""));
        return r;
    }

    static boolean enabled(Context c) { return prefs(c).getBoolean("enabled", true); }

    static void setEnabled(Context c, boolean on) { prefs(c).edit().putBoolean("enabled", on).apply(); }

    static void dismiss(Context c, String version) { prefs(c).edit().putString("dismissed", version).apply(); }

    /**
     * 확인합니다. force=false 면 꺼져 있거나 하루가 안 지났을 때 저장된 결과만 돌려줍니다.
     * callback 은 화면 스레드에서 부릅니다.
     */
    static void check(Context ctx, String appKey, String current, boolean force, Callback cb) {
        final Context c = ctx.getApplicationContext();
        Handler main = new Handler(Looper.getMainLooper());
        Result old = cached(c, current);
        if (!force && (!enabled(c) || System.currentTimeMillis() - old.checkedAt < DAY)) {
            main.post(() -> cb.done(old));
            return;
        }
        new Thread(() -> {
            Result r = old;
            HttpURLConnection con = null;
            try {
                con = (HttpURLConnection) new URL(URL_VERSIONS).openConnection();
                con.setConnectTimeout(8000);
                con.setReadTimeout(8000);
                con.setUseCaches(false);
                con.setRequestProperty("Cache-Control", "no-cache");
                if (con.getResponseCode() == 200) {
                    InputStream in = con.getInputStream();
                    ByteArrayOutputStream buf = new ByteArrayOutputStream();
                    byte[] b = new byte[8192];
                    int n;
                    while ((n = in.read(b)) > 0 && buf.size() < 256 * 1024) buf.write(b, 0, n);
                    JSONObject app = new JSONObject(buf.toString("UTF-8")).getJSONObject("apps").optJSONObject(appKey);
                    if (app != null) {
                        String page = app.optString("page", "");
                        String changes = app.optString("changes", "");
                        // 덜누름 사이트 주소만 엽니다
                        if (!page.startsWith("https://deolnureum.com/")) page = "https://deolnureum.com/apps/";
                        if (!changes.startsWith("https://deolnureum.com/")) changes = "https://deolnureum.com/releases/";
                        prefs(c).edit()
                            .putString("latest", app.optString("version", ""))
                            .putString("date", app.optString("date", ""))
                            .putString("note", app.optString("note", ""))
                            .putString("page", page)
                            .putString("changes", changes)
                            .putLong("checkedAt", System.currentTimeMillis())
                            .apply();
                        r = cached(c, current);
                    }
                }
            } catch (Exception ignored) {
                // 인터넷이 없거나 사이트가 응답하지 않으면 조용히 넘어갑니다 (다음에 다시 확인)
            } finally {
                if (con != null) con.disconnect();
            }
            final Result fr = r;
            main.post(() -> cb.done(fr));
        }).start();
    }

    /** "2.4.1" 과 "2.5" 같은 버전 비교. a 가 크면 양수 */
    static int compare(String a, String b) {
        String[] x = a.split("[^0-9]+"), y = b.split("[^0-9]+");
        for (int i = 0; i < Math.max(x.length, y.length); i++) {
            int p = i < x.length && !x[i].isEmpty() ? Integer.parseInt(x[i]) : 0;
            int q = i < y.length && !y[i].isEmpty() ? Integer.parseInt(y[i]) : 0;
            if (p != q) return p < q ? -1 : 1;
        }
        return 0;
    }
}
