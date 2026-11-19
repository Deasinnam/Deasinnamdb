package com.daesinnam.sseum;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** 휴대폰을 켜거나 덜씀을 업데이트한 뒤, 사용자가 켜 둔 자동 기능이 있으면 덜씀 지킴이를 다시 켬 */
public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context c, Intent i) { GuardService.sync(c); }
}
