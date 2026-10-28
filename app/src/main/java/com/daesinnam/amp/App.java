package com.daesinnam.amp;

import android.app.Application;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.media.audiofx.AudioEffect;
import android.os.Build;

/** 앱이 살아 있는 동안 다른 재생 앱이 보내는 "오디오 효과 세션 열림/닫힘" 알림을 받습니다. */
public class App extends Application {

    @Override
    public void onCreate() {
        super.onCreate();
        BroadcastReceiver rx = new BroadcastReceiver() {
            @Override
            public void onReceive(Context c, Intent i) {
                int session = i.getIntExtra(AudioEffect.EXTRA_AUDIO_SESSION, AudioEffect.ERROR_BAD_VALUE);
                String pkg = i.getStringExtra(AudioEffect.EXTRA_PACKAGE_NAME);
                if (pkg != null && pkg.equals(getPackageName())) return;
                if (AudioEffect.ACTION_OPEN_AUDIO_EFFECT_CONTROL_SESSION.equals(i.getAction())) {
                    ExternalEq.I.sessionOpened(session, pkg);
                } else {
                    ExternalEq.I.sessionClosed(session);
                }
            }
        };
        IntentFilter f = new IntentFilter();
        f.addAction(AudioEffect.ACTION_OPEN_AUDIO_EFFECT_CONTROL_SESSION);
        f.addAction(AudioEffect.ACTION_CLOSE_AUDIO_EFFECT_CONTROL_SESSION);
        if (Build.VERSION.SDK_INT >= 33) registerReceiver(rx, f, Context.RECEIVER_EXPORTED);
        else registerReceiver(rx, f);

        BroadcastReceiver spotify = new BroadcastReceiver() {
            @Override
            public void onReceive(Context c, Intent i) {
                SpotifyInfo.onBroadcast(i);
            }
        };
        IntentFilter sf = new IntentFilter();
        sf.addAction(SpotifyInfo.META);
        sf.addAction(SpotifyInfo.STATE);
        if (Build.VERSION.SDK_INT >= 33) registerReceiver(spotify, sf, Context.RECEIVER_EXPORTED);
        else registerReceiver(spotify, sf);
    }
}
