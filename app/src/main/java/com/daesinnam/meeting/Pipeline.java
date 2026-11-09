package com.daesinnam.meeting;

import android.content.Context;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TimeZone;

/**
 * 회의 하나를 분석합니다: 조각별 화자 구분 받아쓰기 → 합치기 → GPT 분석 → 캘린더 등록.
 *
 * 화자 이름이 조각마다 바뀌지 않게, 앞 조각에서 처음 나온 화자의 목소리(2~10초)를 잘라
 * 다음 조각을 보낼 때 "알려진 화자"로 함께 보냅니다(최대 4명). 사용자가 목소리를 등록했다면
 * 그 목소리가 첫 번째 알려진 화자(사용자 이름)가 됩니다.
 * 조각별 결과는 chunk-NNN.json 에 남겨, 실패 후 다시 분석할 때 받아쓰기를 반복하지 않습니다.
 */
final class Pipeline {
    interface Progress {
        void step(String text);
    }

    private static final int MAX_REFS = 4;
    private final Context context;
    private final Store store;
    private final Prefs prefs;

    Pipeline(Context c) {
        context = c.getApplicationContext();
        store = new Store(context);
        prefs = new Prefs(context);
    }

    void run(String id, boolean transcribeAgain, Progress progress) throws Exception {
        String key = new Secrets(context).apiKey();
        if (key == null || key.isEmpty()) throw new IOException("설정에서 OpenAI API 키를 넣어 주세요.");
        OpenAi api = new OpenAi(prefs.baseUrl(), key);
        List<File> chunks = store.chunks(id);
        if (chunks.isEmpty()) throw new IOException("녹음된 내용이 없습니다.");

        // ---------- 1. 받아쓰기 ----------
        List<OpenAi.Ref> refs = new ArrayList<>();
        String myName = prefs.myName();
        boolean myVoice = !myName.isEmpty() && prefs.voiceSample().length() > 44;
        if (myVoice) refs.add(new OpenAi.Ref(myName, readAll(prefs.voiceSample())));
        int[] nextSpeaker = {1};

        JSONArray all = new JSONArray();
        LinkedHashSet<String> order = new LinkedHashSet<>();
        double offset = 0;
        for (int i = 0; i < chunks.size(); i++) {
            File wav = chunks.get(i);
            String cacheName = String.format(Locale.ROOT, "chunk-%03d.json", i);
            JSONObject cached = transcribeAgain ? null : store.optJson(id, cacheName);
            JSONObject norm;
            if (cached != null && cached.has("segments")) {
                norm = cached;
                // 이 조각에서 새로 만든 알려진 화자 목소리를 다시 잘라 둠 (다음 조각용)
                JSONArray nr = norm.optJSONArray("newRefs");
                for (int k = 0; nr != null && k < nr.length(); k++) {
                    JSONObject r = nr.getJSONObject(k);
                    byte[] clip = Wav.clip(wav, r.getDouble("start"), r.getDouble("end"));
                    if (clip != null && refs.size() < MAX_REFS) refs.add(new OpenAi.Ref(r.getString("name"), clip));
                }
                nextSpeaker[0] = Math.max(nextSpeaker[0], norm.optInt("nextSpeaker", nextSpeaker[0]));
            } else {
                if (Wav.seconds(wav) < 0.5) continue;
                progress.step(chunks.size() == 1 ? "받아쓰는 중…" : "받아쓰는 중 (" + (i + 1) + "/" + chunks.size() + ")");
                JSONObject raw = api.transcribe(wav, prefs.transcribeModel(), refs);
                norm = normalize(raw, wav, refs, nextSpeaker);
                store.putJson(id, cacheName, norm);
            }
            JSONArray segs = norm.getJSONArray("segments");
            for (int k = 0; k < segs.length(); k++) {
                JSONObject s = segs.getJSONObject(k);
                JSONObject o = new JSONObject();
                o.put("speaker", s.getString("speaker"));
                o.put("start", round(s.getDouble("start") + offset));
                o.put("end", round(s.getDouble("end") + offset));
                o.put("text", s.getString("text"));
                all.put(o);
                order.add(s.getString("speaker"));
            }
            offset += Wav.seconds(wav);
        }
        JSONObject transcript = new JSONObject();
        transcript.put("segments", all);
        transcript.put("speakers", new JSONArray(new ArrayList<>(order)));
        store.putJson(id, "transcript.json", transcript);
        if (all.length() == 0) throw new IOException("녹음에서 말소리를 찾지 못했습니다.");

        // ---------- 2. 분석 ----------
        progress.step("회의 내용을 정리하는 중…");
        JSONObject meta = store.meta(id);
        if (myVoice && order.contains(myName) && meta.optString("myLabel").isEmpty()) {
            meta.put("myLabel", myName);
            store.saveMeta(id, meta);
        }
        JSONObject analysis = api.analyzeJson(prefs.analysisModel(), INSTRUCTIONS, buildInput(meta, transcript, myName));
        for (String k : new String[]{"keyPoints", "decisions", "speakers", "requestsToMe", "actionItems", "schedules", "openQuestions"}) {
            if (!(analysis.opt(k) instanceof JSONArray)) analysis.put(k, new JSONArray());
        }
        store.putJson(id, "analysis.json", analysis);

        // ---------- 3. 캘린더 ----------
        meta = store.meta(id);
        JSONObject events = meta.optJSONObject("events");
        Calendars cal = new Calendars(context);
        // 다시 분석하면 일정 번호가 바뀌므로, 앞서 자동으로 넣은 일정은 빼고 새로 넣습니다
        if (events != null && cal.permitted()) {
            JSONObject autoAdded = meta.optJSONObject("autoEvents");
            for (java.util.Iterator<String> it = events.keys(); it.hasNext(); ) {
                String k = it.next();
                if (autoAdded != null && autoAdded.has(k)) {
                    try {
                        cal.delete(events.getLong(k));
                    } catch (Exception ignored) {
                    }
                }
            }
        }
        events = new JSONObject();
        JSONObject autoAdded = new JSONObject();
        int added = 0;
        if (prefs.autoCalendar() && cal.permitted()) {
            long calId = cal.pick(prefs.calendarId());
            JSONArray sch = analysis.getJSONArray("schedules");
            for (int i = 0; calId >= 0 && i < sch.length(); i++) {
                JSONObject s = sch.getJSONObject(i);
                if (!Calendars.autoEligible(s)) continue;
                try {
                    long ev = cal.insert(calId, s, titleOf(meta, analysis), analysis.optString("summary"));
                    events.put(String.valueOf(i), ev);
                    autoAdded.put(String.valueOf(i), true);
                    added++;
                } catch (Exception ignored) {
                    // 넣지 못한 일정은 화면에서 직접 넣을 수 있음
                }
            }
        }
        meta.put("events", events);
        meta.put("autoEvents", autoAdded);
        meta.put("eventsAdded", added);
        meta.put("analyzedAt", System.currentTimeMillis());
        meta.put("myNameUsed", myVoice);
        meta.put("state", "done");
        meta.remove("error");
        meta.remove("step");
        store.saveMeta(id, meta);
    }

    /** 받아쓰기 결과의 화자 이름을 회의 전체에서 같은 이름(화자1, 화자2 … 또는 사용자 이름)으로 맞춥니다 */
    private static JSONObject normalize(JSONObject raw, File wav, List<OpenAi.Ref> refs, int[] nextSpeaker) throws JSONException, IOException {
        JSONArray segs = raw.optJSONArray("segments");
        if (segs == null) segs = new JSONArray();
        Map<String, String> local = new HashMap<>();
        java.util.Set<String> known = new java.util.HashSet<>();
        for (OpenAi.Ref r : refs) known.add(r.name);
        JSONArray out = new JSONArray();
        Map<String, double[]> best = new HashMap<>();
        List<String> fresh = new ArrayList<>();
        for (int i = 0; i < segs.length(); i++) {
            JSONObject s = segs.getJSONObject(i);
            String text = s.optString("text", "").trim();
            if (text.isEmpty()) continue;
            String label = s.optString("speaker", "?");
            String global;
            if (known.contains(label)) global = label;
            else {
                global = local.get(label);
                if (global == null) {
                    global = "화자" + (nextSpeaker[0]++);
                    local.put(label, global);
                    fresh.add(global);
                }
            }
            double start = s.optDouble("start", 0);
            double end = s.optDouble("end", start);
            JSONObject o = new JSONObject();
            o.put("speaker", global);
            o.put("start", round(start));
            o.put("end", round(end));
            o.put("text", text);
            out.put(o);
            double len = end - start;
            double[] b = best.get(global);
            if (len >= 2 && (b == null || len > b[1] - b[0])) best.put(global, new double[]{start, end});
        }
        JSONArray newRefs = new JSONArray();
        for (String g : fresh) {
            if (refs.size() >= MAX_REFS) break;
            double[] b = best.get(g);
            if (b == null) continue;
            double s = b[0] + 0.2;
            double e = Math.min(b[1] - 0.1, s + 8);
            if (e - s < 2) continue;
            byte[] clip = Wav.clip(wav, s, e);
            if (clip == null) continue;
            refs.add(new OpenAi.Ref(g, clip));
            newRefs.put(new JSONObject().put("name", g).put("start", round(s)).put("end", round(e)));
        }
        JSONObject norm = new JSONObject();
        norm.put("segments", out);
        norm.put("newRefs", newRefs);
        norm.put("nextSpeaker", nextSpeaker[0]);
        return norm;
    }

    private static final String INSTRUCTIONS =
            "너는 회의록 비서다. 회의 받아쓰기를 읽고 한국어로 정리해 JSON 하나만 출력한다.\n"
            + "규칙:\n"
            + "- 받아쓰기에 없는 내용은 지어내지 않는다. 확실하지 않으면 비워 두거나 confidence를 낮춘다.\n"
            + "- 화자는 받아쓰기의 화자 표시(label)를 그대로 쓴다. 대화에서 이름·직함이 드러나면 speakers[].name에 추정해 적는다.\n"
            + "- '나'는 이 앱을 쓰는 사람이다. 입력에 '나'의 화자 표시나 이름이 주어진다. requestsToMe에는 다른 사람이 '나'에게 "
            + "부탁·지시·요청한 일, 그리고 '나'가 하겠다고 약속한 일을 모두 넣는다. '나'를 부르는 호칭(이름, 직함, '대신 씨' 등)으로 "
            + "말을 건 경우도 포함한다.\n"
            + "- 날짜 표현('다음 주 금요일', '모레 오후 3시')은 회의 날짜를 기준으로 실제 날짜로 바꾼다. 시각은 회의 지역 시간대 기준이다.\n"
            + "- schedules에는 회의·약속·마감처럼 캘린더에 넣을 만한 일정만 넣는다. 날짜와 시각이 분명하면 confidence를 0.8 이상, "
            + "날짜만 있거나 애매하면 0.6 이하로 둔다. 시각이 없으면 allDay=true와 날짜만 쓴다.\n"
            + "- evidence와 quote에는 근거가 된 발언을 짧게 그대로 인용한다.\n"
            + "출력 JSON 형식:\n"
            + "{\"title\":\"회의 제목(20자 이내)\",\"summary\":\"3~5문장 요약\",\"keyPoints\":[\"핵심 내용\"],\"decisions\":[\"결정 사항\"],"
            + "\"speakers\":[{\"label\":\"화자 표시\",\"name\":\"추정 이름 또는 null\",\"role\":\"역할 추정\",\"summary\":\"이 사람이 한 말 요약\",\"points\":[\"주요 발언\"]}],"
            + "\"requestsToMe\":[{\"from\":\"요청한 화자 표시\",\"request\":\"요청 내용\",\"due\":\"YYYY-MM-DDTHH:mm 또는 YYYY-MM-DD 또는 null\",\"priority\":\"high|normal|low\",\"quote\":\"근거 발언\"}],"
            + "\"actionItems\":[{\"owner\":\"담당 화자 표시 또는 이름\",\"task\":\"할 일\",\"due\":\"날짜 또는 null\"}],"
            + "\"schedules\":[{\"title\":\"일정 이름\",\"start\":\"YYYY-MM-DDTHH:mm 또는 YYYY-MM-DD\",\"end\":\"YYYY-MM-DDTHH:mm 또는 null\",\"allDay\":false,"
            + "\"location\":\"\",\"attendees\":[\"화자 표시\"],\"notes\":\"\",\"confidence\":0.0,\"evidence\":\"근거 발언\"}],"
            + "\"openQuestions\":[\"결론 나지 않은 질문\"]}";

    private static String buildInput(JSONObject meta, JSONObject transcript, String myName) throws JSONException {
        TimeZone tz = TimeZone.getDefault();
        SimpleDateFormat f = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm (EEEE)", Locale.KOREAN);
        f.setTimeZone(tz);
        StringBuilder sb = new StringBuilder();
        sb.append("회의 시작: ").append(f.format(new Date(meta.optLong("startedAt")))).append('\n');
        int offsetMin = tz.getOffset(meta.optLong("startedAt")) / 60000;
        sb.append("시간대: ").append(tz.getID()).append(String.format(Locale.ROOT, " (UTC%+03d:%02d)", offsetMin / 60, Math.abs(offsetMin % 60))).append('\n');
        sb.append("회의 길이: ").append(meta.optLong("durationMs") / 60000).append("분\n");
        if (!meta.optString("title").isEmpty()) sb.append("사용자가 붙인 회의 이름: ").append(meta.optString("title")).append('\n');
        String myLabel = meta.optString("myLabel");
        sb.append("'나'의 이름: ").append(myName.isEmpty() ? "(알 수 없음)" : myName).append('\n');
        sb.append("'나'의 화자 표시: ").append(myLabel.isEmpty() ? "(알 수 없음 — 대화 내용으로 판단)" : myLabel).append('\n');
        JSONObject names = meta.optJSONObject("speakerNames");
        if (names != null && names.length() > 0) {
            sb.append("사용자가 확인한 화자 이름: ");
            for (java.util.Iterator<String> it = names.keys(); it.hasNext(); ) {
                String k = it.next();
                sb.append(k).append('=').append(names.getString(k)).append("  ");
            }
            sb.append('\n');
        }
        sb.append("\n받아쓰기 ([분:초] 화자: 발언):\n");
        JSONArray segs = transcript.getJSONArray("segments");
        String last = null;
        for (int i = 0; i < segs.length(); i++) {
            JSONObject s = segs.getJSONObject(i);
            String spk = s.getString("speaker");
            int t = (int) s.getDouble("start");
            if (spk.equals(last)) {
                sb.append(' ').append(s.getString("text"));
            } else {
                sb.append(String.format(Locale.ROOT, "\n[%02d:%02d] ", t / 60, t % 60)).append(spk).append(": ").append(s.getString("text"));
            }
            last = spk;
        }
        sb.append("\n\n위 회의를 지시한 JSON 형식으로 정리해 줘.");
        return sb.toString();
    }

    static String titleOf(JSONObject meta, JSONObject analysis) {
        if (meta.optBoolean("titleSetByUser") && !meta.optString("title").isEmpty()) return meta.optString("title");
        String t = analysis == null ? "" : analysis.optString("title");
        return t.isEmpty() ? (meta.optString("title").isEmpty() ? "회의" : meta.optString("title")) : t;
    }

    private static double round(double v) {
        return Math.round(v * 100) / 100.0;
    }

    private static byte[] readAll(File f) throws IOException {
        try (InputStream in = new FileInputStream(f)) {
            byte[] b = new byte[(int) f.length()];
            int off = 0;
            while (off < b.length) {
                int n = in.read(b, off, b.length - off);
                if (n < 0) break;
                off += n;
            }
            return b;
        }
    }
}
