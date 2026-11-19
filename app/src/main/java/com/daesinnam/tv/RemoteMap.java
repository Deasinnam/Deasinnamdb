package com.daesinnam.tv;

import android.content.Context;
import android.content.SharedPreferences;
import android.view.InputDevice;
import android.view.KeyEvent;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Iterator;
import java.util.Locale;

/**
 * 리모컨 맞춤 단추 (기본: 미테르 MITER 블루투스 리모컨 MIT_BTR02 / RM1).
 * 리모컨이 보내는 키(KEYCODE_…)를 덜누름 TV 동작으로 바꿉니다.
 * upVol/downVol = 평소 위/아래, 볼륨 모드에서는 소리 키우기/줄이기. mode = 두 모드 바꾸기.
 * 동작: left · right · up · down · ok · back · play · prev · next · volUp · volDown · mute · settings · tvhome · apps · sys(그대로 두기)
 */
final class RemoteMap {
    static final String DEF_DEV = "miter";
    /** • 단추: + − 를 볼륨으로 쓰는 중 (덜누름 TV와 다른 앱이 함께 씀) */
    static volatile boolean volMode;

    /** 미테르 기본값: 설명서 기준 단추 기능을 TV 홈에 맞게 */
    static JSONObject preset() {
        JSONObject m = new JSONObject();
        try {
            // < > (짧게) 이전/다음 쪽 → 왼쪽/오른쪽 고르기
            m.put("KEYCODE_DPAD_LEFT", "left").put("KEYCODE_DPAD_RIGHT", "right");
            m.put("KEYCODE_PAGE_UP", "left").put("KEYCODE_PAGE_DOWN", "right");
            // < > (길게) 이전/다음 곡 → 이전/다음 서비스
            m.put("KEYCODE_MEDIA_PREVIOUS", "prev").put("KEYCODE_MEDIA_NEXT", "next");
            // + − 위/아래 고르기 (• 를 누르면 볼륨 모드로 바뀜)
            m.put("KEYCODE_VOLUME_UP", "upVol").put("KEYCODE_VOLUME_DOWN", "downVol");
            m.put("KEYCODE_DPAD_UP", "up").put("KEYCODE_DPAD_DOWN", "down");
            // ▶/II → 고른 것 열기
            m.put("KEYCODE_MEDIA_PLAY_PAUSE", "ok").put("KEYCODE_MEDIA_PLAY", "ok").put("KEYCODE_ENTER", "ok").put("KEYCODE_DPAD_CENTER", "ok");
            // • (새로 고침) → + − 상하 ↔ 볼륨 바꾸기, ↩ → 뒤로
            m.put("KEYCODE_F5", "mode").put("KEYCODE_REFRESH", "mode");
            m.put("KEYCODE_BACK", "back").put("KEYCODE_ESCAPE", "back");
        } catch (JSONException ignored) { }
        return m;
    }

    static SharedPreferences p(Context c) { return c.getSharedPreferences("tv", Context.MODE_PRIVATE); }

    static boolean on(Context c) { return p(c).getBoolean("rmOn", true); }
    static String dev(Context c) { return p(c).getString("rmDev", DEF_DEV); }
    static boolean homeToTv(Context c) { return p(c).getBoolean("rmHome", true); }

    static JSONObject map(Context c) {
        String s = p(c).getString("rmMap", null);
        if (s != null) try {
            JSONObject m = new JSONObject(s);
            if (p(c).getInt("rmV", 1) < 2) {
                // 0.6에서 맞춘 단추: + − 는 상하(볼륨 모드), • 는 모드 바꾸기로
                for (Iterator<String> it = m.keys(); it.hasNext(); ) {
                    String k = it.next(), v = m.optString(k);
                    if (v.equals("volUp")) m.put(k, "upVol"); else if (v.equals("volDown")) m.put(k, "downVol"); else if (v.equals("settings")) m.put(k, "mode");
                }
                p(c).edit().putString("rmMap", m.toString()).putInt("rmV", 2).apply();
            }
            return m;
        } catch (JSONException ignored) { }
        return preset();
    }

    /** 이 키를 보낸 장치가 맞춤 리모컨인지 (이름에 rmDev가 들어 있으면) */
    static boolean fromRemote(Context c, KeyEvent e) {
        InputDevice d = e.getDevice();
        if (d == null || d.isVirtual()) return false;
        String n = d.getName();
        String want = dev(c).toLowerCase(Locale.ROOT).trim();
        return n != null && !want.isEmpty() && n.toLowerCase(Locale.ROOT).contains(want);
    }

    /** 맞춤 동작 (없으면 null) */
    static String action(Context c, KeyEvent e) {
        if (!on(c) || !fromRemote(c, e)) return null;
        String a = map(c).optString(KeyEvent.keyCodeToString(e.getKeyCode()), null);
        return a == null || a.isEmpty() || a.equals("sys") ? null : a;
    }

    /** 지금 연결된 맞춤 리모컨 이름 (없으면 "") */
    static String connected(Context c) {
        String want = dev(c).toLowerCase(Locale.ROOT).trim();
        if (want.isEmpty()) return "";
        for (int id : InputDevice.getDeviceIds()) {
            InputDevice d = InputDevice.getDevice(id);
            if (d != null && !d.isVirtual() && d.getName() != null && d.getName().toLowerCase(Locale.ROOT).contains(want)) return d.getName();
        }
        return "";
    }

    static String json(Context c) {
        try {
            JSONObject o = new JSONObject().put("on", on(c)).put("dev", dev(c)).put("home", homeToTv(c))
                    .put("map", map(c)).put("connected", connected(c)).put("custom", p(c).contains("rmMap"));
            return o.toString();
        } catch (JSONException e) { return "{}"; }
    }

    /** 화면에서 바꾼 설정 저장 ({on, dev, home, map | reset}) */
    static void save(Context c, String js) {
        try {
            JSONObject o = new JSONObject(js);
            SharedPreferences.Editor ed = p(c).edit();
            if (o.has("on")) ed.putBoolean("rmOn", o.getBoolean("on"));
            if (o.has("dev")) ed.putString("rmDev", o.getString("dev"));
            if (o.has("home")) ed.putBoolean("rmHome", o.getBoolean("home"));
            if (o.optBoolean("reset")) ed.remove("rmMap");
            else if (o.has("map")) {
                JSONObject m = o.getJSONObject("map"), clean = new JSONObject();
                for (Iterator<String> it = m.keys(); it.hasNext(); ) { String k = it.next(); if (k.startsWith("KEYCODE_")) clean.put(k, m.getString(k)); }
                ed.putString("rmMap", clean.toString());
            }
            ed.apply();
        } catch (JSONException ignored) { }
    }
}
