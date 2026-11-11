package com.daesinnam.desk;

import android.content.Context;
import android.graphics.Rect;
import android.view.InputDevice;
import android.view.MotionEvent;
import android.webkit.WebView;

import java.util.ArrayList;
import java.util.List;

/**
 * 바탕화면 화면(WebView). 배경이 투명하고, 그 아래에 위젯(안드로이드 뷰)이 깔립니다.
 *
 * 위젯이 보이는 자리(= 위젯 자리이면서 창·메뉴·아이콘으로 덮이지 않은 곳)를 누르면
 * 이 화면이 받지 않고 흘려보내, 아래에 있는 위젯이 누름을 받게 합니다.
 */
final class PassWebView extends WebView {
    private final List<Rect> widgets = new ArrayList<>();
    private final List<Rect> blockers = new ArrayList<>();
    private boolean blockAll;

    PassWebView(Context context) {
        super(context);
    }

    /** 화면이 알려 준 위젯 자리와 그 위를 덮는 것들 (이 뷰 기준 픽셀) */
    void setRegions(List<Rect> widgetRects, List<Rect> blockerRects, boolean blockEverything) {
        widgets.clear();
        widgets.addAll(widgetRects);
        blockers.clear();
        blockers.addAll(blockerRects);
        blockAll = blockEverything;
    }

    private boolean passes(float fx, float fy) {
        if (blockAll || widgets.isEmpty()) return false;
        int x = (int) fx, y = (int) fy;
        boolean onWidget = false;
        for (Rect r : widgets) {
            if (r.contains(x, y)) {
                onWidget = true;
                break;
            }
        }
        if (!onWidget) return false;
        for (Rect r : blockers) if (r.contains(x, y)) return false;
        return true;
    }

    @Override
    public boolean dispatchTouchEvent(MotionEvent ev) {
        // 누르기 시작한 곳이 위젯이면 이번 누름 전체를 아래로 넘깁니다
        if (ev.getActionMasked() == MotionEvent.ACTION_DOWN && passes(ev.getX(), ev.getY())) return false;
        return super.dispatchTouchEvent(ev);
    }

    @Override
    public boolean dispatchGenericMotionEvent(MotionEvent ev) {
        // 마우스 휠 등
        if (ev.isFromSource(InputDevice.SOURCE_CLASS_POINTER) && passes(ev.getX(), ev.getY())) return false;
        return super.dispatchGenericMotionEvent(ev);
    }

    @Override
    protected boolean dispatchHoverEvent(MotionEvent ev) {
        if (passes(ev.getX(), ev.getY())) return false;
        return super.dispatchHoverEvent(ev);
    }
}
