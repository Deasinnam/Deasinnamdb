package com.daesinnam.meeting;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.ActivityNotFoundException;
import android.content.ContentUris;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaRecorder;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.CalendarContract;
import android.util.Log;
import android.view.ViewGroup;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;

import androidx.activity.ComponentActivity;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.webkit.JavaScriptReplyProxy;
import androidx.webkit.WebMessageCompat;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * 회의비서: 화면은 assets/ui (WebView), 녹음·분석·캘린더는 앱(Java)이 맡습니다.
 * 화면 ↔ 앱은 addWebMessageListener로 {id, method, args} → {id, result} 를 주고받습니다.
 */
public class MainActivity extends ComponentActivity {
    private static final String TAG = "Meeting";
    private static final String ORIGIN = "https://appassets.androidplatform.net";
    private static final String HOME = ORIGIN + "/assets/ui/index.html";

    private WebView web;
    private Store store;
    private Prefs prefs;
    private Secrets secrets;
    private Calendars calendars;
    private final ExecutorService io = Executors.newSingleThreadExecutor();
    private final Handler main = new Handler(Looper.getMainLooper());
    private JavaScriptReplyProxy pageProxy;

    // 권한 요청이 끝나면 이어서 할 일
    private Runnable afterPermission;
    private final ActivityResultLauncher<String[]> permissions =
            registerForActivityResult(new ActivityResultContracts.RequestMultiplePermissions(), r -> {
                Runnable next = afterPermission;
                afterPermission = null;
                if (next != null) next.run();
            });

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        store = new Store(this);
        prefs = new Prefs(this);
        secrets = new Secrets(this);
        calendars = new Calendars(this);

        FrameLayout root = new FrameLayout(this);
        web = new WebView(this);
        root.addView(web, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        setContentView(root);
        ViewCompat.setOnApplyWindowInsetsListener(root, (v, insets) -> {
            Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars()
                    | WindowInsetsCompat.Type.displayCutout() | WindowInsetsCompat.Type.ime());
            v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            return WindowInsetsCompat.CONSUMED;
        });

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setTextZoom(100);

        WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                WebResourceResponse r = loader.shouldInterceptRequest(request.getUrl());
                if (r == null && "appassets.androidplatform.net".equals(request.getUrl().getHost())) {
                    return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", Collections.emptyMap(),
                            new ByteArrayInputStream(new byte[0]));
                }
                return r;
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !"appassets.androidplatform.net".equals(request.getUrl().getHost());
            }
        });
        if (WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
            WebViewCompat.addWebMessageListener(web, "MeetingAndroid", Collections.singleton(ORIGIN), this::onMessage);
        } else {
            Toast.makeText(this, "Android System WebView를 업데이트해 주세요", Toast.LENGTH_LONG).show();
        }
        RecorderService.onChange = this::pushRefresh;

        String open = getIntent() == null ? null : getIntent().getStringExtra(RecorderService.EXTRA_ID);
        web.loadUrl(open == null ? HOME : HOME + "#m/" + Uri.encode(open));

        if (BuildConfig.DEBUG && getIntent() != null && getIntent().hasExtra("meeting.selftest")) {
            new Thread(() -> SelfTest.run(this), "selftest").start();
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        String id = intent.getStringExtra(RecorderService.EXTRA_ID);
        if (id != null) web.evaluateJavascript("location.hash=" + JSONObject.quote("#m/" + Uri.encode(id)), null);
    }

    @Override
    protected void onDestroy() {
        if (RecorderService.onChange != null) RecorderService.onChange = null;
        io.shutdown();
        web.destroy();
        super.onDestroy();
    }

    private void pushRefresh() {
        JavaScriptReplyProxy p = pageProxy;
        if (p == null) return;
        main.post(() -> {
            try {
                p.postMessage("{\"push\":\"refresh\"}");
            } catch (Exception ignored) {
            }
        });
    }

    // ---------- 화면 → 앱 ----------

    private void onMessage(@NonNull WebView view, @NonNull WebMessageCompat message, @NonNull Uri origin,
                           boolean isMainFrame, @NonNull JavaScriptReplyProxy proxy) {
        if (!isMainFrame || message.getData() == null) return;
        pageProxy = proxy;
        int id;
        String method;
        JSONArray a;
        try {
            JSONObject m = new JSONObject(message.getData());
            id = m.getInt("id");
            method = m.getString("method");
            a = m.optJSONArray("args");
            if (a == null) a = new JSONArray();
        } catch (JSONException e) {
            return;
        }
        final JSONArray args = a;
        switch (method) {
            case "startRecording":
                startRecording(proxy, id, args.optString(0, ""));
                return;
            case "recordVoiceSample":
                needPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, () -> io.execute(() -> reply(proxy, id, recordVoiceSample())));
                return;
            case "requestCalendarPermission":
                needPermissions(new String[]{Manifest.permission.READ_CALENDAR, Manifest.permission.WRITE_CALENDAR}, () -> reply(proxy, id, ok()));
                return;
            default:
                io.execute(() -> {
                    JSONObject r;
                    try {
                        r = handle(method, args);
                    } catch (Exception e) {
                        Log.w(TAG, method + " 실패", e);
                        r = fail(e.getMessage() == null ? e.toString() : e.getMessage());
                    }
                    reply(proxy, id, r);
                });
        }
    }

    private JSONObject handle(String method, JSONArray a) throws Exception {
        switch (method) {
            case "status": {
                JSONObject r = ok();
                r.put("state", RecorderService.state);
                r.put("meetingId", RecorderService.meetingId);
                r.put("title", RecorderService.title);
                r.put("elapsedMs", RecorderService.elapsedMs());
                r.put("level", RecorderService.level);
                r.put("step", RecorderService.step);
                r.put("hasKey", secrets.hasApiKey());
                return r;
            }
            case "stopRecording":
                RecorderService.stop(this, false);
                return ok();
            case "cancelRecording":
                RecorderService.stop(this, true);
                return ok();
            case "listMeetings":
                return ok().put("meetings", store.list());
            case "getMeeting": {
                String id = a.getString(0);
                JSONObject r = ok();
                r.put("meta", store.meta(id));
                r.put("transcript", store.optJson(id, "transcript.json"));
                r.put("analysis", store.optJson(id, "analysis.json"));
                r.put("aiApps", AiShare.apps(this));
                return r;
            }
            case "retry":
            case "reanalyze": {
                if (!secrets.hasApiKey()) return fail("설정에서 OpenAI API 키를 넣어 주세요.");
                if (!"idle".equals(RecorderService.state)) return fail("녹음이나 분석이 끝난 뒤에 해 주세요.");
                RecorderService.analyze(this, a.getString(0), "reanalyze".equals(method));
                return ok();
            }
            case "deleteMeeting":
                store.delete(a.getString(0));
                return ok();
            case "renameMeeting": {
                String id = a.getString(0);
                JSONObject m = store.meta(id);
                m.put("title", a.optString(1, ""));
                m.put("titleSetByUser", !a.optString(1, "").isEmpty());
                store.saveMeta(id, m);
                return ok();
            }
            case "renameSpeaker": {
                String id = a.getString(0);
                JSONObject m = store.meta(id);
                JSONObject names = m.optJSONObject("speakerNames");
                if (names == null) names = new JSONObject();
                String name = a.optString(2, "").trim();
                if (name.isEmpty()) names.remove(a.getString(1));
                else names.put(a.getString(1), name);
                m.put("speakerNames", names);
                store.saveMeta(id, m);
                return ok();
            }
            case "setMe":
                store.update(a.getString(0), "myLabel", a.getString(1));
                return ok();
            case "getSettings":
                return settings();
            case "saveSettings":
                return saveSettings(a.getJSONObject(0));
            case "addEvent":
                return addEvent(a.getString(0), a.getInt(1));
            case "removeEvent":
                return removeEvent(a.getString(0), a.getInt(1));
            case "openEvent": {
                Intent i = new Intent(Intent.ACTION_VIEW, ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, a.getLong(0)));
                main.post(() -> {
                    try {
                        startActivity(i);
                    } catch (ActivityNotFoundException ignored) {
                    }
                });
                return ok();
            }
            case "shareMeeting":
                return share(a.getString(0));
            case "sendToAi":
                return sendToAi(a.getString(0), a.optString(1, ""));
            default:
                return fail("모르는 요청: " + method);
        }
    }

    // ---------- 녹음 시작 ----------

    private void startRecording(JavaScriptReplyProxy proxy, int id, String title) {
        if (!secrets.hasApiKey()) {
            reply(proxy, id, fail("설정에서 OpenAI API 키를 먼저 넣어 주세요."));
            return;
        }
        if (!"idle".equals(RecorderService.state)) {
            reply(proxy, id, fail("이미 녹음하거나 분석하는 중입니다."));
            return;
        }
        List<String> need = new ArrayList<>();
        need.add(Manifest.permission.RECORD_AUDIO);
        if (Build.VERSION.SDK_INT >= 33) need.add(Manifest.permission.POST_NOTIFICATIONS);
        if (prefs.autoCalendar()) {
            need.add(Manifest.permission.READ_CALENDAR);
            need.add(Manifest.permission.WRITE_CALENDAR);
        }
        needPermissions(need.toArray(new String[0]), () -> {
            if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                reply(proxy, id, fail("마이크 권한이 있어야 녹음할 수 있습니다."));
                return;
            }
            RecorderService.start(this, title);
            reply(proxy, id, ok());
        });
    }

    private void needPermissions(String[] perms, Runnable then) {
        List<String> missing = new ArrayList<>();
        for (String p : perms) if (checkSelfPermission(p) != PackageManager.PERMISSION_GRANTED) missing.add(p);
        if (missing.isEmpty()) {
            then.run();
            return;
        }
        afterPermission = then;
        permissions.launch(missing.toArray(new String[0]));
    }

    /** 내 목소리 8초 녹음 (받아쓰기에서 '나'를 알아보는 데 씀) */
    @SuppressLint("MissingPermission")
    private JSONObject recordVoiceSample() {
        if (!"idle".equals(RecorderService.state)) return fail("회의 녹음 중에는 할 수 없습니다.");
        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) return fail("마이크 권한이 필요합니다.");
        int min = AudioRecord.getMinBufferSize(Wav.RATE, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT);
        AudioRecord rec = new AudioRecord(MediaRecorder.AudioSource.MIC, Wav.RATE, AudioFormat.CHANNEL_IN_MONO,
                AudioFormat.ENCODING_PCM_16BIT, Math.max(min * 2, Wav.RATE));
        int total = Wav.BYTES_PER_SEC * 8;
        byte[] pcm = new byte[total];
        try {
            rec.startRecording();
            int off = 0;
            while (off < total) {
                int n = rec.read(pcm, off, Math.min(4096, total - off));
                if (n <= 0) break;
                off += n;
            }
            rec.stop();
        } finally {
            rec.release();
        }
        try (OutputStream out = new FileOutputStream(prefs.voiceSample())) {
            out.write(Wav.header(total));
            out.write(pcm);
        } catch (IOException e) {
            return fail("저장하지 못했습니다: " + e.getMessage());
        }
        return ok();
    }

    // ---------- 설정 ----------

    private JSONObject settings() throws JSONException {
        JSONObject r = ok();
        r.put("hasKey", secrets.hasApiKey());
        r.put("keyHint", "…" + secrets.hint());
        r.put("myName", prefs.myName());
        r.put("voiceRegistered", prefs.voiceSample().length() > 44);
        r.put("calendars", calendars.list());
        long picked = calendars.pick(prefs.calendarId());
        r.put("calendarId", picked >= 0 ? String.valueOf(picked) : "");
        r.put("autoCalendar", prefs.autoCalendar());
        r.put("analysisMode", prefs.analysisMode());
        r.put("transcribeModel", prefs.transcribeModel());
        r.put("analysisModel", prefs.analysisModel());
        r.put("baseUrl", prefs.baseUrl());
        return r;
    }

    private JSONObject saveSettings(JSONObject s) throws Exception {
        String key = s.optString("apiKey", "");
        if (!key.isEmpty() && !"null".equals(key)) secrets.setApiKey(key.trim());
        android.content.SharedPreferences.Editor e = prefs.edit();
        e.putString("myName", s.optString("myName", ""));
        String cal = s.optString("calendarId", "");
        if (!cal.isEmpty() && !"null".equals(cal)) e.putLong("calendarId", Long.parseLong(cal));
        e.putBoolean("autoCalendar", s.optBoolean("autoCalendar", true));
        e.putString("analysisMode", "external".equals(s.optString("analysisMode")) ? "external" : "auto");
        e.putString("transcribeModel", s.optString("transcribeModel", ""));
        e.putString("analysisModel", s.optString("analysisModel", ""));
        String base = s.optString("baseUrl", "").trim();
        if (!base.isEmpty() && !base.startsWith("https://") && !BuildConfig.DEBUG) return fail("API 주소는 https:// 로 시작해야 합니다.");
        e.putString("baseUrl", base);
        e.apply();
        return ok();
    }

    // ---------- 캘린더 ----------

    private JSONObject addEvent(String id, int index) throws Exception {
        if (!calendars.permitted()) return fail("캘린더 권한이 필요합니다. 설정에서 허용해 주세요.");
        long cal = calendars.pick(prefs.calendarId());
        if (cal < 0) return fail("일정을 넣을 캘린더가 없습니다.");
        JSONObject analysis = store.optJson(id, "analysis.json");
        JSONObject meta = store.meta(id);
        JSONObject s = analysis.getJSONArray("schedules").getJSONObject(index);
        long ev = calendars.insert(cal, s, Pipeline.titleOf(meta, analysis), analysis.optString("summary"));
        JSONObject events = meta.optJSONObject("events");
        if (events == null) events = new JSONObject();
        events.put(String.valueOf(index), ev);
        meta.put("events", events);
        store.saveMeta(id, meta);
        return ok().put("eventId", ev);
    }

    private JSONObject removeEvent(String id, int index) throws Exception {
        JSONObject meta = store.meta(id);
        JSONObject events = meta.optJSONObject("events");
        if (events == null || !events.has(String.valueOf(index))) return ok();
        if (calendars.permitted()) calendars.delete(events.getLong(String.valueOf(index)));
        events.remove(String.valueOf(index));
        JSONObject auto = meta.optJSONObject("autoEvents");
        if (auto != null) auto.remove(String.valueOf(index));
        store.saveMeta(id, meta);
        return ok();
    }

    // ---------- 공유 ----------

    private JSONObject share(String id) throws Exception {
        JSONObject a = store.optJson(id, "analysis.json");
        if (a == null) return fail("아직 분석되지 않은 회의입니다.");
        JSONObject meta = store.meta(id);
        Map<String, String> names = new java.util.HashMap<>();
        JSONObject sn = meta.optJSONObject("speakerNames");
        if (sn != null) for (java.util.Iterator<String> it = sn.keys(); it.hasNext(); ) {
            String k = it.next();
            names.put(k, sn.getString(k));
        }
        StringBuilder sb = new StringBuilder();
        sb.append("[회의] ").append(Pipeline.titleOf(meta, a)).append("\n\n").append(a.optString("summary")).append('\n');
        section(sb, "핵심 내용", a.optJSONArray("keyPoints"), null, names);
        section(sb, "결정 사항", a.optJSONArray("decisions"), null, names);
        section(sb, "할 일", a.optJSONArray("actionItems"), "task", names);
        section(sb, "일정", a.optJSONArray("schedules"), "title", names);
        Intent send = new Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT, sb.toString());
        main.post(() -> startActivity(Intent.createChooser(send, "회의 요약 공유")));
        return ok();
    }

    /** 받아쓴 기록을 ChatGPT·Claude 앱으로 (target: chatgpt / claude / 그 밖은 공유 시트) */
    private JSONObject sendToAi(String id, String target) throws Exception {
        JSONObject transcript = store.optJson(id, "transcript.json");
        if (transcript == null) return fail("아직 받아쓰지 않은 회의입니다.");
        JSONObject meta = store.meta(id);
        String text = AiShare.buildText(meta, transcript, prefs.myName());
        String title = Pipeline.titleOf(meta, store.optJson(id, "analysis.json"));
        String pkg = "chatgpt".equals(target) ? AiShare.CHATGPT : "claude".equals(target) ? AiShare.CLAUDE : null;
        Intent chooser = AiShare.intent(this, text, title, null);
        Intent direct = pkg == null ? chooser : AiShare.intent(this, text, title, pkg);
        main.post(() -> {
            AiShare.copy(this, text);
            AiShare.launch(this, direct, chooser);
        });
        return ok().put("chars", text.length());
    }

    private static void section(StringBuilder sb, String title, JSONArray arr, String field, Map<String, String> names) {
        if (arr == null || arr.length() == 0) return;
        sb.append("\n■ ").append(title).append('\n');
        for (int i = 0; i < arr.length(); i++) {
            Object o = arr.opt(i);
            if (o instanceof JSONObject) {
                JSONObject j = (JSONObject) o;
                sb.append("- ").append(j.optString(field));
                String owner = j.optString("owner", "");
                if (!owner.isEmpty()) sb.append(" (").append(names.containsKey(owner) ? names.get(owner) : owner).append(')');
                String when = j.optString("due", j.optString("start", ""));
                if (!when.isEmpty() && !"null".equals(when)) sb.append(" · ").append(when.replace('T', ' '));
                sb.append('\n');
            } else {
                sb.append("- ").append(String.valueOf(o)).append('\n');
            }
        }
    }

    // ---------- 응답 ----------

    private void reply(JavaScriptReplyProxy proxy, int id, JSONObject result) {
        JSONObject m = new JSONObject();
        try {
            m.put("id", id);
            m.put("result", result);
        } catch (JSONException ignored) {
        }
        String text = m.toString();
        main.post(() -> {
            try {
                proxy.postMessage(text);
            } catch (Exception ignored) {
            }
        });
    }

    static JSONObject ok() {
        JSONObject o = new JSONObject();
        try {
            o.put("ok", true);
        } catch (JSONException ignored) {
        }
        return o;
    }

    static JSONObject fail(String error) {
        JSONObject o = new JSONObject();
        try {
            o.put("ok", false);
            o.put("error", error);
        } catch (JSONException ignored) {
        }
        return o;
    }
}
