package com.daesinnam.lords;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.os.Build;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/** 게임 화면(assets/game.html)을 전체 화면 WebView로 띄웁니다. */
public class MainActivity extends Activity {
    private WebView web;

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        web = new WebView(this);
        web.setBackgroundColor(0xFF0B3D6B);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);          // 진행 상황 저장(localStorage)
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(true);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.setWebViewClient(new WebViewClient());
        web.addJavascriptInterface(new Bridge(), "AndroidGame");
        setContentView(web);

        if (state != null) web.restoreState(state);
        else web.loadUrl("file:///android_asset/game.html");
        hideBars();
    }

    private void hideBars() {
        if (Build.VERSION.SDK_INT >= 30) {
            WindowInsetsController c = getWindow().getInsetsController();
            if (c != null) {
                c.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                c.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideBars();
    }

    @SuppressWarnings("deprecation")
    @Override
    public void onBackPressed() {
        // 게임 중이면 일시정지 등 게임이 처리하고, 타이틀 화면이면 앱을 닫습니다.
        web.evaluateJavascript("window.onBack ? window.onBack() : false", v -> {
            if (!"true".equals(v)) finish();
        });
    }

    @Override protected void onPause() { super.onPause(); web.onPause(); }
    @Override protected void onResume() { super.onResume(); web.onResume(); hideBars(); }
    @Override protected void onSaveInstanceState(Bundle out) { super.onSaveInstanceState(out); web.saveState(out); }
    @Override protected void onDestroy() { web.destroy(); super.onDestroy(); }

    private class Bridge {
        @JavascriptInterface
        public void vibrate(int ms) {
            Vibrator v = (Vibrator) getSystemService(VIBRATOR_SERVICE);
            if (v == null || !v.hasVibrator()) return;
            v.vibrate(VibrationEffect.createOneShot(Math.max(1, Math.min(ms, 500)), VibrationEffect.DEFAULT_AMPLITUDE));
        }
    }
}
