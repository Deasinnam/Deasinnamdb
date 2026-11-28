package com.daesinnam.pc;

import android.app.Activity;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.util.Log;
import android.view.MotionEvent;
import android.widget.EditText;

/** 시험용 빌드에만: 자동 점검이 모니터에 띄우는 입력 칸 (터치패드 누르기·끌기가 닿는지, 폰 키보드 → 모니터 입력 확인) */
public class TestInputActivity extends Activity {
    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        EditText e = new EditText(this);
        e.setHint("점검 입력 칸");
        e.setTextSize(28);
        e.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int a, int c, int d) { }
            @Override public void onTextChanged(CharSequence s, int a, int c, int d) { }
            @Override public void afterTextChanged(Editable s) { Log.i("PC_SELFTEST", "INPUT-NOW [" + s + "] display " + getDisplay().getDisplayId()); }
        });
        setContentView(e);
        e.requestFocus();
        Log.i("PC_SELFTEST", "INPUT-SHOWN display " + getDisplay().getDisplayId());
    }

    @Override
    public boolean dispatchTouchEvent(MotionEvent ev) {
        int a = ev.getActionMasked();
        if (a == MotionEvent.ACTION_DOWN || a == MotionEvent.ACTION_UP || a == MotionEvent.ACTION_CANCEL)
            Log.i("PC_SELFTEST", "TOUCH " + MotionEvent.actionToString(a) + " " + Math.round(ev.getRawX()) + "," + Math.round(ev.getRawY()) + " display " + getDisplay().getDisplayId());
        return super.dispatchTouchEvent(ev);
    }
}
