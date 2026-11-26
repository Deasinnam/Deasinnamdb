package com.daesinnam.localai

import android.app.ActivityManager
import android.content.Context
import android.os.StatFs
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

/**
 * 기기 안에서 돌리는 AI 모델 목록.
 * Gemma 4(Google 공개 모델, Apache-2.0)를 LiteRT-LM 형식(.litertlm)으로 Hugging Face에서 한 번 내려받음.
 * 저장소에 로그인 · 동의가 필요 없는 공개 모델만 씀.
 */
class Models(private val ctx: Context) {

    data class Model(
        val id: String,
        val name: String,
        val badge: String,
        val desc: String,
        val file: String,
        val url: String,
        val bytes: Long,       // 내려받을 크기(대략, 진행률 표시용 — 실제 크기는 서버가 알려 줌)
        val minRamGb: Int,
        val ctx: Int,          // 대화 길이(토큰)
        val kind: String = "chat", // chat: 대화 모델 · image: 그림 모델
    )

    val list = listOf(
        Model(
            "gemma4-e4b", "Gemma 4 E4B", "추천 · 더 똑똑함",
            "대화 · 글쓰기 · 사진 이해를 더 정확하게. 폴드8 울트라에 맞춘 기본 모델",
            "gemma-4-E4B-it.litertlm",
            "https://huggingface.co/litert-community/gemma-4-E4B-it-litert-lm/resolve/main/gemma-4-E4B-it.litertlm",
            3_660_000_000L, 8, 8192,
        ),
        Model(
            "gemma4-e2b", "Gemma 4 E2B", "가볍고 빠름",
            "답이 두 배 이상 빠름. 배터리 · 공간을 아끼고 싶을 때",
            "gemma-4-E2B-it.litertlm",
            "https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/main/gemma-4-E2B-it.litertlm",
            2_590_000_000L, 6, 8192,
        ),
        // 그림: DreamShaper 7 + LCM(빠른 몇 단계 생성)을 stable-diffusion.cpp용 한 파일(GGUF)로. CreativeML OpenRAIL-M
        Model(
            "dreamshaper7-lcm", "DreamShaper 7 LCM", "그림 그리기",
            "\"고양이 그려줘\"처럼 말하면 폰 안에서 그림을 그려요(512×512)",
            "dreamshaper-7-lcm-f16.gguf",
            "https://huggingface.co/darkmaniac7/TokForge-DreamShaper-LCM-GGUF/resolve/main/dreamshaper-7-lcm-f16.gguf",
            2_130_000_000L, 8, 0, kind = "image",
        ),
    )
    val chatModels get() = list.filter { it.kind == "chat" }
    val imageModel get() = list.first { it.kind == "image" }

    fun byId(id: String?) = list.firstOrNull { it.id == id }

    val dir: File get() = (ctx.getExternalFilesDir("models") ?: File(ctx.filesDir, "models")).apply { mkdirs() }
    fun file(m: Model) = File(dir, m.file)
    fun part(m: Model) = File(dir, m.file + ".part")
    fun ready(m: Model) = file(m).let { it.exists() && it.length() > m.bytes * 0.9 }

    private val prefs get() = ctx.getSharedPreferences("localai", Context.MODE_PRIVATE)
    var activeId: String?
        get() = prefs.getString("model", null)?.takeIf { id -> byId(id)?.let { it.kind == "chat" && ready(it) } == true }
            ?: chatModels.firstOrNull { ready(it) }?.id
        set(v) { prefs.edit().putString("model", v).apply() }

    fun delete(m: Model) { file(m).delete(); part(m).delete() }

    fun freeBytes(): Long = StatFs(dir.path).availableBytes

    fun ramGb(): Double {
        val mi = ActivityManager.MemoryInfo()
        ctx.getSystemService(ActivityManager::class.java).getMemoryInfo(mi)
        return mi.totalMem / 1024.0 / 1024 / 1024
    }

    fun json(dl: DownloadService.Progress?): JSONObject {
        val a = JSONArray()
        for (m in list) {
            a.put(JSONObject()
                .put("id", m.id).put("name", m.name).put("badge", m.badge).put("desc", m.desc)
                .put("bytes", m.bytes).put("minRam", m.minRamGb).put("kind", m.kind)
                .put("ready", ready(m)).put("partial", part(m).length())
                .put("downloading", dl != null && dl.id == m.id && !dl.done))
        }
        val o = JSONObject().put("models", a).put("active", activeId ?: JSONObject.NULL)
            .put("imageReady", ImageGen.available && ready(imageModel)).put("imageEngine", ImageGen.available)
            .put("free", freeBytes()).put("ram", Math.round(ramGb() * 10) / 10.0)
        if (dl != null) o.put("dl", dl.json())
        return o
    }
}
