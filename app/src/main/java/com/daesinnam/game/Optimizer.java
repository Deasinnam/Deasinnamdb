package com.daesinnam.game;

import android.app.ActivityManager;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.os.BatteryManager;
import android.os.Build;
import android.os.PowerManager;
import android.view.Display;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * 기기 맞춤 게임 최적화: 칩·메모리·화면·발열·배터리를 보고 알맞은 설정값(단계)을 고릅니다.
 *
 * 단계(0 가볍게 / 1 균형 / 2 고성능)마다 FPS 상한, 게임 해상도, 안드로이드 게임 모드, 녹화 화질이 정해집니다.
 * - 녹화 화질·방해 금지는 지금 바로 적용됩니다.
 * - FPS 상한·해상도·게임 모드는 다른 앱 설정이라 Shizuku 권한이 있어야 적용됩니다
 *   (안드로이드 `cmd game mode` / `cmd game set`). 그 명령은 shellCommands()가 만듭니다.
 */
final class Optimizer {
    static final String[] LEVEL_NAMES = {"가볍게", "균형", "고성능"};

    private final Context ctx;
    private final SharedPreferences prefs;

    Optimizer(Context ctx, SharedPreferences prefs) {
        this.ctx = ctx;
        this.prefs = prefs;
    }

    // ---------- 기기 알아보기 ----------

    /** 알려진 칩: 최신 고성능이면 2, 한 세대 전 고성능·중상급이면 1, 모르면 메모리로 판단(-1) */
    static int chipTier(String soc) {
        if (soc == null) return -1;
        String s = soc.toUpperCase();
        // 퀄컴 스냅드래곤 8 Elite·8 Gen 3·8 Gen 2, 삼성 엑시노스 2400·2500, 미디어텍 디멘시티 9300·9400
        if (s.matches(".*(SM8850|SM8750|SM8650|SM8550|S5E9945|S5E9955|MT6989|MT6991).*")) return 2;
        // 스냅드래곤 8+ Gen 1·8 Gen 1·7+ Gen 2·7 Gen 3, 엑시노스 2200·1480·1580, 디멘시티 8x00·9200
        if (s.matches(".*(SM8475|SM8450|SM7475|SM7550|S5E9925|S5E8835|S5E8845|MT6985|MT6896|MT6897|MT6895).*")) return 1;
        return -1;
    }

    static String friendlyModel() {
        String m = Build.MODEL == null ? "" : Build.MODEL.toUpperCase();
        if (m.startsWith("SM-F966")) return "갤럭시 Z 폴드7";
        if (m.startsWith("SM-F956")) return "갤럭시 Z 폴드6";
        if (m.startsWith("SM-F946")) return "갤럭시 Z 폴드5";
        if (m.startsWith("SM-F936")) return "갤럭시 Z 폴드4";
        if (m.startsWith("SM-F766")) return "갤럭시 Z 플립7";
        if (m.startsWith("SM-F741")) return "갤럭시 Z 플립6";
        return Build.MANUFACTURER + " " + Build.MODEL;
    }

    JSONObject device(Display display) throws Exception {
        JSONObject d = new JSONObject();
        d.put("model", friendlyModel());
        d.put("code", Build.MODEL);
        String soc = Build.VERSION.SDK_INT >= 31 ? (Build.SOC_MANUFACTURER + " " + Build.SOC_MODEL) : Build.HARDWARE;
        d.put("soc", soc.trim());
        ActivityManager.MemoryInfo mi = new ActivityManager.MemoryInfo();
        ctx.getSystemService(ActivityManager.class).getMemoryInfo(mi);
        int ramGb = (int) Math.round(mi.totalMem / 1024.0 / 1024 / 1024);
        d.put("ramGb", ramGb);
        d.put("cores", Runtime.getRuntime().availableProcessors());
        int maxHz = 60;
        if (display != null) for (Display.Mode m : display.getSupportedModes()) maxHz = Math.max(maxHz, Math.round(m.getRefreshRate()));
        d.put("maxHz", maxHz);
        PowerManager pm = ctx.getSystemService(PowerManager.class);
        d.put("thermal", pm.getCurrentThermalStatus());
        d.put("powerSave", pm.isPowerSaveMode());
        Intent bat = ctx.registerReceiver(null, new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
        if (bat != null) {
            d.put("batteryTemp", bat.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, 0) / 10.0);
            int level = bat.getIntExtra(BatteryManager.EXTRA_LEVEL, -1), scale = bat.getIntExtra(BatteryManager.EXTRA_SCALE, 100);
            d.put("battery", level < 0 ? -1 : level * 100 / Math.max(scale, 1));
            int plugged = bat.getIntExtra(BatteryManager.EXTRA_PLUGGED, 0);
            d.put("charging", plugged != 0);
        }
        return d;
    }

    // ---------- 추천 ----------

    /** 기기 성능만으로 정한 기본 단계 */
    static int baseLevel(JSONObject d) {
        int tier = chipTier(d.optString("soc"));
        int ram = d.optInt("ramGb");
        if (tier < 0) tier = ram >= 12 ? 2 : ram >= 8 ? 1 : 0;   // 칩을 모르면 메모리로
        if (tier == 2 && ram < 8) tier = 1;                      // 칩이 좋아도 메모리가 적으면 한 단계 낮춤
        return tier;
    }

    /** 지금 상태(발열·배터리·절전)까지 본 추천 단계와 그 이유 */
    static JSONObject recommend(JSONObject d) throws Exception {
        int level = baseLevel(d);
        JSONArray why = new JSONArray();
        why.put("기기 성능 기준: " + LEVEL_NAMES[level]);
        boolean down = false;
        if (d.optInt("thermal") >= PowerManager.THERMAL_STATUS_MODERATE) { why.put("기기가 뜨거워 한 단계 낮춤"); down = true; }
        else if (d.optDouble("batteryTemp", 0) >= 42) { why.put("배터리 온도가 높아(" + d.optDouble("batteryTemp") + "°C) 한 단계 낮춤"); down = true; }
        if (!down && d.optBoolean("powerSave")) { why.put("절전 모드라 한 단계 낮춤"); down = true; }
        if (!down && !d.optBoolean("charging") && d.optInt("battery", 100) >= 0 && d.optInt("battery", 100) < 20) { why.put("배터리가 20% 아래라 한 단계 낮춤"); down = true; }
        if (down) level = Math.max(0, level - 1);
        JSONObject r = new JSONObject();
        r.put("level", level);
        r.put("why", why);
        r.put("settings", settings(level, d.optInt("maxHz", 60)));
        return r;
    }

    /** 단계별 설정값 */
    static JSONObject settings(int level, int maxHz) throws Exception {
        JSONObject s = new JSONObject();
        int fps;
        float scale;
        String mode;
        int recSide, recFps;
        switch (level) {
            case 2: fps = Math.min(maxHz, 120); scale = 1.0f; mode = "performance"; recSide = 1920; recFps = 60; break;
            case 1: fps = Math.min(maxHz, 60); scale = 0.85f; mode = "standard"; recSide = 1920; recFps = 30; break;
            default: fps = Math.min(maxHz, 60); scale = 0.7f; mode = "battery"; recSide = 1280; recFps = 30; break;
        }
        s.put("fps", fps);
        s.put("scale", scale);
        s.put("mode", mode);
        s.put("recSide", recSide);
        s.put("recFps", recFps);
        return s;
    }

    // ---------- 저장·적용 ----------

    /** 저장된 선택: -1 = 자동 추천. 게임별 값이 있으면 그것을 씀 */
    int chosenLevel(String pkg) {
        if (pkg != null && prefs.contains("level." + pkg)) return prefs.getInt("level." + pkg, -1);
        return prefs.getInt("level", -1);
    }

    void choose(String pkg, int level) {
        String key = pkg == null || pkg.isEmpty() ? "level" : "level." + pkg;
        if (pkg != null && !pkg.isEmpty() && level == -2) prefs.edit().remove(key).apply(); // 게임별 값 지우기 → 기본 따름
        else prefs.edit().putInt(key, level).apply();
    }

    /** 실제로 쓸 단계 (자동이면 지금 추천값) */
    int effectiveLevel(String pkg, Display display) {
        int lv = chosenLevel(pkg);
        if (lv >= 0) return lv;
        try { return recommend(device(display)).getInt("level"); } catch (Exception e) { return 1; }
    }

    /** 녹화 화질을 단계에 맞춤 (RecordService가 읽음) */
    void applyRecording(int level, int maxHz) {
        try {
            JSONObject s = settings(level, maxHz);
            prefs.edit().putInt("recSide", s.getInt("recSide")).putInt("recFps", s.getInt("recFps")).apply();
        } catch (Exception ignored) { }
    }

    /** Shizuku로 실행할 명령 (안드로이드 13+ 게임 개입: 해상도·FPS, 12+ 게임 모드) */
    static JSONArray shellCommands(String pkg, JSONObject s) throws Exception {
        JSONArray c = new JSONArray();
        String mode = s.getString("mode");
        c.put("cmd game mode " + mode + " " + pkg);
        if (Build.VERSION.SDK_INT >= 33) {
            int modeId = "performance".equals(mode) ? 2 : "battery".equals(mode) ? 3 : 1;
            if (modeId != 1) c.put("cmd game set --mode " + modeId + " --downscale " + s.getDouble("scale") + " --fps " + s.getInt("fps") + " " + pkg);
        }
        c.put("settings put system peak_refresh_rate " + s.getInt("fps"));
        return c;
    }
}
