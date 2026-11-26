package com.daesinnam.localai

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.media.ExifInterface
import android.net.Uri
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import java.util.UUID

/** 대화 기록: 앱 안 폴더(files/chats)에 JSON으로만 저장. 사진은 files/img에 줄여서 보관. */
class Chats(private val ctx: Context) {
    private val dir = File(ctx.filesDir, "chats").apply { mkdirs() }
    val imgDir = File(ctx.filesDir, "img").apply { mkdirs() }

    @Synchronized fun list(): JSONArray {
        val items = dir.listFiles { f -> f.name.endsWith(".json") }.orEmpty().mapNotNull {
            runCatching { JSONObject(it.readText()) }.getOrNull()
        }.sortedByDescending { it.optLong("updated") }
        val a = JSONArray()
        for (c in items) {
            val msgs = c.optJSONArray("messages") ?: JSONArray()
            var last = ""
            for (i in msgs.length() - 1 downTo 0) { last = msgs.getJSONObject(i).optString("text"); if (last.isNotBlank()) break }
            a.put(JSONObject().put("id", c.getString("id")).put("title", c.optString("title", "새 대화"))
                .put("updated", c.optLong("updated")).put("count", msgs.length()).put("last", last.take(80)))
        }
        return a
    }

    @Synchronized fun get(id: String): JSONObject? =
        File(dir, "$id.json").takeIf { it.exists() }?.let { runCatching { JSONObject(it.readText()) }.getOrNull() }

    @Synchronized fun create(): JSONObject {
        val now = System.currentTimeMillis()
        val c = JSONObject().put("id", UUID.randomUUID().toString().take(12)).put("title", "새 대화")
            .put("created", now).put("updated", now).put("messages", JSONArray())
        save(c); return c
    }

    @Synchronized fun save(c: JSONObject) {
        c.put("updated", System.currentTimeMillis())
        val f = File(dir, c.getString("id") + ".json")
        val tmp = File(dir, c.getString("id") + ".tmp")
        tmp.writeText(c.toString()); tmp.renameTo(f)
    }

    @Synchronized fun delete(id: String) {
        get(id)?.optJSONArray("messages")?.let { m ->
            for (i in 0 until m.length()) m.getJSONObject(i).optJSONArray("images")?.let { a ->
                for (j in 0 until a.length()) File(a.getString(j)).delete()
            }
        }
        File(dir, "$id.json").delete()
    }

    @Synchronized fun deleteAll() { dir.listFiles()?.forEach { it.delete() }; imgDir.listFiles()?.forEach { it.delete() } }

    /** 사진을 긴 변 1280px JPEG로 줄여 저장(회전 정보 반영). 모델에 넣기 빠르고 기록 용량도 작게 */
    fun importImage(uri: Uri): File {
        val raw = ctx.contentResolver.openInputStream(uri)?.use { it.readBytes() } ?: error("사진을 열지 못했어요")
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeByteArray(raw, 0, raw.size, bounds)
        var sample = 1
        while (maxOf(bounds.outWidth, bounds.outHeight) / (sample * 2) >= 1280) sample *= 2
        var bm = BitmapFactory.decodeByteArray(raw, 0, raw.size, BitmapFactory.Options().apply { inSampleSize = sample })
            ?: error("사진 형식을 읽지 못했어요")
        val rot = runCatching {
            when (ExifInterface(raw.inputStream()).getAttributeInt(ExifInterface.TAG_ORIENTATION, 1)) {
                ExifInterface.ORIENTATION_ROTATE_90 -> 90f; ExifInterface.ORIENTATION_ROTATE_180 -> 180f
                ExifInterface.ORIENTATION_ROTATE_270 -> 270f; else -> 0f
            }
        }.getOrDefault(0f)
        val scale = 1280f / maxOf(bm.width, bm.height)
        if (rot != 0f || scale < 1f) {
            val mx = Matrix().apply { if (scale < 1f) postScale(scale, scale); if (rot != 0f) postRotate(rot) }
            bm = Bitmap.createBitmap(bm, 0, 0, bm.width, bm.height, mx, true)
        }
        val out = File(imgDir, UUID.randomUUID().toString().take(12) + ".jpg")
        FileOutputStream(out).use { bm.compress(Bitmap.CompressFormat.JPEG, 88, it) }
        return out
    }
}
