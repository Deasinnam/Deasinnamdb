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
 * AI와 연동하기: 사장님이 직접 넣은 API 열쇠로 메뉴 일을 돕습니다. 세 곳 중 원하는 곳(여러 곳도)을 연결할 수 있어요.
 * - ChatGPT(OpenAI) · Gemini(Google): 메뉴 사진 만들기
 * - Claude(Anthropic): 메뉴 설명 쓰기 · 사진 설명(만들 사진의 묘사) 다듬기 — Claude는 그림을 직접 만들지 않음
 * 열쇠는 이 기기 안(SharedPreferences)에만 저장, 손님 화면 · 주문 데이터(state.json)에는 들어가지 않음
 * 만든 그림은 JPEG로 줄여 메뉴 사진 폴더(files/img)에 저장 → 기존 메뉴 사진과 똑같이 쓰임
 */
final class AiImage {
    static final String OPENAI = "openai", GEMINI = "gemini", CLAUDE = "claude";
    static final String[] ALL = {OPENAI, GEMINI, CLAUDE};
    static final String DEF_OPENAI = "gpt-image-2", DEF_GEMINI = "gemini-3.1-flash-image", DEF_CLAUDE = "claude-sonnet-5-5";

    private final SharedPreferences p;
    private final File imgDir;

    AiImage(Context c, File imgDir) {
        this.p = c.getSharedPreferences("tableorder_ai", Context.MODE_PRIVATE);
        this.imgDir = imgDir;
        migrate();
    }

    /** 0.2(한 곳만 연결)에서 올라온 경우: 기존 열쇠를 그 회사 칸으로 옮김 */
    private void migrate() {
        String k = p.getString("key", "");
        if (k.isEmpty()) return;
        String pv = GEMINI.equals(p.getString("provider", OPENAI)) ? GEMINI : OPENAI;
        p.edit().putString("key_" + pv, k).putString("model_" + pv, p.getString("model", "")).putString("imageProvider", pv)
                .remove("key").remove("model").remove("provider").apply();
    }

    private static String norm(String pv) { return GEMINI.equals(pv) ? GEMINI : CLAUDE.equals(pv) ? CLAUDE : OPENAI; }
    private String key(String pv) { return p.getString("key_" + pv, ""); }
    private boolean has(String pv) { return !key(pv).isEmpty(); }
    String model(String pv) {
        String m = p.getString("model_" + pv, "");
        return !m.isEmpty() ? m : GEMINI.equals(pv) ? DEF_GEMINI : CLAUDE.equals(pv) ? DEF_CLAUDE : DEF_OPENAI;
    }

    /** 사진을 만들 곳: 고른 곳이 연결돼 있으면 그곳, 아니면 연결된 다른 사진 AI */
    String imageProvider() {
        String pv = GEMINI.equals(p.getString("imageProvider", OPENAI)) ? GEMINI : OPENAI;
        if (has(pv)) return pv;
        String other = OPENAI.equals(pv) ? GEMINI : OPENAI;
        return has(other) ? other : "";
    }

    /** 점검용: 127.0.0.1 주소만 받음(다른 곳으로 열쇠가 새지 않게) */
    private String base(String pv) {
        String b = p.getString("base", "");
        if (b.startsWith("http://127.0.0.1:")) return b;
        return GEMINI.equals(pv) ? "https://generativelanguage.googleapis.com" : CLAUDE.equals(pv) ? "https://api.anthropic.com" : "https://api.openai.com";
    }

    JSONObject info() throws Exception {
        JSONObject ps = new JSONObject();
        for (String pv : ALL) {
            String k = key(pv);
            ps.put(pv, new JSONObject().put("connected", !k.isEmpty()).put("keyTail", k.length() > 4 ? "…" + k.substring(k.length() - 4) : "").put("model", model(pv)));
        }
        String ip = imageProvider();
        return new JSONObject().put("providers", ps).put("imageProvider", ip).put("imageReady", !ip.isEmpty()).put("textReady", has(CLAUDE))
                .put("connected", has(OPENAI) || has(GEMINI) || has(CLAUDE))
                .put("defaults", new JSONObject().put(OPENAI, DEF_OPENAI).put(GEMINI, DEF_GEMINI).put(CLAUDE, DEF_CLAUDE));
    }

    /** {provider, key?, model?} 한 곳 저장(key ""면 그 곳 연결 끊기) · {imageProvider} 사진 만들 곳 · {base} 점검용 */
    void save(JSONObject in) {
        SharedPreferences.Editor e = p.edit();
        if (in.has("provider")) {
            String pv = norm(in.optString("provider"));
            if (in.has("model")) e.putString("model_" + pv, in.optString("model").trim().replaceAll("[^A-Za-z0-9._:-]", ""));
            if (in.has("key")) e.putString("key_" + pv, in.optString("key").trim());
        }
        if (in.has("imageProvider")) e.putString("imageProvider", GEMINI.equals(in.optString("imageProvider")) ? GEMINI : OPENAI);
        if (in.has("base")) e.putString("base", in.optString("base").startsWith("http://127.0.0.1:") ? in.optString("base") : "");
        if (in.optBoolean("disconnectAll")) for (String pv : ALL) e.remove("key_" + pv);
        e.apply();
    }

    /** 연결 확인(그림 · 글을 만들지 않아 요금이 들지 않는 모델 목록 조회) */
    void test(String pv) throws Exception {
        pv = norm(pv);
        need(pv);
        if (GEMINI.equals(pv)) call("GET", base(pv) + "/v1beta/models", null, "x-goog-api-key", key(pv), null);
        else if (CLAUDE.equals(pv)) call("GET", base(pv) + "/v1/models", null, "x-api-key", key(pv), "2023-06-01");
        else call("GET", base(pv) + "/v1/models", null, "Authorization", "Bearer " + key(pv), null);
    }

    /** 그림 만들기(ChatGPT 또는 Gemini) → 메뉴 사진 주소(/img/xxx.jpg) */
    String generate(String prompt) throws Exception {
        String pv = imageProvider();
        if (pv.isEmpty()) throw new IllegalArgumentException(has(CLAUDE)
                ? "Claude는 그림을 직접 만들지 않아요. 사진을 만들려면 ChatGPT나 Gemini도 연결해 주세요"
                : "먼저 설정에서 AI와 연동해 주세요");
        if (prompt == null || prompt.trim().length() < 2) throw new IllegalArgumentException("어떤 사진을 만들지 적어 주세요");
        prompt = prompt.trim();
        if (prompt.length() > 1500) prompt = prompt.substring(0, 1500);
        byte[] raw = null;
        if (GEMINI.equals(pv)) {
            JSONObject body = new JSONObject()
                    .put("contents", new JSONArray().put(new JSONObject().put("parts", new JSONArray().put(new JSONObject().put("text", prompt)))))
                    .put("generationConfig", new JSONObject().put("responseModalities", new JSONArray().put("TEXT").put("IMAGE")));
            JSONObject r = call("POST", base(pv) + "/v1beta/models/" + model(pv) + ":generateContent", body, "x-goog-api-key", key(pv), null);
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
            JSONObject body = new JSONObject().put("model", model(pv)).put("prompt", prompt).put("n", 1).put("size", "1024x1024");
            if (model(pv).startsWith("dall-e")) body.put("response_format", "b64_json");
            JSONObject r = call("POST", base(pv) + "/v1/images/generations", body, "Authorization", "Bearer " + key(pv), null);
            JSONArray data = r.optJSONArray("data");
            JSONObject d0 = data == null || data.length() == 0 ? null : data.getJSONObject(0);
            raw = d0 != null && d0.has("b64_json") ? Base64.decode(d0.getString("b64_json"), Base64.DEFAULT) : null;
        }
        if (raw == null) throw new IllegalStateException("AI가 그림을 보내지 않았어요. 설명을 조금 바꿔 다시 해 보세요");
        return saveJpeg(raw);
    }

    /** Claude로 글쓰기: desc(메뉴 한 줄 설명) · prompt(만들 사진의 묘사) */
    String write(JSONObject in) throws Exception {
        need(CLAUDE);
        String name = clip(in.optString("name"), 40), desc = clip(in.optString("desc"), 80), cat = clip(in.optString("cat"), 20), style = clip(in.optString("style"), 120);
        if (name.isEmpty()) throw new IllegalArgumentException("먼저 메뉴 이름을 적어 주세요");
        String ask = "prompt".equals(in.optString("kind"))
                ? "식당 메뉴판에 넣을 음식 사진을 이미지 생성 AI로 만들려고 해요. 아래 메뉴를 먹음직스럽고 사실적으로 보이도록, 그릇 · 담음새 · 곁들임 · 조명 · 구도를 구체적으로 묘사한 한국어 사진 설명을 3~4문장으로 써 주세요. "
                  + "글자 · 로고 · 사람 · 손은 나오지 않게 하고, 정사각형 사진이라고 적어 주세요. 설명 문장만 답해 주세요.\n메뉴: " + name
                  + (desc.isEmpty() ? "" : "\n메뉴 소개: " + desc) + (cat.isEmpty() ? "" : "\n분류: " + cat) + (style.isEmpty() ? "" : "\n원하는 분위기: " + style)
                : "식당 태블릿 메뉴판에 들어갈 메뉴 한 줄 설명을 써 주세요. 손님이 맛과 특징을 바로 알 수 있게, 과장 없이 30자 안쪽의 자연스러운 한국어 한 문장으로. 따옴표 없이 문장만 답해 주세요.\n메뉴: " + name
                  + (cat.isEmpty() ? "" : "\n분류: " + cat) + (desc.isEmpty() ? "" : "\n지금 설명: " + desc);
        JSONObject body = new JSONObject().put("model", model(CLAUDE)).put("max_tokens", 600)
                .put("messages", new JSONArray().put(new JSONObject().put("role", "user").put("content", ask)));
        JSONObject r = call("POST", base(CLAUDE) + "/v1/messages", body, "x-api-key", key(CLAUDE), "2023-06-01");
        StringBuilder sb = new StringBuilder();
        JSONArray content = r.optJSONArray("content");
        for (int i = 0; content != null && i < content.length(); i++) {
            JSONObject c = content.getJSONObject(i);
            if ("text".equals(c.optString("type"))) sb.append(c.optString("text"));
        }
        String t = sb.toString().trim().replaceAll("^[\"“'‘]+|[\"”'’]+$", "");
        if (t.isEmpty()) throw new IllegalStateException("Claude가 답을 보내지 않았어요. 다시 해 보세요");
        return t;
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

    private void need(String pv) {
        if (!has(pv)) throw new IllegalArgumentException((CLAUDE.equals(pv) ? "Claude" : GEMINI.equals(pv) ? "Gemini" : "ChatGPT") + "를 먼저 연결해 주세요");
    }

    private static String clip(String v, int n) { v = v == null ? "" : v.trim(); return v.length() > n ? v.substring(0, n) : v; }

    private static JSONObject call(String method, String url, JSONObject body, String hk, String hv, String anthropicVersion) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setConnectTimeout(15000);
        c.setReadTimeout(150000);
        c.setRequestMethod(method);
        c.setRequestProperty(hk, hv);
        if (anthropicVersion != null) c.setRequestProperty("anthropic-version", anthropicVersion);
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
            throw new IllegalStateException("AI가 처리하지 못했어요 (" + code + ")" + (msg.isEmpty() ? "" : ": " + msg));
        }
        return s.trim().isEmpty() ? new JSONObject() : new JSONObject(s);
    }
}
