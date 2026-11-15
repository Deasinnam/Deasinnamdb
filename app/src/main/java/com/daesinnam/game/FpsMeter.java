package com.daesinnam.game;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * FPS 계산 (안드로이드 없이도 시험할 수 있게 순수 자바).
 *
 * Shizuku(셸 권한)로 아래 명령의 출력을 받아 셉니다.
 *  1) 앞에 뜬 앱:   dumpsys activity activities | grep -m3 -E "topResumedActivity|mResumedActivity"
 *  2) 그 앱의 화면 층: dumpsys SurfaceFlinger --list   (패키지 이름이 들어간 줄)
 *  3) 층마다 최근 프레임 시각: dumpsys SurfaceFlinger --latency "층 이름"
 *     첫 줄은 화면 주기(ns), 다음 줄들은 "원한 시각  실제로 화면에 나온 시각  준비된 시각"(ns).
 * 실제로 나온 시각이 가장 최근 것에서 1초 안에 든 프레임 수 = FPS. 새 프레임이 없으면 0.
 * (안드로이드 14부터 셸에서 "service call SurfaceFlinger 1013"이 막혀 이 방식을 씁니다.)
 */
final class FpsMeter {
    static final String MARK = "@@LAYER ";
    private static final Pattern PKG = Pattern.compile("(?:topResumedActivity|mResumedActivity)[^\\n]*?\\s([a-zA-Z][\\w.]*)/");
    private static final long SEC = 1_000_000_000L;

    private final Map<String, Long> lastNewest = new HashMap<>();

    /** 1)의 출력에서 앞에 뜬 앱 패키지. 없으면 null */
    static String foregroundPackage(String out) {
        if (out == null) return null;
        Matcher m = PKG.matcher(out);
        return m.find() ? m.group(1) : null;
    }

    /** 2)의 출력에서 그 앱의 화면 층 이름들 (SurfaceView를 앞에, 최대 6개) */
    static List<String> layersOf(String list, String pkg) {
        List<String> sv = new ArrayList<>(), other = new ArrayList<>();
        if (list == null || pkg == null) return sv;
        for (String raw : list.split("\n")) {
            String l = raw.trim();
            if (l.isEmpty() || l.contains("'") || l.contains("\"")) continue;
            if (!(l.contains(pkg + "/") || l.contains("[" + pkg) || l.startsWith(pkg))) continue;
            if (l.contains("Background for") || l.startsWith("Bounds for") || l.contains("ActivityRecord")) continue;
            if (l.contains("SurfaceView")) sv.add(l); else other.add(l);
        }
        sv.addAll(other);
        return sv.size() > 6 ? new ArrayList<>(sv.subList(0, 6)) : sv;
    }

    /** 3)을 한 번에 돌리는 셸 명령 (층마다 MARK 줄을 먼저 찍음) */
    static String latencyCommand(List<String> layers) {
        StringBuilder sb = new StringBuilder();
        for (String l : layers) {
            sb.append("echo '").append(MARK).append(l).append("'; dumpsys SurfaceFlinger --latency '").append(l).append("'; ");
        }
        return sb.toString();
    }

    /**
     * 3)의 출력으로 FPS. 층마다 계산해 가장 큰 값 (게임 화면이 보통 가장 많이 그림).
     * 지난번과 비교해 새 프레임이 없는 층은 0. 읽을 수 있는 층이 하나도 없으면 -1.
     */
    int fps(String out) {
        if (out == null) return -1;
        int best = -1;
        String layer = null;
        List<Long> times = new ArrayList<>();
        for (String raw : (out + "\n" + MARK).split("\n")) {
            String line = raw.trim();
            if (line.startsWith(MARK)) {
                if (layer != null) best = Math.max(best, layerFps(layer, times));
                layer = line.substring(MARK.length());
                times.clear();
                continue;
            }
            if (layer == null || line.isEmpty()) continue;
            String[] p = line.split("\\s+");
            if (p.length < 2) continue;   // 첫 줄(화면 주기) 등
            try {
                long actual = Long.parseLong(p[1]);
                if (actual > 0 && actual < Long.MAX_VALUE / 2) times.add(actual);
            } catch (NumberFormatException ignored) { }
        }
        return best;
    }

    private int layerFps(String layer, List<Long> times) {
        if (times.isEmpty()) return -1;
        long newest = 0;
        for (long t : times) newest = Math.max(newest, t);
        Long prev = lastNewest.put(layer, newest);
        if (prev != null && newest <= prev) return 0;   // 지난 1초 동안 새 프레임 없음
        // 1초 안의 프레임들: (개수 - 1) 간격 ÷ 걸린 시간
        int n = 0;
        long oldest = newest;
        for (long t : times) if (t > newest - SEC) { n++; oldest = Math.min(oldest, t); }
        if (n < 2 || newest == oldest) return n;
        return (int) Math.round((n - 1) * (double) SEC / (newest - oldest));
    }
}
