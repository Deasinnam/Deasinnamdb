package com.daesinnam.desk;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 셸 명령 출력에서 열린 창(작업) 목록을 읽습니다. 안드로이드에 기대지 않는 순수 자바라 따로 시험할 수 있습니다.
 *  1) am stack list  — "RootTask id=.. displayId=N" 아래 "taskId=12: 패키지/클래스 bounds=[l,t][r,b] ... visible=true"
 *  2) dumpsys activity activities — "Display #N", "* Task{.. #12 .. visible=true ..}", "mBounds=Rect(l, t - r, b)",
 *     "ActivityRecord{.. u0 패키지/클래스 t12}" (삼성 기기 등 1)이 안 될 때)
 */
final class TaskParser {
    static final class T {
        int task, display = -1, l, t, r, b;
        String pkg, cls;
        boolean visible;
        boolean hasBounds;
    }

    private static final Pattern ROOT = Pattern.compile("RootTask id=\\d+ .*?displayId=(\\d+)");
    private static final Pattern TASK = Pattern.compile(
            "taskId=(\\d+): ([^/\\s]+)/(\\S+) bounds=\\[(-?\\d+),(-?\\d+)\\]\\[(-?\\d+),(-?\\d+)\\].*?visible=(true|false)");

    static List<T> stackList(String out) {
        List<T> list = new ArrayList<>();
        if (out == null) return list;
        int disp = -1;
        for (String line : out.split("\n")) {
            Matcher r = ROOT.matcher(line);
            if (r.find()) { disp = Integer.parseInt(r.group(1)); continue; }
            Matcher m = TASK.matcher(line);
            if (!m.find()) continue;
            T t = new T();
            t.task = Integer.parseInt(m.group(1)); t.display = disp; t.pkg = m.group(2); t.cls = full(t.pkg, m.group(3));
            t.l = Integer.parseInt(m.group(4)); t.t = Integer.parseInt(m.group(5)); t.r = Integer.parseInt(m.group(6)); t.b = Integer.parseInt(m.group(7));
            t.visible = "true".equals(m.group(8)); t.hasBounds = true;
            list.add(t);
        }
        return list;
    }

    private static final Pattern DISPLAY = Pattern.compile("^\\s*Display #(\\d+)");
    private static final Pattern DTASK = Pattern.compile("\\* Task\\{[0-9a-f]+ #(\\d+) .*?type=(\\w+)(.*)\\}");
    private static final Pattern BOUNDS = Pattern.compile("mBounds=Rect\\((-?\\d+), (-?\\d+) - (-?\\d+), (-?\\d+)\\)");
    private static final Pattern REC = Pattern.compile("ActivityRecord\\{[0-9a-f]+ u\\d+ ([^/\\s]+)/(\\S+) t(\\d+)");

    static List<T> dumpsys(String out) {
        List<T> list = new ArrayList<>();
        if (out == null) return list;
        int disp = -1;
        T cur = null;
        for (String line : out.split("\n")) {
            Matcher d = DISPLAY.matcher(line);
            if (d.find()) { disp = Integer.parseInt(d.group(1)); cur = null; continue; }
            Matcher m = DTASK.matcher(line);
            if (m.find()) {
                cur = null;
                if (!"standard".equals(m.group(2))) continue; // 홈 · 최근 앱 등은 빼기
                cur = new T();
                cur.task = Integer.parseInt(m.group(1)); cur.display = disp;
                cur.visible = m.group(3).contains("visible=true");
                list.add(cur);
                continue;
            }
            if (cur == null) continue;
            Matcher b = BOUNDS.matcher(line);
            if (b.find() && !cur.hasBounds) {
                cur.l = Integer.parseInt(b.group(1)); cur.t = Integer.parseInt(b.group(2)); cur.r = Integer.parseInt(b.group(3)); cur.b = Integer.parseInt(b.group(4));
                cur.hasBounds = true;
            }
            Matcher a = REC.matcher(line);
            if (a.find() && cur.pkg == null && Integer.parseInt(a.group(3)) == cur.task) { cur.pkg = a.group(1); cur.cls = full(cur.pkg, a.group(2)); }
        }
        list.removeIf(t -> t.pkg == null || !t.hasBounds);
        return list;
    }

    private static String full(String pkg, String cls) { return cls.startsWith(".") ? pkg + cls : cls; }
}
