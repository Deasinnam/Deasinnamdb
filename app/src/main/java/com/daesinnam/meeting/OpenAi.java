package com.daesinnam.meeting;

import android.util.Base64;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.concurrent.TimeUnit;

import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import okhttp3.ResponseBody;

/**
 * OpenAI API 호출
 *  - 받아쓰기: POST /audio/transcriptions (gpt-4o-transcribe-diarize, diarized_json, chunking_strategy=auto,
 *    known_speaker_names[] / known_speaker_references[] 로 앞 조각의 화자를 이어 붙임 — 최대 4명, 2~10초 클립)
 *  - 분석:    POST /responses (JSON 모드). 404면 /chat/completions 로 다시 시도
 */
final class OpenAi {
    static final class Ref {
        final String name;
        final byte[] wav;

        Ref(String name, byte[] wav) {
            this.name = name;
            this.wav = wav;
        }
    }

    static final class ApiException extends IOException {
        final int status;

        ApiException(int status, String msg) {
            super(msg);
            this.status = status;
        }
    }

    private static final MediaType WAV = MediaType.get("audio/wav");
    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");

    private final OkHttpClient http = new OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(10, TimeUnit.MINUTES)
            .readTimeout(15, TimeUnit.MINUTES)
            .callTimeout(20, TimeUnit.MINUTES)
            .build();
    private final String base;
    private final String key;

    OpenAi(String baseUrl, String apiKey) {
        this.base = baseUrl;
        this.key = apiKey;
    }

    JSONObject transcribe(File wav, String model, List<Ref> refs) throws IOException {
        MultipartBody.Builder b = new MultipartBody.Builder().setType(MultipartBody.FORM)
                .addFormDataPart("file", wav.getName(), RequestBody.create(wav, WAV))
                .addFormDataPart("model", model)
                .addFormDataPart("response_format", "diarized_json")
                .addFormDataPart("chunking_strategy", "auto");
        for (Ref r : refs) {
            b.addFormDataPart("known_speaker_names[]", r.name);
            b.addFormDataPart("known_speaker_references[]",
                    "data:audio/wav;base64," + Base64.encodeToString(r.wav, Base64.NO_WRAP));
        }
        Request req = new Request.Builder().url(base + "/audio/transcriptions")
                .header("Authorization", "Bearer " + key)
                .post(b.build()).build();
        return withRetry(req);
    }

    JSONObject analyzeJson(String model, String instructions, String input) throws IOException {
        JSONObject body = new JSONObject();
        try {
            body.put("model", model);
            body.put("instructions", instructions);
            body.put("input", input);
            body.put("text", new JSONObject().put("format", new JSONObject().put("type", "json_object")));
        } catch (JSONException e) {
            throw new IOException(e);
        }
        Request req = new Request.Builder().url(base + "/responses")
                .header("Authorization", "Bearer " + key)
                .post(RequestBody.create(body.toString(), JSON)).build();
        String text;
        try {
            text = outputText(withRetry(req));
        } catch (ApiException e) {
            if (e.status != 404) throw e;
            text = chatFallback(model, instructions, input);
        }
        try {
            return new JSONObject(stripFence(text));
        } catch (JSONException e) {
            throw new IOException("분석 결과를 읽지 못했습니다 (JSON 아님)");
        }
    }

    private String chatFallback(String model, String instructions, String input) throws IOException {
        try {
            JSONObject body = new JSONObject()
                    .put("model", model)
                    .put("response_format", new JSONObject().put("type", "json_object"))
                    .put("messages", new JSONArray()
                            .put(new JSONObject().put("role", "system").put("content", instructions))
                            .put(new JSONObject().put("role", "user").put("content", input)));
            Request req = new Request.Builder().url(base + "/chat/completions")
                    .header("Authorization", "Bearer " + key)
                    .post(RequestBody.create(body.toString(), JSON)).build();
            JSONObject r = withRetry(req);
            return r.getJSONArray("choices").getJSONObject(0).getJSONObject("message").getString("content");
        } catch (JSONException e) {
            throw new IOException("분석 응답 형식이 예상과 다릅니다");
        }
    }

    /** Responses API 응답에서 글자 출력만 모읍니다 */
    static String outputText(JSONObject r) throws IOException {
        if (r.has("output_text") && !r.optString("output_text").isEmpty()) return r.optString("output_text");
        JSONArray out = r.optJSONArray("output");
        StringBuilder sb = new StringBuilder();
        if (out != null) {
            for (int i = 0; i < out.length(); i++) {
                JSONObject item = out.optJSONObject(i);
                if (item == null || !"message".equals(item.optString("type"))) continue;
                JSONArray content = item.optJSONArray("content");
                if (content == null) continue;
                for (int j = 0; j < content.length(); j++) {
                    JSONObject c = content.optJSONObject(j);
                    if (c != null && "output_text".equals(c.optString("type"))) sb.append(c.optString("text"));
                }
            }
        }
        if (sb.length() == 0) throw new IOException("분석 응답이 비어 있습니다");
        return sb.toString();
    }

    private static String stripFence(String t) {
        String s = t.trim();
        if (s.startsWith("```")) {
            int nl = s.indexOf('\n');
            int end = s.lastIndexOf("```");
            if (nl > 0 && end > nl) s = s.substring(nl + 1, end).trim();
        }
        return s;
    }

    private JSONObject withRetry(Request req) throws IOException {
        IOException last = null;
        for (int attempt = 0; attempt < 3; attempt++) {
            try (Response res = http.newCall(req).execute()) {
                ResponseBody rb = res.body();
                String text = rb == null ? "" : rb.string();
                if (res.isSuccessful()) {
                    try {
                        return new JSONObject(text);
                    } catch (JSONException e) {
                        throw new IOException("응답을 읽지 못했습니다");
                    }
                }
                ApiException err = new ApiException(res.code(), explain(res.code(), text));
                if (res.code() != 429 && res.code() < 500) throw err;
                last = err;
            } catch (ApiException e) {
                if (e.status != 429 && e.status < 500) throw e;
                last = e;
            } catch (IOException e) {
                last = new IOException("인터넷 연결 문제: " + e.getMessage(), e);
            }
            try {
                Thread.sleep(3000L * (attempt + 1) * (attempt + 1));
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                break;
            }
        }
        throw last != null ? last : new IOException("요청 실패");
    }

    private static String explain(int code, String body) {
        String msg = "";
        try {
            msg = new JSONObject(body).getJSONObject("error").optString("message");
        } catch (JSONException ignored) {
        }
        switch (code) {
            case 401: return "API 키가 올바르지 않습니다 (401). 설정에서 키를 확인해 주세요.";
            case 403: return "이 키로는 쓸 수 없는 모델입니다 (403). " + msg;
            case 404: return "모델이나 주소를 찾지 못했습니다 (404). 설정의 모델 이름을 확인해 주세요. " + msg;
            case 413: return "녹음 조각이 너무 큽니다 (413).";
            case 429: return "요청 한도나 결제 한도를 넘었습니다 (429). " + msg;
            default: return "OpenAI 오류 " + code + (msg.isEmpty() ? "" : ": " + msg);
        }
    }
}
