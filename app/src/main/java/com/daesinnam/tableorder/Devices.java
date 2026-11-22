package com.daesinnam.tableorder;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONObject;

import java.security.SecureRandom;

/**
 * 서브 기기(주방 화면 · 보조 계산대) 연결.
 * 메인 카운터에서 6자리 연결 코드를 띄우면(10분), 서브 폰이 그 코드로 한 번 연결하고 자기만의 열쇠(token)를 받습니다.
 * 메인은 연결된 기기 목록을 보고 언제든 끊을 수 있고, 끊긴 기기는 바로 주문을 못 봅니다.
 * 역할: kitchen(주방 — 주문판만, 가격 숨김) · counter(계산대 — 주문판 + 테이블 결제)
 */
final class Devices {
    static final String KITCHEN = "kitchen", COUNTER = "counter";
    private static final long CODE_MS = 10 * 60 * 1000L;
    private final SharedPreferences p;
    private final SecureRandom rnd = new SecureRandom();
    private String code = "";
    private long codeUntil;
    private int fails;

    Devices(Context c) { p = c.getSharedPreferences("tableorder_devices", Context.MODE_PRIVATE); }

    private JSONArray all() {
        try { return new JSONArray(p.getString("list", "[]")); } catch (Exception e) { return new JSONArray(); }
    }

    private void put(JSONArray a) { p.edit().putString("list", a.toString()).apply(); }

    /** 새 연결 코드(메인이 「기기 추가」를 누를 때) */
    synchronized JSONObject newCode() throws Exception {
        code = String.format("%06d", rnd.nextInt(1_000_000));
        codeUntil = System.currentTimeMillis() + CODE_MS;
        fails = 0;
        return new JSONObject().put("code", code).put("until", codeUntil);
    }

    /** 서브 기기가 코드로 연결 → 열쇠를 돌려줌 */
    synchronized JSONObject pair(String c, String name, String role) throws Exception {
        if (code.isEmpty() || System.currentTimeMillis() > codeUntil) throw new IllegalArgumentException("연결 코드가 없거나 시간이 지났어요. 메인 카운터에서 「기기 추가」를 다시 눌러 주세요");
        if (!code.equals(c == null ? "" : c.trim())) {
            if (++fails >= 8) code = ""; // 여러 번 틀리면 코드 무효
            throw new IllegalArgumentException("연결 코드가 맞지 않아요");
        }
        code = ""; // 한 번 쓰면 끝
        String r = KITCHEN.equals(role) ? KITCHEN : COUNTER;
        String n = name == null ? "" : name.trim();
        if (n.isEmpty()) n = KITCHEN.equals(r) ? "주방" : "계산대";
        if (n.length() > 20) n = n.substring(0, 20);
        byte[] b = new byte[16];
        rnd.nextBytes(b);
        StringBuilder t = new StringBuilder();
        for (byte x : b) t.append(String.format("%02x", x));
        JSONObject d = new JSONObject().put("id", t.substring(0, 8)).put("token", t.toString()).put("name", n).put("role", r)
                .put("since", System.currentTimeMillis()).put("seen", System.currentTimeMillis());
        JSONArray a = all();
        a.put(d);
        put(a);
        return d;
    }

    /** 열쇠로 기기 찾기(없으면 null). 마지막 접속 시간도 기록 */
    synchronized JSONObject auth(String token) {
        if (token == null || token.length() < 16) return null;
        JSONArray a = all();
        for (int i = 0; i < a.length(); i++) {
            JSONObject d = a.optJSONObject(i);
            if (d != null && token.equals(d.optString("token"))) {
                long now = System.currentTimeMillis();
                if (now - d.optLong("seen") > 30_000) { try { d.put("seen", now); put(a); } catch (Exception ignored) { } }
                return d;
            }
        }
        return null;
    }

    /** 메인이 보는 목록(열쇠는 빼고) */
    synchronized JSONArray list() throws Exception {
        JSONArray a = all(), out = new JSONArray();
        for (int i = 0; i < a.length(); i++) {
            JSONObject d = a.getJSONObject(i);
            out.put(new JSONObject().put("id", d.optString("id")).put("name", d.optString("name")).put("role", d.optString("role"))
                    .put("since", d.optLong("since")).put("seen", d.optLong("seen")));
        }
        return out;
    }

    synchronized void remove(String id) {
        JSONArray a = all(), keep = new JSONArray();
        for (int i = 0; i < a.length(); i++) { JSONObject d = a.optJSONObject(i); if (d != null && !d.optString("id").equals(id)) keep.put(d); }
        put(keep);
    }

    synchronized boolean codeActive() { return !code.isEmpty() && System.currentTimeMillis() < codeUntil; }
}
