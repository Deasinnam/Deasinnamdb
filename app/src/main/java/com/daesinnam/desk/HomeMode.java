package com.daesinnam.desk;

import android.app.role.RoleManager;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.util.Log;

/**
 * 홈 앱 등록 켜고 끄기 (1.6.9).
 *
 * 삼성 DeX(탭 S9 등)는 홈 앱으로 등록된 앱을 "태블릿 홈 화면에서만 사용할 수 있어 DeX에서 실행할 수 없어요"라며 열지 않습니다.
 * 앱 아이콘을 홈 등록이 없는 DexActivity로 바꿔도(1.6.6) 앱 전체를 홈 앱으로 보고 막았습니다.
 * 그래서 홈 등록(.Home 별칭)을 덜누름 데스크가 실제 기본 홈일 때만 켜 둡니다.
 *  - 앱이 켜질 때 · 새 버전으로 덮어 설치될 때: 기본 홈이 아니면 끔
 *  - "기본 홈 앱으로 정하기": 켜고 나서 안드로이드에 기본 홈 요청
 */
final class HomeMode {
    private HomeMode() { }

    static ComponentName alias(Context c) { return new ComponentName(c, "com.daesinnam.desk.Home"); }

    static boolean registered(Context c) {
        int s = c.getPackageManager().getComponentEnabledSetting(alias(c));
        return s != PackageManager.COMPONENT_ENABLED_STATE_DISABLED; // 기본값(설치 때) = 켜짐
    }

    static void set(Context c, boolean on) {
        try {
            if (registered(c) == on) return;
            c.getPackageManager().setComponentEnabledSetting(alias(c),
                    on ? PackageManager.COMPONENT_ENABLED_STATE_ENABLED : PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
                    PackageManager.DONT_KILL_APP);
            Log.i("Desk", "홈 앱 등록 " + (on ? "켬" : "끔 (DeX에서 열 수 있게)"));
        } catch (RuntimeException e) {
            Log.w("Desk", "홈 앱 등록을 바꾸지 못함", e);
        }
    }

    /** 덜누름 데스크가 지금 기본 홈 앱인가 */
    static boolean isDefault(Context c) {
        try {
            if (android.os.Build.VERSION.SDK_INT >= 29) {
                RoleManager rm = c.getSystemService(RoleManager.class);
                if (rm != null && rm.isRoleAvailable(RoleManager.ROLE_HOME)) return rm.isRoleHeld(RoleManager.ROLE_HOME);
            }
            ResolveInfo ri = c.getPackageManager().resolveActivity(new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME),
                    PackageManager.MATCH_DEFAULT_ONLY);
            return ri != null && ri.activityInfo != null && c.getPackageName().equals(ri.activityInfo.packageName);
        } catch (RuntimeException e) {
            return true; // 모르면 건드리지 않음 (홈 화면을 잃지 않게)
        }
    }

    /** 기본 홈이 아니면 홈 등록을 끔 */
    static void tidy(Context c) {
        if (registered(c) && !isDefault(c)) set(c, false);
    }

    /** 새 버전으로 덮어 설치됨 */
    public static final class Updated extends BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (Intent.ACTION_MY_PACKAGE_REPLACED.equals(intent.getAction())) tidy(context);
        }
    }
}
