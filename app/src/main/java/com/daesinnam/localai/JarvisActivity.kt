package com.daesinnam.localai

import android.annotation.SuppressLint
import android.app.Activity
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Intent
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.view.ViewGroup
import android.view.WindowInsets
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.window.OnBackInvokedDispatcher
import org.json.JSONObject
import java.io.File

/**
 * 자비스 — DNR AI 음성 모드. Chat DNR Ai 안에 있지만 홈 화면 · 덜누름 데스크에 따로 아이콘이 있는 별도 화면.
 *
 *  - 열면(또는 "자비스 온"이라고 부르면) 듣기 → 기기 안 AI가 받아 적어 묻기 → 답을 소리로 읽기 → 이어서 다시 듣기
 *  - "자비스 오프"라고 하거나 끄기를 누르면 대화를 마침. 화면이 꺼지거나 다른 앱으로 가면 마이크도 꺼짐
 *  - 폰의 기본 디지털 어시스턴트로 정하면 측면 버튼(길게)으로 바로 부름(ACTION_ASSIST · VOICE_COMMAND)
 *  - 대화는 Chat DNR Ai 대화 목록에 "자비스 · …"로 남음. 모두 기기 안에서만.
 * 화면: assets/web/jarvis.html
 */
class JarvisActivity : Activity() {
    private lateinit var web: WebView
    private val ui = Handler(Looper.getMainLooper())
    private val app get() = App.app
    private val voice by lazy { DnrVoice(this) { t, d -> emit(t, d) } }
    private var chatId: String? = null
    private var pageReady = false

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = Color.parseColor("#050A10")
        window.navigationBarColor = Color.parseColor("#050A10")
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON) // 자비스와 이야기하는 동안 화면이 꺼지지 않게
        val root = FrameLayout(this)
        root.setBackgroundColor(Color.parseColor("#050A10"))
        web = WebView(this)
        web.setBackgroundColor(Color.parseColor("#050A10"))
        root.addView(web, ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
        root.setOnApplyWindowInsetsListener { v, ins ->
            val b = ins.getInsets(WindowInsets.Type.systemBars() or WindowInsets.Type.displayCutout())
            v.setPadding(b.left, b.top, b.right, b.bottom); ins
        }
        setContentView(root)
        with(web.settings) { javaScriptEnabled = true; domStorageEnabled = true; textZoom = 100; allowFileAccess = true; allowContentAccess = false; mediaPlaybackRequiresUserGesture = true }
        web.webChromeClient = WebChromeClient()
        web.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(v: WebView, r: android.webkit.WebResourceRequest) = !r.url.toString().startsWith("file:///android_asset/")
            override fun onPageFinished(v: WebView, url: String) { pageReady = true; handleStart(intent) }
        }
        web.addJavascriptInterface(Bridge(), "LA")
        val demo = if (BuildConfig.DEBUG) intent.getStringExtra("demo") else null
        web.loadUrl("file:///android_asset/web/jarvis.html" + (if (demo != null) "?demo=$demo" else ""))
        if (Build.VERSION.SDK_INT >= 33) onBackInvokedDispatcher.registerOnBackInvokedCallback(OnBackInvokedDispatcher.PRIORITY_DEFAULT) {
            web.evaluateJavascript("window.onBack ? onBack() : false") { r -> if (r != "true") finish() }
        }
        if (app.models.activeId != null) app.ai.preload()
    }

    override fun onNewIntent(intent: Intent) { super.onNewIntent(intent); setIntent(intent); if (pageReady) handleStart(intent) }

    /** 측면 버튼(어시스턴트) · 음성 명령으로 열렸거나 바로가기로 열렸으면 바로 듣기 */
    private fun handleStart(i: Intent) {
        val how = when (i.action) { Intent.ACTION_ASSIST, Intent.ACTION_VOICE_COMMAND -> "assist"; else -> "open" }
        emit("start", JSONObject().put("how", how))
        // 자동 점검(시험용 빌드만): 녹음 대신 음성 파일로 묻기
        if (BuildConfig.DEBUG) i.getStringExtra("stt")?.let { p -> ui.postDelayed({ emit("voiceask", JSONObject()); voice.transcribeFile(File(p)) }, 2500) }
    }

    override fun onResume() { super.onResume(); if (pageReady) emit("resume", JSONObject()) }
    override fun onPause() { super.onPause(); voice.cancelListen(); voice.stopWake(); emit("pause", JSONObject()) }
    override fun onStop() { super.onStop(); voice.stopSpeak() }
    override fun onDestroy() { voice.release(); super.onDestroy() }

    override fun onRequestPermissionsResult(req: Int, perms: Array<out String>, res: IntArray) {
        super.onRequestPermissionsResult(req, perms, res)
        if (req == REQ_MIC) emit("mic", JSONObject().put("granted", res.firstOrNull() == android.content.pm.PackageManager.PERMISSION_GRANTED))
    }

    private fun emit(type: String, data: Any) {
        val s = JSONObject.quote(data.toString())
        ui.post { web.evaluateJavascript("window.LAe && LAe('$type', JSON.parse($s))", null) }
    }

    inner class Bridge {
        @JavascriptInterface fun info(): String {
            val active = app.models.byId(app.models.activeId ?: "")
            return JSONObject()
                .put("ready", active != null && app.models.ready(active))
                .put("model", active?.name ?: JSONObject.NULL)
                .put("settings", app.ai.settings())
                .put("debug", BuildConfig.DEBUG)
                .toString()
        }
        @JavascriptInterface fun run(prompt: String): String = ask(prompt, false)
        /** "인터넷에서 찾아줘" — 사용자 네이버 키로 검색해 답 */
        @JavascriptInterface fun runWeb(prompt: String): String = if (!WebSearch.configured(app)) "nokey" else ask(prompt, true)
        private fun ask(prompt: String, web: Boolean): String {
            if (app.models.activeId == null) return "nomodel"
            val id = chatId ?: app.chats.create().also { it.put("voice", true); app.chats.save(it) }.getString("id").also { chatId = it }
            return Runner.send(id, prompt, emptyList(), { t, d -> emit(t, d) }, titleHint = "자비스 · " + prompt, web = web)
        }
        /** 대화를 마침(자비스 오프) — 다음에 부르면 새 대화 */
        @JavascriptInterface fun endChat() { chatId = null }
        @JavascriptInterface fun stop() { app.ai.stop() }
        @JavascriptInterface fun busy(): Boolean = Runner.busy()

        @JavascriptInterface fun micOk(): Boolean = checkSelfPermission(android.Manifest.permission.RECORD_AUDIO) == android.content.pm.PackageManager.PERMISSION_GRANTED
        @JavascriptInterface fun askMic() { ui.post { requestPermissions(arrayOf(android.Manifest.permission.RECORD_AUDIO), REQ_MIC) } }
        @JavascriptInterface fun listen(): String { if (!micOk()) return "nomic"; if (app.ai.busy()) return "busy"; ui.post { voice.stopWake(); voice.listen() }; return "ok" }
        @JavascriptInterface fun stopListen() { ui.post { voice.stopListen() } }
        @JavascriptInterface fun cancelListen() { ui.post { voice.cancelListen() } }
        @JavascriptInterface fun wake(): String { if (!micOk()) return "nomic"; if (app.ai.busy()) return "busy"; ui.post { voice.wake() }; return "ok" }
        @JavascriptInterface fun stopWake() { ui.post { voice.stopWake() } }
        @JavascriptInterface fun speak(text: String, id: String) { ui.post { voice.speak(text, id) } }
        @JavascriptInterface fun stopSpeak() { ui.post { voice.stopSpeak() } }
        @JavascriptInterface fun setSettings(json: String) { app.ai.setSettings(JSONObject(json)) }

        @JavascriptInterface fun copy(text: String) {
            getSystemService(ClipboardManager::class.java).setPrimaryClip(ClipData.newPlainText("자비스", text))
        }
        @JavascriptInterface fun openApp() {
            ui.post {
                startActivity(Intent(this@JarvisActivity, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    .apply { chatId?.let { putExtra("openChat", it) } })
            }
        }
        /** 기본 디지털 어시스턴트(측면 버튼) 설정 화면 */
        @JavascriptInterface fun assistantSettings() {
            ui.post {
                val tries = listOf(Intent(Settings.ACTION_MANAGE_DEFAULT_APPS_SETTINGS), Intent(Settings.ACTION_VOICE_INPUT_SETTINGS), Intent(Settings.ACTION_SETTINGS))
                for (t in tries) if (runCatching { startActivity(t.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) }.isSuccess) break
            }
        }
        @JavascriptInterface fun close() { ui.post { finish() } }
    }

    companion object { const val REQ_MIC = 31 }
}
