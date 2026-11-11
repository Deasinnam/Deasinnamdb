package com.daesinnam.browser;

import java.net.URLDecoder;
import java.util.Locale;

/**
 * 누른 링크·입력한 주소를 이 브라우저가 열 HTTPS 주소로 바꿉니다.
 *  - http:// → https://
 *  - 유튜브 주소(youtu.be, m.youtube.com, 앱 전용 링크 포함) → PC 화면 주소 (app=desktop)
 *  - 그 밖의 앱 전용 링크(intent:, market: 등) → 열지 않음 (null)
 */
public final class WebLinkResolver {
    public static final String YOUTUBE_HOME = "https://www.youtube.com/?app=desktop&persist_app=1";
    private static final String VIDEO_ID = "[A-Za-z0-9_-]{11}";
    private static final String FALLBACK = "S.browser_fallback_url=";

    private WebLinkResolver() {
    }

    private static String decode(String s) {
        try {
            return URLDecoder.decode(s, "UTF-8");
        } catch (Exception e) {
            return null;
        }
    }

    /** 질의에서 app·persist_app을 빼고 PC 화면 표시를 붙입니다 */
    private static String desktopQuery(String query) {
        StringBuilder out = new StringBuilder();
        if (query != null && !query.isEmpty()) {
            for (String pair : query.split("&")) {
                if (pair.isEmpty()) continue;
                String name = decode(pair.split("=", 2)[0]);
                if (name == null) return null;
                if (name.equals("app") || name.equals("persist_app")) continue;
                if (out.length() > 0) out.append('&');
                out.append(pair);
            }
        }
        if (out.length() > 0) out.append('&');
        return out.append("app=desktop&persist_app=1").toString();
    }

    private static boolean isYouTube(String host) {
        if (host == null) return false;
        String h = host.toLowerCase(Locale.ROOT);
        return h.equals("youtube.com") || h.equals("www.youtube.com") || h.equals("m.youtube.com")
                || h.equals("music.youtube.com") || h.equals("youtu.be");
    }

    private static String validatedYouTube(String url) {
        String r = resolve(url);
        UrlPolicy.Parts p = UrlPolicy.parse(r);
        if (p == null || !isYouTube(p.host) || (p.port != -1 && p.port != 443)) return null;
        return r;
    }

    /** intent://…#Intent;…;end — 유튜브로 가는 것만 웹 주소로 바꿉니다 */
    private static String fromIntent(String s) {
        int at = s.indexOf("#Intent;");
        if (at < 7 || !s.endsWith(";end")) return null;
        String target = s.substring(7, at);
        if (!target.startsWith("//")) return null;
        for (String part : s.substring(at + 8, s.length() - 4).split(";")) {
            if (!part.startsWith(FALLBACK)) continue;
            String fallback = decode(part.substring(FALLBACK.length()));
            if (fallback != null && fallback.toLowerCase(Locale.ROOT).startsWith("https://")) {
                String r = validatedYouTube(fallback);
                if (r != null) return r;
            }
        }
        String direct = "https:" + target;
        return UrlPolicy.isAllowed(direct) ? validatedYouTube(direct) : null;
    }

    /** vnd.youtube:<영상 번호>, youtube://… */
    private static String fromYouTubeScheme(String s) {
        String rest = s.substring(s.indexOf(':') + 1);
        if (rest.matches(VIDEO_ID)) return resolve("https://www.youtube.com/watch?v=" + rest);
        if (!rest.startsWith("//")) return null;
        String asWeb = "https:" + rest;
        UrlPolicy.Parts p = UrlPolicy.parse(asWeb);
        if (p != null && isYouTube(p.host)) return validatedYouTube(asWeb);
        String tail = rest.substring(2);
        if (tail.matches(VIDEO_ID)) return resolve("https://www.youtube.com/watch?v=" + tail);
        if (tail.startsWith("watch?")) return resolve("https://www.youtube.com/" + tail);
        return null;
    }

    public static String resolve(String input) {
        if (input == null || input.length() > 16384) return null;
        String s = input.trim();
        if (s.indexOf('\\') >= 0) return null;
        for (int i = 0; i < s.length(); i++) if (Character.isISOControl(s.charAt(i))) return null;
        String lower = s.toLowerCase(Locale.ROOT);
        if (lower.startsWith("intent:")) return fromIntent(s);
        if (lower.startsWith("vnd.youtube:") || lower.startsWith("youtube:")) return fromYouTubeScheme(s);
        if (s.startsWith("//")) s = "https:" + s;
        else if (lower.startsWith("http://")) s = "https://" + s.substring(7);
        UrlPolicy.Parts p = UrlPolicy.parse(s);
        if (p == null) return null;
        String normalized = "https:" + s.substring(s.indexOf(':') + 1);
        if (!isYouTube(p.host) || (p.port != -1 && p.port != 443)) return normalized;

        String host = p.host.toLowerCase(Locale.ROOT);
        String path = p.path.isEmpty() ? "/" : p.path;
        String query = p.query;
        if (host.equals("youtu.be")) {
            String id = path.substring(1);
            if (!id.matches(VIDEO_ID)) return null;
            query = "v=" + id + (query != null && !query.isEmpty() ? "&" + query : "");
            path = "/watch";
        }
        if (host.equals("music.youtube.com")) return normalized;
        String q = desktopQuery(query);
        if (q == null) return null;
        return "https://www.youtube.com" + path + "?" + q + (p.fragment != null ? "#" + p.fragment : "");
    }
}
