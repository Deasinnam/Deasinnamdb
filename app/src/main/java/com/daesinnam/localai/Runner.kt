package com.daesinnam.localai

import org.json.JSONArray
import org.json.JSONObject
import java.io.File

/** 질문 하나를 대화에 넣고 AI 답을 받아 저장 — 앱 화면(MainActivity)과 다른 앱용 질문 창(AskActivity)이 함께 씀 */
object Runner {
    /** 인터넷 검색 중(답 만들기 전) */
    @Volatile var searching = false
    fun busy() = searching || App.app.ai.busy()

    /**
     * 반환: ok | busy | nochat. emit(type, data): delta · done · error (+ web: websearch {state: searching|found|fail})
     * web=true: 사용자 키로 네이버 검색 → 결과를 붙여 기기 안 AI에게 물음. 검색이 안 되면 기기 안에서만 답하고 그렇다고 표시
     */
    fun send(chatId: String, text: String, images: List<String>, emit: (String, JSONObject) -> Unit, titleHint: String? = null, web: Boolean = false): String {
        val app = App.app
        if (busy()) return "busy"
        val chat = app.chats.get(chatId) ?: return "nochat"
        val imgs = images.filter { File(it).exists() }
        val before = JSONObject(chat.toString()) // 이번 질문을 넣기 전 기록 → 모델 문맥
        val msgs = chat.getJSONArray("messages")
        msgs.put(JSONObject().put("role", "user").put("text", text).put("images", JSONArray(imgs)).put("at", System.currentTimeMillis()).apply { if (web) put("web", true) })
        if (msgs.length() == 1 || chat.optString("title") == "새 대화")
            chat.put("title", (titleHint ?: text).replace(Regex("\\s+"), " ").trim().take(28).ifEmpty { "사진 질문" })
        app.chats.save(chat)
        val modelName = app.models.byId(app.models.activeId)?.name ?: ""
        if (!web) { ask(chatId, before, text, imgs, emit, modelName, null, null); return "ok" }
        searching = true
        emit("websearch", JSONObject().put("chat", chatId).put("state", "searching").put("query", WebSearch.query(text)))
        Thread {
            var srcs: List<WebSearch.Src>? = null; var err: String? = null
            try { srcs = WebSearch.search(app, text) } catch (e: Exception) { err = (e as? WebSearch.SearchException)?.message ?: "검색하지 못했어요" }
            if (srcs != null && srcs.isEmpty()) { err = "검색 결과가 없어요"; srcs = null }
            emit("websearch", JSONObject().put("chat", chatId).put("state", if (srcs != null) "found" else "fail").put("count", srcs?.size ?: 0).put("error", err ?: ""))
            searching = false
            ask(chatId, before, if (srcs != null) WebSearch.prompt(text, srcs) else text, imgs, emit, modelName, srcs, err)
        }.start()
        return "ok"
    }

    private fun ask(chatId: String, before: JSONObject, modelText: String, imgs: List<String>, emit: (String, JSONObject) -> Unit,
                    modelName: String, srcs: List<WebSearch.Src>?, webErr: String?) {
        val app = App.app
        var lastPush = 0L
        app.ai.send(before, modelText, imgs, object : Ai.Listener {
            override fun onDelta(text: String, thought: String) {
                val now = System.currentTimeMillis()
                if (now - lastPush < 40) return
                lastPush = now
                emit("delta", JSONObject().put("chat", chatId).put("text", text).put("thought", thought))
            }
            override fun onDone(text: String, thought: String, ms: Long) {
                save(text, thought, ms, null)
                emit("done", JSONObject().put("chat", chatId).put("text", text).put("thought", thought).put("ms", ms).put("model", modelName))
            }
            override fun onError(msg: String, partial: String) {
                save(partial, "", 0, msg)
                emit("error", JSONObject().put("chat", chatId).put("text", partial).put("error", msg))
            }
            private fun save(t: String, th: String, ms: Long, err: String?) {
                val c = app.chats.get(chatId) ?: return
                val o = JSONObject().put("role", "model").put("text", t).put("ms", ms).put("model", modelName).put("at", System.currentTimeMillis())
                if (th.isNotBlank()) o.put("thought", th)
                if (srcs != null) o.put("web", true).put("sources", WebSearch.json(srcs))
                if (webErr != null) o.put("webFail", webErr)
                if (err != null) o.put("error", err)
                c.getJSONArray("messages").put(o); app.chats.save(c)
            }
        })
    }
}
