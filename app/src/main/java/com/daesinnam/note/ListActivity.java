package com.daesinnam.note;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.OpenableColumns;
import android.text.TextUtils;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.GridView;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import java.io.File;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** 노트 목록 (앱 아이콘으로 여는 첫 화면): 새 노트 · PDF 열기 · 노트 카드 */
public class ListActivity extends Activity {
    private static final int REQ_OPEN_PDF = 1;
    private final ExecutorService bg = Executors.newSingleThreadExecutor();
    private final Handler main = new Handler(Looper.getMainLooper());
    private final List<Store.Item> items = new ArrayList<>();
    private final Map<String, Bitmap> thumbs = new HashMap<>();
    private GridView grid;
    private TextView empty;
    private Adapter adapter;

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Ui.BG);

        LinearLayout bar = new LinearLayout(this);
        bar.setGravity(Gravity.CENTER_VERTICAL);
        bar.setBackgroundColor(Ui.BAR);
        bar.setPadding(Ui.dp(this, 18), 0, Ui.dp(this, 12), 0);
        TextView title = Ui.text(this, "덜누름 노트", 20, Ui.TEXT);
        title.getPaint().setFakeBoldText(true);
        bar.addView(title, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.MATCH_PARENT, 1));
        TextView pdfB = Ui.button(this, "PDF 열기", false, v -> openPdf());
        pdfB.setCompoundDrawablesRelativeWithIntrinsicBounds(R.drawable.ic_pdf, 0, 0, 0);
        pdfB.setCompoundDrawablePadding(Ui.dp(this, 6));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, Ui.dp(this, 40));
        lp.setMargins(0, 0, Ui.dp(this, 8), 0);
        bar.addView(pdfB, lp);
        TextView newB = Ui.button(this, "새 노트", true, v -> newNote());
        bar.addView(newB, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, Ui.dp(this, 40)));
        root.addView(bar, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, Ui.dp(this, 60)));

        FrameLayout body = new FrameLayout(this);
        grid = new GridView(this);
        grid.setNumColumns(GridView.AUTO_FIT);
        grid.setColumnWidth(Ui.dp(this, 168));
        grid.setStretchMode(GridView.STRETCH_COLUMN_WIDTH);
        grid.setHorizontalSpacing(Ui.dp(this, 14));
        grid.setVerticalSpacing(Ui.dp(this, 18));
        int pad = Ui.dp(this, 18);
        grid.setPadding(pad, pad, pad, pad);
        grid.setClipToPadding(false);
        grid.setSelector(new android.graphics.drawable.ColorDrawable(0));
        adapter = new Adapter();
        grid.setAdapter(adapter);
        grid.setOnItemClickListener((p, v, pos, id) -> open(items.get(pos).id, false));
        grid.setOnItemLongClickListener((p, v, pos, id) -> { manage(items.get(pos)); return true; });
        body.addView(grid);
        empty = Ui.text(this, "아직 노트가 없어요.\n'새 노트'로 바로 쓰거나 'PDF 열기'로 PDF 위에 써 보세요.\n\nS펜 옆 버튼을 누른 채 쓰면 지우개가 돼요.", 16, Ui.SUB);
        empty.setGravity(Gravity.CENTER);
        body.addView(empty, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        root.addView(body, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1));
        setContentView(root);

        handleShared(getIntent());
        if (BuildConfig.DEBUG && getIntent().getBooleanExtra("note.selftest", false)) {
            try { open(Store.create(this, Model.LINED).id, true); } catch (Exception e) { Log.e("NOTE_SELFTEST", "FAIL create " + e); }
        }
    }

    @Override
    protected void onNewIntent(Intent i) {
        super.onNewIntent(i);
        handleShared(i);
    }

    @Override
    protected void onResume() {
        super.onResume();
        reload();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        bg.shutdown();
    }

    private void reload() {
        bg.execute(() -> {
            List<Store.Item> l = Store.list(this);
            Map<String, Bitmap> t = new HashMap<>();
            for (Store.Item it : l) {
                File f = Store.thumb(this, it.id);
                if (f.exists()) {
                    Bitmap bm = BitmapFactory.decodeFile(f.getPath());
                    if (bm != null) t.put(it.id, bm);
                }
            }
            main.post(() -> {
                items.clear();
                items.addAll(l);
                thumbs.clear();
                thumbs.putAll(t);
                adapter.notifyDataSetChanged();
                empty.setVisibility(items.isEmpty() ? View.VISIBLE : View.GONE);
            });
        });
    }

    private void open(String id, boolean selftest) {
        Intent i = new Intent(this, NoteActivity.class).putExtra("id", id);
        if (selftest) i.putExtra("note.selftest", true);
        startActivity(i);
    }

    private void newNote() {
        String[] names = {"줄 노트", "모눈 노트", "점 노트", "무지 노트"};
        String[] papers = {Model.LINED, Model.GRID, Model.DOT, Model.PLAIN};
        new AlertDialog.Builder(this, android.R.style.Theme_DeviceDefault_Dialog_Alert)
                .setTitle("어떤 종이에 쓸까요?")
                .setItems(names, (d, w) -> {
                    try {
                        getSharedPreferences("tools", MODE_PRIVATE).edit().putString("paper", papers[w]).apply();
                        open(Store.create(this, papers[w]).id, false);
                    } catch (Exception e) {
                        Toast.makeText(this, "노트를 만들지 못했어요", Toast.LENGTH_LONG).show();
                    }
                }).show();
    }

    private void openPdf() {
        Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("application/pdf");
        try { startActivityForResult(i, REQ_OPEN_PDF); }
        catch (Exception e) { Toast.makeText(this, "파일 고르기 창을 열 수 없어요", Toast.LENGTH_LONG).show(); }
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        super.onActivityResult(req, res, data);
        if (req == REQ_OPEN_PDF && res == RESULT_OK && data != null && data.getData() != null) importPdf(data.getData());
    }

    /** 다른 앱에서 "덜누름 노트로 열기 · 보내기"로 온 PDF */
    private void handleShared(Intent i) {
        if (i == null) return;
        Uri u = null;
        if (Intent.ACTION_VIEW.equals(i.getAction())) u = i.getData();
        else if (Intent.ACTION_SEND.equals(i.getAction())) u = i.getParcelableExtra(Intent.EXTRA_STREAM);
        if (u != null) {
            i.setAction(Intent.ACTION_MAIN); // 화면을 돌려도 다시 가져오지 않게
            importPdf(u);
        }
    }

    private void importPdf(Uri u) {
        Toast.makeText(this, "PDF를 가져오는 중…", Toast.LENGTH_SHORT).show();
        bg.execute(() -> {
            try {
                Model.Note n = Store.importPdf(this, u, displayName(u));
                main.post(() -> open(n.id, false));
            } catch (Exception e) {
                Log.w("Note", "import", e);
                main.post(() -> Toast.makeText(this, e.getMessage() == null ? "PDF를 가져오지 못했어요" : e.getMessage(), Toast.LENGTH_LONG).show());
            }
        });
    }

    private String displayName(Uri u) {
        try (Cursor c = getContentResolver().query(u, new String[]{OpenableColumns.DISPLAY_NAME}, null, null, null)) {
            if (c != null && c.moveToFirst()) return c.getString(0);
        } catch (Exception ignored) { }
        String s = u.getLastPathSegment();
        return s == null ? null : s.substring(s.lastIndexOf('/') + 1);
    }

    private void manage(Store.Item it) {
        new AlertDialog.Builder(this, android.R.style.Theme_DeviceDefault_Dialog_Alert)
                .setTitle(it.title)
                .setItems(new String[]{"이름 바꾸기", "지우기"}, (d, w) -> {
                    if (w == 0) rename(it);
                    else new AlertDialog.Builder(this, android.R.style.Theme_DeviceDefault_Dialog_Alert)
                            .setTitle("'" + it.title + "'을(를) 지울까요?").setMessage("지운 노트는 되살릴 수 없어요.")
                            .setPositiveButton("지우기", (d2, w2) -> { Store.delete(this, it.id); reload(); })
                            .setNegativeButton("취소", null).show();
                }).show();
    }

    private void rename(Store.Item it) {
        EditText e = new EditText(this);
        e.setText(it.title);
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
                    bg.execute(() -> {
                        try { Store.rename(this, it.id, t); } catch (Exception ignored) { }
                        main.post(this::reload);
                    });
                }).setNegativeButton("취소", null).show();
    }

    private final class Adapter extends BaseAdapter {
        private final SimpleDateFormat fmt = new SimpleDateFormat("M월 d일 HH:mm", Locale.KOREA);

        @Override public int getCount() { return items.size(); }
        @Override public Object getItem(int i) { return items.get(i); }
        @Override public long getItemId(int i) { return i; }

        @Override
        public View getView(int pos, View v, ViewGroup parent) {
            LinearLayout card;
            if (v instanceof LinearLayout) card = (LinearLayout) v;
            else {
                card = new LinearLayout(ListActivity.this);
                card.setOrientation(LinearLayout.VERTICAL);
                FrameLayout frame = new FrameLayout(ListActivity.this);
                frame.setBackground(Ui.round(0xFFFFFFFF, Ui.dp(ListActivity.this, 10)));
                frame.setClipToOutline(true);
                frame.setElevation(Ui.dp(ListActivity.this, 2));
                ImageView img = new ImageView(ListActivity.this);
                img.setScaleType(ImageView.ScaleType.CENTER_CROP);
                img.setTag("img");
                frame.addView(img, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
                card.addView(frame, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, Ui.dp(ListActivity.this, 210)));
                TextView t = Ui.text(ListActivity.this, "", 15, Ui.TEXT);
                t.setTag("title");
                t.setSingleLine(true);
                t.setEllipsize(TextUtils.TruncateAt.END);
                t.setPadding(Ui.dp(ListActivity.this, 2), Ui.dp(ListActivity.this, 8), 0, 0);
                card.addView(t);
                TextView m = Ui.text(ListActivity.this, "", 12, Ui.SUB);
                m.setTag("meta");
                m.setPadding(Ui.dp(ListActivity.this, 2), Ui.dp(ListActivity.this, 2), 0, 0);
                card.addView(m);
            }
            Store.Item it = items.get(pos);
            ImageView img = card.findViewWithTag("img");
            Bitmap bm = thumbs.get(it.id);
            if (bm != null) img.setImageBitmap(bm); else img.setImageDrawable(null);
            ((TextView) card.findViewWithTag("title")).setText(it.title);
            ((TextView) card.findViewWithTag("meta")).setText((it.pdf ? "PDF · " : "") + it.pages + "쪽 · " + fmt.format(new Date(it.modified)));
            return card;
        }
    }
}
