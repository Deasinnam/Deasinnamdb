package com.daesinnam.localai

import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.util.Log
import android.util.TypedValue
import android.view.Gravity
import android.view.WindowManager
import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeoutOrNull
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.RandomAccessFile
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.Locale
import kotlin.coroutines.resume

/**
 * 덜누름 벤치가 자비스(기기 안 AI)를 재는 입구.
 *
 * 부르는 쪽:  startActivityForResult(Intent("com.daesinnam.ai.action.BENCH").setPackage("com.daesinnam.localai"))
 * 돌려받기:   RESULT_OK + "bench"(JSON 문자열) — 숫자만: 모델 · 처리 장치 · 올리는 시간 · 첫 글자까지 · 초당 토큰 ·
 *             음성 만들기 · 받아 적기 시간과 정확도 · 그림 1장 시간. 대화 · 질문 기록은 읽지도 남기지도 않음.
 *
 * 같은 서명(덜누름 키)으로 만든 앱만 부를 수 있음. 측정하는 동안 화면에 무엇을 재는지 보여 주고, 사용자가 멈출 수 있음.
 */
class BenchActivity : Activity() {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private var job: Job? = null
    private lateinit var stepView: TextView
    private lateinit var detailView: TextView
    private val result = JSONObject()
    private val selftest get() = BuildConfig.DEBUG && intent.getBooleanExtra("selftest", false)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        if (!selftest && !callerAllowed()) {
            setResult(RESULT_CANCELED, Intent().putExtra("error", "덜누름 앱만 부를 수 있어요"))
            finish(); return
        }
        setContentView(buildUi())
        job = scope.launch { run() }
    }

    /** 부른 앱이 Chat DNR Ai와 같은 서명(덜누름 키)인지 */
    private fun callerAllowed(): Boolean {
        val caller = callingPackage ?: return false
        return runCatching { packageManager.checkSignatures(caller, packageName) == PackageManager.SIGNATURE_MATCH }.getOrDefault(false)
    }

    private fun dp(v: Float) = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, resources.displayMetrics)

    private fun buildUi(): FrameLayout {
        val root = FrameLayout(this).apply { setBackgroundColor(Color.argb(170, 0, 0, 0)) }
        val card = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            val p = dp(22f).toInt(); setPadding(p, p, p, p)
            background = GradientDrawable().apply { setColor(Color.rgb(0x16, 0x16, 0x1A)); cornerRadius = dp(20f); setStroke(dp(1f).toInt(), Color.rgb(0x33, 0x33, 0x38)) }
        }
        fun text(size: Float, color: Int, bold: Boolean = false) = TextView(this).apply {
            setTextSize(TypedValue.COMPLEX_UNIT_SP, size); setTextColor(color); if (bold) typeface = Typeface.DEFAULT_BOLD
            setLineSpacing(0f, 1.25f)
        }
        card.addView(text(13f, Color.rgb(0xFF, 0xC2, 0x1A), true).apply { text = "덜누름 벤치" })
        card.addView(text(19f, Color.WHITE, true).apply { text = "자비스 속도를 재는 중"; setPadding(0, dp(4f).toInt(), 0, dp(10f).toInt()) })
        stepView = text(15f, Color.rgb(0xE4, 0xE4, 0xE7)).also { card.addView(it) }
        detailView = text(12.5f, Color.rgb(0xA1, 0xA1, 0xAA)).also { it.setPadding(0, dp(6f).toInt(), 0, dp(14f).toInt()); card.addView(it) }
        card.addView(text(11.5f, Color.rgb(0x8B, 0x8B, 0x93)).apply {
            text = "지금 쓰는 모델과 설정 그대로, 정해진 시험 문장으로만 잽니다. 대화 기록은 읽지도 남기지도 않아요. 모두 기기 안에서."
        })
        card.addView(Button(this).apply {
            text = "그만두기"; isAllCaps = false; setTextColor(Color.WHITE)
            background = GradientDrawable().apply { setColor(Color.rgb(0x26, 0x26, 0x2B)); cornerRadius = dp(14f) }
            setOnClickListener { cancel() }
        }, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(50f).toInt()).apply { topMargin = dp(16f).toInt() })
        root.addView(card, FrameLayout.LayoutParams(dp(340f).toInt(), FrameLayout.LayoutParams.WRAP_CONTENT, Gravity.CENTER))
        return root
    }

    private fun step(s: String, d: String = "") { stepView.text = s; detailView.text = d; log("STEP $s") }
    private fun log(s: String) { Log.i("LA_BENCH", s) }

    private suspend fun run() {
        val app = App.app
        val small = selftest && intent.getBooleanExtra("small", false)
        result.put("version", BuildConfig.VERSION_NAME).put("api", 1)
        val active = app.models.byId(app.models.activeId)
        if (active == null) {
            result.put("ready", false).put("na", "AI 모델을 아직 내려받지 않았어요")
            done(); return
        }
        result.put("ready", true).put("model", active.name)
        try {
            // 1) 모델 올리기 + 답 쓰기
            step("① AI 모델 올리고 답 쓰기", active.name + " · 질문 하나에 답하는 속도")
            val text = withContext(Dispatchers.Default) { app.ai.benchText(PROMPT) }
            result.put("text", text)
            log("TEXT $text")

            // 2) 말 → 글: 한국어 문장을 기기 음성으로 만들고, 자비스(DNR 음성 엔진)가 다시 받아 적기
            step("② 말 받아 적기", "한국어 문장을 기기 음성으로 만든 뒤 자비스가 받아 적어요")
            result.put("voice", voiceBench())
            log("VOICE " + result.optJSONObject("voice"))

            // 3) 그림 1장 (그림 모델이 있을 때만)
            val size = if (small) 256 else app.ai.settings().optInt("imgSize", 512)
            val steps = if (small) 4 else 6
            step("③ 그림 1장 그리기", "${size}×${size} · ${steps}단계 · 그림 모델이 있을 때만")
            app.ai.benchEnd() // 대화 엔진은 내리고 그림 엔진만 (메모리)
            result.put("image", withContext(Dispatchers.Default) { app.ai.benchImage(size, steps) })
            log("IMAGE " + result.optJSONObject("image"))
        } catch (c: kotlinx.coroutines.CancellationException) {
            throw c
        } catch (t: Throwable) {
            Log.w("LA_BENCH", "bench failed", t)
            result.put("error", t.message?.take(200) ?: t.javaClass.simpleName)
        } finally {
            withContext(kotlinx.coroutines.NonCancellable) { runCatching { app.ai.benchEnd() } }
        }
        done()
    }

    private fun done() {
        log("RESULT $result")
        step("끝", "결과를 덜누름 벤치로 보내요")
        setResult(RESULT_OK, Intent().putExtra("bench", result.toString()))
        finish()
    }

    private fun cancel() {
        job?.cancel()
        App.app.ai.stop()
        runCatching { ImageGen.nCancel() }
        setResult(RESULT_CANCELED)
        finish()
    }

    override fun onBackPressed() { cancel() }

    override fun onDestroy() { if (job != null) scope.launch(kotlinx.coroutines.NonCancellable) { runCatching { App.app.ai.benchEnd() } }; super.onDestroy() }

    // ---------- 말 → 글 ----------
    private suspend fun voiceBench(): JSONObject {
        val o = JSONObject().put("sentence", SENTENCE)
        if (!App.app.ai.audioOk) return o.put("na", "이 모델은 소리 입력을 지원하지 않아요")
        val raw = File(cacheDir, "bench-tts.wav").apply { delete() }
        val t0 = System.currentTimeMillis()
        val ok = withTimeoutOrNull(20_000) { synth(SENTENCE, raw) } ?: false
        val ttsMs = System.currentTimeMillis() - t0
        if (!ok || !raw.exists() || raw.length() < 2000) return o.put("na", "기기에 한국어 음성 합성이 없어요")
        o.put("ttsMs", ttsMs)
        val wav = File(cacheDir, "bench-16k.wav")
        val sec = withContext(Dispatchers.IO) { to16kMono(raw, wav) }
        o.put("audioSec", Math.round(sec * 10) / 10.0)
        val t1 = System.currentTimeMillis()
        val heard = try { withContext(Dispatchers.Default) { App.app.ai.transcribe(wav) } } catch (e: Ai.NoAudioException) { return o.put("na", e.message ?: "소리 입력 안 됨") }
        o.put("sttMs", System.currentTimeMillis() - t1).put("accuracy", Math.round(similarity(SENTENCE, heard) * 100)).put("heard", heard.take(80))
        raw.delete(); wav.delete()
        return o
    }

    /** 기기 음성 합성(TTS)으로 문장을 WAV 파일로 */
    private suspend fun synth(text: String, out: File): Boolean = suspendCancellableCoroutine { cont ->
        var tts: TextToSpeech? = null
        tts = TextToSpeech(applicationContext) { st ->
            val t = tts
            if (st != TextToSpeech.SUCCESS || t == null) { if (cont.isActive) cont.resume(false); return@TextToSpeech }
            val r = t.setLanguage(Locale.KOREAN)
            if (r == TextToSpeech.LANG_MISSING_DATA || r == TextToSpeech.LANG_NOT_SUPPORTED) { t.shutdown(); if (cont.isActive) cont.resume(false); return@TextToSpeech }
            t.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                override fun onStart(id: String) {}
                override fun onDone(id: String) { t.shutdown(); if (cont.isActive) cont.resume(true) }
                @Deprecated("") override fun onError(id: String) { t.shutdown(); if (cont.isActive) cont.resume(false) }
            })
            if (t.synthesizeToFile(text, Bundle(), out, "bench") != TextToSpeech.SUCCESS) { t.shutdown(); if (cont.isActive) cont.resume(false) }
        }
        cont.invokeOnCancellation { runCatching { tts?.shutdown() } }
    }

    /** 아무 WAV(PCM 16비트) → 16kHz 모노 WAV. 길이(초)를 돌려줌 */
    private fun to16kMono(src: File, dst: File): Double {
        val b = src.readBytes()
        val bb = ByteBuffer.wrap(b).order(ByteOrder.LITTLE_ENDIAN)
        var pos = 12; var rate = 22050; var ch = 1; var bits = 16; var dataOff = 44; var dataLen = b.size - 44
        while (pos + 8 <= b.size) {
            val id = String(b, pos, 4, Charsets.US_ASCII); val len = bb.getInt(pos + 4)
            if (id == "fmt ") { ch = bb.getShort(pos + 10).toInt(); rate = bb.getInt(pos + 12); bits = bb.getShort(pos + 22).toInt() }
            if (id == "data") { dataOff = pos + 8; dataLen = minOf(len, b.size - dataOff); break }
            pos += 8 + len + (len and 1)
        }
        if (bits != 16) throw IllegalStateException("지원하지 않는 음성 형식")
        val frames = dataLen / (2 * ch)
        val mono = ShortArray(frames) { i -> var s = 0; for (c in 0 until ch) s += bb.getShort(dataOff + (i * ch + c) * 2); (s / ch).toShort() }
        val n = (frames.toLong() * 16000 / rate).toInt()
        val out = ByteArrayOutputStream(44 + n * 2)
        val hdr = ByteBuffer.allocate(44).order(ByteOrder.LITTLE_ENDIAN)
        hdr.put("RIFF".toByteArray()).putInt(36 + n * 2).put("WAVE".toByteArray()).put("fmt ".toByteArray()).putInt(16)
            .putShort(1).putShort(1).putInt(16000).putInt(32000).putShort(2).putShort(16).put("data".toByteArray()).putInt(n * 2)
        out.write(hdr.array())
        val pcm = ByteBuffer.allocate(n * 2).order(ByteOrder.LITTLE_ENDIAN)
        for (i in 0 until n) {
            val x = i.toDouble() * rate / 16000; val j = x.toInt(); val f = x - j
            val a = mono[minOf(j, frames - 1)].toInt(); val c = mono[minOf(j + 1, frames - 1)].toInt()
            pcm.putShort((a + (c - a) * f).toInt().toShort())
        }
        out.write(pcm.array())
        RandomAccessFile(dst, "rw").use { it.setLength(0); it.write(out.toByteArray()) }
        return frames.toDouble() / rate
    }

    /** 글자 단위 일치율(띄어쓰기 · 문장 부호 빼고) */
    private fun similarity(a0: String, b0: String): Double {
        val a = a0.filter { it.isLetterOrDigit() }; val b = b0.filter { it.isLetterOrDigit() }
        if (a.isEmpty()) return 0.0
        val d = IntArray(b.length + 1) { it }
        for (i in 1..a.length) {
            var prev = d[0]; d[0] = i
            for (j in 1..b.length) {
                val tmp = d[j]
                d[j] = minOf(d[j] + 1, d[j - 1] + 1, prev + if (a[i - 1] == b[j - 1]) 0 else 1)
                prev = tmp
            }
        }
        return (1.0 - d[b.length].toDouble() / maxOf(a.length, b.length)).coerceIn(0.0, 1.0)
    }

    companion object {
        /** 답 쓰기 시험 질문 (모든 기기에서 같은 질문) */
        const val PROMPT = "스마트폰을 PC처럼 쓸 때 좋은 점 다섯 가지를 한 문장씩 번호를 붙여 써 줘."
        /** 받아 적기 시험 문장 */
        const val SENTENCE = "오늘 오후 세 시에 회의실에서 다음 달 예산 회의를 시작합니다."
    }
}
