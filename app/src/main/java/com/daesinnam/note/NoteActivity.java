package com.daesinnam.note;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.TextUtils;
import android.util.Log;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.Menu;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.HorizontalScrollView;
import android.widget.ImageButton;
import android.widget.LinearLayout;
import android.widget.PopupMenu;
import android.widget.TextView;
import android.widget.Toast;

import java.io.OutputStream;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** 필기 화면: 위 줄(목록 · 이름 · 되돌리기 · 쪽), 도구 줄(펜 · 형광펜 · 지우개 · 색 · 굵기), 쪽 */
public class NoteActivity extends Activity implements InkView.Listener {
    static final String TAG = "Note";
    private static final int REQ_PNG = 11, REQ_PDF = 12;

    static final int[] PEN_COLORS = {0xFF1A1A1A, 0xFF1E5EFF, 0xFFE53935, 0xFF2E9D4F, 0xFF7B4DFF, 0xFFF08A24};
    static final int[] MARKER_COLORS = {0xFFFFE14D, 0xFF8CF08C, 0xFFFF8AD8, 0xFF7FD3FF, 0xFFFFB061};
    static final float[] PEN_W = {2.5f, 4f, 7f};
    static final float[] MARKER_W = {14f, 22f, 34f};

    private final Handler main = new Handler(Looper.getMainLooper());
    private final ExecutorService bg = Executors.newSingleThreadExecutor();
    private final ExecutorService pdfThread = Executors.newSingleThreadExecutor();
    private Model.Note note;
    private Pdf pdf;
    private InkView ink;
    private TextView titleView, pageLabel;
    private ImageButton undoB, redoB, penB, markerB, eraserB;
    private LinearLayout optionRow;
    private boolean dirty;
    private android.content.SharedPreferences prefs;

    private final Runnable saveSoon = this::saveNow;

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        prefs = getSharedPreferences("tools", MODE_PRIVATE);
        String id = getIntent().getStringExtra("id");
        try {
            note = Store.load(this, id);
        } catch (Exception e) {
            Toast.makeText(this, "노트를 열지 못했어요", Toast.LENGTH_LONG).show();
            Log.w(TAG, "load", e);
            finish();
            return;
        }
        if (note.hasPdf) {
            pdf = new Pdf(Store.pdf(this, note.id));
            if (!pdf.ok()) Toast.makeText(this, "원본 PDF를 열지 못해 필기만 보여요", Toast.LENGTH_LONG).show();
        }

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Ui.BG);
        root.addView(topBar(), new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, Ui.dp(this, 52)));
        root.addView(toolBar(), new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, Ui.dp(this, 52)));

        ink = new InkView(this);
        ink.note = note;
        ink.pdf = pdf != null && pdf.ok() ? pdf : null;
        ink.bg = pdfThread;
        ink.listener = this;
        ink.page = note.lastPage;
        ink.penSeen = prefs.getBoolean("penSeen", false);
        ink.penOnly = prefs.getBoolean("penOnly", ink.penSeen);
        ink.tool = prefs.getInt("tool", Model.PEN);
        ink.penColor = prefs.getInt("penColor", PEN_COLORS[0]);
        ink.markerColor = prefs.getInt("markerColor", MARKER_COLORS[0]);
        ink.penWidth = prefs.getFloat("penWidth", PEN_W[1]);
        ink.markerWidth = prefs.getFloat("markerWidth", MARKER_W[1]);
        root.addView(ink, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1));
        setContentView(root);
        ink.requestFocus();
        refreshTools();
        onPageChanged();
        onInkChanged0();

        if (BuildConfig.DEBUG && getIntent().getBooleanExtra("note.selftest", false)) main.postDelayed(() -> new SelfTest(this).run(), 1500);
    }

    // ================= 위 줄 =================

    private View topBar() {
        LinearLayout bar = new LinearLayout(this);
        bar.setOrientation(LinearLayout.HORIZONTAL);
        bar.setGravity(Gravity.CENTER_VERTICAL);
        bar.setBackgroundColor(Ui.BAR);
        bar.setPadding(Ui.dp(this, 4), 0, Ui.dp(this, 4), 0);
        bar.addView(Ui.icon(this, R.drawable.ic_back, "노트 목록", v -> finish()));
        titleView = Ui.text(this, note.title, 17, Ui.TEXT);
        titleView.setSingleLine(true);
        titleView.setEllipsize(TextUtils.TruncateAt.END);
        titleView.setPadding(Ui.dp(this, 8), 0, Ui.dp(this, 8), 0);
        titleView.setBackground(Ui.ripple(this, 0, 8));
        titleView.setOnClickListener(v -> rename());
        LinearLayout.LayoutParams tl = new LinearLayout.LayoutParams(0, Ui.dp(this, 40), 1);
        bar.addView(titleView, tl);
        undoB = Ui.icon(this, R.drawable.ic_undo, "되돌리기 (Ctrl+Z)", v -> ink.undo());
        redoB = Ui.icon(this, R.drawable.ic_redo, "다시 하기 (Ctrl+Y)", v -> ink.redo());
        bar.addView(undoB);
        bar.addView(redoB);
        bar.addView(Ui.divider(this));
        bar.addView(Ui.icon(this, R.drawable.ic_prev, "앞 쪽", v -> ink.setPage(ink.page - 1)));
        pageLabel = Ui.text(this, "1 / 1", 14, Ui.SUB);
        pageLabel.setGravity(Gravity.CENTER);
        pageLabel.setMinWidth(Ui.dp(this, 52));
        pageLabel.setBackground(Ui.ripple(this, 0, 8));
        pageLabel.setOnClickListener(v -> goToPage());
        bar.addView(pageLabel, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, Ui.dp(this, 40)));
        bar.addView(Ui.icon(this, R.drawable.ic_next, "다음 쪽", v -> ink.setPage(ink.page + 1)));
        bar.addView(Ui.icon(this, R.drawable.ic_addpage, "쪽 추가 (다음에)", v -> addPage()));
        bar.addView(Ui.icon(this, R.drawable.ic_more, "더 보기", this::more));
        return bar;
    }

    // ================= 도구 줄 =================

    private View toolBar() {
        HorizontalScrollView sc = new HorizontalScrollView(this);
        sc.setHorizontalScrollBarEnabled(false);
        sc.setBackgroundColor(Ui.BAR2);
        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setGravity(Gravity.CENTER_VERTICAL);
        row.setPadding(Ui.dp(this, 6), 0, Ui.dp(this, 6), 0);
        penB = Ui.icon(this, R.drawable.ic_pen, "펜 (P)", v -> setTool(Model.PEN));
        markerB = Ui.icon(this, R.drawable.ic_marker, "형광펜 (H)", v -> setTool(Model.MARKER));
        eraserB = Ui.icon(this, R.drawable.ic_eraser, "지우개 (E) — S펜 버튼을 누른 채 써도 지워져요", v -> setTool(InkView.ERASER));
        row.addView(penB);
        row.addView(markerB);
        row.addView(eraserB);
        row.addView(Ui.divider(this));
        optionRow = new LinearLayout(this);
        optionRow.setOrientation(LinearLayout.HORIZONTAL);
        optionRow.setGravity(Gravity.CENTER_VERTICAL);
        row.addView(optionRow, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.MATCH_PARENT));
        sc.addView(row, new ViewGroup.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.MATCH_PARENT));
        return sc;
    }

    private void setTool(int t) {
        ink.tool = t;
        prefs.edit().putInt("tool", t).apply();
        refreshTools();
    }

    /** 도구에 맞는 색 · 굵기 단추 */
    private void refreshTools() {
        Ui.selected(penB, ink.tool == Model.PEN);
        Ui.selected(markerB, ink.tool == Model.MARKER);
        Ui.selected(eraserB, ink.tool == InkView.ERASER);
        optionRow.removeAllViews();
        if (ink.tool == InkView.ERASER) {
            TextView t = Ui.text(this, "닿은 획을 통째로 지워요 · S펜 버튼을 누른 채 쓰면 언제든 지우개", 13, Ui.SUB);
            t.setPadding(Ui.dp(this, 6), 0, Ui.dp(this, 10), 0);
            optionRow.addView(t, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.MATCH_PARENT));
            TextView clear = Ui.button(this, "이 쪽 모두 지우기", false, v -> confirmClear());
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, Ui.dp(this, 36));
            lp.gravity = Gravity.CENTER_VERTICAL;
            optionRow.addView(clear, lp);
            return;
        }
        boolean pen = ink.tool == Model.PEN;
        int[] colors = pen ? PEN_COLORS : MARKER_COLORS;
        int curColor = pen ? ink.penColor : ink.markerColor;
        for (int c : colors) {
            optionRow.addView(Ui.swatch(this, c, c == curColor, v -> {
                if (pen) { ink.penColor = c; prefs.edit().putInt("penColor", c).apply(); }
                else { ink.markerColor = c; prefs.edit().putInt("markerColor", c).apply(); }
                refreshTools();
            }));
        }
        optionRow.addView(Ui.divider(this));
        float[] ws = pen ? PEN_W : MARKER_W;
        float curW = pen ? ink.penWidth : ink.markerWidth;
        float[] dots = {6, 10, 15};
        for (int i = 0; i < ws.length; i++) {
            final float w = ws[i];
            optionRow.addView(Ui.thickness(this, dots[i], Math.abs(w - curW) < 0.01f, v -> {
                if (pen) { ink.penWidth = w; prefs.edit().putFloat("penWidth", w).apply(); }
                else { ink.markerWidth = w; prefs.edit().putFloat("markerWidth", w).apply(); }
                refreshTools();
            }));
        }
    }

    // ================= InkView 알림 =================

    @Override
    public void onInkChanged() {
        dirty = true;
        note.modified = System.currentTimeMillis();
        main.removeCallbacks(saveSoon);
        main.postDelayed(saveSoon, 1500);
        onInkChanged0();
    }

    private void onInkChanged0() {
        undoB.setEnabled(ink.canUndo());
        undoB.setAlpha(ink.canUndo() ? 1f : 0.35f);
        redoB.setEnabled(ink.canRedo());
        redoB.setAlpha(ink.canRedo() ? 1f : 0.35f);
    }

    @Override
    public void onPageChanged() {
        pageLabel.setText((ink.page + 1) + " / " + note.pages.size());
        dirty = true;
    }

    @Override
    public void onPenSeen() {
        prefs.edit().putBoolean("penSeen", true).putBoolean("penOnly", true).apply();
        Toast.makeText(this, "S펜을 찾았어요. 이제 손가락은 화면 옮기기 · 확대만 해요 (손바닥이 닿아도 안 써져요)", Toast.LENGTH_LONG).show();
    }

    // ================= 쪽 =================

    private void addPage() {
        Model.Page curP = ink.cur();
        String paper = curP.pdf >= 0 ? prefs.getString("paper", Model.LINED) : curP.paper;
        note.pages.add(ink.page + 1, Model.Page.blank(paper));
        ink.setPage(ink.page + 1);
        onInkChanged();
    }

    private void goToPage() {
        if (note.pages.size() < 2) return;
        String[] items = new String[note.pages.size()];
        for (int i = 0; i < items.length; i++) items[i] = (i + 1) + "쪽" + (note.pages.get(i).pdf >= 0 ? " (PDF)" : "");
        new AlertDialog.Builder(this, android.R.style.Theme_DeviceDefault_Dialog_Alert)
                .setTitle("쪽으로 가기").setItems(items, (d, w) -> ink.setPage(w)).show();
    }

    private void deletePage() {
        if (note.pages.size() <= 1) { Toast.makeText(this, "쪽이 하나뿐이라 지울 수 없어요", Toast.LENGTH_SHORT).show(); return; }
        new AlertDialog.Builder(this, android.R.style.Theme_DeviceDefault_Dialog_Alert)
                .setTitle((ink.page + 1) + "쪽을 지울까요?").setMessage("이 쪽의 필기도 함께 지워지고 되돌릴 수 없어요.")
                .setPositiveButton("지우기", (d, w) -> {
                    Model.Page p = note.pages.remove(ink.page);
                    ink.forget(p);
                    ink.setPage(Math.min(ink.page, note.pages.size() - 1));
                    onInkChanged();
                }).setNegativeButton("취소", null).show();
    }

    private void confirmClear() {
        if (ink.strokeCount() == 0) return;
        new AlertDialog.Builder(this, android.R.style.Theme_DeviceDefault_Dialog_Alert)
                .setTitle("이 쪽의 필기를 모두 지울까요?").setMessage("되돌리기로 다시 살릴 수 있어요.")
                .setPositiveButton("모두 지우기", (d, w) -> ink.clearPage()).setNegativeButton("취소", null).show();
    }

    // ================= 더 보기 =================

    private void more(View anchor) {
        PopupMenu m = new PopupMenu(this, anchor);
        Menu mm = m.getMenu();
        boolean pdfPage = ink.cur().pdf >= 0;
        if (!pdfPage) {
            mm.add(0, 1, 0, "종이: 줄");
            mm.add(0, 2, 0, "종이: 모눈");
            mm.add(0, 3, 0, "종이: 점");
            mm.add(0, 4, 0, "종이: 무지");
        }
        mm.add(0, 10, 1, "펜으로만 쓰기 (손가락은 옮기기 · 확대)").setCheckable(true).setChecked(ink.penOnly);
        mm.add(0, 11, 1, "쪽 맞춤 (확대 풀기)");
        mm.add(0, 20, 2, "이 쪽을 그림(PNG)으로 저장");
        mm.add(0, 21, 2, "노트 전체를 PDF로 내보내기");
        mm.add(0, 30, 3, "이름 바꾸기");
        mm.add(0, 31, 3, "이 쪽 지우기");
        m.setOnMenuItemClickListener(it -> {
            int id = it.getItemId();
            if (id >= 1 && id <= 4) {
                String paper = id == 1 ? Model.LINED : id == 2 ? Model.GRID : id == 3 ? Model.DOT : Model.PLAIN;
                ink.cur().paper = paper;
                prefs.edit().putString("paper", paper).apply();
                ink.invalidate();
                onInkChanged();
            } else if (id == 10) {
                ink.penOnly = !ink.penOnly;
                prefs.edit().putBoolean("penOnly", ink.penOnly).apply();
                Toast.makeText(this, ink.penOnly ? "펜으로만 써요. 손가락은 옮기기 · 확대" : "손가락으로도 써요. 두 손가락으로 옮기기 · 확대", Toast.LENGTH_SHORT).show();
            } else if (id == 11) ink.fit();
            else if (id == 20) create(REQ_PNG, "image/png", note.title + " " + (ink.page + 1) + "쪽.png");
            else if (id == 21) create(REQ_PDF, "application/pdf", note.title + ".pdf");
            else if (id == 30) rename();
            else if (id == 31) deletePage();
            return true;
        });
        m.show();
    }

    private void rename() {
        EditText e = new EditText(this);
        e.setText(note.title);
        e.setSelectAllOnFocus(true);
        e.setSingleLine(true);
        LinearLayout box = new LinearLayout(this);
        box.setPadding(Ui.dp(this, 20), Ui.dp(this, 8), Ui.dp(this, 20), 0);
        box.addView(e, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        new AlertDialog.Builder(this, android.R.style.Theme_DeviceDefault_Dialog_Alert)
                .setTitle("노트 이름").setView(box)
                .setPositiveButton("바꾸기", (d, w) -> {
                    String t = e.getText().toString().trim();
                    if (t.isEmpty()) return;
                    note.title = t;
                    titleView.setText(t);
                    onInkChanged();
                }).setNegativeButton("취소", null).show();
    }

    // ================= 내보내기 =================

    private void create(int req, String type, String name) {
        Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType(type)
                .putExtra(Intent.EXTRA_TITLE, name.replaceAll("[\\\\/:*?\"<>|]", " "));
        try { startActivityForResult(i, req); }
        catch (Exception e) { Toast.makeText(this, "파일 저장 창을 열 수 없어요", Toast.LENGTH_LONG).show(); }
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        super.onActivityResult(req, res, data);
        if (res != RESULT_OK || data == null || data.getData() == null) return;
        Uri uri = data.getData();
        final Model.Note snap = note.snapshot();
        final int pg = ink.page;
        Toast.makeText(this, "저장하는 중…", Toast.LENGTH_SHORT).show();
        bg.execute(() -> {
            String msg;
            try (OutputStream o = getContentResolver().openOutputStream(uri, "wt")) {
                if (o == null) throw new Exception("파일을 열 수 없어요");
                if (req == REQ_PNG) Exporter.png(snap.pages.get(pg), ink.pdf, o);
                else Exporter.pdf(snap, ink.pdf, o);
                msg = req == REQ_PNG ? "그림으로 저장했어요" : "PDF로 내보냈어요 (" + snap.pages.size() + "쪽)";
            } catch (Throwable t) {
                Log.w(TAG, "export", t);
                msg = "저장하지 못했어요: " + t.getMessage();
            }
            final String m = msg;
            main.post(() -> Toast.makeText(this, m, Toast.LENGTH_LONG).show());
        });
    }

    // ================= 저장 =================

    void saveNow() {
        main.removeCallbacks(saveSoon);
        if (!dirty) return;
        dirty = false;
        final Model.Note snap = note.snapshot();
        bg.execute(() -> {
            try { Store.save(this, snap); } catch (Exception e) { Log.w(TAG, "save", e); }
        });
    }

    /** 자동 점검: 바로 저장하고 끝날 때까지 기다림 */
    void saveBlocking() throws Exception {
        main.removeCallbacks(saveSoon);
        dirty = false;
        Store.save(this, note.snapshot());
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (note == null) return;
        prefs.edit().putBoolean("penOnly", ink.penOnly).apply();
        // 목록으로 돌아가면 바로 새 그림 · 쪽 수가 보이게, 나갈 때는 여기서 곧바로 저장 (작은 그림이라 금방 끝남)
        main.removeCallbacks(saveSoon);
        dirty = false;
        Model.Note snap = note.snapshot();
        try { Store.save(this, snap); } catch (Exception e) { Log.w(TAG, "save", e); }
        Exporter.thumb(snap, ink.pdf, Store.thumb(this, note.id));
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        bg.execute(() -> { if (pdf != null) pdf.close(); });
        bg.shutdown();
        pdfThread.shutdown();
    }

    // ================= 키보드 (DeX · 키보드 커버) =================

    @Override
    public boolean onKeyDown(int code, KeyEvent e) {
        if (e.isCtrlPressed()) {
            if (code == KeyEvent.KEYCODE_Z) { if (e.isShiftPressed()) ink.redo(); else ink.undo(); return true; }
            if (code == KeyEvent.KEYCODE_Y) { ink.redo(); return true; }
            if (code == KeyEvent.KEYCODE_S) { dirty = true; saveNow(); Toast.makeText(this, "저장했어요", Toast.LENGTH_SHORT).show(); return true; }
            if (code == KeyEvent.KEYCODE_0) { ink.fit(); return true; }
        }
        switch (code) {
            case KeyEvent.KEYCODE_PAGE_DOWN: case KeyEvent.KEYCODE_DPAD_RIGHT: ink.setPage(ink.page + 1); return true;
            case KeyEvent.KEYCODE_PAGE_UP: case KeyEvent.KEYCODE_DPAD_LEFT: ink.setPage(ink.page - 1); return true;
            case KeyEvent.KEYCODE_P: setTool(Model.PEN); return true;
            case KeyEvent.KEYCODE_H: setTool(Model.MARKER); return true;
            case KeyEvent.KEYCODE_E: setTool(InkView.ERASER); return true;
            default: return super.onKeyDown(code, e);
        }
    }

    // 자동 점검용
    InkView ink() { return ink; }
    Model.Note note() { return note; }
    void addPageForTest() { addPage(); }
}
