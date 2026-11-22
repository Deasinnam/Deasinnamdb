package com.daesinnam.tableorder;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.UUID;

/**
 * 카운터(사장님 기기)가 가진 가게 정보 · 메뉴 · 주문 · 직원 호출. 모두 이 기기 안의 파일 하나(state.json)에 저장합니다.
 * 바뀔 때마다 rev가 하나씩 올라가고, 기다리던 화면(주문 목록)이 바로 깨어납니다.
 */
final class Store {
    private final File file;
    private JSONObject s;
    private long rev = 1;

    Store(File dir) {
        file = new File(dir, "state.json");
        try {
            s = new JSONObject(new String(Files.readAllBytes(file.toPath()), StandardCharsets.UTF_8));
        } catch (Exception e) {
            s = sample();
            save();
        }
        ensure();
    }

    // ---------- 읽기 ----------

    synchronized long rev() { return rev; }

    /** 기다리기: rev가 바뀌거나 시간이 지나면 돌아옴 */
    synchronized long waitChange(long known, long ms) {
        long end = System.currentTimeMillis() + ms;
        while (rev == known) {
            long left = end - System.currentTimeMillis();
            if (left <= 0) break;
            try { wait(left); } catch (InterruptedException e) { break; }
        }
        return rev;
    }

    /** 테이블 주문기가 보는 것: 가게 이름 · 메뉴(숨긴 것 빼고) · 이 테이블의 오늘 주문 */
    synchronized JSONObject tableView(int table) throws JSONException {
        JSONObject o = new JSONObject();
        JSONObject st = s.getJSONObject("settings");
        o.put("rev", rev);
        o.put("shop", st.optString("shop"));
        o.put("tables", st.optInt("tables", 8));
        o.put("notice", st.optString("notice"));
        o.put("skin", skin(st.optString("skin")));
        o.put("categories", s.getJSONArray("categories"));
        JSONArray items = new JSONArray();
        JSONArray all = s.getJSONArray("items");
        for (int i = 0; i < all.length(); i++) {
            JSONObject it = all.getJSONObject(i);
            if (!it.optBoolean("hidden")) items.put(it);
        }
        o.put("items", items);
        JSONArray mine = new JSONArray();
        JSONArray orders = s.getJSONArray("orders");
        for (int i = 0; i < orders.length(); i++) {
            JSONObject od = orders.getJSONObject(i);
            if (od.optInt("table") == table && !od.optBoolean("paid") && !"canceled".equals(od.optString("status"))) mine.put(od);
        }
        o.put("orders", mine);
        return o;
    }

    /** 카운터 화면이 보는 것: 전부 + 오늘 매출 */
    synchronized JSONObject adminView() throws JSONException {
        JSONObject o = new JSONObject(s.toString());
        o.remove("seq");
        o.remove("sales"); // 매출 기록은 따로(/api/admin/sales) — 주문판이 가볍게
        o.put("rev", rev);
        long sum = 0;
        int cnt = 0;
        String today = today();
        JSONArray orders = s.getJSONArray("orders");
        for (int i = 0; i < orders.length(); i++) {
            JSONObject od = orders.getJSONObject(i);
            if (today.equals(od.optString("day")) && !"canceled".equals(od.optString("status"))) { sum += od.optLong("total"); cnt++; }
        }
        o.put("todaySales", sum);
        o.put("todayCount", cnt);
        return o;
    }

    // ---------- 손님(테이블) ----------

    /** 주문 넣기. 값은 카운터 메뉴에서 다시 계산합니다(테이블이 보낸 가격은 믿지 않음). */
    synchronized JSONObject placeOrder(JSONObject req) throws JSONException {
        int table = req.optInt("table", 0);
        int maxT = s.getJSONObject("settings").optInt("tables", 8);
        if (table < 1 || table > Math.max(maxT, 1) + 50) throw new IllegalArgumentException("테이블 번호가 올바르지 않습니다");
        JSONArray want = req.optJSONArray("items");
        if (want == null || want.length() == 0) throw new IllegalArgumentException("담은 메뉴가 없습니다");
        JSONArray lines = new JSONArray();
        long total = 0;
        for (int i = 0; i < want.length() && i < 60; i++) {
            JSONObject w = want.getJSONObject(i);
            JSONObject it = item(w.optString("id"));
            int qty = Math.max(1, Math.min(99, w.optInt("qty", 1)));
            if (it == null || it.optBoolean("hidden")) throw new IllegalArgumentException("메뉴가 바뀌었습니다. 다시 담아 주세요");
            if (it.optBoolean("soldout")) throw new IllegalArgumentException(it.optString("name") + "은(는) 지금 품절입니다");
            long price = it.optLong("price");
            lines.put(new JSONObject().put("id", it.optString("id")).put("name", it.optString("name")).put("price", price).put("qty", qty));
            total += price * qty;
        }
        rollDay();
        String okey = clip(req.optString("key"), 40);
        if (!okey.isEmpty()) { // 같은 주문을 두 번 눌렀거나 다시 보낸 경우: 처음 주문을 그대로 돌려줌
            JSONArray os = s.getJSONArray("orders");
            for (int i = os.length() - 1; i >= 0 && i >= os.length() - 200; i--) {
                JSONObject o = os.getJSONObject(i);
                if (okey.equals(o.optString("key")) && o.optInt("table") == table) return o;
            }
        }
        JSONObject seq = s.getJSONObject("seq");
        int no = seq.optInt("no", 0) + 1;
        seq.put("no", no);
        JSONObject od = new JSONObject()
                .put("id", UUID.randomUUID().toString().substring(0, 8))
                .put("no", no)
                .put("table", table)
                .put("items", lines)
                .put("total", total)
                .put("note", clip(req.optString("note"), 120))
                .put("key", okey)
                .put("status", "new")
                .put("paid", false)
                .put("time", System.currentTimeMillis())
                .put("day", today());
        s.getJSONArray("orders").put(od);
        changed();
        return od;
    }

    synchronized JSONObject call(JSONObject req) throws JSONException {
        int table = req.optInt("table", 0);
        if (table < 1) throw new IllegalArgumentException("테이블 번호가 올바르지 않습니다");
        JSONObject c = new JSONObject()
                .put("id", UUID.randomUUID().toString().substring(0, 8))
                .put("table", table)
                .put("what", clip(req.optString("what", "직원 호출"), 40))
                .put("time", System.currentTimeMillis());
        s.getJSONArray("calls").put(c);
        changed();
        return c;
    }

    // ---------- 사장님(카운터) ----------

    synchronized void setStatus(String id, String status) throws JSONException {
        if (!"new".equals(status) && !"cooking".equals(status) && !"done".equals(status) && !"canceled".equals(status)) throw new IllegalArgumentException("상태가 올바르지 않습니다");
        JSONObject od = order(id);
        if (od == null) throw new IllegalArgumentException("주문을 찾지 못했습니다");
        od.put("status", status);
        changed();
    }

    /** 결제 끝: 그 테이블의 주문을 모두 결제 완료로(목록에서 내려감, 매출에는 남음) */
    synchronized void clearTable(int table) throws JSONException {
        JSONArray orders = s.getJSONArray("orders");
        for (int i = 0; i < orders.length(); i++) {
            JSONObject od = orders.getJSONObject(i);
            if (od.optInt("table") == table) od.put("paid", true);
        }
        changed();
    }

    synchronized void doneCall(String id) throws JSONException {
        JSONArray calls = s.getJSONArray("calls");
        JSONArray keep = new JSONArray();
        for (int i = 0; i < calls.length(); i++) if (!id.equals(calls.getJSONObject(i).optString("id"))) keep.put(calls.get(i));
        s.put("calls", keep);
        changed();
    }

    synchronized void soldout(String id, boolean on) throws JSONException {
        JSONObject it = item(id);
        if (it == null) throw new IllegalArgumentException("메뉴를 찾지 못했습니다");
        it.put("soldout", on);
        changed();
    }

    /** 메뉴 전체 바꾸기(분류 + 메뉴) */
    synchronized void setMenu(JSONObject m) throws JSONException {
        JSONArray cats = m.getJSONArray("categories"), items = m.getJSONArray("items");
        JSONArray c2 = new JSONArray(), i2 = new JSONArray();
        for (int i = 0; i < cats.length() && i < 40; i++) {
            JSONObject c = cats.getJSONObject(i);
            c2.put(new JSONObject().put("id", nz(c.optString("id"))).put("name", clip(c.optString("name"), 20)));
        }
        for (int i = 0; i < items.length() && i < 300; i++) {
            JSONObject it = items.getJSONObject(i);
            i2.put(new JSONObject()
                    .put("id", nz(it.optString("id")))
                    .put("cat", it.optString("cat"))
                    .put("name", clip(it.optString("name"), 40))
                    .put("desc", clip(it.optString("desc"), 80))
                    .put("price", Math.max(0, Math.min(10_000_000, it.optLong("price"))))
                    .put("img", it.optString("img").startsWith("/img/") ? it.optString("img") : "")
                    .put("soldout", it.optBoolean("soldout"))
                    .put("hidden", it.optBoolean("hidden"))
                    .put("best", it.optBoolean("best")));
        }
        s.put("categories", c2);
        s.put("items", i2);
        changed();
    }

    synchronized void setSettings(JSONObject in) throws JSONException {
        JSONObject st = s.getJSONObject("settings");
        if (in.has("shop")) st.put("shop", clip(in.optString("shop"), 30));
        if (in.has("tables")) st.put("tables", Math.max(1, Math.min(99, in.optInt("tables", 8))));
        if (in.has("notice")) st.put("notice", clip(in.optString("notice"), 80));
        if (in.has("sound")) st.put("sound", in.optBoolean("sound", true));
        if (in.has("skin")) st.put("skin", skin(in.optString("skin")));
        if (in.has("bell")) st.put("bell", bell(in.optString("bell")));
        if (in.has("bellRepeat")) st.put("bellRepeat", Math.max(1, Math.min(3, in.optInt("bellRepeat", 2))));
        if (in.has("bellCustom")) { String c = in.optString("bellCustom"); st.put("bellCustom", c.matches("/sndc/[A-Za-z0-9_-]{1,40}\\.(mp3|wav|ogg|m4a|aac)") ? c : ""); }
        if (in.has("bellRemind")) st.put("bellRemind", in.optBoolean("bellRemind", true));
        if (in.has("bellCustomName")) st.put("bellCustomName", clip(in.optString("bellCustomName"), 40));
        changed();
    }

    synchronized void resetToday() throws JSONException {
        archive(today()); // 어제까지 기록은 남기고
        s.getJSONObject("sales").remove(today()); // 오늘 것만 지움
        s.put("orders", new JSONArray());
        s.put("calls", new JSONArray());
        s.getJSONObject("seq").put("no", 0);
        changed();
    }

    // ---------- 안쪽 ----------

    private JSONObject item(String id) throws JSONException {
        JSONArray a = s.getJSONArray("items");
        for (int i = 0; i < a.length(); i++) if (id.equals(a.getJSONObject(i).optString("id"))) return a.getJSONObject(i);
        return null;
    }

    private JSONObject order(String id) throws JSONException {
        JSONArray a = s.getJSONArray("orders");
        for (int i = 0; i < a.length(); i++) if (id.equals(a.getJSONObject(i).optString("id"))) return a.getJSONObject(i);
        return null;
    }

    /** 날이 바뀌면 주문 번호를 1부터, 이틀 지난 주문은 지움 */
    private void rollDay() throws JSONException {
        String t = today();
        JSONObject seq = s.getJSONObject("seq");
        if (!t.equals(seq.optString("day"))) {
            seq.put("day", t);
            seq.put("no", 0);
            JSONArray keep = new JSONArray(), orders = s.getJSONArray("orders");
            archive(t); // 지난 날의 매출을 하루 요약으로 남김(주문은 지워져도 매출 기록은 유지)
            long cut = System.currentTimeMillis() - 2L * 24 * 3600 * 1000;
            for (int i = 0; i < orders.length(); i++) {
                JSONObject od = orders.getJSONObject(i);
                if (od.optLong("time") >= cut && !(od.optBoolean("paid") && !t.equals(od.optString("day")))) keep.put(od);
            }
            s.put("orders", keep);
        }
    }

    // ---------- 매출 ----------

    /** 주문 목록에서 날짜별 요약(취소 제외): 건수 · 합계 · 메뉴별 수량/금액 · 시간대별 금액 */
    private static JSONObject summarize(JSONArray orders, String day) throws JSONException {
        long total = 0;
        int count = 0;
        long[] hours = new long[24];
        JSONObject items = new JSONObject();
        java.util.Calendar cal = java.util.Calendar.getInstance();
        for (int i = 0; i < orders.length(); i++) {
            JSONObject od = orders.getJSONObject(i);
            if (!day.equals(od.optString("day")) || "canceled".equals(od.optString("status"))) continue;
            count++;
            total += od.optLong("total");
            cal.setTimeInMillis(od.optLong("time"));
            hours[cal.get(java.util.Calendar.HOUR_OF_DAY)] += od.optLong("total");
            JSONArray ls = od.optJSONArray("items");
            for (int j = 0; ls != null && j < ls.length(); j++) {
                JSONObject l = ls.getJSONObject(j);
                String n = l.optString("name");
                JSONObject it = items.optJSONObject(n);
                if (it == null) { it = new JSONObject().put("qty", 0).put("amount", 0); items.put(n, it); }
                it.put("qty", it.optInt("qty") + l.optInt("qty"));
                it.put("amount", it.optLong("amount") + l.optLong("price") * l.optInt("qty"));
            }
        }
        JSONArray h = new JSONArray();
        for (long v : hours) h.put(v);
        return new JSONObject().put("count", count).put("total", total).put("items", items).put("hours", h);
    }

    /** 오늘(except)이 아닌 날들의 매출을 sales에 저장. 400일 넘은 기록은 정리 */
    private void archive(String except) throws JSONException {
        JSONObject sales = s.getJSONObject("sales");
        JSONArray orders = s.getJSONArray("orders");
        java.util.HashSet<String> days = new java.util.HashSet<>();
        for (int i = 0; i < orders.length(); i++) days.add(orders.getJSONObject(i).optString("day"));
        for (String d : days) if (!d.isEmpty() && !d.equals(except)) sales.put(d, summarize(orders, d));
        String cut = new SimpleDateFormat("yyyy-MM-dd", Locale.KOREA).format(new Date(System.currentTimeMillis() - 400L * 24 * 3600 * 1000));
        java.util.ArrayList<String> old = new java.util.ArrayList<>();
        for (java.util.Iterator<String> k = sales.keys(); k.hasNext(); ) { String d = k.next(); if (d.compareTo(cut) < 0) old.add(d); }
        for (String d : old) sales.remove(d);
    }

    /** 매출 보기: month = "2026-11". 날짜별 합계 + 그 달 메뉴 순위 + 고른 날(day)의 자세한 내용 */
    synchronized JSONObject sales(String month, String day) throws JSONException {
        String t = today();
        if (month == null || !month.matches("\\d{4}-\\d{2}")) month = t.substring(0, 7);
        if (day == null || !day.matches("\\d{4}-\\d{2}-\\d{2}")) day = t;
        JSONObject sales = s.getJSONObject("sales"), orders = null;
        JSONArray os = s.getJSONArray("orders");
        java.util.HashSet<String> live = new java.util.HashSet<>(); // 아직 주문이 남아 있는 날은 주문에서 바로 계산(가장 정확)
        for (int i = 0; i < os.length(); i++) live.add(os.getJSONObject(i).optString("day"));
        java.util.Calendar c = java.util.Calendar.getInstance();
        c.set(Integer.parseInt(month.substring(0, 4)), Integer.parseInt(month.substring(5, 7)) - 1, 1);
        int last = c.getActualMaximum(java.util.Calendar.DAY_OF_MONTH);
        JSONArray days = new JSONArray();
        long mTotal = 0;
        int mCount = 0, open = 0;
        JSONObject mItems = new JSONObject();
        for (int d = 1; d <= last; d++) {
            String key = month + "-" + (d < 10 ? "0" : "") + d;
            JSONObject sm = live.contains(key) ? summarize(os, key) : sales.optJSONObject(key);
            long tot = sm == null ? 0 : sm.optLong("total");
            int cnt = sm == null ? 0 : sm.optInt("count");
            days.put(new JSONObject().put("day", key).put("total", tot).put("count", cnt));
            mTotal += tot;
            mCount += cnt;
            if (cnt > 0) open++;
            JSONObject its = sm == null ? null : sm.optJSONObject("items");
            if (its != null) for (java.util.Iterator<String> k = its.keys(); k.hasNext(); ) {
                String n = k.next();
                JSONObject a = its.getJSONObject(n), m = mItems.optJSONObject(n);
                if (m == null) { m = new JSONObject().put("qty", 0).put("amount", 0); mItems.put(n, m); }
                m.put("qty", m.optInt("qty") + a.optInt("qty")).put("amount", m.optLong("amount") + a.optLong("amount"));
            }
        }
        JSONObject dsum = live.contains(day) ? summarize(os, day) : sales.optJSONObject(day);
        if (dsum == null) dsum = summarize(new JSONArray(), day);
        // 지난달 합계(비교용)
        c.add(java.util.Calendar.MONTH, -1);
        String pm = new SimpleDateFormat("yyyy-MM", Locale.KOREA).format(c.getTime());
        long prev = 0;
        for (java.util.Iterator<String> k = sales.keys(); k.hasNext(); ) { String d = k.next(); if (d.startsWith(pm) && !live.contains(d)) prev += sales.getJSONObject(d).optLong("total"); }
        for (String d : live) if (d.startsWith(pm)) prev += summarize(os, d).optLong("total");
        return new JSONObject().put("ok", true).put("today", t).put("month", month).put("days", days)
                .put("monthTotal", mTotal).put("monthCount", mCount).put("openDays", open).put("monthItems", mItems).put("prevMonthTotal", prev)
                .put("day", day).put("daySummary", dsum);
    }

    private void changed() {
        rev++;
        save();
        notifyAll();
    }

    private void save() {
        try {
            File tmp = new File(file.getPath() + ".tmp");
            try (FileOutputStream out = new FileOutputStream(tmp)) { out.write(s.toString().getBytes(StandardCharsets.UTF_8)); }
            if (!tmp.renameTo(file)) Files.write(file.toPath(), s.toString().getBytes(StandardCharsets.UTF_8));
        } catch (Exception ignored) {
        }
    }

    private void ensure() {
        try {
            if (!s.has("settings")) s.put("settings", new JSONObject());
            for (String k : new String[]{"categories", "items", "orders", "calls"}) if (!s.has(k)) s.put(k, new JSONArray());
            if (!s.has("sales")) s.put("sales", new JSONObject());
            if (!s.has("seq")) s.put("seq", new JSONObject().put("no", 0).put("day", today()));
            JSONObject st = s.getJSONObject("settings");
            if (!st.has("shop")) st.put("shop", "우리 가게");
            if (!st.has("tables")) st.put("tables", 8);
            if (!st.has("skin")) st.put("skin", "premium");
            if (!st.has("bell")) st.put("bell", "dingdong");
            if (!st.has("bellRepeat")) st.put("bellRepeat", 2); // 처음 설치 · 이전 버전 모두 기본 스킨부터(메뉴 · 주문은 그대로)
        } catch (JSONException ignored) {
        }
    }

    /** 스킨: premium(기본) · cafe(카페) · korean(한식). 모르는 값은 기본으로 */
    /** 알림벨: dingdong(기본) · bell · chime · beep · custom(사장님이 올린 소리) */
    static String bell(String v) { return v != null && v.matches("bell|chime|beep|custom") ? v : "dingdong"; }

    static String skin(String v) { return "cafe".equals(v) || "korean".equals(v) ? v : "premium"; }

    static String today() { return new SimpleDateFormat("yyyy-MM-dd", Locale.KOREA).format(new Date()); }

    private static String clip(String v, int n) { v = v == null ? "" : v.trim(); return v.length() > n ? v.substring(0, n) : v; }

    private static String nz(String id) { return id == null || id.isEmpty() ? UUID.randomUUID().toString().substring(0, 8) : clip(id, 24); }

    /** 처음 켜면 바로 써 볼 수 있는 예시 메뉴(카페) — 메뉴 관리에서 지우고 바꾸면 됩니다 */
    private static JSONObject sample() {
        try {
            JSONObject o = new JSONObject();
            o.put("settings", new JSONObject().put("shop", "덜누름 카페").put("tables", 8).put("sound", true).put("skin", "premium").put("notice", "주문 후 자리에서 기다려 주세요"));
            o.put("categories", new JSONArray()
                    .put(new JSONObject().put("id", "coffee").put("name", "커피"))
                    .put(new JSONObject().put("id", "drink").put("name", "음료"))
                    .put(new JSONObject().put("id", "dessert").put("name", "디저트")));
            String[][] m = {
                    {"americano", "coffee", "아메리카노", "4500", "고소한 원두로 진하게", "1"},
                    {"latte", "coffee", "카페라떼", "5000", "부드러운 우유 거품", "0"},
                    {"vanilla", "coffee", "바닐라라떼", "5500", "달콤한 바닐라", "0"},
                    {"coldbrew", "coffee", "콜드브루", "5000", "12시간 천천히 내린", "0"},
                    {"ade", "drink", "자몽에이드", "6000", "상큼한 자몽과 탄산", "1"},
                    {"tea", "drink", "유자차", "5000", "따뜻하게", "0"},
                    {"choco", "drink", "초코라떼", "5500", "진한 초콜릿", "0"},
                    {"cake", "dessert", "치즈케이크", "6500", "꾸덕한 뉴욕 치즈", "1"},
                    {"croffle", "dessert", "크로플", "5000", "버터 크루아상 와플", "0"},
                    {"cookie", "dessert", "쿠키", "3000", "초코칩", "0"},
            };
            JSONArray items = new JSONArray();
            for (String[] r : m) items.put(new JSONObject().put("id", r[0]).put("cat", r[1]).put("name", r[2]).put("price", Long.parseLong(r[3])).put("desc", r[4]).put("img", "").put("soldout", false).put("hidden", false).put("best", "1".equals(r[5])));
            o.put("items", items);
            o.put("orders", new JSONArray());
            o.put("calls", new JSONArray());
            o.put("sales", new JSONObject());
            o.put("seq", new JSONObject().put("no", 0).put("day", today()));
            return o;
        } catch (JSONException e) {
            return new JSONObject();
        }
    }
}
