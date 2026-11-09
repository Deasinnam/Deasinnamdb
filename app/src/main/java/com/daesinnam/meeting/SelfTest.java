package com.daesinnam.meeting;

import android.content.Context;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

/**
 * 빌드 서버 에뮬레이터 자동 점검 (디버그 빌드에서만, --ez meeting.selftest true).
 * 가짜 OpenAI 서버(호스트 10.0.2.2:8787)를 상대로 녹음 → 조각별 받아쓰기(화자 이어 붙이기) → 분석 → 캘린더 등록까지 확인합니다.
 */
final class SelfTest {
    private static final String TAG = "MEETING_SELFTEST";

    private SelfTest() {}

    static void run(Context c) {
        try {
            Prefs prefs = new Prefs(c);
            prefs.edit().putString("baseUrl", "http://10.0.2.2:8787/v1").putString("myName", "이대신")
                    .putBoolean("autoCalendar", true).commit();
            new Secrets(c).setApiKey("sk-selftest-0000");
            Log.i(TAG, "key ok hint=" + new Secrets(c).hint() + " roundtrip=" + "sk-selftest-0000".equals(new Secrets(c).apiKey()));

            Calendars cal = new Calendars(c);
            if (cal.permitted() && cal.list().length() == 0) Log.i(TAG, "local calendar " + cal.createLocalCalendar());
            long calId = cal.pick(-1);
            prefs.edit().putLong("calendarId", calId).commit();
            Log.i(TAG, "calendar id=" + calId + " permitted=" + cal.permitted());

            // 내 목소리(합성음 3초)
            writeTone(prefs.voiceSample(), 3, 220);

            // 1) 실제 녹음 경로: 4초 녹음 후 취소
            RecorderService.start(c, "점검 녹음");
            Thread.sleep(4500);
            String recId = RecorderService.meetingId;
            File f = new Store(c).chunkFile(recId, 0);
            long size = f.length();
            Log.i(TAG, "record state=" + RecorderService.state + " bytes=" + size + " level=" + RecorderService.level);
            RecorderService.stop(c, true);
            Thread.sleep(2500);
            Log.i(TAG, (size > 44 + Wav.BYTES_PER_SEC * 2 ? "PASS" : "FAIL") + " recording wrote " + size + " bytes; cancelled state=" + RecorderService.state);

            // 2) 분석 경로: 30초 조각 두 개
            Store store = new Store(c);
            String id = store.create("", System.currentTimeMillis() - 65000);
            writeTone(store.chunkFile(id, 0), 30, 300);
            writeTone(store.chunkFile(id, 1), 30, 400);
            store.update(id, "durationMs", 60000);
            new Pipeline(c).run(id, false, t -> Log.i(TAG, "step " + t));
            JSONObject meta = store.meta(id);
            JSONObject tr = store.optJson(id, "transcript.json");
            JSONObject an = store.optJson(id, "analysis.json");
            JSONArray speakers = tr.getJSONArray("speakers");
            JSONObject events = meta.getJSONObject("events");
            boolean evOk = events.length() > 0 && cal.exists(events.getLong(events.keys().next()));
            Log.i(TAG, "speakers=" + speakers + " myLabel=" + meta.optString("myLabel") + " requestsToMe="
                    + an.getJSONArray("requestsToMe").length() + " events=" + events + " eventExists=" + evOk);
            boolean pass = speakers.length() == 4 && "이대신".equals(meta.optString("myLabel")) && evOk
                    && "done".equals(meta.optString("state")) && an.optString("title").length() > 0;
            Log.i(TAG, (pass ? "PASS" : "FAIL") + " pipeline");
        } catch (Throwable t) {
            Log.e(TAG, "FAIL exception", t);
        }
        Log.i(TAG, "DONE");
    }

    private static void writeTone(File f, int seconds, double hz) throws Exception {
        int n = Wav.RATE * seconds;
        byte[] pcm = new byte[n * 2];
        for (int i = 0; i < n; i++) {
            short v = (short) (Math.sin(2 * Math.PI * hz * i / Wav.RATE) * 6000);
            pcm[2 * i] = (byte) v;
            pcm[2 * i + 1] = (byte) (v >> 8);
        }
        try (OutputStream out = new FileOutputStream(f)) {
            out.write(Wav.header(pcm.length));
            out.write(pcm);
        }
    }
}
