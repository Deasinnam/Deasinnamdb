package com.daesinnam.localai

import org.json.JSONArray
import org.json.JSONObject
import java.io.File

/** 질문 하나를 대화에 넣고 AI 답을 받아 저장 — 앱 화면(MainActivity)과 다른 앱용 질문 창(AskActivity)이 함께 씀 */
object Runner {
    /** 반환: ok | busy | nochat. emit(type, data): delta · done · error */
    fun send(chatId: String, text: String, images: List<String>, emit: (String, JSONObject) -> Unit, titleHint: String? = null): String {
        val app = App.app
        if (app.ai.busy()) return "busy"
        val chat = app.chats.get(chatId) ?: return "nochat"
        val imgs = images.filter { File(it).exists() }
        val before = JSONObject(chat.toString()) // 이번 질문을 넣기 전 기록 → 모델 문맥
        val msgs = chat.getJSONArray("messages")
        msgs.put(JSONObject().put("role", "user").put("text", text).put("images", JSONArray(imgs)).put("at", System.currentTimeMillis()))
        if (msgs.length() == 1 || chat.optString("title") == "새 대화")
            chat.put("title", (titleHint ?: text).replace(Regex("\\s+"), " ").trim().take(28).ifEmpty { "사진 질문" })
        app.chats.save(chat)
        val modelName = app.models.byId(app.models.activeId)?.name ?: ""
        var lastPush = 0L
        app.ai.send(before, text, imgs, object : Ai.Listener {
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
                if (err != null) o.put("error", err)
                c.getJSONArray("messages").put(o); app.chats.save(c)
            }
        })
        return "ok"
    }
}
