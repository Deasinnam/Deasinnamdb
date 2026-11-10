package com.daesinnam.work;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.ViewConfiguration;
import android.widget.FrameLayout;
import android.widget.TextView;

/**
 * 편집 화면 위에 떠 있는 "홈" 버튼. 누르면 덜누름 워크 첫 화면으로 갑니다.
 * 편집기는 각자 따로 된 작업(문서·사진·동영상)으로 남아 있어, 첫 화면에서 다시 고르면 하던 그대로 돌아옵니다.
 *
 * 편집기 메뉴를 가리지 않게 손가락으로 끌어 옮길 수 있고(놓으면 가까운 옆 가장자리에 붙음),
 * 옮긴 자리는 편집기마다 기억합니다.
 */
final class HomeButton {
    private HomeButton() {}

    @SuppressLint("ClickableViewAccessibility")
    static void attach(Activity activity, FrameLayout root, String key) {
        float dp = activity.getResources().getDisplayMetrics().density;
        int size = Math.round(46 * dp);
        int margin = Math.round(10 * dp);
        SharedPreferences prefs = activity.getSharedPreferences("home_button", Activity.MODE_PRIVATE);

        TextView b = new TextView(activity);
        b.setText("홈");
        b.setTextColor(Color.WHITE);
        b.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14);
        b.setTypeface(Typeface.DEFAULT_BOLD);
        b.setGravity(Gravity.CENTER);
        GradientDrawable bg = new GradientDrawable();
        bg.setShape(GradientDrawable.OVAL);
        bg.setColor(0xD9111111);
        bg.setStroke(Math.round(1.5f * dp), 0x66FFFFFF);
        b.setBackground(bg);
        b.setElevation(8 * dp);
        b.setContentDescription("덜누름 워크 첫 화면으로");
        b.setFocusable(true);

        FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(size, size);
        lp.gravity = Gravity.TOP | Gravity.START;
        root.addView(b, lp);

        // 기본 자리: 오른쪽 가장자리, 화면 높이의 60% 지점
        root.post(() -> {
            int w = root.getWidth() - root.getPaddingLeft() - root.getPaddingRight();
            int h = root.getHeight() - root.getPaddingTop() - root.getPaddingBottom();
            boolean right = prefs.getBoolean(key + ".right", true);
            float yRatio = prefs.getFloat(key + ".y", 0.6f);
            b.setX(root.getPaddingLeft() + (right ? w - size - margin : margin));
            b.setY(root.getPaddingTop() + clamp(yRatio * h - size / 2f, margin, h - size - margin));
        });

        int slop = ViewConfiguration.get(activity).getScaledTouchSlop();
        float[] start = new float[4]; // 손가락 x, y, 버튼 x, y
        boolean[] dragging = {false};
        b.setOnTouchListener((v, e) -> {
            switch (e.getActionMasked()) {
                case MotionEvent.ACTION_DOWN:
                    start[0] = e.getRawX(); start[1] = e.getRawY(); start[2] = v.getX(); start[3] = v.getY();
                    dragging[0] = false;
                    v.animate().scaleX(0.92f).scaleY(0.92f).setDuration(80).start();
                    return true;
                case MotionEvent.ACTION_MOVE: {
                    float dx = e.getRawX() - start[0], dy = e.getRawY() - start[1];
                    if (!dragging[0] && Math.hypot(dx, dy) > slop) dragging[0] = true;
                    if (dragging[0]) {
                        int left = root.getPaddingLeft(), top = root.getPaddingTop();
                        int right = root.getWidth() - root.getPaddingRight() - size;
                        int bottom = root.getHeight() - root.getPaddingBottom() - size;
                        v.setX(clamp(start[2] + dx, left, right));
                        v.setY(clamp(start[3] + dy, top, bottom));
                    }
                    return true;
                }
                case MotionEvent.ACTION_UP:
                    v.animate().scaleX(1f).scaleY(1f).setDuration(80).start();
                    if (dragging[0]) {
                        // 가까운 옆 가장자리에 붙이고 자리 기억
                        int w = root.getWidth() - root.getPaddingLeft() - root.getPaddingRight();
                        int h = root.getHeight() - root.getPaddingTop() - root.getPaddingBottom();
                        boolean toRight = v.getX() + size / 2f > root.getPaddingLeft() + w / 2f;
                        float x = root.getPaddingLeft() + (toRight ? w - size - margin : margin);
                        v.animate().x(x).setDuration(160).start();
                        float yRatio = (v.getY() - root.getPaddingTop() + size / 2f) / Math.max(1, h);
                        prefs.edit().putBoolean(key + ".right", toRight).putFloat(key + ".y", yRatio).apply();
                    } else {
                        v.performClick();
                    }
                    return true;
                case MotionEvent.ACTION_CANCEL:
                    v.animate().scaleX(1f).scaleY(1f).setDuration(80).start();
                    return true;
                default:
                    return false;
            }
        });
        b.setOnClickListener(v -> goHome(activity));
    }

    /** 첫 화면을 앞으로 (편집기는 닫지 않음) */
    static void goHome(Activity activity) {
        Intent i = new Intent(activity, HomeActivity.class)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        activity.startActivity(i);
    }

    private static float clamp(float v, float lo, float hi) {
        return Math.max(lo, Math.min(hi, v));
    }
}
