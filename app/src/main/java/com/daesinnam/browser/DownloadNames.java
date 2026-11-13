package com.daesinnam.browser;

import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.Charset;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 받을 파일의 이름 정하기 (안드로이드에 기대지 않는 순수 자바 → PC에서 바로 점검 가능).
 *
 *  - Content-Disposition의 filename*=UTF-8''... (한글 이름에 흔함)을 먼저 봅니다.
 *  - filename="..."에 UTF-8 글자가 깨져 들어오거나(%EA%B0... 형태 포함) 하면 바로잡습니다.
 *  - 저장할 수 없는 글자를 빼고, 너무 긴 이름은 확장자를 남기고 자릅니다.
 */
public final class DownloadNames {
    private DownloadNames() {}

    private static final Pattern EXT_STAR = Pattern.compile("filename\\*\\s*=\\s*([^';]*)'[^']*'([^;]+)", Pattern.CASE_INSENSITIVE);
    private static final Pattern PLAIN = Pattern.compile("(?:^|;)\\s*filename\\s*=\\s*(\"((?:\\\\.|[^\"\\\\])*)\"|[^;]+)", Pattern.CASE_INSENSITIVE);
    private static final Pattern PERCENT = Pattern.compile("%[0-9A-Fa-f]{2}");
    /** 서버 프로그램 이름이 그대로 붙는 경우(download.php 등): 파일 종류에 맞는 확장자로 바꿉니다 */
    private static final String[] SCRIPT_EXT = {"php", "jsp", "asp", "aspx", "do", "cgi", "action", "bin"};
    private static final int MAX_LEN = 120;

    /** 이름 결정: 서버가 준 이름 → 페이지가 정한 이름(download 속성) → 주소의 마지막 부분 → "download" */
    public static String choose(String disposition, String url, String hint, String extFromMime) {
        String name = fromDisposition(disposition);
        if (blank(name)) name = hint;
        if (blank(name)) name = fromUrl(url);
        name = sanitize(name);
        String ext = extFromMime == null ? null : extFromMime.toLowerCase(Locale.ROOT);
        if (ext != null && !ext.isEmpty() && ext.matches("[a-z0-9]{1,8}")) {
            int dot = name.lastIndexOf('.');
            if (dot <= 0) {
                name = name + "." + ext;
            } else {
                String cur = name.substring(dot + 1).toLowerCase(Locale.ROOT);
                for (String s : SCRIPT_EXT) {
                    if (s.equals(cur) && !s.equals(ext)) {
                        name = name.substring(0, dot) + "." + ext;
                        break;
                    }
                }
            }
        }
        return sanitize(name);
    }

    public static String fromDisposition(String cd) {
        if (blank(cd)) return null;
        Matcher m = EXT_STAR.matcher(cd);
        if (m.find()) {
            String charset = m.group(1).trim();
            Charset cs = StandardCharsets.UTF_8;
            try {
                if (!charset.isEmpty()) cs = Charset.forName(charset);
            } catch (RuntimeException ignored) {
            }
            String v = percentDecode(m.group(2).trim().replaceAll("^\"|\"$", ""), cs);
            if (!blank(v)) return v;
        }
        m = PLAIN.matcher(cd);
        if (m.find()) {
            String v = m.group(2) != null ? m.group(2).replaceAll("\\\\(.)", "$1") : m.group(1).trim();
            v = fixMojibake(v);
            if (PERCENT.matcher(v).find()) {
                String d = percentDecode(v, StandardCharsets.UTF_8);
                if (d != null) v = d;
            }
            if (!blank(v)) return v;
        }
        return null;
    }

    public static String fromUrl(String url) {
        if (blank(url)) return null;
        String lower = url.toLowerCase(Locale.ROOT);
        if (lower.startsWith("data:") || lower.startsWith("blob:")) return null;
        String u = url;
        int cut = u.indexOf('#');
        if (cut >= 0) u = u.substring(0, cut);
        cut = u.indexOf('?');
        if (cut >= 0) u = u.substring(0, cut);
        int scheme = u.indexOf("://");
        if (scheme >= 0) {
            int path = u.indexOf('/', scheme + 3);
            if (path < 0) return null;
            u = u.substring(path);
        }
        int slash = u.lastIndexOf('/');
        String seg = slash >= 0 ? u.substring(slash + 1) : u;
        if (seg.isEmpty()) return null;
        String d = percentDecode(seg, StandardCharsets.UTF_8);
        return d != null ? d : seg;
    }

    public static String sanitize(String in) {
        if (in == null) in = "";
        String n = in;
        int sep = Math.max(n.lastIndexOf('/'), n.lastIndexOf('\\'));
        if (sep >= 0) n = n.substring(sep + 1);
        StringBuilder b = new StringBuilder(n.length());
        for (int i = 0; i < n.length(); i++) {
            char c = n.charAt(i);
            if (c < 0x20 || c == 0x7F || "\\/:*?\"<>|".indexOf(c) >= 0) continue;
            if (c == '\u202E' || c == '\u202D' || c == '\u200E' || c == '\u200F') continue; // 글자 방향을 뒤집어 확장자를 속이는 문자
            b.append(c);
        }
        n = b.toString().trim();
        while (n.startsWith(".")) n = n.substring(1).trim();
        while (n.endsWith(".") || n.endsWith(" ")) n = n.substring(0, n.length() - 1);
        if (n.isEmpty()) n = "download";
        if (n.codePointCount(0, n.length()) > MAX_LEN) {
            int dot = n.lastIndexOf('.');
            String ext = dot > 0 && n.length() - dot <= 10 ? n.substring(dot) : "";
            String base = ext.isEmpty() ? n : n.substring(0, dot);
            int keep = MAX_LEN - ext.length();
            base = base.substring(0, base.offsetByCodePoints(0, Math.min(keep, base.codePointCount(0, base.length()))));
            n = base.trim() + ext;
        }
        return n;
    }

    /** %XX를 바이트로 풀어 문자로 (잘못된 글자가 섞이면 null) */
    static String percentDecode(String s, Charset cs) {
        ByteBuffer buf = ByteBuffer.allocate(s.length() * 4);
        try {
            for (int i = 0; i < s.length(); i++) {
                char c = s.charAt(i);
                if (c == '%' && i + 2 < s.length()) {
                    int hi = Character.digit(s.charAt(i + 1), 16), lo = Character.digit(s.charAt(i + 2), 16);
                    if (hi >= 0 && lo >= 0) {
                        buf.put((byte) (hi * 16 + lo));
                        i += 2;
                        continue;
                    }
                }
                buf.put(String.valueOf(c).getBytes(cs));
            }
            buf.flip();
            return cs.newDecoder().onMalformedInput(CodingErrorAction.REPORT)
                    .onUnmappableCharacter(CodingErrorAction.REPORT).decode(buf).toString();
        } catch (CharacterCodingException | RuntimeException e) {
            return null;
        }
    }

    /** UTF-8 바이트가 한 바이트씩 글자로 들어온 경우("ë¬¸ì" 같은 깨진 이름)를 바로잡습니다 */
    static String fixMojibake(String s) {
        boolean high = false;
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c > 0xFF) return s;
            if (c >= 0x80) high = true;
        }
        if (!high) return s;
        try {
            return StandardCharsets.UTF_8.newDecoder().onMalformedInput(CodingErrorAction.REPORT)
                    .onUnmappableCharacter(CodingErrorAction.REPORT)
                    .decode(ByteBuffer.wrap(s.getBytes(StandardCharsets.ISO_8859_1))).toString();
        } catch (CharacterCodingException e) {
            return s;
        }
    }

    private static boolean blank(String s) {
        return s == null || s.trim().isEmpty();
    }
}
