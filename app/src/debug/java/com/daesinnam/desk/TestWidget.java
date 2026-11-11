package com.daesinnam.desk;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.util.Log;
import android.widget.RemoteViews;

/** 시험용 빌드 전용 위젯. 누르면 기록을 남기고 글자를 바꿉니다 (자동 점검이 확인). */
public class TestWidget extends AppWidgetProvider {
    private static final String CLICK = "com.daesinnam.desk.TEST_WIDGET_CLICK";
    private static int clicks;

    private static RemoteViews views(Context context) {
        RemoteViews v = new RemoteViews(context.getPackageName(), R.layout.test_widget);
        v.setTextViewText(R.id.tw_text, clicks == 0 ? "점검 위젯" : "눌림 " + clicks + "번");
        Intent i = new Intent(context, TestWidget.class).setAction(CLICK);
        v.setOnClickPendingIntent(R.id.tw_root, PendingIntent.getBroadcast(context, 0, i,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
        return v;
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        manager.updateAppWidget(ids, views(context));
        Log.i("DESK_SELFTEST", "WIDGET-UPDATE ids=" + ids.length);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        if (CLICK.equals(intent.getAction())) {
            clicks++;
            Log.i("DESK_SELFTEST", "WIDGET-CLICK " + clicks);
            AppWidgetManager.getInstance(context).updateAppWidget(new ComponentName(context, TestWidget.class), views(context));
            return;
        }
        super.onReceive(context, intent);
    }
}
