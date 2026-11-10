package com.daesinnam.work;

import android.app.Application;
import android.os.Build;
import android.webkit.WebView;

/**
 * 사진 편집(:photo)·동영상 편집(:film)은 각자 다른 프로세스에서 돕니다. 큰 편집기가 메모리를 따로 쓰고,
 * 하나가 멈춰도 다른 편집이 같이 닫히지 않게 하려는 것입니다.
 * 한 앱에서 여러 프로세스가 WebView를 쓰려면 프로세스마다 WebView 데이터 폴더를 나눠야 합니다.
 */
public class WorkApp extends Application {
    @Override
    public void onCreate() {
        super.onCreate();
        String p = Build.VERSION.SDK_INT >= 28 ? getProcessName() : null;
        if (p != null) {
            int c = p.indexOf(':');
            if (c >= 0) WebView.setDataDirectorySuffix(p.substring(c + 1));
        }
    }
}
