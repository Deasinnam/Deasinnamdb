package com.daesinnam.amp;

import android.media.audiofx.AudioEffect;
import android.media.audiofx.DynamicsProcessing;
import android.media.audiofx.Equalizer;
import android.os.Build;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 다른 앱(YouTube Music, Spotify 등)의 소리에 10밴드 EQ를 적용합니다.
 * 1) 재생 앱이 오디오 효과 세션을 알려 주면 그 세션에 직접 붙고,
 * 2) 알려 주지 않으면 출력 전체(세션 0)에 붙어 봅니다. 기기마다 지원 여부가 다릅니다.
 */
final class ExternalEq {

    static final ExternalEq I = new ExternalEq();

    private static final float[] CENTER = {60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000};
    private static final float[] CUTOFF = {101, 230, 431, 775, 1732, 4243, 8485, 12961, 14967, 20000};
    private static final int PRIORITY = 100;

    private final Map<Integer, String> sessions = new LinkedHashMap<>();
    private final Map<Integer, AudioEffect> effects = new HashMap<>();
    private boolean active = false;
    private boolean on = true;
    private float pre = 0f;
    private float[] gains = new float[10];
    private String status = "꺼짐";
    // 내 음악(표준 플레이어)의 오디오 세션에 붙는 EQ
    private int localSession = 0;
    private AudioEffect localEffect;

    private ExternalEq() {}

    static String friendly(String pkg) {
        if (pkg == null || pkg.isEmpty()) return "알 수 없는 앱";
        switch (pkg) {
            case "com.spotify.music": return "Spotify";
            case "com.google.android.apps.youtube.music": return "YouTube Music";
            case "com.google.android.youtube": return "YouTube";
            case "com.iloen.melon": return "멜론";
            case "com.ktmusic.geniemusic": return "지니뮤직";
            case "com.sec.android.app.music": return "삼성 뮤직";
            default: return pkg;
        }
    }

    synchronized void sessionOpened(int session, String pkg) {
        if (session <= 0) return;
        sessions.put(session, pkg == null ? "" : pkg);
        rebuild();
    }

    synchronized void sessionClosed(int session) {
        sessions.remove(session);
        rebuild();
    }

    synchronized void setActive(boolean a) {
        active = a;
        rebuild();
    }

    synchronized void set(boolean enabled, float preamp, float[] g) {
        on = enabled;
        pre = preamp;
        if (g != null && g.length == 10) gains = g.clone();
        for (AudioEffect e : effects.values()) apply(e);
        if (localEffect != null) apply(localEffect);
    }

    /** 표준 플레이어가 만들어지거나 없어질 때 호출 (0이면 해제) */
    synchronized void setLocalSession(int session) {
        if (session == localSession) return;
        if (localEffect != null) {
            release(localEffect);
            localEffect = null;
        }
        localSession = session;
        if (session > 0) {
            localEffect = create(session);
            if (localEffect != null) apply(localEffect);
        }
    }

    synchronized boolean localActive() {
        return localEffect != null;
    }

    synchronized String status() {
        return status;
    }

    private void rebuild() {
        Set<Integer> want = new LinkedHashSet<>();
        if (active) want.addAll(sessions.keySet());

        Iterator<Map.Entry<Integer, AudioEffect>> it = effects.entrySet().iterator();
        while (it.hasNext()) {
            Map.Entry<Integer, AudioEffect> en = it.next();
            boolean keep = want.contains(en.getKey()) || (en.getKey() == 0 && active && want.isEmpty());
            if (!keep) {
                release(en.getValue());
                it.remove();
            }
        }
        for (int s : want) {
            if (!effects.containsKey(s)) {
                AudioEffect e = create(s);
                if (e != null) {
                    effects.put(s, e);
                    apply(e);
                }
            }
        }
        boolean appAttached = false;
        for (int s : effects.keySet()) if (s != 0) appAttached = true;
        if (active && !appAttached && !effects.containsKey(0)) {
            AudioEffect e = create(0);
            if (e != null) {
                effects.put(0, e);
                apply(e);
            }
        } else if (appAttached && effects.containsKey(0)) {
            release(effects.remove(0));
        }

        if (!active) status = "꺼짐";
        else if (effects.isEmpty()) status = "이 기기는 외부 앱 EQ를 지원하지 않아요";
        else if (effects.containsKey(0)) status = "전역 EQ (기기 전체 소리)";
        else {
            List<String> names = new ArrayList<>();
            for (int s : effects.keySet()) {
                String n = friendly(sessions.get(s));
                if (!names.contains(n)) names.add(n);
            }
            status = "연결됨: " + String.join(", ", names);
        }
    }

    private AudioEffect create(int session) {
        if (Build.VERSION.SDK_INT >= 28) {
            try {
                DynamicsProcessing.Config cfg = new DynamicsProcessing.Config.Builder(
                        DynamicsProcessing.VARIANT_FAVOR_FREQUENCY_RESOLUTION,
                        2, true, 10, false, 0, false, 0, true).build();
                DynamicsProcessing dp = new DynamicsProcessing(PRIORITY, session, cfg);
                dp.setLimiterAllChannelsTo(new DynamicsProcessing.Limiter(true, true, 0, 1f, 60f, 10f, -1f, 0f));
                dp.setEnabled(true);
                return dp;
            } catch (Throwable ignored) {
                // 일부 기기는 DynamicsProcessing을 지원하지 않아 기본 Equalizer로 넘어갑니다.
            }
        }
        try {
            Equalizer eq = new Equalizer(PRIORITY, session);
            eq.setEnabled(true);
            return eq;
        } catch (Throwable ignored) {
            return null;
        }
    }

    private float gainAt(float hz) {
        if (hz <= CENTER[0]) return gains[0];
        if (hz >= CENTER[9]) return gains[9];
        double lf = Math.log(hz);
        for (int i = 0; i < 9; i++) {
            if (hz <= CENTER[i + 1]) {
                double a = Math.log(CENTER[i]), b = Math.log(CENTER[i + 1]);
                double t = (lf - a) / (b - a);
                return (float) (gains[i] * (1 - t) + gains[i + 1] * t);
            }
        }
        return gains[9];
    }

    private void apply(AudioEffect e) {
        try {
            if (Build.VERSION.SDK_INT >= 28 && e instanceof DynamicsProcessing) {
                DynamicsProcessing dp = (DynamicsProcessing) e;
                for (int i = 0; i < 10; i++) {
                    dp.setPreEqBandAllChannelsTo(i, new DynamicsProcessing.EqBand(true, CUTOFF[i], on ? gains[i] : 0f));
                }
                dp.setInputGainAllChannelsTo(on ? pre : 0f);
            } else if (e instanceof Equalizer) {
                Equalizer eq = (Equalizer) e;
                short n = eq.getNumberOfBands();
                short[] range = eq.getBandLevelRange();
                for (short b = 0; b < n; b++) {
                    float hz = eq.getCenterFreq(b) / 1000f;
                    int mb = on ? Math.round((gainAt(hz) + pre) * 100) : 0;
                    mb = Math.max(range[0], Math.min(range[1], mb));
                    eq.setBandLevel(b, (short) mb);
                }
            }
        } catch (Throwable ignored) {
            // 다른 앱이 더 높은 우선순위로 효과를 가져가면 설정이 실패할 수 있습니다.
        }
    }

    private void release(AudioEffect e) {
        if (e == null) return;
        try {
            e.setEnabled(false);
        } catch (Throwable ignored) {}
        try {
            e.release();
        } catch (Throwable ignored) {}
    }
}
