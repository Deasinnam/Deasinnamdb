package com.daesinnam.localai

import android.annotation.SuppressLint
import android.app.Activity
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.provider.MediaStore
import android.view.ViewGroup
import android.view.WindowInsets
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.window.OnBackInvokedDispatcher
import androidx.core.content.FileProvider
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream

class MainActivity : Activity() {
    private lateinit var web: WebView
    private val ui = Handler(Looper.getMainLooper())
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private var camFile: File? = null
    private var pendingShare: JSONObject? = null
    private var pageReady = false
    private val app get() = App.app
    private val voice by lazy { DnrVoice(this) { t, d -> emit(t, d) } }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val root = FrameLayout(this)
        web = WebView(this)
        root.addView(web, ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
        root.setBackgroundColor(Color.parseColor("#0E0F12"))
        // 가장자리까지 그리는 화면: 상태바 · 내비바 · 키보드만큼 안쪽으로
        root.setOnApplyWindowInsetsListener { v, ins ->
            val b = ins.getInsets(WindowInsets.Type.systemBars() or WindowInsets.Type.ime() or WindowInsets.Type.displayCutout())
            v.setPadding(b.left, b.top, b.right, b.bottom); ins
        }
        setContentView(root)
        with(web.settings) {
            javaScriptEnabled = true; domStorageEnabled = true
            allowFileAccess = true          // 기기 안 사진(files/img) 미리보기
            allowContentAccess = false
            textZoom = 100
            mediaPlaybackRequiresUserGesture = true
        }
        web.webChromeClient = WebChromeClient()
        web.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(v: WebView, r: android.webkit.WebResourceRequest): Boolean {
                val u = r.url.toString()
                if (u.startsWith("file:///android_asset/")) return false
                if (u.startsWith("https://")) runCatching { startActivity(Intent(Intent.ACTION_VIEW, r.url)) }
                return true
            }
            override fun onPageFinished(v: WebView, url: String) {
                pageReady = true; pendingShare?.let { emit("shared", it); pendingShare = null }
                // 자동 점검(CI): 실제 화면에서 질문 보내 보기
                intent.getStringExtra("ask")?.let { q -> ui.postDelayed({ emit("ask", JSONObject().put("text", q)) }, 2500) }
                intent.getStringExtra("openChat")?.let { id -> ui.postDelayed({ emit("open", JSONObject().put("id", id)) }, 400) }
                // 자동 점검(시험용 빌드만): 녹음 대신 음성 파일로 "말로 묻기" 전체 흐름
                if (BuildConfig.DEBUG) intent.getStringExtra("stt")?.let { p -> ui.postDelayed({ emit("voiceask", JSONObject()); voice.transcribeFile(File(p)) }, 3000) }
            }
        }
        web.addJavascriptInterface(Bridge(), "LA")
        val demo = intent.getStringExtra("demo")
        web.loadUrl("file:///android_asset/web/index.html" + (if (demo != null) "?demo=$demo" else ""))

        // 진행 상황을 화면으로
        scope.launch { DownloadService.state.collect { emit("dl", it?.json() ?: JSONObject()) } }
        scope.launch { app.ai.status.collect { emit("ai", it.json()) } }

        if (Build.VERSION.SDK_INT >= 33) onBackInvokedDispatcher.registerOnBackInvokedCallback(OnBackInvokedDispatcher.PRIORITY_DEFAULT) {
            web.evaluateJavascript("window.onBack ? onBack() : false") { r -> if (r != "true") moveTaskToBack(true) }
        }
        handleShare(intent)
        intent.getStringExtra("selftest")?.let { runSelftest(it) }
        intent.getStringExtra("selftestimg")?.let { p ->
            val out = File(getExternalFilesDir(null), "selftest-img.txt").apply { delete() }
            app.ai.selftestImage(p) { line -> synchronized(out) { out.appendText(line + "\n") } }
        }
        if (BuildConfig.DEBUG && intent.getBooleanExtra("imgsmall", false)) app.ai.setSettings(JSONObject().put("imgSize", 256))
        // 자동 점검(시험용 빌드만): 에뮬레이터에는 GPU가 없어 CPU로 고정
        if (BuildConfig.DEBUG && intent.getBooleanExtra("cpu", false)) app.ai.setSettings(JSONObject().put("backend", "cpu").put("mtp", false))
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent); setIntent(intent); handleShare(intent)
        // 자동 점검(시험용 빌드만): 지금 대화에 이어서 질문(그림 뒤 대화가 되는지)
        if (BuildConfig.DEBUG) intent.getStringExtra("ask")?.let { q -> if (pageReady) ui.postDelayed({ emit("ask", JSONObject().put("text", q)) }, 1500) }
        intent.getStringExtra("openChat")?.let { id -> if (pageReady) emit("open", JSONObject().put("id", id)) }
    }

    override fun onResume() { super.onResume(); if (pageReady) emit("resume", JSONObject().put("online", online())) }

    override fun onDestroy() { scope.cancel(); voice.release(); super.onDestroy() }

    override fun onRequestPermissionsResult(req: Int, perms: Array<out String>, res: IntArray) {
        super.onRequestPermissionsResult(req, perms, res)
        if (req == REQ_MIC) emit("mic", JSONObject().put("granted", res.firstOrNull() == android.content.pm.PackageManager.PERMISSION_GRANTED))
    }

    override fun onPause() { super.onPause(); voice.cancelListen() }

    override fun onTrimMemory(level: Int) {
        super.onTrimMemory(level)
        // 오래 뒤로 가 있거나 메모리가 부족하면 AI를 내려 둠(다시 열면 몇 초 만에 다시 올림)
        if (level >= TRIM_MEMORY_BACKGROUND && !app.ai.busy()) CoroutineScope(Dispatchers.Default).launch { app.ai.unload(); app.ai.freeImage() }
    }

    private fun emit(type: String, data: Any) {
        val s = JSONObject.quote(data.toString())
        ui.post { web.evaluateJavascript("window.LAe && LAe('$type', JSON.parse($s))", null) }
    }

    private fun online(): Boolean {
        val cm = getSystemService(ConnectivityManager::class.java)
        val c = cm.getNetworkCapabilities(cm.activeNetwork) ?: return false
        return c.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    // ---------- 사진 고르기 · 찍기 · 공유받기 ----------
    private fun importUris(uris: List<Uri>) {
        CoroutineScope(Dispatchers.IO).launch {
            val a = JSONArray()
            for (u in uris.take(4)) runCatching { app.chats.importImage(u) }.onSuccess { a.put(it.absolutePath) }
                .onFailure { emit("toast", JSONObject().put("text", it.message ?: "사진을 열지 못했어요")) }
            emit("picked", JSONObject().put("images", a))
        }
    }

    @Deprecated("startActivityForResult — 의존성 없이 간단하게")
    override fun onActivityResult(req: Int, res: Int, data: Intent?) {
        super.onActivityResult(req, res, data)
        if (res != RESULT_OK) return
        when (req) {
            REQ_PICK -> {
                val uris = ArrayList<Uri>()
                data?.clipData?.let { for (i in 0 until it.itemCount) uris.add(it.getItemAt(i).uri) } ?: data?.data?.let { uris.add(it) }
                importUris(uris)
            }
            REQ_CAM -> camFile?.let { importUris(listOf(Uri.fromFile(it))) }
        }
    }

    private fun handleShare(i: Intent?) {
        if (i?.action != Intent.ACTION_SEND) return
        val text = i.getStringExtra(Intent.EXTRA_TEXT) ?: ""
        @Suppress("DEPRECATION") val uri: Uri? = if (Build.VERSION.SDK_INT >= 33) i.getParcelableExtra(Intent.EXTRA_STREAM, Uri::class.java) else i.getParcelableExtra(Intent.EXTRA_STREAM)
        CoroutineScope(Dispatchers.IO).launch {
            val imgs = JSONArray()
            if (uri != null) runCatching { app.chats.importImage(uri) }.onSuccess { imgs.put(it.absolutePath) }
            val o = JSONObject().put("text", text).put("images", imgs)
            if (pageReady) emit("shared", o) else pendingShare = o
        }
        i.action = null
    }

    // ---------- 자동 점검 ----------
    private fun runSelftest(path: String) {
        val img = File(cacheDir, "selftest.jpg")
        val bm = Bitmap.createBitmap(512, 512, Bitmap.Config.ARGB_8888)
        Canvas(bm).apply {
            drawColor(Color.WHITE)
            drawCircle(256f, 256f, 200f, Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.RED })
            drawText("7", 256f, 330f, Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.WHITE; textSize = 240f; textAlign = Paint.Align.CENTER; isFakeBoldText = true })
        }
        FileOutputStream(img).use { bm.compress(Bitmap.CompressFormat.JPEG, 92, it) }
        val out = File(getExternalFilesDir(null), "selftest.txt").apply { delete() }
        app.ai.selftest(path, img) { line -> synchronized(out) { out.appendText(line + "\n") } }
    }

    // ---------- 화면(JS) ↔ 앱 ----------
    inner class Bridge {
        @JavascriptInterface fun state(): String {
            val o = app.models.json(DownloadService.state.value)
            o.put("ai", app.ai.status.value.json()).put("settings", app.ai.settings()).put("busy", app.ai.busy())
                .put("online", online()).put("version", BuildConfig.VERSION_NAME).put("device", Build.MODEL)
            return o.toString()
        }

        @JavascriptInterface fun download(id: String) {
            if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) != android.content.pm.PackageManager.PERMISSION_GRANTED)
                ui.post { requestPermissions(arrayOf(android.Manifest.permission.POST_NOTIFICATIONS), 3) }
            DownloadService.start(this@MainActivity, id)
        }
        @JavascriptInterface fun stopDownload() { DownloadService.stop(this@MainActivity) }
        @JavascriptInterface fun deleteModel(id: String) {
            val m = app.models.byId(id) ?: return
            CoroutineScope(Dispatchers.Default).launch {
                if (app.models.activeId == id) app.ai.unload()
                app.models.delete(m)
                if (app.models.activeId == id) app.models.activeId = null
                emit("models", JSONObject(state()))
            }
        }
        @JavascriptInterface fun useModel(id: String) {
            if (app.models.byId(id)?.let(app.models::ready) != true) return
            app.models.activeId = id
            CoroutineScope(Dispatchers.Default).launch { app.ai.unload(); app.ai.preload() }
        }
        @JavascriptInterface fun preload() { if (app.models.activeId != null) app.ai.preload() }

        @JavascriptInterface fun chats(): String = app.chats.list().toString()
        @JavascriptInterface fun chat(id: String): String = app.chats.get(id)?.toString() ?: "null"
        @JavascriptInterface fun newChat(): String = app.chats.create().toString()
        @JavascriptInterface fun deleteChat(id: String) { app.ai.dropConversation(); app.chats.delete(id) }
        @JavascriptInterface fun deleteAllChats() { app.ai.dropConversation(); app.chats.deleteAll() }
        @JavascriptInterface fun renameChat(id: String, title: String) {
            app.chats.get(id)?.let { it.put("title", title.trim().take(40).ifEmpty { "새 대화" }); app.chats.save(it) }
        }

        /** 질문 보내기: 기록에 넣고, 답을 조각조각 화면으로 */
        @JavascriptInterface fun send(chatId: String, text: String, imagesJson: String): String {
            val imgs = JSONArray(imagesJson.ifBlank { "[]" })
            return Runner.send(chatId, text, (0 until imgs.length()).map { imgs.getString(it) }, { t, d -> emit(t, d) })
        }

        /** 인터넷 검색을 함께 써서 묻기(사용자 네이버 키) */
        @JavascriptInterface fun sendWeb(chatId: String, text: String, imagesJson: String): String {
            val imgs = JSONArray(imagesJson.ifBlank { "[]" })
            if (!WebSearch.configured(app)) return "nokey"
            return Runner.send(chatId, text, (0 until imgs.length()).map { imgs.getString(it) }, { t, d -> emit(t, d) }, web = true)
        }
        /** 검색 키 확인 후 저장: ok | 오류 문장 (실제로 한 번 검색해 봄) */
        @JavascriptInterface fun webKey(id: String, secret: String): String = WebSearch.saveKey(app, id, secret)
        @JavascriptInterface fun webClear() { WebSearch.clear(app); app.ai.setSettings(JSONObject().put("webOn", false)) }

        @JavascriptInterface fun stop() { app.ai.stopDraw() }

        // ---------- DNR 음성 엔진 ----------
        @JavascriptInterface fun micOk(): Boolean = checkSelfPermission(android.Manifest.permission.RECORD_AUDIO) == android.content.pm.PackageManager.PERMISSION_GRANTED
        @JavascriptInterface fun askMic() { ui.post { requestPermissions(arrayOf(android.Manifest.permission.RECORD_AUDIO), REQ_MIC) } }
        @JavascriptInterface fun listen(): String { if (!micOk()) return "nomic"; if (app.ai.busy()) return "busy"; ui.post { voice.listen() }; return "ok" }
        @JavascriptInterface fun stopListen() { ui.post { voice.stopListen() } }
        @JavascriptInterface fun cancelListen() { ui.post { voice.cancelListen() } }
        @JavascriptInterface fun speak(text: String, id: String) { ui.post { voice.speak(text, id) } }
        @JavascriptInterface fun stopSpeak() { ui.post { voice.stopSpeak() } }
        @JavascriptInterface fun ttsInfo(): String = voice.ttsInfo().toString()
        @JavascriptInterface fun ttsSettings() { runCatching { startActivity(Intent("com.android.settings.TTS_SETTINGS").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) } }

        /** 그림 그리기: 대화 맥락 + 요청 → 기기 안 그림 */
        @JavascriptInterface fun draw(chatId: String, text: String): String {
            if (app.ai.busy()) return "busy"
            if (!ImageGen.available) return "noengine"
            if (!app.models.ready(app.models.imageModel)) return "nomodel"
            val chat = app.chats.get(chatId) ?: return "nochat"
            val before = JSONObject(chat.toString())
            chat.getJSONArray("messages").put(JSONObject().put("role", "user").put("text", text).put("draw", true).put("at", System.currentTimeMillis()))
            if (chat.getJSONArray("messages").length() == 1 || chat.optString("title") == "새 대화")
                chat.put("title", "🎨 " + text.replace(Regex("\\s+"), " ").trim().take(26))
            app.chats.save(chat)
            val size = app.ai.settings().optInt("imgSize", 512)
            app.ai.draw(before, text, size, object : Ai.DrawListener {
                override fun onStage(stage: String, step: Int, steps: Int) {
                    emit("drawstage", JSONObject().put("chat", chatId).put("stage", stage).put("step", step).put("steps", steps))
                }
                override fun onDone(path: String, prompt: String, ms: Long) {
                    val c = app.chats.get(chatId) ?: return
                    c.getJSONArray("messages").put(JSONObject().put("role", "model").put("text", "").put("image", path)
                        .put("prompt", prompt).put("ms", ms).put("model", app.models.imageModel.name).put("at", System.currentTimeMillis()))
                    app.chats.save(c)
                    emit("done", JSONObject().put("chat", chatId).put("image", path).put("ms", ms))
                }
                override fun onError(msg: String) {
                    val c = app.chats.get(chatId) ?: return
                    c.getJSONArray("messages").put(JSONObject().put("role", "model").put("text", "").put("error", msg).put("at", System.currentTimeMillis()))
                    app.chats.save(c)
                    emit("error", JSONObject().put("chat", chatId).put("error", msg))
                }
            })
            return "ok"
        }

        /** 그린 그림을 갤러리(사진/Chat DNR Ai)에 저장 */
        @JavascriptInterface fun saveImage(path: String): String = runCatching {
            val f = File(path); require(f.parentFile == app.chats.imgDir)
            val cv = android.content.ContentValues().apply {
                put(MediaStore.MediaColumns.DISPLAY_NAME, "ChatDNRAi_" + System.currentTimeMillis() + ".png")
                put(MediaStore.MediaColumns.MIME_TYPE, "image/png")
                put(MediaStore.MediaColumns.RELATIVE_PATH, android.os.Environment.DIRECTORY_PICTURES + "/Chat DNR Ai")
            }
            val uri = contentResolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, cv)!!
            contentResolver.openOutputStream(uri)!!.use { o -> f.inputStream().use { it.copyTo(o) } }
            "ok"
        }.getOrElse { "fail" }

        @JavascriptInterface fun shareImage(path: String) {
            val f = File(path).takeIf { it.parentFile == app.chats.imgDir } ?: return
            val uri = FileProvider.getUriForFile(this@MainActivity, "$packageName.files", f)
            ui.post { startActivity(Intent.createChooser(Intent(Intent.ACTION_SEND).setType("image/png").putExtra(Intent.EXTRA_STREAM, uri)
                .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION), "그림 공유하기")) }
        }

        // ---------- 덜누름 워크(DNR Work)로 문서 만들기 ----------
        @JavascriptInterface fun workInfo(): String = JSONObject().put("installed", Docs.workInstalled(this@MainActivity))
            .put("allowed", app.ai.settings().optBoolean("work")).toString()

        /** kind: docx | xlsx | md. 허용(설정)한 뒤에만. 결과: ok | consent | nowork | fail:메시지 */
        @JavascriptInterface fun toWork(text: String, title: String, kind: String): String {
            if (!app.ai.settings().optBoolean("work")) return "consent"
            if (!Docs.workInstalled(this@MainActivity)) return "nowork"
            return runCatching {
                val uri = Docs.save(this@MainActivity, text, title, kind)
                Docs.openInWork(this@MainActivity, uri, Docs.mime(kind)); "ok"
            }.getOrElse { "fail:" + (it.message ?: "문서를 만들지 못했어요") }
        }
        @JavascriptInterface fun hasTable(text: String): Boolean = Docs.hasTable(text)

        @JavascriptInterface fun pickImages() {
            val i = Intent(MediaStore.ACTION_PICK_IMAGES).putExtra(MediaStore.EXTRA_PICK_IMAGES_MAX, 4).setType("image/*")
            @Suppress("DEPRECATION") runCatching { startActivityForResult(i, REQ_PICK) }.onFailure {
                startActivityForResult(Intent(Intent.ACTION_GET_CONTENT).setType("image/*").putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true), REQ_PICK)
            }
        }
        @JavascriptInterface fun camera() {
            val f = File(File(cacheDir, "cam").apply { mkdirs() }, "shot.jpg"); camFile = f
            val uri = FileProvider.getUriForFile(this@MainActivity, "$packageName.files", f)
            val i = Intent(MediaStore.ACTION_IMAGE_CAPTURE).putExtra(MediaStore.EXTRA_OUTPUT, uri)
                .addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION or Intent.FLAG_GRANT_READ_URI_PERMISSION)
            @Suppress("DEPRECATION") runCatching { startActivityForResult(i, REQ_CAM) }
                .onFailure { emit("toast", JSONObject().put("text", "카메라 앱을 열지 못했어요")) }
        }
        @JavascriptInterface fun dropImage(path: String) { File(path).takeIf { it.parentFile == app.chats.imgDir }?.delete() }

        @JavascriptInterface fun settings(): String = app.ai.settings().toString()
        @JavascriptInterface fun setSettings(json: String) { app.ai.setSettings(JSONObject(json)) }

        @JavascriptInterface fun copy(text: String) {
            getSystemService(ClipboardManager::class.java).setPrimaryClip(ClipData.newPlainText("Chat DNR Ai", text))
        }
        @JavascriptInterface fun share(text: String) {
            ui.post { startActivity(Intent.createChooser(Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT, text), "답 공유하기")) }
        }
        @JavascriptInterface fun openUrl(url: String) {
            if (url.startsWith("https://")) ui.post { runCatching { startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url))) } }
        }
        @JavascriptInterface fun wifiSettings() { ui.post { runCatching { startActivity(Intent(android.provider.Settings.ACTION_WIFI_SETTINGS)) } } }
    }

    companion object { const val REQ_PICK = 11; const val REQ_CAM = 12; const val REQ_MIC = 13 }
}
