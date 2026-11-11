import com.daesinnam.browser.UrlPolicy;
import com.daesinnam.browser.WebLinkResolver;
public class UrlRulesTest {
    static int bad = 0;
    static void eq(String what, Object got, Object want) { boolean ok = want == null ? got == null : want.equals(got); if (!ok) { bad++; } System.out.println((ok ? "ok   " : "FAIL ") + what + " -> " + got + (ok ? "" : "   (want " + want + ")")); }
    public static void main(String[] a) {
        eq("naver", UrlPolicy.isAllowed("https://www.naver.com/"), true);
        eq("http", UrlPolicy.isAllowed("http://www.naver.com/"), false);
        eq("userinfo", UrlPolicy.isAllowed("https://www.naver.com@evil.example/"), false);
        eq("userinfo2", UrlPolicy.isAllowed("https://a:b@evil.example/"), false);
        eq("pipe query", UrlPolicy.isAllowed("https://fonts.googleapis.com/css?family=A|B&x={1}"), true);
        eq("idn", UrlPolicy.isAllowed("https://한글.kr/"), true);
        eq("underscore host", UrlPolicy.isAllowed("https://my_host.example.com/x"), true);
        eq("file", UrlPolicy.isAllowed("file:///sdcard/x"), false);
        eq("port ok", UrlPolicy.isAllowed("https://a.com:8443/x"), true);
        eq("port big", UrlPolicy.isAllowed("https://a.com:99999/"), false);
        eq("port junk", UrlPolicy.isAllowed("https://a.com:80a/"), false);
        eq("backslash", UrlPolicy.isAllowed("https://a.com\\@b.com/"), false);
        eq("space", UrlPolicy.isAllowed("https://a.com/ x"), false);
        eq("empty host", UrlPolicy.isAllowed("https:///x"), false);
        eq("ipv6", UrlPolicy.isAllowed("https://[2001:db8::1]:8443/x"), true);
        eq("about", UrlPolicy.isAllowed("about:blank"), false);
        eq("origin", UrlPolicy.origin("https://WWW.Naver.com:443/a?b#c"), "https://www.naver.com");
        eq("origin port", UrlPolicy.origin("https://a.com:8443/a"), "https://a.com:8443");
        eq("http->https", WebLinkResolver.resolve("http://example.com/a?b=1#c"), "https://example.com/a?b=1#c");
        eq("//", WebLinkResolver.resolve("//example.com/a"), "https://example.com/a");
        eq("HTTPS case", WebLinkResolver.resolve("HTTPS://example.com/a"), "https://example.com/a");
        eq("youtu.be", WebLinkResolver.resolve("https://youtu.be/dQw4w9WgXcQ?t=5"), "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=5&app=desktop&persist_app=1");
        eq("m.youtube", WebLinkResolver.resolve("https://m.youtube.com/watch?v=abc&app=m#t"), "https://www.youtube.com/watch?v=abc&app=desktop&persist_app=1#t");
        eq("yt home", WebLinkResolver.resolve("https://www.youtube.com"), "https://www.youtube.com/?app=desktop&persist_app=1");
        eq("yt stable", WebLinkResolver.resolve(WebLinkResolver.YOUTUBE_HOME), WebLinkResolver.YOUTUBE_HOME);
        eq("yt music", WebLinkResolver.resolve("https://music.youtube.com/watch?v=x"), "https://music.youtube.com/watch?v=x");
        eq("intent yt", WebLinkResolver.resolve("intent://www.youtube.com/watch?v=abcdefghijk#Intent;scheme=https;package=com.google.android.youtube;end"), "https://www.youtube.com/watch?v=abcdefghijk&app=desktop&persist_app=1");
        eq("intent fallback", WebLinkResolver.resolve("intent://x#Intent;scheme=vnd.youtube;S.browser_fallback_url=https%3A%2F%2Fm.youtube.com%2Fwatch%3Fv%3Dabcdefghijk;end"), "https://www.youtube.com/watch?v=abcdefghijk&app=desktop&persist_app=1");
        eq("intent other", WebLinkResolver.resolve("intent://pay.example.com/x#Intent;scheme=https;package=com.bank;end"), null);
        eq("vnd.youtube", WebLinkResolver.resolve("vnd.youtube:dQw4w9WgXcQ"), "https://www.youtube.com/watch?v=dQw4w9WgXcQ&app=desktop&persist_app=1");
        eq("youtube://", WebLinkResolver.resolve("youtube://www.youtube.com/watch?v=dQw4w9WgXcQ"), "https://www.youtube.com/watch?v=dQw4w9WgXcQ&app=desktop&persist_app=1");
        eq("market", WebLinkResolver.resolve("market://details?id=x"), null);
        eq("javascript", WebLinkResolver.resolve("javascript:alert(1)"), null);
        eq("data", WebLinkResolver.resolve("data:text/html,x"), null);
        eq("null", WebLinkResolver.resolve(null), null);
        System.out.println(bad == 0 ? "ALL OK" : "BAD " + bad);
        if (bad != 0) System.exit(1);
    }
}
