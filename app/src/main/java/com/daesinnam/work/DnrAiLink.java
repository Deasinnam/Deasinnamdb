package com.daesinnam.work;

import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.webkit.WebView;
import android.widget.FrameLayout;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;

import org.json.JSONObject;
import org.json.JSONTokener;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;

/**
 * 덜누름 워크 ↔ DNR AI(Chat DNR Ai, 기기 안 AI) 양방향 연결.
 *
 * 편집 화면의 떠 있는 "AI" 단추 → 선택한 글(없으면 문서 글)을 DNR AI 창으로 보내 요약 · 번역 · 다듬기 →
 * 사람이 "문서에 넣기"를 누르면 결과를 선택 부분 대신(또는 커서 자리에) 붙여 넣음. 붙여 넣을 수 없는 편집기(그림으로 그리는 엑셀 · 한글 등)는 복사.
 * Chat DNR Ai가 설치되어 있을 때만 단추가 보임. 문서는 기기 밖으로 나가지 않음.
 * 통로 규약: Chat DNR Ai 저장소 docs/DNR-AI-통로.md
 */
final class DnrAiLink {
    private DnrAiLink() {}

    static final String PKG = "com.daesinnam.localai";
    static final String ACTION_ASK = "com.daesinnam.ai.action.ASK";
    private static String script;

    static boolean installed(Context c) {
        try {
            c.getPackageManager().getPackageInfo(PKG, 0);
            return c.getPackageManager().resolveActivity(new Intent(ACTION_ASK).setPackage(PKG), 0) != null;
        } catch (PackageManager.NameNotFoundException e) {
            return false;
        }
    }

    static void attach(Activity a, FrameLayout root, WebView web, ActivityResultLauncher<Intent> launcher) {
        if (!installed(a)) return;
        HomeButton.floating(a, root, "home_button", "dnrai", "AI", "DNR AI에게 맡기기: 요약 · 번역 · 맞춤법",
                0xFFE8590C, 0.45f, v -> capture(a, web, launcher));
    }

    private static String js(Context c) {
        if (script != null) return script;
        try (InputStream in = c.getAssets().open("work/dnr-ai.js")) {
            byte[] b = new byte[in.available()];
            int n = 0, r;
            while (n < b.length && (r = in.read(b, n, b.length - n)) > 0) n += r;
            script = new String(b, 0, n, StandardCharsets.UTF_8);
        } catch (Exception e) {
            script = "";
        }
        return script;
    }

    private static void capture(Activity a, WebView web, ActivityResultLauncher<Intent> launcher) {
        web.evaluateJavascript(js(a) + "\n;window.__dnrAi ? __dnrAi.capture() : null", v -> {
            String sel = "", all = "", title = "";
            boolean canInsert = false;
            try {
                Object o = new JSONTokener(v).nextValue();
                if (o instanceof String) {
                    JSONObject j = new JSONObject((String) o);
                    sel = j.optString("sel");
                    all = j.optString("all");
                    title = j.optString("title");
                    canInsert = j.optBoolean("canInsert");
                }
            } catch (Exception ignored) {
            }
            boolean hasSel = !sel.trim().isEmpty();
            String text = hasSel ? sel : all;
            String label = hasSel ? (canInsert ? "선택 부분 바꾸기" : "복사하기") : (canInsert ? "커서 자리에 넣기" : "복사하기");
            Intent i = new Intent(ACTION_ASK).setPackage(PKG)
                    .putExtra("title", hasSel ? "선택한 글 · DNR AI" : "워크 문서 · DNR AI")
                    .putExtra("insertLabel", label);
            if (!text.trim().isEmpty()) i.putExtra("text", text);
            try {
                launcher.launch(i);
            } catch (Exception e) {
                Toast.makeText(a, "Chat DNR Ai를 열지 못했어요", Toast.LENGTH_SHORT).show();
            }
        });
    }

    static void onResult(Activity a, WebView web, int code, Intent data) {
        if (code != Activity.RESULT_OK || data == null) return;
        String plain = data.getStringExtra("plain");
        String html = data.getStringExtra("html");
        String md = data.getStringExtra("result");
        if (plain == null || plain.isEmpty()) plain = md == null ? "" : md;
        if (plain.isEmpty()) return;
        final String text = plain;
        String call = js(a) + "\n;window.__dnrAi ? __dnrAi.insert(" + JSONObject.quote(html == null ? "" : html) + "," + JSONObject.quote(text) + ") : 'copy'";
        // 돌아온 직후엔 화면이 다시 붙는 중일 수 있어 아주 잠깐 기다림
        web.postDelayed(() -> web.evaluateJavascript(call, v -> {
            if (v != null && v.contains("ok")) {
                Toast.makeText(a, "DNR AI 결과를 문서에 넣었어요", Toast.LENGTH_SHORT).show();
            } else {
                ClipboardManager cm = (ClipboardManager) a.getSystemService(Context.CLIPBOARD_SERVICE);
                cm.setPrimaryClip(ClipData.newPlainText("DNR AI", md != null && !md.isEmpty() ? md : text));
                Toast.makeText(a, "DNR AI 결과를 복사했어요. 넣을 곳을 길게 눌러 붙여 넣으세요", Toast.LENGTH_LONG).show();
            }
        }), 250);
    }
}
