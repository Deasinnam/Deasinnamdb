package com.daesinnam.localai

import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.IBinder
import android.os.PowerManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL

/**
 * AI 모델(수 GB) 내려받기. 앱을 닫거나 화면을 꺼도 계속되고, 끊기면 받은 데까지 이어받음(HTTP Range).
 * 받은 파일은 앱 전용 폴더에만 저장(다른 앱 · 사이트로 보내지 않음).
 */
class DownloadService : Service() {

    data class Progress(
        val id: String, val got: Long, val total: Long, val speed: Long,
        val done: Boolean = false, val error: String? = null, val retry: Int = 0,
    ) {
        fun json(): JSONObject = JSONObject().put("id", id).put("got", got).put("total", total).put("speed", speed)
            .put("done", done).put("error", error ?: JSONObject.NULL).put("retry", retry)
    }

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var job: Job? = null
    private var wake: PowerManager.WakeLock? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACT_STOP) { stopAll(null); return START_NOT_STICKY }
        val m = App.app.models.byId(intent?.getStringExtra("id")) ?: run { stopSelf(); return START_NOT_STICKY }
        startForeground(NID, note(m.name, 0, 0, 0), ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
        if (job?.isActive == true) return START_NOT_STICKY
        wake = (getSystemService(Context.POWER_SERVICE) as PowerManager)
            .newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "localai:dl").apply { acquire(3 * 60 * 60 * 1000L) }
        job = scope.launch { run(m) }
        return START_NOT_STICKY
    }

    private suspend fun run(m: Models.Model) {
        val models = App.app.models
        val part = models.part(m)
        var retry = 0
        var lastErr: String? = null
        while (scope.isActive && retry <= 30) {
            try {
                fetch(m, part)
                if (!part.renameTo(models.file(m))) throw IOException("파일을 옮기지 못했어요")
                state.value = Progress(m.id, models.file(m).length(), models.file(m).length(), 0, done = true)
                if (m.kind == "chat" && (models.activeId == null || !models.ready(models.byId(models.activeId)!!))) models.activeId = m.id
                stopAll(null)
                return
            } catch (e: kotlinx.coroutines.CancellationException) {
                throw e
            } catch (e: Exception) {
                lastErr = when {
                    e is NoSpace -> "저장 공간이 모자라요. ${gb(e.need)}GB 이상 비워 주세요"
                    !online() -> "인터넷이 끊겼어요. 다시 연결되면 이어받아요"
                    else -> "내려받기가 멈췄어요(${e.message ?: e.javaClass.simpleName}). 이어받는 중…"
                }
                if (e is NoSpace) break
                retry++
                state.value = (state.value ?: Progress(m.id, part.length(), m.bytes, 0)).copy(error = lastErr, retry = retry, speed = 0)
                delay(if (online()) 3000L * minOf(retry, 10) else 5000L)
            }
        }
        stopAll(lastErr ?: "내려받지 못했어요")
    }

    private class NoSpace(val need: Long) : IOException("no space")

    private fun fetch(m: Models.Model, part: File) {
        var have = if (part.exists()) part.length() else 0L
        val c = (URL(m.url).openConnection() as HttpURLConnection).apply {
            instanceFollowRedirects = true
            connectTimeout = 20_000; readTimeout = 60_000
            setRequestProperty("User-Agent", "ChatDNRAi/${BuildConfig.VERSION_NAME} (Android)")
            if (have > 0) setRequestProperty("Range", "bytes=$have-")
        }
        val code = c.responseCode
        if (code == 416) { c.disconnect(); return } // 이미 다 받음
        if (code != 200 && code != 206) throw IOException("서버 응답 $code")
        if (code == 200 && have > 0) { have = 0; part.delete() } // 이어받기를 지원하지 않으면 처음부터
        val total = have + c.contentLengthLong.coerceAtLeast(0)
        val need = total - have + 200_000_000L
        if (App.app.models.freeBytes() < need) { c.disconnect(); throw NoSpace(need) }
        c.inputStream.use { inp ->
            FileOutputStream(part, have > 0).use { out ->
                val buf = ByteArray(1 shl 20)
                var got = have
                var t0 = System.currentTimeMillis(); var g0 = got; var speed = 0L; var lastNote = 0L
                while (true) {
                    if (!scope.isActive || job?.isCancelled == true) throw kotlinx.coroutines.CancellationException()
                    val n = inp.read(buf); if (n < 0) break
                    out.write(buf, 0, n); got += n
                    val now = System.currentTimeMillis()
                    if (now - t0 >= 1000) { speed = (got - g0) * 1000 / (now - t0); t0 = now; g0 = got
                        state.value = Progress(m.id, got, total, speed) }
                    if (now - lastNote > 2000) { lastNote = now; notify(note(m.name, got, total, speed)) }
                }
                if (total > 0 && got < total) throw IOException("연결이 끊겼어요")
            }
        }
    }

    private fun online(): Boolean {
        val cm = getSystemService(ConnectivityManager::class.java)
        val cap = cm.getNetworkCapabilities(cm.activeNetwork) ?: return false
        return cap.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    private fun stopAll(err: String?) {
        job?.cancel()
        if (err != null) state.value = state.value?.copy(error = err, speed = 0, done = false)
        else if (state.value?.done != true) state.value = null
        wake?.let { if (it.isHeld) it.release() }
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    override fun onDestroy() { scope.coroutineContext[Job]?.cancel(); super.onDestroy() }

    private fun notify(n: Notification) = getSystemService(android.app.NotificationManager::class.java).notify(NID, n)

    private fun note(name: String, got: Long, total: Long, speed: Long): Notification {
        val open = PendingIntent.getActivity(this, 0, Intent(this, MainActivity::class.java), PendingIntent.FLAG_IMMUTABLE)
        val stop = PendingIntent.getService(this, 1, Intent(this, DownloadService::class.java).setAction(ACT_STOP), PendingIntent.FLAG_IMMUTABLE)
        val pct = if (total > 0) (got * 100 / total).toInt() else 0
        return Notification.Builder(this, App.CH_DL)
            .setSmallIcon(android.R.drawable.stat_sys_download)
            .setContentTitle("$name 내려받는 중 · $pct%")
            .setContentText(if (total > 0) "${gb(got)} / ${gb(total)}GB" + (if (speed > 0) " · ${speed / 1_000_000}MB/s" else "") else "준비 중…")
            .setProgress(100, pct, total <= 0)
            .setOngoing(true).setOnlyAlertOnce(true)
            .setContentIntent(open)
            .addAction(Notification.Action.Builder(null, "멈추기", stop).build())
            .build()
    }

    companion object {
        const val NID = 7
        const val ACT_STOP = "stop"
        val state = MutableStateFlow<Progress?>(null)
        fun gb(b: Long) = String.format(java.util.Locale.ROOT, "%.1f", b / 1e9)
        fun start(ctx: Context, id: String) = ctx.startForegroundService(Intent(ctx, DownloadService::class.java).putExtra("id", id))
        fun stop(ctx: Context) = ctx.startService(Intent(ctx, DownloadService::class.java).setAction(ACT_STOP))
    }
}
