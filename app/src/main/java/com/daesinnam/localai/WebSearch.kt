package com.daesinnam.localai

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * 인터넷 검색(선택) — 사용자가 넣은 네이버 검색 키로만, 이 폰에서 네이버로 바로 검색해요(덜누름 서버를 거치지 않음).
 *  - 밖으로 나가는 건 검색어뿐. 답은 여전히 기기 안 AI(Gemma)가 검색 결과를 읽고 만들어요.
 *  - 키: NAVER API HUB(새 키, naverapihub.apigw.ntruss.com) 또는 예전 네이버 개발자 센터 키(openapi.naver.com, 2027.6.30까지)
 *  - 키는 이 앱 저장소(websearch)에만 저장하고, 화면(JS)에는 돌려주지 않아요.
 */
object WebSearch {
    data class Src(val title: String, val link: String, val desc: String, val kind: String, val date: String = "")
    class SearchException(msg: String) : Exception(msg)

    private fun prefs(ctx: Context) = ctx.getSharedPreferences("websearch", Context.MODE_PRIVATE)
    fun configured(ctx: Context) = prefs(ctx).getString("id", "").orEmpty().isNotBlank() && prefs(ctx).getString("secret", "").orEmpty().isNotBlank()
    fun kind(ctx: Context) = prefs(ctx).getString("kind", "hub") ?: "hub"
    fun clear(ctx: Context) { prefs(ctx).edit().clear().apply() }

    /** 키를 확인(실제로 한 번 검색)하고 맞으면 저장. 반환: ok | 오류 문장 */
    fun saveKey(ctx: Context, id: String, secret: String): String {
        val i = id.trim(); val s = secret.trim()
        if (i.isEmpty() || s.isEmpty()) return "Client ID와 Client Secret을 모두 넣어 주세요"
        var last = "키를 확인하지 못했어요"
        for (k in listOf("hub", "dev")) {
            try { call(k, i, s, "news", "날씨", 1); prefs(ctx).edit().putString("id", i).putString("secret", s).putString("kind", k).apply(); return "ok" }
            catch (e: SearchException) { last = e.message ?: last; if (last.startsWith("인터넷")) return last }
        }
        return last
    }

    /** 웹 문서 + 뉴스를 함께 찾아 겹치는 주소를 빼고 돌려줌 */
    fun search(ctx: Context, question: String): List<Src> {
        val p = prefs(ctx)
        val id = p.getString("id", "").orEmpty(); val secret = p.getString("secret", "").orEmpty()
        if (id.isBlank() || secret.isBlank()) throw SearchException("인터넷 검색 키가 없어요. 설정 › 인터넷 검색에서 넣어 주세요")
        val q = query(question)
        val k = kind(ctx)
        val news = runCatching { call(k, id, secret, "news", q, 4) }
        val web = runCatching { call(k, id, secret, "webkr", q, 4) }
        if (news.isFailure && web.isFailure) throw (web.exceptionOrNull() as? SearchException) ?: SearchException("검색하지 못했어요")
        val seen = HashSet<String>()
        return (news.getOrDefault(emptyList()) + web.getOrDefault(emptyList())).filter { seen.add(it.link) }.take(6)
    }

    /** 말하듯 쓴 질문에서 검색어만 남기기 */
    fun query(q: String): String {
        var s = q.replace(Regex("\\s+"), " ").trim()
        s = s.replace(Regex("^(헤이\\s*)?(자비스|jarvis)\\s*(온)?[,.!]?\\s*", RegexOption.IGNORE_CASE), "")
        s = s.replace(Regex("(인터넷|웹|네이버)(에서|으로|로)?\\s*(좀\\s*)?(찾아|검색해|알아봐|검색)\\s*(줘|주세요|봐|봐줘|줄래|줄래요)?"), " ")
        s = s.replace(Regex("(을|를)?\\s*(알려\\s*줘|알려\\s*주세요|알려줄래|가르쳐\\s*줘|뭐야|뭐예요|뭔가요|어때|어때요|인가요|일까|일까요|이야|야)\\s*[?？.!]*$"), "")
        s = s.replace(Regex("[?？!.]+$"), "").trim()
        return s.ifEmpty { q.trim() }.take(80)
    }

    private fun call(kind: String, id: String, secret: String, what: String, q: String, n: Int): List<Src> {
        val enc = URLEncoder.encode(q, "UTF-8")
        val url = if (kind == "hub") "https://naverapihub.apigw.ntruss.com/search/v1/$what?query=$enc&display=$n&start=1&format=json"
                  else "https://openapi.naver.com/v1/search/$what.json?query=$enc&display=$n&start=1"
        val c = try { URL(url).openConnection() as HttpURLConnection } catch (e: Exception) { throw SearchException("인터넷에 연결할 수 없어요") }
        c.connectTimeout = 7000; c.readTimeout = 9000
        if (kind == "hub") { c.setRequestProperty("X-NCP-APIGW-API-KEY-ID", id); c.setRequestProperty("X-NCP-APIGW-API-KEY", secret) }
        else { c.setRequestProperty("X-Naver-Client-Id", id); c.setRequestProperty("X-Naver-Client-Secret", secret) }
        try {
            val code = try { c.responseCode } catch (e: java.io.IOException) { throw SearchException("인터넷에 연결할 수 없어요") }
            when (code) {
                200 -> {}
                401, 403 -> throw SearchException("검색 키가 맞지 않거나 검색 API 사용 신청이 안 되어 있어요")
                429 -> throw SearchException("오늘 검색 한도를 다 썼어요(네이버 하루 한도)")
                else -> throw SearchException("네이버 검색이 응답하지 않아요($code)")
            }
            val body = c.inputStream.bufferedReader().use { it.readText() }
            val items = JSONObject(body).optJSONArray("items") ?: JSONArray()
            return (0 until items.length()).map { i ->
                val o = items.getJSONObject(i)
                val link = o.optString("originallink").ifBlank { o.optString("link") }
                Src(clean(o.optString("title")), link, clean(o.optString("description")), what, newsDate(o.optString("pubDate")))
            }.filter { it.link.startsWith("http") && it.title.isNotBlank() }
        } finally { c.disconnect() }
    }

    private fun clean(s: String) = s.replace(Regex("<[^>]+>"), "")
        .replace("&quot;", "\"").replace("&apos;", "'").replace("&#39;", "'").replace("&lt;", "<").replace("&gt;", ">").replace("&amp;", "&")
        .replace(Regex("\\s+"), " ").trim()

    private fun newsDate(s: String): String = if (s.isBlank()) "" else runCatching {
        SimpleDateFormat("yyyy-MM-dd", Locale.KOREA).format(SimpleDateFormat("EEE, dd MMM yyyy HH:mm:ss Z", Locale.US).parse(s)!!)
    }.getOrDefault("")

    fun site(link: String) = runCatching { URL(link).host.removePrefix("www.").removePrefix("m.") }.getOrDefault("")

    /** 기기 안 AI에게 줄 질문: 검색 결과 + 규칙 + 원래 질문 */
    fun prompt(question: String, srcs: List<Src>): String {
        val today = SimpleDateFormat("yyyy년 M월 d일 (E)", Locale.KOREA).format(Date())
        val sb = StringBuilder("[인터넷 검색 결과 · 오늘은 $today]\n")
        srcs.forEachIndexed { i, s ->
            sb.append("[${i + 1}] ").append(s.title)
            if (s.date.isNotBlank()) sb.append(" (").append(s.date).append(")")
            sb.append(" — ").append(s.desc.take(220)).append(" · ").append(site(s.link)).append('\n')
        }
        sb.append("\n위 검색 결과를 근거로 질문에 답해. 지금은 인터넷 검색 결과가 있으니 '인터넷에 연결되어 있지 않다'고 말하지 마. ")
            .append("검색 결과에서 가져온 내용 끝에는 [1]처럼 번호를 붙이고, 결과에 없는 건 지어내지 말고 '검색 결과에서는 확인되지 않아요'라고 해. ")
            .append("날짜가 다른 결과끼리 다르면 최신 것을 따르고 그렇다고 말해.\n\n질문: ").append(question)
        return sb.toString()
    }

    fun json(srcs: List<Src>) = JSONArray().apply { srcs.forEach { put(JSONObject().put("t", it.title).put("u", it.link).put("s", site(it.link)).put("d", it.date)) } }
}
