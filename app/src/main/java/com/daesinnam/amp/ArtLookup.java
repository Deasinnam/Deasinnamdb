package com.daesinnam.amp;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * 재생 앱이 앨범 아트를 넘겨주지 않을 때 인터넷에서 찾아옵니다.
 * 1) Spotify 곡 ID가 있으면 Spotify 공개 oEmbed로 해당 곡의 커버를 가져오고
 * 2) 없으면 곡 제목과 아티스트로 iTunes 검색에서 커버를 찾습니다.
 */
final class ArtLookup {

    interface Callback { void done(String url); }

    private static final ExecutorService EX = Executors.newSingleThreadExecutor();
    private static final Map<String, String> CACHE = Collections.synchronizedMap(new LinkedHashMap<String, String>(64, .75f, true) {
        @Override
        protected boolean removeEldestEntry(Map.Entry<String, String> e) {
            return size() > 200;
        }
    });

    private ArtLookup() {}

    static void find(final String spotifyId, final String title, final String artist, final Callback cb) {
        final String key = nz(spotifyId) + "|" + nz(title) + "|" + nz(artist);
        if (CACHE.containsKey(key)) {
            cb.done(CACHE.get(key));
            return;
        }
        EX.execute(() -> {
            String url = null;
            try {
                if (spotifyId != null && !spotifyId.isEmpty()) url = spotify(spotifyId);
            } catch (Exception ignored) {}
            if (url == null) {
                try {
                    url = itunes(title, artist);
                } catch (Exception ignored) {}
            }
            CACHE.put(key, url);
            cb.done(url);
        });
    }

    private static String spotify(String id) throws Exception {
        String tid = id;
        int i = tid.lastIndexOf(':');
        if (tid.startsWith("spotify:") && i >= 0) tid = tid.substring(i + 1);
        String u = "https://open.spotify.com/oembed?url=" + URLEncoder.encode("https://open.spotify.com/track/" + tid, "UTF-8");
        String thumb = new JSONObject(get(u)).optString("thumbnail_url", "");
        return thumb.isEmpty() ? null : thumb;
    }

    private static String clean(String s) {
        return nz(s)
                .replaceAll("(?i)\\s*[(\\[][^)\\]]*(feat|ft\\.|remaster|official|lyrics|audio|video|live|mv|m/v)[^)\\]]*[)\\]]", "")
                .replaceAll("(?i)\\s+-\\s+.*remaster.*$", "")
                .trim();
    }

    private static String itunes(String title, String artist) throws Exception {
        String t = clean(title), a = clean(artist).replaceAll("(?i)\\s*-\\s*topic$", "");
        if (t.isEmpty()) return null;
        String term = (a + " " + t).trim();
        for (String country : new String[]{"KR", "US"}) {
            String u = "https://itunes.apple.com/search?media=music&entity=song&limit=8&country=" + country
                    + "&term=" + URLEncoder.encode(term, "UTF-8");
            JSONArray rs = new JSONObject(get(u)).optJSONArray("results");
            if (rs == null || rs.length() == 0) continue;
            JSONObject best = rs.getJSONObject(0);
            String al = a.toLowerCase(Locale.ROOT);
            for (int k = 0; k < rs.length(); k++) {
                JSONObject r = rs.getJSONObject(k);
                String ra = r.optString("artistName", "").toLowerCase(Locale.ROOT);
                if (!al.isEmpty() && (ra.contains(al) || al.contains(ra))) {
                    best = r;
                    break;
                }
            }
            String art = best.optString("artworkUrl100", "");
            if (!art.isEmpty()) return art.replace("100x100bb", "600x600bb");
        }
        return null;
    }

    private static String get(String u) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(u).openConnection();
        c.setConnectTimeout(6000);
        c.setReadTimeout(8000);
        c.setRequestProperty("User-Agent", "DaesinnamAmp/2.2 (Android)");
        try (InputStream in = c.getInputStream()) {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            int n;
            while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
            return out.toString("UTF-8");
        } finally {
            c.disconnect();
        }
    }

    private static String nz(String s) {
        return s == null ? "" : s;
    }
}
