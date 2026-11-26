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
import android.view.ViewGroup
import android.view.WindowInsets
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.window.OnBackInvokedDispatcher
import org.json.JSONObject

/**
 * DNR AI 통로 — 다른 덜누름 앱(워크 · 데스크탑앱 …)이 Chat DNR Ai를 불러 쓰는 떠 있는 질문 창.
 *
 * 부르는 쪽:  startActivityForResult(Intent("com.daesinnam.ai.action.ASK")
 *                 .setPackage("com.daesinnam.localai")
 *                 .putExtra("text", 보낼 글(선택)) .putExtra("task", "summary"|"easy"|"fix"|"en"|"ko"|"table"|"continue" 또는 직접 쓴 지시)
 *                 .putExtra("title", 창 제목) .putExtra("insertLabel", "문서에 넣기") .putExtra("voice", true=바로 말로 묻기))
 * 돌려받기:   RESULT_OK + "result"(마크다운 답) · "plain"(읽기 쉬운 글) · "chat"(대화 id)
 *
 * 사람이 보는 창에서 사람이 누를 때만 결과가 돌아가므로 다른 앱이 몰래 AI를 쓰거나 대화를 읽을 수 없음.
 * 질문과 답은 Chat DNR Ai 대화 목록에도 남아 앱에서 이어서 물어볼 수 있음. 모두 기기 안에서만.
 */
class AskActivity : Activity() {
    private lateinit var web: WebView
    private val ui = Handler(Looper.getMainLooper())
    private val app get() = App.app
    private val voice by lazy { DnrVoice(this) { t, d -> emit(t, d) } }
    private var chatId: String? = null

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val root = FrameLayout(this)
        web = WebView(this)
        web.setBackgroundColor(Color.TRANSPARENT)
        root.addView(web, ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
        root.setOnApplyWindowInsetsListener { v, ins ->
            val b = ins.getInsets(WindowInsets.Type.systemBars() or WindowInsets.Type.ime() or WindowInsets.Type.displayCutout())
            v.setPadding(b.left, b.top, b.right, b.bottom); ins
        }
        setContentView(root)
        with(web.settings) { javaScriptEnabled = true; domStorageEnabled = true; textZoom = 100; allowFileAccess = true; allowContentAccess = false }
        web.webChromeClient = WebChromeClient()
        web.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(v: WebView, r: android.webkit.WebResourceRequest) = !r.url.toString().startsWith("file:///android_asset/")
        }
        web.addJavascriptInterface(Bridge(), "LA")
        val demo = if (BuildConfig.DEBUG) intent.getStringExtra("demo") else null
        web.loadUrl("file:///android_asset/web/ask.html" + (if (demo != null) "?demo=$demo" else ""))
        if (Build.VERSION.SDK_INT >= 33) onBackInvokedDispatcher.registerOnBackInvokedCallback(OnBackInvokedDispatcher.PRIORITY_DEFAULT) {
            web.evaluateJavascript("window.onBack ? onBack() : false") { r -> if (r != "true") cancel() }
        }
        if (app.models.activeId != null) app.ai.preload() // 창을 여는 동안 AI를 미리 올려 둠
    }

    override fun onPause() { super.onPause(); voice.cancelListen() }
    override fun onDestroy() { voice.release(); super.onDestroy() }

    override fun onRequestPermissionsResult(req: Int, perms: Array<out String>, res: IntArray) {
        super.onRequestPermissionsResult(req, perms, res)
        if (req == REQ_MIC) emit("mic", JSONObject().put("granted", res.firstOrNull() == android.content.pm.PackageManager.PERMISSION_GRANTED))
    }

    private fun emit(type: String, data: Any) {
        val s = JSONObject.quote(data.toString())
        ui.post { web.evaluateJavascript("window.LAe && LAe('$type', JSON.parse($s))", null) }
    }

    private fun cancel() { if (app.ai.busy()) app.ai.stop(); setResult(RESULT_CANCELED); finish() }

    private fun callerLabel(): String {
        val pkg = callingPackage ?: intent.getStringExtra("from") ?: return ""
        return runCatching { packageManager.getApplicationLabel(packageManager.getApplicationInfo(pkg, 0)).toString() }.getOrDefault(pkg)
    }

    inner class Bridge {
        @JavascriptInterface fun info(): String {
            val active = app.models.byId(app.models.activeId ?: "")
            return JSONObject()
                .put("caller", callerLabel())
                .put("text", (intent.getStringExtra("text") ?: "").take(MAX_TEXT))
                .put("textLen", (intent.getStringExtra("text") ?: "").length)
                .put("max", MAX_TEXT)
                .put("task", intent.getStringExtra("task") ?: "")
                .put("title", intent.getStringExtra("title") ?: "")
                .put("insertLabel", intent.getStringExtra("insertLabel") ?: (if (callingPackage != null) "넣기" else ""))
                .put("voice", intent.getBooleanExtra("voice", false))
                .put("ready", active != null && app.models.ready(active))
                .put("model", active?.name ?: JSONObject.NULL)
                .put("ai", app.ai.status.value.json())
                .put("settings", app.ai.settings())
                .toString()
        }

        /** prompt: 실제로 AI에 보낼 글, title: 대화 목록에 남을 제목 */
        @JavascriptInterface fun run(prompt: String, title: String): String {
            if (app.models.activeId == null) return "nomodel"
            val id = chatId ?: app.chats.create().getString("id").also { chatId = it }
            return Runner.send(id, prompt, emptyList(), { t, d -> emit(t, d) }, titleHint = title)
        }
        @JavascriptInterface fun stop() { app.ai.stop() }

        @JavascriptInterface fun finish(result: String) {
            ui.post {
                setResult(RESULT_OK, Intent().putExtra("result", result).putExtra("plain", DnrVoice.speakable(result).ifBlank { result })
                    .putExtra("chat", chatId ?: ""))
                this@AskActivity.finish()
            }
        }
        @JavascriptInterface fun close() { ui.post { cancel() } }
        @JavascriptInterface fun openApp() {
            ui.post {
                startActivity(Intent(this@AskActivity, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    .apply { chatId?.let { putExtra("openChat", it) } })
                setResult(RESULT_CANCELED); this@AskActivity.finish()
            }
        }
        @JavascriptInterface fun copy(text: String) {
            getSystemService(ClipboardManager::class.java).setPrimaryClip(ClipData.newPlainText("Chat DNR Ai", text))
        }

        // DNR 음성 엔진
        @JavascriptInterface fun micOk(): Boolean = checkSelfPermission(android.Manifest.permission.RECORD_AUDIO) == android.content.pm.PackageManager.PERMISSION_GRANTED
        @JavascriptInterface fun askMic() { ui.post { requestPermissions(arrayOf(android.Manifest.permission.RECORD_AUDIO), REQ_MIC) } }
        @JavascriptInterface fun listen(): String { if (!micOk()) return "nomic"; if (app.ai.busy()) return "busy"; ui.post { voice.listen() }; return "ok" }
        @JavascriptInterface fun stopListen() { ui.post { voice.stopListen() } }
        @JavascriptInterface fun cancelListen() { ui.post { voice.cancelListen() } }
        @JavascriptInterface fun speak(text: String, id: String) { ui.post { voice.speak(text, id) } }
        @JavascriptInterface fun stopSpeak() { ui.post { voice.stopSpeak() } }
    }

    companion object {
        const val REQ_MIC = 21
        const val MAX_TEXT = 7000
    }
}
