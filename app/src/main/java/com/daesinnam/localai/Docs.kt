package com.daesinnam.localai

import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Environment
import android.provider.MediaStore
import java.io.ByteArrayOutputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

/**
 * AI 답(마크다운)을 문서 파일로 만들어 덜누름 워크(DNR Work)에서 열기.
 * 파일은 이 폰의 문서/Chat DNR Ai 폴더에만 저장하고, 워크에는 그 파일 하나만 읽고 쓸 권한을 줌.
 */
object Docs {
    const val WORK_PKG = "com.daesinnam.work"
    const val WORK_ACT = "com.daesinnam.work.OfficeActivity"
    const val DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    const val XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

    fun workInstalled(ctx: Context) = runCatching { ctx.packageManager.getPackageInfo(WORK_PKG, 0); true }.getOrDefault(false)

    fun hasTable(md: String) = tables(md).isNotEmpty()

    /** kind: docx | xlsx | md. 만든 파일 Uri */
    fun save(ctx: Context, md: String, title: String, kind: String): Uri {
        val stamp = SimpleDateFormat("yyMMdd-HHmm", Locale.KOREA).format(Date())
        val safe = title.replace(Regex("[\\\\/:*?\"<>|\\n]"), " ").trim().take(30).ifEmpty { "Chat DNR Ai" }
        val (bytes, mime, ext) = when (kind) {
            "xlsx" -> Triple(xlsx(md), XLSX, "xlsx")
            "md" -> Triple(md.toByteArray(), "text/markdown", "md")
            else -> Triple(docx(md, title), DOCX, "docx")
        }
        val cv = ContentValues().apply {
            put(MediaStore.MediaColumns.DISPLAY_NAME, "$safe $stamp.$ext")
            put(MediaStore.MediaColumns.MIME_TYPE, mime)
            put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOCUMENTS + "/Chat DNR Ai")
            put(MediaStore.MediaColumns.IS_PENDING, 1)
        }
        val cr = ctx.contentResolver
        val uri = cr.insert(MediaStore.Files.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY), cv) ?: error("파일을 만들지 못했어요")
        cr.openOutputStream(uri)!!.use { it.write(bytes) }
        cv.clear(); cv.put(MediaStore.MediaColumns.IS_PENDING, 0); cr.update(uri, cv, null, null)
        return uri
    }

    fun openInWork(ctx: Context, uri: Uri, mime: String) {
        val i = Intent(Intent.ACTION_EDIT).setDataAndType(uri, mime).setClassName(WORK_PKG, WORK_ACT)
            .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_WRITE_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
        runCatching { ctx.startActivity(i) }.onFailure {
            ctx.startActivity(Intent(Intent.ACTION_VIEW).setDataAndType(uri, mime).setPackage(WORK_PKG)
                .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_WRITE_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK))
        }
    }

    fun mime(kind: String) = when (kind) { "xlsx" -> XLSX; "md" -> "text/markdown"; else -> DOCX }

    // ---------- 마크다운 읽기 ----------
    private fun x(s: String) = s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;")

    private fun tables(md: String): List<List<List<String>>> {
        val out = ArrayList<List<List<String>>>()
        val lines = md.lines()
        var i = 0
        while (i < lines.size) {
            if (lines[i].trim().startsWith("|") && i + 1 < lines.size && Regex("^\\s*\\|?\\s*:?-{2,}").containsMatchIn(lines[i + 1])) {
                val rows = ArrayList<List<String>>()
                rows.add(cells(lines[i])); i += 2
                while (i < lines.size && lines[i].trim().startsWith("|")) { rows.add(cells(lines[i])); i++ }
                out.add(rows)
            } else i++
        }
        return out
    }

    private fun cells(l: String): List<String> {
        var t = l.trim(); if (t.startsWith("|")) t = t.drop(1); if (t.endsWith("|")) t = t.dropLast(1)
        return t.split("|").map { it.trim().replace("**", "").replace("`", "") }
    }

    // ---------- Word(.docx) ----------
    private fun runs(text: String, mono: Boolean = false, size: Int = 0, bold: Boolean = false): String {
        val sb = StringBuilder()
        // **굵게**, `코드` 만 구분
        val re = Regex("(\\*\\*[^*]+\\*\\*|`[^`]+`)")
        var last = 0
        fun run(t: String, b: Boolean, m: Boolean) {
            if (t.isEmpty()) return
            sb.append("<w:r><w:rPr>")
            if (m || mono) sb.append("<w:rFonts w:ascii=\"Consolas\" w:hAnsi=\"Consolas\" w:eastAsia=\"D2Coding\"/>")
            if (b || bold) sb.append("<w:b/>")
            if (size > 0) sb.append("<w:sz w:val=\"$size\"/><w:szCs w:val=\"$size\"/>")
            sb.append("</w:rPr><w:t xml:space=\"preserve\">").append(x(t)).append("</w:t></w:r>")
        }
        for (m in re.findAll(text)) {
            run(text.substring(last, m.range.first), false, false)
            val v = m.value
            if (v.startsWith("**")) run(v.substring(2, v.length - 2), true, false) else run(v.substring(1, v.length - 1), false, true)
            last = m.range.last + 1
        }
        run(text.substring(last), false, false)
        return sb.toString()
    }

    private fun para(text: String, style: String? = null, ind: Int = 0, mono: Boolean = false, size: Int = 0, bold: Boolean = false, shade: Boolean = false): String {
        val pPr = StringBuilder("<w:pPr>")
        if (style != null) pPr.append("<w:pStyle w:val=\"$style\"/>")
        if (shade) pPr.append("<w:shd w:val=\"clear\" w:color=\"auto\" w:fill=\"F2F2F2\"/>")
        pPr.append("<w:spacing w:after=\"${if (mono) 0 else 120}\"/>")
        if (ind > 0) pPr.append("<w:ind w:left=\"$ind\" w:hanging=\"300\"/>")
        pPr.append("</w:pPr>")
        return "<w:p>$pPr${runs(text, mono, size, bold)}</w:p>"
    }

    fun docx(md: String, title: String): ByteArray {
        val body = StringBuilder()
        body.append(para(title, "Title"))
        val lines = md.replace("\r", "").lines()
        var i = 0
        while (i < lines.size) {
            val l = lines[i]
            val t = l.trim()
            when {
                t.startsWith("```") -> {
                    i++
                    while (i < lines.size && !lines[i].trim().startsWith("```")) { body.append(para(lines[i].ifEmpty { " " }, mono = true, size = 18, shade = true)); i++ }
                    i++; continue
                }
                t.startsWith("|") && i + 1 < lines.size && Regex("^\\s*\\|?\\s*:?-{2,}").containsMatchIn(lines[i + 1]) -> {
                    val rows = ArrayList<List<String>>(); rows.add(cells(l)); i += 2
                    while (i < lines.size && lines[i].trim().startsWith("|")) { rows.add(cells(lines[i])); i++ }
                    val cols = rows.maxOf { it.size }
                    body.append("<w:tbl><w:tblPr><w:tblStyle w:val=\"TableGrid\"/><w:tblW w:w=\"5000\" w:type=\"pct\"/>")
                    body.append("<w:tblBorders>")
                    for (b in listOf("top", "left", "bottom", "right", "insideH", "insideV")) body.append("<w:$b w:val=\"single\" w:sz=\"4\" w:color=\"999999\"/>")
                    body.append("</w:tblBorders></w:tblPr><w:tblGrid>")
                    repeat(cols) { body.append("<w:gridCol/>") }
                    body.append("</w:tblGrid>")
                    rows.forEachIndexed { ri, r ->
                        body.append("<w:tr>")
                        for (c in 0 until cols) {
                            body.append("<w:tc><w:tcPr>")
                            if (ri == 0) body.append("<w:shd w:val=\"clear\" w:color=\"auto\" w:fill=\"EDEDED\"/>")
                            body.append("</w:tcPr>").append(para(r.getOrElse(c) { "" }, bold = ri == 0)).append("</w:tc>")
                        }
                        body.append("</w:tr>")
                    }
                    body.append("</w:tbl>").append(para(""))
                    continue
                }
                Regex("^#{1,4}\\s").containsMatchIn(t) -> {
                    val lv = t.takeWhile { it == '#' }.length
                    body.append(para(t.drop(lv).trim(), "Heading${minOf(lv, 3)}"))
                }
                Regex("^[-*•]\\s+").containsMatchIn(t) -> {
                    val depth = (l.length - l.trimStart().length) / 2
                    body.append(para("• " + t.replaceFirst(Regex("^[-*•]\\s+"), ""), ind = 400 + depth * 360))
                }
                Regex("^\\d+[.)]\\s+").containsMatchIn(t) -> body.append(para(t, ind = 400))
                Regex("^(-{3,}|\\*{3,})$").matches(t) -> body.append(para(""))
                t.startsWith(">") -> body.append(para(t.removePrefix(">").trim(), "Quote"))
                t.isEmpty() -> {}
                else -> body.append(para(t))
            }
            i++
        }
        val doc = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
            "<w:document xmlns:w=\"http://schemas.openxmlformats.org/wordprocessingml/2006/main\"><w:body>$body" +
            "<w:sectPr><w:pgSz w:w=\"11906\" w:h=\"16838\"/><w:pgMar w:top=\"1440\" w:right=\"1300\" w:bottom=\"1440\" w:left=\"1300\" w:header=\"720\" w:footer=\"720\" w:gutter=\"0\"/></w:sectPr></w:body></w:document>"
        val font = "<w:rFonts w:ascii=\"Malgun Gothic\" w:hAnsi=\"Malgun Gothic\" w:eastAsia=\"맑은 고딕\"/>"
        fun st(id: String, name: String, sz: Int, bold: Boolean, color: String = "000000", before: Int = 0) =
            "<w:style w:type=\"paragraph\" w:styleId=\"$id\"><w:name w:val=\"$name\"/><w:basedOn w:val=\"Normal\"/><w:next w:val=\"Normal\"/>" +
                "<w:pPr><w:keepNext/><w:spacing w:before=\"$before\" w:after=\"120\"/></w:pPr><w:rPr>${if (bold) "<w:b/>" else ""}<w:color w:val=\"$color\"/><w:sz w:val=\"$sz\"/><w:szCs w:val=\"$sz\"/></w:rPr></w:style>"
        val styles = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
            "<w:styles xmlns:w=\"http://schemas.openxmlformats.org/wordprocessingml/2006/main\">" +
            "<w:docDefaults><w:rPrDefault><w:rPr>$font<w:sz w:val=\"22\"/><w:szCs w:val=\"22\"/><w:lang w:val=\"ko-KR\" w:eastAsia=\"ko-KR\"/></w:rPr></w:rPrDefault>" +
            "<w:pPrDefault><w:pPr><w:spacing w:after=\"120\" w:line=\"300\" w:lineRule=\"auto\"/></w:pPr></w:pPrDefault></w:docDefaults>" +
            "<w:style w:type=\"paragraph\" w:default=\"1\" w:styleId=\"Normal\"><w:name w:val=\"Normal\"/></w:style>" +
            st("Title", "Title", 40, true, "1F2023", 0) + st("Heading1", "heading 1", 32, true, "1F2023", 240) +
            st("Heading2", "heading 2", 28, true, "1F2023", 200) + st("Heading3", "heading 3", 24, true, "333333", 160) +
            "<w:style w:type=\"paragraph\" w:styleId=\"Quote\"><w:name w:val=\"Quote\"/><w:basedOn w:val=\"Normal\"/><w:pPr><w:ind w:left=\"400\"/></w:pPr><w:rPr><w:i/><w:color w:val=\"555555\"/></w:rPr></w:style>" +
            "<w:style w:type=\"table\" w:styleId=\"TableGrid\"><w:name w:val=\"Table Grid\"/><w:tblPr><w:tblCellMar><w:left w:w=\"100\" w:type=\"dxa\"/><w:right w:w=\"100\" w:type=\"dxa\"/></w:tblCellMar></w:tblPr></w:style>" +
            "</w:styles>"
        return zip(mapOf(
            "[Content_Types].xml" to "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\"><Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/><Default Extension=\"xml\" ContentType=\"application/xml\"/><Override PartName=\"/word/document.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml\"/><Override PartName=\"/word/styles.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml\"/></Types>",
            "_rels/.rels" to "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"word/document.xml\"/></Relationships>",
            "word/_rels/document.xml.rels" to "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles\" Target=\"styles.xml\"/></Relationships>",
            "word/document.xml" to doc,
            "word/styles.xml" to styles,
        ))
    }

    // ---------- Excel(.xlsx): 답 속 표마다 시트 하나. 표가 없으면 줄마다 한 칸 ----------
    fun xlsx(md: String): ByteArray {
        var tbls = tables(md)
        if (tbls.isEmpty()) tbls = listOf(md.lines().filter { it.isNotBlank() }.map { listOf(it.trim()) })
        fun col(c: Int): String { var n = c + 1; var s = ""; while (n > 0) { val r = (n - 1) % 26; s = ('A' + r) + s; n = (n - 1) / 26 }; return s }
        val num = Regex("^-?[0-9][0-9,]*(\\.[0-9]+)?$")
        val files = LinkedHashMap<String, String>()
        val sheets = StringBuilder(); val rels = StringBuilder(); val ct = StringBuilder()
        tbls.forEachIndexed { si, rows ->
            val sd = StringBuilder()
            rows.forEachIndexed { ri, r ->
                sd.append("<row r=\"${ri + 1}\">")
                r.forEachIndexed { ci, v0 ->
                    val v = v0.removeSuffix("원").trim()
                    val ref = col(ci) + (ri + 1)
                    val st = if (ri == 0) " s=\"1\"" else ""
                    if (ri > 0 && num.matches(v)) sd.append("<c r=\"$ref\"$st><v>${v.replace(",", "")}</v></c>")
                    else sd.append("<c r=\"$ref\" t=\"inlineStr\"$st><is><t xml:space=\"preserve\">${x(v0)}</t></is></c>")
                }
                sd.append("</row>")
            }
            val ncol = rows.maxOfOrNull { it.size } ?: 1
            val cols = (1..ncol).joinToString("") { "<col min=\"$it\" max=\"$it\" width=\"18\" customWidth=\"1\"/>" }
            files["xl/worksheets/sheet${si + 1}.xml"] = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"><sheetViews><sheetView workbookViewId=\"0\"><pane ySplit=\"1\" topLeftCell=\"A2\" activePane=\"bottomLeft\" state=\"frozen\"/></sheetView></sheetViews><cols>$cols</cols><sheetData>$sd</sheetData></worksheet>"
            sheets.append("<sheet name=\"표${si + 1}\" sheetId=\"${si + 1}\" r:id=\"rId${si + 1}\"/>")
            rels.append("<Relationship Id=\"rId${si + 1}\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet${si + 1}.xml\"/>")
            ct.append("<Override PartName=\"/xl/worksheets/sheet${si + 1}.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/>")
        }
        val sid = tbls.size + 1
        rels.append("<Relationship Id=\"rId$sid\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles\" Target=\"styles.xml\"/>")
        files["[Content_Types].xml"] = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\"><Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/><Default Extension=\"xml\" ContentType=\"application/xml\"/><Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/><Override PartName=\"/xl/styles.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml\"/>$ct</Types>"
        files["_rels/.rels"] = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\"/></Relationships>"
        files["xl/workbook.xml"] = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\"><sheets>$sheets</sheets></workbook>"
        files["xl/_rels/workbook.xml.rels"] = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">$rels</Relationships>"
        files["xl/styles.xml"] = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><styleSheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"><numFmts count=\"0\"/><fonts count=\"2\"><font><sz val=\"11\"/><name val=\"맑은 고딕\"/></font><font><b/><sz val=\"11\"/><name val=\"맑은 고딕\"/></font></fonts><fills count=\"3\"><fill><patternFill patternType=\"none\"/></fill><fill><patternFill patternType=\"gray125\"/></fill><fill><patternFill patternType=\"solid\"><fgColor rgb=\"FFEDEDED\"/></patternFill></fill></fills><borders count=\"1\"><border/></borders><cellStyleXfs count=\"1\"><xf/></cellStyleXfs><cellXfs count=\"2\"><xf/><xf fontId=\"1\" fillId=\"2\" applyFont=\"1\" applyFill=\"1\"/></cellXfs></styleSheet>"
        return zip(files)
    }

    private fun zip(files: Map<String, String>): ByteArray {
        val bo = ByteArrayOutputStream()
        ZipOutputStream(bo).use { z -> for ((k, v) in files) { z.putNextEntry(ZipEntry(k)); z.write(v.toByteArray(Charsets.UTF_8)); z.closeEntry() } }
        return bo.toByteArray()
    }
}
