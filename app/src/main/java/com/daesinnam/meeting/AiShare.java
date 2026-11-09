package com.daesinnam.meeting;

import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;

import androidx.core.content.FileProvider;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

/**
 * 받아쓴 회의 기록을 ChatGPT·Claude 앱으로 보냅니다. 분석은 사용자의 구독(ChatGPT Plus, Claude Pro 등)으로 하게 됩니다.
 * 정리해 달라는 요청문을 맨 앞에 붙이고, 기록이 길면 .txt 파일로 첨부합니다. 어떤 앱이 글을 받지 못해도
 * 붙여 넣을 수 있게 항상 클립보드에도 복사합니다.
 */
final class AiShare {
    static final String CHATGPT = "com.openai.chatgpt";
    static final String CLAUDE = "com.anthropic.claude";
    /** 이보다 길면 글 대신 파일로 보냅니다 (인텐트 크기 한도 1MB 대비 넉넉히) */
    private static final int MAX_INLINE_CHARS = 60_000;

    private AiShare() {}

    static boolean installed(Context c, String pkg) {
        try {
            c.getPackageManager().getPackageInfo(pkg, 0);
            return true;
        } catch (PackageManager.NameNotFoundException e) {
            return false;
        }
    }

    static JSONObject apps(Context c) throws JSONException {
        return new JSONObject().put("chatgpt", installed(c, CHATGPT)).put("claude", installed(c, CLAUDE));
    }

    /** 요청문 + 회의 정보 + 화자별 받아쓰기 */
    static String buildText(JSONObject meta, JSONObject transcript, String myName) throws JSONException {
        JSONObject names = meta.optJSONObject("speakerNames");
        String myLabel = meta.optString("myLabel");
        String me = !myName.isEmpty() ? myName : (myLabel.isEmpty() ? "" : display(myLabel, names));

        StringBuilder sb = new StringBuilder();
        sb.append("아래는 회의 녹음을 화자별로 받아쓴 기록이야. 한국어로 다음을 정리해 줘.\n")
                .append("1. 회의 요약 (3~5문장)\n")
                .append("2. 핵심 내용과 결정 사항\n")
                .append("3. 화자별 주요 발언과 입장\n")
                .append("4. ").append(me.isEmpty() ? "나" : "나(" + me + ")")
                .append("에게 요청하거나 맡긴 일 — 누가, 무엇을, 언제까지 (가장 중요하니 빠짐없이)\n")
                .append("5. 할 일 목록 (담당자·기한)\n")
                .append("6. 일정 — 제목, 날짜·시간, 장소, 참석자. '다음 주 화요일' 같은 말은 회의 날짜를 기준으로 실제 날짜로 바꿔 줘\n")
                .append("7. 결론 나지 않은 질문\n")
                .append("받아쓰기라 틀린 글자가 있을 수 있으니 문맥으로 바로잡고, 확실하지 않은 내용은 '확인 필요'라고 표시해 줘.\n")
                .append("캘린더가 연결되어 있다면, 정리한 일정을 보여 주고 내가 확인하면 캘린더에 등록해 줘.\n\n");

        TimeZone tz = TimeZone.getDefault();
        SimpleDateFormat f = new SimpleDateFormat("yyyy-MM-dd (E) HH:mm", Locale.KOREAN);
        f.setTimeZone(tz);
        sb.append("[회의 정보]\n");
        if (!meta.optString("title").isEmpty()) sb.append("- 회의 이름: ").append(meta.optString("title")).append('\n');
        sb.append("- 시작: ").append(f.format(new Date(meta.optLong("startedAt")))).append(" (").append(tz.getID()).append(")\n");
        long min = meta.optLong("durationMs") / 60000;
        if (min > 0) sb.append("- 길이: 약 ").append(min).append("분\n");
        if (!me.isEmpty()) {
            sb.append("- 나: ").append(me);
            if (!myLabel.isEmpty()) sb.append(" (기록에서 '").append(display(myLabel, names)).append("')");
            sb.append('\n');
        }
        JSONArray spk = transcript.optJSONArray("speakers");
        if (spk != null && spk.length() > 0) {
            sb.append("- 화자: ");
            for (int i = 0; i < spk.length(); i++) {
                if (i > 0) sb.append(", ");
                sb.append(display(spk.getString(i), names));
            }
            sb.append(" (이름이 '화자N'이면 누구인지 모르는 사람)\n");
        }

        sb.append("\n[받아쓰기]");
        JSONArray segs = transcript.getJSONArray("segments");
        String last = null;
        for (int i = 0; i < segs.length(); i++) {
            JSONObject s = segs.getJSONObject(i);
            String who = s.getString("speaker");
            if (who.equals(last)) {
                sb.append(' ').append(s.getString("text"));
            } else {
                int t = (int) s.getDouble("start");
                sb.append(t >= 3600
                        ? String.format(Locale.ROOT, "\n[%d:%02d:%02d] ", t / 3600, t / 60 % 60, t % 60)
                        : String.format(Locale.ROOT, "\n[%02d:%02d] ", t / 60, t % 60));
                sb.append(display(who, names)).append(": ").append(s.getString("text"));
            }
            last = who;
        }
        sb.append('\n');
        return sb.toString();
    }

    private static String display(String label, JSONObject names) {
        if (names != null) {
            String n = names.optString(label, "");
            if (!n.isEmpty()) return n;
        }
        return label;
    }

    /**
     * 보낼 인텐트를 만듭니다. pkg 가 null 이면 공유 시트를 띄웁니다.
     */
    static Intent intent(Context c, String text, String title, String pkg) throws IOException {
        Intent send = new Intent(Intent.ACTION_SEND).setType("text/plain");
        if (text.length() <= MAX_INLINE_CHARS) {
            send.putExtra(Intent.EXTRA_TEXT, text);
        } else {
            File dir = new File(c.getCacheDir(), "share");
            //noinspection ResultOfMethodCallIgnored
            dir.mkdirs();
            File[] old = dir.listFiles();
            if (old != null) for (File o : old) //noinspection ResultOfMethodCallIgnored
                o.delete();
            File f = new File(dir, safeName(title) + ".txt");
            try (OutputStream out = new FileOutputStream(f)) {
                out.write(text.getBytes(StandardCharsets.UTF_8));
            }
            Uri uri = FileProvider.getUriForFile(c, c.getPackageName() + ".files", f);
            send.putExtra(Intent.EXTRA_STREAM, uri);
            send.putExtra(Intent.EXTRA_TEXT, "첨부한 회의 기록 파일을 읽고, 파일 맨 앞에 적힌 요청대로 정리해 줘.");
            send.setClipData(ClipData.newRawUri(f.getName(), uri));
            send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        }
        send.putExtra(Intent.EXTRA_SUBJECT, title);
        if (pkg != null) {
            send.setPackage(pkg);
            return send;
        }
        return Intent.createChooser(send, "회의 기록 보내기");
    }

    static void copy(Context c, String text) {
        ClipboardManager cm = c.getSystemService(ClipboardManager.class);
        if (cm != null) cm.setPrimaryClip(ClipData.newPlainText("회의 기록", text));
    }

    /** 대상 앱을 열고, 그 앱이 없거나 받지 못하면 공유 시트로 대신합니다 */
    static void launch(Context c, Intent target, Intent fallback) {
        try {
            c.startActivity(target);
        } catch (ActivityNotFoundException | SecurityException e) {
            c.startActivity(fallback);
        }
    }

    private static String safeName(String s) {
        String t = s.replaceAll("[\\\\/:*?\"<>|\\s]+", "_");
        if (t.isEmpty()) t = "회의기록";
        return t.length() > 40 ? t.substring(0, 40) : t;
    }
}
