package com.daesinnam.browser;

import java.util.Locale;

/**
 * 열어도 되는 주소인지 판단합니다: HTTPS만, 사용자 정보(@) 없음, 호스트·포트가 올바름.
 *
 * 주소의 "어디로 가는가"(호스트·포트)는 엄격하게 보고, 경로·질의 부분은 사이트마다 쓰는 글자가
 * 다양하므로(|, {} 등) 막지 않습니다. 제어 문자와 역슬래시는 어디에 있든 거부합니다.
 */
public final class UrlPolicy {
    private UrlPolicy() {
    }

    /** 나눠 본 HTTPS 주소 */
    public static final class Parts {
        public String host;
        public int port = -1;
        /** "/"로 시작하는 경로 (없으면 빈 문자열) */
        public String path = "";
        /** "?" 뒤 (없으면 null) */
        public String query;
        /** "#" 뒤 (없으면 null) */
        public String fragment;
    }

    /** 허용되는 HTTPS 주소면 나눠서 돌려주고, 아니면 null */
    public static Parts parse(String url) {
        if (url == null || url.length() > 16384 || url.indexOf('\\') >= 0) return null;
        for (int i = 0; i < url.length(); i++) {
            char c = url.charAt(i);
            if (Character.isISOControl(c) || Character.isWhitespace(c)) return null;
        }
        if (url.length() < 9 || !url.regionMatches(true, 0, "https://", 0, 8)) return null;
        int end = url.length();
        for (int i = 8; i < url.length(); i++) {
            char c = url.charAt(i);
            if (c == '/' || c == '?' || c == '#') {
                end = i;
                break;
            }
        }
        String authority = url.substring(8, end);
        if (authority.isEmpty() || authority.indexOf('@') >= 0) return null; // 사용자 정보로 호스트를 속이는 주소 차단
        Parts p = new Parts();
        String portText = null;
        if (authority.charAt(0) == '[') { // IPv6
            int close = authority.indexOf(']');
            if (close < 2) return null;
            p.host = authority.substring(0, close + 1);
            for (int i = 1; i < close; i++) {
                char c = authority.charAt(i);
                if (!(Character.digit(c, 16) >= 0 || c == ':' || c == '.')) return null;
            }
            String rest = authority.substring(close + 1);
            if (!rest.isEmpty()) {
                if (rest.charAt(0) != ':') return null;
                portText = rest.substring(1);
            }
        } else {
            int colon = authority.indexOf(':');
            p.host = colon < 0 ? authority : authority.substring(0, colon);
            if (colon >= 0) portText = authority.substring(colon + 1);
            if (p.host.isEmpty() || p.host.charAt(0) == '.' || p.host.charAt(0) == '-') return null;
            for (int i = 0; i < p.host.length(); i++) {
                char c = p.host.charAt(i);
                if (!(Character.isLetterOrDigit(c) || c == '.' || c == '-' || c == '_')) return null;
            }
        }
        if (portText != null && !portText.isEmpty()) {
            if (portText.length() > 5) return null;
            for (int i = 0; i < portText.length(); i++) if (portText.charAt(i) < '0' || portText.charAt(i) > '9') return null;
            p.port = Integer.parseInt(portText);
            if (p.port < 1 || p.port > 65535) return null;
        }
        String rest = url.substring(end);
        int hash = rest.indexOf('#');
        if (hash >= 0) {
            p.fragment = rest.substring(hash + 1);
            rest = rest.substring(0, hash);
        }
        int q = rest.indexOf('?');
        if (q >= 0) {
            p.query = rest.substring(q + 1);
            rest = rest.substring(0, q);
        }
        p.path = rest;
        return p;
    }

    public static boolean isAllowed(String url) {
        return parse(url) != null;
    }

    /** 접속한 곳: https://호스트[:포트] (허용되지 않는 주소면 빈 문자열) */
    public static String origin(String url) {
        Parts p = parse(url);
        if (p == null) return "";
        return "https://" + p.host.toLowerCase(Locale.ROOT) + (p.port != -1 && p.port != 443 ? ":" + p.port : "");
    }
}
