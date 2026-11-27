package com.daesinnam.localai

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.io.File
import java.io.RandomAccessFile
import java.util.Locale
import kotlin.math.sqrt

/**
 * DNR 음성 엔진 — 말로 묻고, 답을 소리로 듣기. 인터넷을 쓰지 않음.
 *
 *  - 듣기: 마이크로 16kHz 녹음 → 말이 끝나면(조용해지면) 자동으로 멈춤 → 기기 안 Gemma 4가 받아 적음(오디오 입력).
 *          모델이 소리를 못 받으면 휴대폰에 내장된 기기 안 음성 인식으로 바꿔 씀(설정에서 고를 수도 있음).
 *  - 읽기: 휴대폰에 설치된 한국어 음성(TTS)으로 답을 읽음. 마크다운 · 표 · 코드는 읽기 좋게 다듬어서.
 *
 * 화면(JS)으로 가는 알림: voice {state: listening|level|thinking|done|error, level, text, error, engine},
 *                         speak {state: start|done|error, id}
 */
class DnrVoice(private val ctx: Context, private val emit: (String, JSONObject) -> Unit) {
    private val ui = Handler(Looper.getMainLooper())
    private val prefs get() = ctx.getSharedPreferences("localai", Context.MODE_PRIVATE)
    private var rec: Recorder? = null
    private var sys: SpeechRecognizer? = null
    private var tts: TextToSpeech? = null
    @Volatile private var ttsReady = false
    @Volatile private var ttsKorean = false
    private var pendingSpeak: Pair<String, String>? = null

    // ---------- 듣기 ----------
    /** stt: auto(DNR 먼저, 안 되면 기기 내장) | dnr | system */
    fun listen() {
        stopSpeak()
        if (rec != null || sys != null) return
        val mode = prefs.getString("stt", "auto")
        val dnrOk = prefs.getBoolean("sttDnrOk", true)
        if (mode == "system" || (mode == "auto" && !dnrOk)) { listenSystem(); return }
        listenDnr(File(ctx.cacheDir, "voice").apply { mkdirs() }.resolve("ask.wav"))
    }

    fun stopListen() {
        rec?.finish()
        sys?.stopListening()
    }

    fun cancelListen() {
        rec?.cancel(); rec = null
        sys?.cancel(); sys?.destroy(); sys = null
    }

    private fun listenDnr(out: File) {
        emit("voice", JSONObject().put("state", "listening").put("engine", "dnr"))
        val r = Recorder(out, onLevel = { lv -> emit("voice", JSONObject().put("state", "level").put("level", lv.toDouble())) }) { file, err ->
            rec = null
            if (file == null) { emit("voice", JSONObject().put("state", "error").put("error", err ?: "말소리가 들리지 않았어요")); return@Recorder }
            transcribeFile(file, "dnr")
        }
        rec = r; r.start()
    }

    // ---------- 자비스 부르기("자비스 온") 대기 ----------
    /**
     * 화면이 켜져 있는 동안만: 짧은 말소리가 들리면 기기 안 AI로 받아 적어 화면(JS)에 넘김 → JS가 "자비스"가 있는지 봄.
     * wake {state: armed | heard(text) | idle(조용함 → 다시 대기) | off(이 모델은 소리를 못 받음)}
     */
    fun wake() {
        if (rec != null || sys != null) return
        if (!prefs.getBoolean("sttDnrOk", true) || prefs.getString("stt", "auto") == "system") {
            emit("wake", JSONObject().put("state", "off")); return
        }
        val out = File(ctx.cacheDir, "voice").apply { mkdirs() }.resolve("wake.wav")
        emit("wake", JSONObject().put("state", "armed"))
        val r = Recorder(out, onLevel = { lv -> emit("wake", JSONObject().put("state", "level").put("level", lv.toDouble())) },
            waitMs = 45000, maxMs = 6000, silenceMs = 700) { file, _ ->
            rec = null
            if (file == null) { emit("wake", JSONObject().put("state", "idle")); return@Recorder }
            CoroutineScope(Dispatchers.Default).launch {
                val text = runCatching { App.app.ai.transcribe(file) }.getOrElse { t ->
                    if (t is Ai.NoAudioException) { prefs.edit().putBoolean("sttDnrOk", false).apply(); emit("wake", JSONObject().put("state", "off")); return@launch }
                    ""
                }
                emit("wake", JSONObject().put("state", "heard").put("text", text))
            }
        }
        rec = r; r.start()
    }

    fun stopWake() { rec?.cancel(); rec = null }

    /** 녹음된 파일(16kHz 모노 WAV)을 받아 적기 — 자동 점검에서도 씀 */
    fun transcribeFile(file: File, engine: String = "dnr") {
        emit("voice", JSONObject().put("state", "thinking").put("engine", engine))
        CoroutineScope(Dispatchers.Default).launch {
            try {
                val t0 = System.currentTimeMillis()
                val text = App.app.ai.transcribe(file)
                if (text.isBlank()) throw IllegalStateException("말을 알아듣지 못했어요. 다시 말씀해 주세요")
                prefs.edit().putBoolean("sttDnrOk", true).apply()
                emit("voice", JSONObject().put("state", "done").put("text", text).put("engine", "dnr").put("ms", System.currentTimeMillis() - t0))
            } catch (t: Throwable) {
                Log.w(TAG, "dnr stt failed", t)
                val noAudio = t is Ai.NoAudioException
                if (noAudio) prefs.edit().putBoolean("sttDnrOk", false).apply()
                emit("voice", JSONObject().put("state", "error").put("noAudio", noAudio)
                    .put("error", if (noAudio) "이 AI 모델은 소리를 받지 못해요. 기기 내장 음성 인식으로 바꿨어요. 다시 눌러 말씀해 주세요" else (t.message ?: "받아 적지 못했어요")))
            }
        }
    }

    private fun listenSystem() {
        ui.post {
            val on = SpeechRecognizer.isOnDeviceRecognitionAvailable(ctx)
            if (!on && !SpeechRecognizer.isRecognitionAvailable(ctx)) {
                emit("voice", JSONObject().put("state", "error").put("error", "이 휴대폰에는 기기 내장 음성 인식이 없어요")); return@post
            }
            val s = if (on) SpeechRecognizer.createOnDeviceSpeechRecognizer(ctx) else SpeechRecognizer.createSpeechRecognizer(ctx)
            sys = s
            s.setRecognitionListener(object : RecognitionListener {
                override fun onReadyForSpeech(p: Bundle?) { emit("voice", JSONObject().put("state", "listening").put("engine", "system")) }
                override fun onBeginningOfSpeech() {}
                override fun onRmsChanged(db: Float) { emit("voice", JSONObject().put("state", "level").put("level", ((db + 2f) / 12f).coerceIn(0f, 1f).toDouble())) }
                override fun onBufferReceived(b: ByteArray?) {}
                override fun onEndOfSpeech() { emit("voice", JSONObject().put("state", "thinking").put("engine", "system")) }
                override fun onError(e: Int) {
                    s.destroy(); sys = null
                    emit("voice", JSONObject().put("state", "error").put("error", when (e) {
                        SpeechRecognizer.ERROR_NO_MATCH, SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "말소리가 들리지 않았어요"
                        SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "마이크 권한이 필요해요"
                        SpeechRecognizer.ERROR_LANGUAGE_UNAVAILABLE, SpeechRecognizer.ERROR_LANGUAGE_NOT_SUPPORTED -> "기기 내장 인식에 한국어가 없어요(설정 › 일반 › 음성 인식에서 한국어를 받아 주세요)"
                        else -> "음성 인식이 멈췄어요 ($e)"
                    }))
                }
                override fun onResults(b: Bundle?) {
                    s.destroy(); sys = null
                    val t = b?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull().orEmpty()
                    if (t.isBlank()) emit("voice", JSONObject().put("state", "error").put("error", "말을 알아듣지 못했어요"))
                    else emit("voice", JSONObject().put("state", "done").put("text", t).put("engine", "system"))
                }
                override fun onPartialResults(b: Bundle?) {
                    val t = b?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull().orEmpty()
                    if (t.isNotBlank()) emit("voice", JSONObject().put("state", "partial").put("text", t))
                }
                override fun onEvent(t: Int, b: Bundle?) {}
            })
            s.startListening(Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH)
                .putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                .putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault().toLanguageTag())
                .putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                .putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true))
        }
    }

    // ---------- 읽기 ----------
    private fun ensureTts(after: (() -> Unit)? = null) {
        if (tts != null) { if (ttsReady) after?.invoke(); return }
        tts = TextToSpeech(ctx.applicationContext) { st ->
            ttsReady = st == TextToSpeech.SUCCESS
            val t = tts ?: return@TextToSpeech
            if (ttsReady) {
                val r = t.setLanguage(Locale.KOREAN)
                ttsKorean = r != TextToSpeech.LANG_MISSING_DATA && r != TextToSpeech.LANG_NOT_SUPPORTED
                t.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                    override fun onStart(id: String) {}
                    override fun onDone(id: String) { if (id.endsWith("#last")) emit("speak", JSONObject().put("state", "done").put("id", id.substringBefore('#'))) }
                    @Deprecated("") override fun onError(id: String) { emit("speak", JSONObject().put("state", "error").put("id", id.substringBefore('#'))) }
                    override fun onStop(id: String, interrupted: Boolean) { emit("speak", JSONObject().put("state", "done").put("id", id.substringBefore('#'))) }
                })
                after?.invoke()
                pendingSpeak?.let { (x, id) -> pendingSpeak = null; speak(x, id) }
            } else emit("speak", JSONObject().put("state", "error").put("error", "읽어 주는 음성(TTS)이 없어요"))
        }
    }

    fun speak(text: String, id: String) {
        if (!ttsReady) { pendingSpeak = text to id; ensureTts(); return }
        val t = tts ?: return
        if (!ttsKorean && Regex("[가-힣]").containsMatchIn(text)) {
            emit("speak", JSONObject().put("state", "error").put("id", id).put("error", "한국어 읽기 음성이 없어요. 설정 › 일반 › 글자 읽어주기에서 한국어 음성을 받아 주세요"))
            return
        }
        t.setSpeechRate(prefs.getFloat("ttsRate", 1.0f))
        t.stop()
        val parts = chunks(speakable(text))
        if (parts.isEmpty()) { emit("speak", JSONObject().put("state", "done").put("id", id)); return }
        emit("speak", JSONObject().put("state", "start").put("id", id))
        parts.forEachIndexed { i, p ->
            t.speak(p, if (i == 0) TextToSpeech.QUEUE_FLUSH else TextToSpeech.QUEUE_ADD, null, if (i == parts.size - 1) "$id#last" else "$id#$i")
        }
    }

    fun stopSpeak() { if (ttsReady) tts?.stop() }

    fun ttsInfo(): JSONObject = JSONObject().put("ready", ttsReady).put("korean", ttsKorean)
        .put("engine", tts?.defaultEngine ?: JSONObject.NULL)

    fun warmUp() = ensureTts()

    fun release() { cancelListen(); runCatching { tts?.shutdown() }; tts = null; ttsReady = false }

    companion object {
        const val TAG = "DnrVoice"

        /** 읽기 좋게: 코드 · 표 테두리 · 마크다운 기호 · 링크 주소를 빼고 문장만 */
        fun speakable(md: String): String {
            var s = md.replace(Regex("(?s)```.*?```"), " (코드는 화면에서 봐 주세요) ")
            s = s.replace(Regex("`([^`]*)`"), "$1")
            s = s.replace(Regex("!\\[[^\\]]*]\\([^)]*\\)"), " ")
            s = s.replace(Regex("\\[([^\\]]+)]\\([^)]*\\)"), "$1")
            s = s.replace(Regex("\\s?\\[\\d{1,2}](\\[\\d{1,2}])*"), "") // 출처 번호 [1][2]는 읽지 않음
            s = s.lines().filterNot { Regex("^\\s*\\|?\\s*:?-{2,}").containsMatchIn(it) }.joinToString("\n") { line ->
                if (line.trim().startsWith("|")) line.trim().trim('|').split("|").joinToString(", ") { it.trim() } + "." else line
            }
            s = s.replace(Regex("(?m)^\\s{0,3}#{1,6}\\s*"), "").replace(Regex("(?m)^\\s*[-*+]\\s+"), "").replace(Regex("(?m)^\\s*>\\s?"), "")
            s = s.replace(Regex("[*_~]{1,3}"), "").replace(Regex("https?://\\S+"), " 링크 ")
            return s.replace(Regex("[ \\t]+"), " ").replace(Regex("\\n{2,}"), "\n").trim()
        }

        fun chunks(s: String, max: Int = 1800): List<String> {
            if (s.isBlank()) return emptyList()
            val out = ArrayList<String>(); val cur = StringBuilder()
            for (sent in s.split(Regex("(?<=[.!?。…\\n])"))) {
                if (cur.length + sent.length > max && cur.isNotEmpty()) { out.add(cur.toString()); cur.setLength(0) }
                cur.append(sent.take(max))
            }
            if (cur.isNotBlank()) out.add(cur.toString())
            return out.filter { it.isNotBlank() }
        }
    }

    /** 16kHz 모노 녹음. 말이 시작된 뒤 1.2초 조용하면 끝, 최대 30초, 8초 안에 말이 없으면 취소 */
    private class Recorder(private val out: File, private val onLevel: (Float) -> Unit,
                           private val waitMs: Int = 8000, private val maxMs: Int = 30000, private val silenceMs: Int = 1200,
                           private val onEnd: (File?, String?) -> Unit) {
        @Volatile private var stop = false
        @Volatile private var cancelled = false
        private val main = Handler(Looper.getMainLooper())
        fun finish() { stop = true }
        fun cancel() { cancelled = true; stop = true }

        @SuppressLint("MissingPermission")
        fun start() = Thread {
            val rate = 16000
            val min = AudioRecord.getMinBufferSize(rate, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT)
            val ar = try {
                AudioRecord(MediaRecorder.AudioSource.VOICE_RECOGNITION, rate, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT, maxOf(min, rate))
            } catch (t: Throwable) { main.post { onEnd(null, "마이크를 열지 못했어요") }; return@Thread }
            if (ar.state != AudioRecord.STATE_INITIALIZED) { ar.release(); main.post { onEnd(null, "마이크를 열지 못했어요(권한을 확인해 주세요)") }; return@Thread }
            val pcm = java.io.ByteArrayOutputStream()
            val frame = ShortArray(rate / 50) // 20ms
            val bytes = ByteArray(frame.size * 2)
            var floor = 0.0; var nFloor = 0; var speech = false; var silentMs = 0; var totalMs = 0; var lastLevel = 0L
            ar.startRecording()
            try {
                while (!stop) {
                    val n = ar.read(frame, 0, frame.size); if (n <= 0) continue
                    var sum = 0.0
                    for (i in 0 until n) { val v = frame[i].toInt(); sum += v * v; bytes[i * 2] = (v and 0xff).toByte(); bytes[i * 2 + 1] = ((v shr 8) and 0xff).toByte() }
                    pcm.write(bytes, 0, n * 2)
                    val rms = sqrt(sum / n); totalMs += 20
                    if (totalMs <= 300) { floor += rms; nFloor++; continue }
                    val base = if (nFloor > 0) floor / nFloor else 300.0
                    val th = maxOf(base * 3.0, 700.0)
                    if (rms > th) { speech = true; silentMs = 0 } else if (speech) silentMs += 20
                    val now = System.currentTimeMillis()
                    if (now - lastLevel > 80) { lastLevel = now; val lv = (rms / 6000.0).coerceIn(0.0, 1.0).toFloat(); main.post { onLevel(lv) } }
                    if (speech && silentMs >= silenceMs) break
                    if (!speech && totalMs >= waitMs) { cancelled = true; break }
                    if (totalMs >= maxMs) break
                }
            } finally { runCatching { ar.stop() }; ar.release() }
            if (cancelled) { main.post { onEnd(null, null) }; return@Thread }
            writeWav(out, pcm.toByteArray(), rate)
            main.post { onEnd(out, null) }
        }.apply { name = "dnr-voice-rec" }.start()

        private fun writeWav(f: File, data: ByteArray, rate: Int) {
            RandomAccessFile(f, "rw").use { w ->
                w.setLength(0)
                fun i32(v: Int) { w.write(byteArrayOf((v and 0xff).toByte(), (v shr 8 and 0xff).toByte(), (v shr 16 and 0xff).toByte(), (v shr 24 and 0xff).toByte())) }
                fun i16(v: Int) { w.write(byteArrayOf((v and 0xff).toByte(), (v shr 8 and 0xff).toByte())) }
                w.writeBytes("RIFF"); i32(36 + data.size); w.writeBytes("WAVE")
                w.writeBytes("fmt "); i32(16); i16(1); i16(1); i32(rate); i32(rate * 2); i16(2); i16(16)
                w.writeBytes("data"); i32(data.size); w.write(data)
            }
        }
    }
}
