package com.daesinnam.localai

import android.content.Context
import android.util.Log
import com.google.ai.edge.litertlm.Backend
import com.google.ai.edge.litertlm.Content
import com.google.ai.edge.litertlm.Contents
import com.google.ai.edge.litertlm.Conversation
import com.google.ai.edge.litertlm.ConversationConfig
import com.google.ai.edge.litertlm.Engine
import com.google.ai.edge.litertlm.EngineConfig
import com.google.ai.edge.litertlm.ExperimentalApi
import com.google.ai.edge.litertlm.ExperimentalFlags
import com.google.ai.edge.litertlm.Message
import com.google.ai.edge.litertlm.Role
import com.google.ai.edge.litertlm.SamplerConfig
import com.google.ai.edge.litertlm.ThinkingConfig
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

/**
 * 기기 안 AI 엔진(LiteRT-LM). 인터넷 없이 GPU(안 되면 CPU)로 Gemma 4를 돌림.
 * 대화 하나당 Conversation 하나 — 다른 대화로 바꾸면 기록을 다시 넣어 이어 감.
 */
class Ai(private val ctx: Context) {

    data class Status(val state: String, val model: String? = null, val backend: String? = null, val error: String? = null, val loadMs: Long = 0) {
        fun json(): JSONObject = JSONObject().put("state", state).put("model", model ?: JSONObject.NULL)
            .put("backend", backend ?: JSONObject.NULL).put("error", error ?: JSONObject.NULL).put("loadMs", loadMs)
    }

    interface Listener {
        fun onDelta(text: String, thought: String)
        fun onDone(text: String, thought: String, ms: Long)
        fun onError(msg: String, partial: String)
    }

    val status = MutableStateFlow(Status("idle"))
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    private val lock = Mutex()
    private var engine: Engine? = null
    private var engineKey: String? = null
    private var conv: Conversation? = null
    private var convKey: String? = null
    @Volatile private var job: Job? = null

    private val prefs get() = ctx.getSharedPreferences("localai", Context.MODE_PRIVATE)
    fun settings(): JSONObject = JSONObject()
        .put("temperature", prefs.getFloat("temperature", 0.8f).toDouble())
        .put("thinking", prefs.getBoolean("thinking", false))
        .put("backend", prefs.getString("backend", "auto"))
        .put("system", prefs.getString("system", "") ?: "")
        .put("mtp", prefs.getBoolean("mtp", true))
    fun setSettings(o: JSONObject) {
        val e = prefs.edit()
        if (o.has("temperature")) e.putFloat("temperature", o.getDouble("temperature").toFloat().coerceIn(0f, 1.5f))
        if (o.has("thinking")) e.putBoolean("thinking", o.getBoolean("thinking"))
        if (o.has("backend")) e.putString("backend", o.getString("backend"))
        if (o.has("system")) e.putString("system", o.getString("system").take(2000))
        if (o.has("mtp")) e.putBoolean("mtp", o.getBoolean("mtp"))
        e.apply()
        // 처리 장치 · 빠른 생성(MTP)은 엔진을 다시 올려야 적용
        if (o.has("backend") || o.has("mtp")) scope.launch { unload() }
        convKey = null
    }

    private fun sysPrompt(): String {
        val user = prefs.getString("system", "")?.trim().orEmpty()
        val base = "너는 'Chat DNR Ai'야. DNR(덜누름)이 만들었어. 인터넷 없이 사용자의 휴대폰(갤럭시 폴드) 안에서만 돌아가는 도우미야. " +
            "사용자가 쓰는 언어로 답하고, 한국어로 물으면 자연스러운 한국어 존댓말로 답해. " +
            "핵심부터 간결하게, 필요하면 목록 · 표 · 코드 블록(마크다운)을 써. " +
            "모르는 것이나 최신 정보(오늘 날씨 · 뉴스 · 가격 등)는 인터넷에 연결되어 있지 않아 확인할 수 없다고 솔직히 말해."
        return if (user.isEmpty()) base else "$base\n\n사용자가 정한 지시: $user"
    }

    /** 엔진 올리기(이미 올라가 있으면 그대로). GPU가 안 되면 CPU로 */
    @OptIn(ExperimentalApi::class)
    suspend fun ensureEngine(): Engine = lock.withLock {
        val models = App.app.models
        val m = models.byId(models.activeId) ?: throw IllegalStateException("먼저 AI 모델을 내려받아 주세요")
        val pref = prefs.getString("backend", "auto")!!
        val mtp = prefs.getBoolean("mtp", true)
        val key = "${m.id}|$pref|$mtp"
        engine?.let { if (engineKey == key) return@withLock it }
        closeAll()
        val path = models.file(m).absolutePath
        val tries = when (pref) { "cpu" -> listOf("CPU"); "gpu" -> listOf("GPU"); else -> listOf("GPU", "CPU") }
        var last: Throwable? = null
        for (b in tries) {
            status.value = Status("loading", m.name, b)
            val t0 = System.currentTimeMillis()
            try {
                ExperimentalFlags.enableSpeculativeDecoding = mtp
                val e = Engine(config(path, b, m.ctx))
                e.initialize()
                engine = e; engineKey = key
                status.value = Status("ready", m.name, b, loadMs = System.currentTimeMillis() - t0)
                return@withLock e
            } catch (t: Throwable) {
                Log.w(TAG, "engine $b failed", t); last = t
                if (mtp) runCatching { // 빠른 생성(MTP) 없이 한 번 더
                    ExperimentalFlags.enableSpeculativeDecoding = false
                    val e = Engine(config(path, b, m.ctx)); e.initialize()
                    engine = e; engineKey = key
                    status.value = Status("ready", m.name, b, loadMs = System.currentTimeMillis() - t0)
                    return@withLock e
                }
            }
        }
        val msg = friendly(last)
        status.value = Status("error", m.name, null, msg)
        throw IllegalStateException(msg)
    }

    private fun config(path: String, b: String, maxTokens: Int) = EngineConfig(
        modelPath = path,
        backend = if (b == "GPU") Backend.GPU() else Backend.CPU(),
        visionBackend = if (b == "GPU") Backend.GPU() else Backend.CPU(),
        maxNumTokens = maxTokens,
        cacheDir = ctx.cacheDir.path,
    )

    private fun friendly(t: Throwable?): String {
        val s = (t?.message ?: t?.javaClass?.simpleName ?: "").lowercase()
        return when {
            "memory" in s || "oom" in s || "alloc" in s -> "메모리가 모자라 AI를 올리지 못했어요. 다른 앱을 닫거나 가벼운 모델(E2B)로 바꿔 보세요"
            "file" in s || "open" in s || "corrupt" in s || "flatbuffer" in s -> "모델 파일이 손상된 것 같아요. 설정에서 모델을 지우고 다시 내려받아 주세요"
            else -> "AI를 올리지 못했어요 (${t?.message?.take(120) ?: "알 수 없는 오류"})"
        }
    }

    /** 대화 기록(JSON)을 모델에 다시 넣을 메시지로. 너무 길면 최근 것만 */
    private fun history(chat: JSONObject, keep: Int): List<Message> {
        val msgs = chat.optJSONArray("messages") ?: JSONArray()
        val out = ArrayList<Message>()
        val from = maxOf(0, msgs.length() - keep)
        for (i in from until msgs.length()) {
            val o = msgs.getJSONObject(i)
            val text = o.optString("text")
            if (text.isBlank() || o.optBoolean("error")) continue
            val role = if (o.optString("role") == "user") Role.USER else Role.MODEL
            val note = if (role == Role.USER && (o.optJSONArray("images")?.length() ?: 0) > 0) "[사진을 함께 보냄] " else ""
            out.add(if (role == Role.USER) Message.user(Contents.of(Content.Text(note + text))) else Message.model(text))
        }
        // 첫 메시지는 사용자 차례여야 함
        while (out.isNotEmpty() && out.first().role != Role.USER) out.removeAt(0)
        return out
    }

    private fun newConv(e: Engine, chat: JSONObject, keep: Int): Conversation {
        val think = prefs.getBoolean("thinking", false)
        val cfg = ConversationConfig(
            systemInstruction = Contents.of(Content.Text(sysPrompt())),
            initialMessages = history(chat, keep),
            samplerConfig = SamplerConfig(64, 0.95, prefs.getFloat("temperature", 0.8f).toDouble(), 0),
            thinkingConfig = ThinkingConfig(think),
        )
        return e.createConversation(cfg)
    }

    /** chat: 지금까지 기록(이번 질문 제외). 답을 조각조각 listener로 */
    @OptIn(ExperimentalApi::class)
    fun send(chat: JSONObject, text: String, images: List<String>, l: Listener) {
        job?.cancel()
        job = scope.launch {
            var acc = ""; var thought = ""
            val t0 = System.currentTimeMillis()
            try {
                val e = ensureEngine()
                val m = App.app.models.byId(App.app.models.activeId)!!
                val key = chat.getString("id") + "|" + engineKey
                lock.withLock {
                    var c = conv
                    if (c == null || convKey != key || !c.isAlive) {
                        c?.close(); c = newConv(e, chat, 24); conv = c; convKey = key
                    } else if (runCatching { c.getTokenCount() }.getOrDefault(0) > m.ctx * 0.7) { // 대화가 길어지면 최근 내용만 남기고 새로 이어 감
                        c.close(); c = newConv(e, chat, 8); conv = c
                    }
                }
                val parts = images.map { Content.ImageFile(it) } + Content.Text(text.ifBlank { "이 사진을 자세히 설명해 줘." })
                conv!!.sendMessageAsync(Contents.of(*parts.toTypedArray())).collect { msg ->
                    val (t, th) = split(msg)
                    // 조각(델타)으로 오는 것이 기본, 혹시 누적으로 오면 그대로 교체
                    acc = if (acc.isNotEmpty() && t.startsWith(acc)) t else acc + t
                    if (th.isNotEmpty()) thought = if (thought.isNotEmpty() && th.startsWith(thought)) th else thought + th
                    l.onDelta(acc, thought)
                }
                l.onDone(acc, thought, System.currentTimeMillis() - t0)
            } catch (c: kotlinx.coroutines.CancellationException) {
                l.onDone(acc, thought, System.currentTimeMillis() - t0)
            } catch (t: Throwable) {
                Log.w(TAG, "send failed", t)
                val s = (t.message ?: "").lowercase()
                convKey = null // 다음에 새로 만듦
                l.onError(when {
                    "token" in s && ("exceed" in s || "max" in s || "limit" in s) -> "대화가 너무 길어졌어요. 새 대화를 열어 주세요"
                    "image" in s -> "사진을 읽지 못했어요. 다른 사진으로 해 보세요"
                    status.value.state == "error" -> status.value.error ?: "AI를 올리지 못했어요"
                    else -> "답을 만들다 멈췄어요 (${t.message?.take(100) ?: t.javaClass.simpleName})"
                }, acc)
            }
        }
    }

    private fun split(m: Message): Pair<String, String> {
        val t = StringBuilder()
        for (c in m.contents.contents) if (c is Content.Text) t.append(c.text)
        val th = m.channels.values.joinToString("")
        return t.toString() to th
    }

    fun stop() {
        runCatching { conv?.cancelProcess() }
        job?.cancel()
    }

    fun busy() = job?.isActive == true

    /** 대화 바꾸기 · 지우기 때 엔진은 두고 대화만 정리 */
    fun dropConversation() { scope.launch { lock.withLock { runCatching { conv?.close() }; conv = null; convKey = null } } }

    suspend fun unload() = lock.withLock { closeAll(); status.value = Status("idle") }

    private fun closeAll() {
        runCatching { conv?.close() }; conv = null; convKey = null
        runCatching { engine?.close() }; engine = null; engineKey = null
    }

    fun preload() { scope.launch { runCatching { ensureEngine() } } }

    // ---------- 자동 점검(에뮬레이터 CI): 진짜 모델로 글 · 사진 질문 ----------
    fun selftest(path: String, img: File, out: (String) -> Unit) {
        scope.launch {
            fun log(s: String) { Log.i("LA_SELFTEST", s); out(s) }
            try {
                val t0 = System.currentTimeMillis()
                val e = Engine(EngineConfig(modelPath = path, backend = Backend.CPU(), visionBackend = Backend.CPU(), maxNumTokens = 2048, cacheDir = ctx.cacheDir.path))
                e.initialize()
                log("PASS engine load cpu ${System.currentTimeMillis() - t0}ms")
                e.createConversation(ConversationConfig(systemInstruction = Contents.of(Content.Text("짧게 답해.")))).use { c ->
                    var acc = ""; var chunks = 0
                    val t1 = System.currentTimeMillis()
                    c.sendMessageAsync("12 더하기 30은? 숫자만 답해.").collect { m -> chunks++; acc += split(m).first }
                    log((if ("42" in acc) "PASS" else "FAIL") + " text answer '${acc.trim().take(60)}' chunks=$chunks ${System.currentTimeMillis() - t1}ms")
                    var acc2 = ""
                    c.sendMessageAsync("방금 답한 숫자에 1을 더하면? 숫자만.").collect { m -> acc2 += split(m).first }
                    log((if ("43" in acc2) "PASS" else "FAIL") + " multi-turn '${acc2.trim().take(60)}'")
                }
                e.createConversation(ConversationConfig()).use { c ->
                    var acc = ""
                    val t2 = System.currentTimeMillis()
                    c.sendMessageAsync(Contents.of(Content.ImageFile(img.absolutePath), Content.Text("What number is written in the picture, and what color is the circle? Answer briefly in English.")))
                        .collect { m -> acc += split(m).first }
                    val a = acc.lowercase()
                    log((if ("7" in a && "red" in a) "PASS" else "FAIL") + " vision '${acc.trim().replace('\n', ' ').take(80)}' ${System.currentTimeMillis() - t2}ms")
                }
                e.close()
                log("DONE")
            } catch (t: Throwable) {
                Log.e("LA_SELFTEST", "error", t); log("FAIL exception ${t.javaClass.simpleName}: ${t.message?.take(200)}"); log("DONE")
            }
        }
    }

    companion object { const val TAG = "LocalAI" }
}
