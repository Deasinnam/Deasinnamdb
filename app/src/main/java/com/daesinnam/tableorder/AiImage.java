package com.daesinnam.tableorder;

import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Base64;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

/**
 * AI와 연동하기: 사장님이 직접 넣은 API 열쇠로 메뉴 사진을 만들어 메뉴에 넣습니다.
 * - 지원: OpenAI(이미지 API) · Google Gemini(이미지 모델)
 * - 열쇠는 이 기기 안(SharedPreferences)에만 저장, 손님 화면 · 주문 데이터(state.json)에는 들어가지 않음
 * - 만든 그림은 JPEG로 줄여 메뉴 사진 폴더(files/img)에 저장 → 기존 메뉴 사진과 똑같이 쓰임
 */
final class AiImage {
    static final String OPENAI = "openai", GEMINI = "gemini";
    static final String DEF_OPENAI = "gpt-image-2", DEF_GEMINI = "gemini-3.1-flash-image";

    private final SharedPreferences p;
    private final File imgDir;

    AiImage(Context c, File imgDir) {
        this.p = c.getSharedPreferences("tableorder_ai", Context.MODE_PRIVATE);
        this.imgDir = imgDir;
    }

    String provider() { return GEMINI.equals(p.getString("provider", OPENAI)) ? GEMINI : OPENAI; }
    String key() { return p.getString("key", ""); }
    String model() { String m = p.getString("model", ""); return m.isEmpty() ? (GEMINI.equals(provider()) ? DEF_GEMINI : DEF_OPENAI) : m; }
    /** 점검용: 127.0.0.1 주소만 받음(다른 곳으로 열쇠가 새지 않게) */
    private String base() {
        String b = p.getString("base", "");
        if (b.startsWith("http://127.0.0.1:")) return b;
        return GEMINI.equals(provider()) ? "https://generativelanguage.googleapis.com" : "https://api.openai.com";
    }

    JSONObject info() throws Exception {
        String k = key();
        return new JSONObject().put("provider", provider()).put("model", model()).put("connected", !k.isEmpty())
                .put("keyTail", k.length() > 4 ? "…" + k.substring(k.length() - 4) : "")
                .put("defaults", new JSONObject().put(OPENAI, DEF_OPENAI).put(GEMINI, DEF_GEMINI));
    }

    void save(JSONObject in) {
        SharedPreferences.Editor e = p.edit();
        if (in.has("provider")) e.putString("provider", GEMINI.equals(in.optString("provider")) ? GEMINI : OPENAI);
        if (in.has("model")) e.putString("model", in.optString("model").trim().replaceAll("[^A-Za-z0-9._:-]", ""));
        if (in.has("key")) e.putString("key", in.optString("key").trim());
        if (in.has("base")) e.putString("base", in.optString("base").startsWith("http://127.0.0.1:") ? in.optString("base") : "");
        e.apply();
    }

    /** 연결 확인(그림을 만들지 않아 요금이 들지 않는 모델 목록 조회) */
    void test() throws Exception {
        need();
        if (GEMINI.equals(provider())) call("GET", base() + "/v1beta/models", null, "x-goog-api-key", key());
        else call("GET", base() + "/v1/models", null, "Authorization", "Bearer " + key());
    }

    /** 그림 만들기 → 메뉴 사진 주소(/img/xxx.jpg) */
    String generate(String prompt) throws Exception {
        need();
        if (prompt == null || prompt.trim().length() < 2) throw new IllegalArgumentException("어떤 사진을 만들지 적어 주세요");
        prompt = prompt.trim();
        if (prompt.length() > 1500) prompt = prompt.substring(0, 1500);
        byte[] raw;
        if (GEMINI.equals(provider())) {
            JSONObject body = new JSONObject()
                    .put("contents", new JSONArray().put(new JSONObject().put("parts", new JSONArray().put(new JSONObject().put("text", prompt)))))
                    .put("generationConfig", new JSONObject().put("responseModalities", new JSONArray().put("TEXT").put("IMAGE")));
            JSONObject r = call("POST", base() + "/v1beta/models/" + model() + ":generateContent", body, "x-goog-api-key", key());
            raw = null;
            JSONArray cands = r.optJSONArray("candidates");
            for (int c = 0; cands != null && c < cands.length() && raw == null; c++) {
                JSONObject content = cands.getJSONObject(c).optJSONObject("content");
                JSONArray parts = content == null ? null : content.optJSONArray("parts");
                for (int i = 0; parts != null && i < parts.length() && raw == null; i++) {
                    JSONObject part = parts.getJSONObject(i);
                    JSONObject inline = part.has("inlineData") ? part.optJSONObject("inlineData") : part.optJSONObject("inline_data");
                    if (inline != null && inline.has("data")) raw = Base64.decode(inline.getString("data"), Base64.DEFAULT);
                }
            }
        } else {
            JSONObject body = new JSONObject().put("model", model()).put("prompt", prompt).put("n", 1).put("size", "1024x1024");
            if (model().startsWith("dall-e")) body.put("response_format", "b64_json");
            JSONObject r = call("POST", base() + "/v1/images/generations", body, "Authorization", "Bearer " + key());
            JSONArray data = r.optJSONArray("data");
            JSONObject d0 = data == null || data.length() == 0 ? null : data.getJSONObject(0);
            raw = d0 != null && d0.has("b64_json") ? Base64.decode(d0.getString("b64_json"), Base64.DEFAULT) : null;
        }
        if (raw == null) throw new IllegalStateException("AI가 그림을 보내지 않았어요. 설명을 조금 바꿔 다시 해 보세요");
        return saveJpeg(raw);
    }

    /** 받은 그림(PNG · JPEG · WebP)을 1024px 이하 JPEG로 저장 */
    private String saveJpeg(byte[] raw) throws Exception {
        Bitmap bm = BitmapFactory.decodeByteArray(raw, 0, raw.length);
        if (bm == null) throw new IllegalStateException("받은 그림을 읽지 못했어요");
        int max = Math.max(bm.getWidth(), bm.getHeight());
        if (max > 1024) {
            float s = 1024f / max;
            Bitmap sc = Bitmap.createScaledBitmap(bm, Math.round(bm.getWidth() * s), Math.round(bm.getHeight() * s), true);
            if (sc != bm) bm.recycle();
            bm = sc;
        }
        String name = "ai" + UUID.randomUUID().toString().replace("-", "").substring(0, 14) + ".jpg";
        try (FileOutputStream fo = new FileOutputStream(new File(imgDir, name))) { bm.compress(Bitmap.CompressFormat.JPEG, 86, fo); }
        bm.recycle();
        return "/img/" + name;
    }

    private void need() { if (key().isEmpty()) throw new IllegalArgumentException("먼저 설정에서 AI와 연동해 주세요"); }

    private static JSONObject call(String method, String url, JSONObject body, String hk, String hv) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setConnectTimeout(15000);
        c.setReadTimeout(150000);
        c.setRequestMethod(method);
        c.setRequestProperty(hk, hv);
        c.setRequestProperty("Accept", "application/json");
        if (body != null) {
            c.setDoOutput(true);
            c.setRequestProperty("Content-Type", "application/json");
            try (OutputStream o = c.getOutputStream()) { o.write(body.toString().getBytes(StandardCharsets.UTF_8)); }
        }
        int code;
        try { code = c.getResponseCode(); } catch (java.io.IOException e) { throw new IllegalStateException("AI 서비스에 닿지 않았어요. 인터넷 연결을 확인해 주세요"); }
        InputStream in = code < 400 ? c.getInputStream() : c.getErrorStream();
        ByteArrayOutputStream b = new ByteArrayOutputStream();
        byte[] buf = new byte[16384];
        for (int n; in != null && (n = in.read(buf)) > 0; ) b.write(buf, 0, n);
        String s = b.toString("UTF-8");
        if (code == 401 || code == 403) throw new IllegalArgumentException("API 열쇠가 맞지 않거나 권한이 없어요 (" + code + ")");
        if (code == 429) throw new IllegalStateException("요청이 많거나 사용 한도를 넘었어요. 잠시 뒤 다시 해 보세요");
        if (code >= 400) {
            String msg = "";
            try { JSONObject e = new JSONObject(s).optJSONObject("error"); if (e != null) msg = e.optString("message"); } catch (Exception ignored) { }
            if (msg.length() > 160) msg = msg.substring(0, 160);
            throw new IllegalStateException("AI가 만들지 못했어요 (" + code + ")" + (msg.isEmpty() ? "" : ": " + msg));
        }
        return s.trim().isEmpty() ? new JSONObject() : new JSONObject(s);
    }
}
