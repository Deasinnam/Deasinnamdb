package com.daesinnam.dnrai;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;

/**
 * DNR AI 통로 — 덜누름 앱에서 Chat DNR Ai(기기 안 AI)를 부르는 작은 도우미. 이 파일 하나를 복사해 쓰세요.
 *
 * 매니페스트에 꼭 넣기(안드로이드 11+ 앱 보기 제한):
 *   <queries><package android:name="com.daesinnam.localai" /></queries>
 *
 * 쓰는 법:
 *   if (DnrAi.installed(ctx)) launcher.launch(DnrAi.ask("요약할 글", DnrAi.TASK_SUMMARY, "워크 문서", "문서에 넣기", false));
 *   // 돌아오면: RESULT_OK 일 때 DnrAi.result(data) = 마크다운 답, DnrAi.plain(data) = 기호를 뺀 글
 *
 * 창은 Chat DNR Ai가 띄우고, 사람이 "넣기"를 눌러야 결과가 돌아옵니다. 모두 기기 안에서만 처리됩니다.
 */
public final class DnrAi {
    private DnrAi() {}

    public static final String PKG = "com.daesinnam.localai";
    public static final String ACTION_ASK = "com.daesinnam.ai.action.ASK";

    /** 정해진 일(task). 그 밖의 글을 넣으면 그 글이 그대로 지시가 됩니다 */
    public static final String TASK_SUMMARY = "summary";   // 요약
    public static final String TASK_FIX = "fix";           // 맞춤법 · 다듬기
    public static final String TASK_EASY = "easy";         // 쉽게 풀어 쓰기
    public static final String TASK_EN = "en";             // 영어로 번역
    public static final String TASK_KO = "ko";             // 한국어로 번역
    public static final String TASK_TABLE = "table";       // 표로 정리
    public static final String TASK_CONTINUE = "continue"; // 이어 쓰기

    public static boolean installed(Context c) {
        try {
            c.getPackageManager().getPackageInfo(PKG, 0);
            return c.getPackageManager().resolveActivity(new Intent(ACTION_ASK).setPackage(PKG), 0) != null;
        } catch (PackageManager.NameNotFoundException e) {
            return false;
        }
    }

    /**
     * @param text        AI에 함께 보낼 글(선택 부분 · 문서 내용). 없으면 null — 앞 7,000자까지만 씀
     * @param task        TASK_* 또는 직접 쓴 지시. null이면 사용자가 창에서 고름
     * @param title       창 제목(예: "워크 문서")
     * @param insertLabel 결과를 돌려받는 단추 이름(예: "문서에 넣기"). null이면 단추 없음(묻고 보기만)
     * @param voice       true면 창이 열리자마자 말로 묻기(DNR 음성 엔진)
     */
    public static Intent ask(String text, String task, String title, String insertLabel, boolean voice) {
        Intent i = new Intent(ACTION_ASK).setPackage(PKG);
        if (text != null) i.putExtra("text", text);
        if (task != null) i.putExtra("task", task);
        if (title != null) i.putExtra("title", title);
        if (insertLabel != null) i.putExtra("insertLabel", insertLabel);
        if (voice) i.putExtra("voice", true);
        return i;
    }

    public static String result(Intent data) { return data == null ? null : data.getStringExtra("result"); }
    public static String plain(Intent data) { return data == null ? null : data.getStringExtra("plain"); }
    /** 제목 · 목록 · 표가 살아 있는 HTML(문서 편집기에 붙여 넣기용) */
    public static String html(Intent data) { return data == null ? null : data.getStringExtra("html"); }
}
