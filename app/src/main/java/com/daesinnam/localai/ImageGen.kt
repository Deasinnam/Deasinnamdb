package com.daesinnam.localai

import android.graphics.Bitmap
import android.util.Log

/** 기기 안 그림 엔진(stable-diffusion.cpp, CPU). 한 번에 한 장 */
object ImageGen {
    val available: Boolean = runCatching { System.loadLibrary("dnrimg"); true }
        .onFailure { Log.e("DnrImg", "native load failed", it) }.getOrDefault(false)

    @Volatile var listener: ((Int, Int) -> Unit)? = null

    @JvmStatic external fun nLoad(path: String, threads: Int): Boolean
    @JvmStatic external fun nFree()
    @JvmStatic external fun nCancel()
    @JvmStatic external fun nGenerate(prompt: String, neg: String, w: Int, h: Int, steps: Int, cfg: Float, seed: Long): ByteArray?

    @JvmStatic fun onProgress(step: Int, steps: Int) { listener?.invoke(step, steps) }

    fun toBitmap(rgb: ByteArray, w: Int, h: Int): Bitmap {
        val px = IntArray(w * h)
        val ch = rgb.size / (w * h)
        for (i in 0 until w * h) {
            val r = rgb[i * ch].toInt() and 255; val g = rgb[i * ch + 1].toInt() and 255; val b = rgb[i * ch + 2].toInt() and 255
            px[i] = (0xFF shl 24) or (r shl 16) or (g shl 8) or b
        }
        return Bitmap.createBitmap(px, w, h, Bitmap.Config.ARGB_8888)
    }
}
