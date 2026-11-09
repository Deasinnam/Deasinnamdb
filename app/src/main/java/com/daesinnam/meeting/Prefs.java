package com.daesinnam.meeting;

import android.content.Context;
import android.content.SharedPreferences;

import java.io.File;

/** 사용자 설정 */
final class Prefs {
    static final String DEFAULT_TRANSCRIBE = "gpt-4o-transcribe-diarize";
    static final String DEFAULT_ANALYSIS = "gpt-5.6-terra";
    static final String DEFAULT_BASE = "https://api.openai.com/v1";

    private final SharedPreferences p;
    private final Context context;

    Prefs(Context c) {
        context = c.getApplicationContext();
        p = context.getSharedPreferences("settings", Context.MODE_PRIVATE);
    }

    String myName() { return p.getString("myName", ""); }
    long calendarId() { return p.getLong("calendarId", -1); }
    boolean autoCalendar() { return p.getBoolean("autoCalendar", true); }
    /** "auto" = 앱이 OpenAI로 분석까지, "external" = 받아쓰기만 하고 ChatGPT·Claude 앱으로 보내 분석 */
    String analysisMode() { return "external".equals(p.getString("analysisMode", "auto")) ? "external" : "auto"; }
    String transcribeModel() { return nonEmpty(p.getString("transcribeModel", ""), DEFAULT_TRANSCRIBE); }
    String analysisModel() { return nonEmpty(p.getString("analysisModel", ""), DEFAULT_ANALYSIS); }
    String baseUrl() {
        String b = nonEmpty(p.getString("baseUrl", ""), DEFAULT_BASE);
        return b.endsWith("/") ? b.substring(0, b.length() - 1) : b;
    }

    File voiceSample() { return new File(context.getFilesDir(), "my-voice.wav"); }

    SharedPreferences.Editor edit() { return p.edit(); }

    private static String nonEmpty(String s, String d) {
        return s == null || s.trim().isEmpty() ? d : s.trim();
    }
}
