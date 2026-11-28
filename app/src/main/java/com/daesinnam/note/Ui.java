package com.daesinnam.note;

import android.content.Context;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.RippleDrawable;
import android.view.Gravity;
import android.view.View;
import android.widget.ImageButton;
import android.widget.LinearLayout;
import android.widget.TextView;

/** 화면 조각 만들기 (XML 없이). 덜누름 노트 색: 어두운 바탕 + 주황 강조 */
final class Ui {
    private Ui() { }

    static final int BG = 0xFF1B1C21, BAR = 0xFF25262C, BAR2 = 0xFF2C2D34, LINE = 0xFF3A3B43;
    static final int TEXT = 0xFFF1F1F4, SUB = 0xFFA6A7B0, ACCENT = 0xFFF08A24, SEL = 0x33F08A24;

    static int dp(Context c, float v) { return Math.round(v * c.getResources().getDisplayMetrics().density); }

    static Drawable round(int color, float radiusPx) {
        GradientDrawable d = new GradientDrawable();
        d.setColor(color);
        d.setCornerRadius(radiusPx);
        return d;
    }

    static Drawable ripple(Context c, int fill, float radiusDp) {
        GradientDrawable mask = new GradientDrawable();
        mask.setColor(Color.WHITE);
        mask.setCornerRadius(dp(c, radiusDp));
        Drawable content = fill == 0 ? null : round(fill, dp(c, radiusDp));
        return new RippleDrawable(ColorStateList.valueOf(0x33FFFFFF), content, mask);
    }

    /** 아이콘 단추 (44dp, 길게 누르면 이름) */
    static ImageButton icon(Context c, int res, String name, View.OnClickListener l) {
        ImageButton b = new ImageButton(c);
        b.setImageResource(res);
        b.setContentDescription(name);
        if (android.os.Build.VERSION.SDK_INT >= 26) b.setTooltipText(name);
        b.setBackground(ripple(c, 0, 10));
        b.setScaleType(android.widget.ImageView.ScaleType.CENTER);
        b.setImageTintList(ColorStateList.valueOf(TEXT));
        b.setOnClickListener(l);
        int s = dp(c, 44);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(s, s);
        lp.setMargins(dp(c, 1), 0, dp(c, 1), 0);
        b.setLayoutParams(lp);
        return b;
    }

    /** 고른 상태 표시 (도구 단추) */
    static void selected(View v, boolean on) {
        Context c = v.getContext();
        v.setBackground(on ? ripple(c, SEL, 10) : ripple(c, 0, 10));
        if (v instanceof ImageButton) ((ImageButton) v).setImageTintList(ColorStateList.valueOf(on ? ACCENT : TEXT));
    }

    static TextView text(Context c, String s, float sp, int color) {
        TextView t = new TextView(c);
        t.setText(s);
        t.setTextSize(sp);
        t.setTextColor(color);
        t.setGravity(Gravity.CENTER_VERTICAL);
        return t;
    }

    /** 글자 단추 (filled=true면 주황 바탕) */
    static TextView button(Context c, String s, boolean filled, View.OnClickListener l) {
        TextView t = text(c, s, 15, filled ? 0xFF1B1203 : TEXT);
        t.setGravity(Gravity.CENTER);
        t.setPadding(dp(c, 16), 0, dp(c, 16), 0);
        t.setBackground(ripple(c, filled ? ACCENT : BAR2, 10));
        t.setOnClickListener(l);
        t.setMinHeight(dp(c, 40));
        t.getPaint().setFakeBoldText(filled);
        return t;
    }

    /** 색 동그라미 */
    static View swatch(Context c, int color, boolean on, View.OnClickListener l) {
        View v = new View(c);
        GradientDrawable d = new GradientDrawable();
        d.setShape(GradientDrawable.OVAL);
        d.setColor(color | 0xFF000000);
        d.setStroke(dp(c, on ? 3 : 1), on ? ACCENT : 0x55FFFFFF);
        v.setBackground(d);
        v.setOnClickListener(l);
        int s = dp(c, on ? 30 : 26);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(s, s);
        lp.gravity = Gravity.CENTER_VERTICAL;
        lp.setMargins(dp(c, 5), 0, dp(c, 5), 0);
        v.setLayoutParams(lp);
        return v;
    }

    /** 굵기 점 */
    static View thickness(Context c, float dotDp, boolean on, View.OnClickListener l) {
        LinearLayout box = new LinearLayout(c);
        box.setGravity(Gravity.CENTER);
        box.setBackground(on ? ripple(c, SEL, 10) : ripple(c, 0, 10));
        View dot = new View(c);
        GradientDrawable d = new GradientDrawable();
        d.setShape(GradientDrawable.OVAL);
        d.setColor(on ? ACCENT : TEXT);
        dot.setBackground(d);
        int s = dp(c, dotDp);
        box.addView(dot, new LinearLayout.LayoutParams(s, s));
        box.setOnClickListener(l);
        int b = dp(c, 40);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(b, b);
        lp.gravity = Gravity.CENTER_VERTICAL;
        box.setLayoutParams(lp);
        return box;
    }

    static View divider(Context c) {
        View v = new View(c);
        v.setBackgroundColor(LINE);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(dp(c, 1), dp(c, 26));
        lp.gravity = Gravity.CENTER_VERTICAL;
        lp.setMargins(dp(c, 8), 0, dp(c, 8), 0);
        v.setLayoutParams(lp);
        return v;
    }
}
