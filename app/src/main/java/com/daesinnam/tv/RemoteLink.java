package com.daesinnam.tv;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
import android.bluetooth.le.BluetoothLeScanner;
import android.bluetooth.le.ScanCallback;
import android.bluetooth.le.ScanResult;
import android.bluetooth.le.ScanSettings;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * 삼성 스마트 리모컨(원리모컨 · 스마트 컨트롤)을 휴대폰에 바로 연결.
 * 리모컨을 연결 모드로 두면 블루투스 HID(키보드처럼 동작) 장치로 보이므로,
 * 주변을 찾아(BLE + 일반 검색) 고른 장치와 페어링(createBond)만 하면
 * 그다음부터는 안드로이드가 리모컨 단추를 키 입력으로 넘겨 줍니다.
 */
@SuppressLint("MissingPermission")
final class RemoteLink {
    interface Js { void call(String fn, String arg); }

    static final int REQ_PERM = 7301, REQ_ENABLE = 7302;
    private static final int SAMSUNG_COMPANY_ID = 0x0075;

    private final Activity act;
    private final Js js;
    private final Handler main = new Handler(Looper.getMainLooper());
    private final Map<String, BluetoothDevice> found = new HashMap<>();
    private BluetoothLeScanner le;
    private boolean scanning, receiverOn, wantScan;

    RemoteLink(Activity act, Js js) { this.act = act; this.js = js; }

    private BluetoothAdapter adapter() {
        BluetoothManager m = (BluetoothManager) act.getSystemService(Context.BLUETOOTH_SERVICE);
        return m == null ? null : m.getAdapter();
    }

    private String[] perms() {
        return Build.VERSION.SDK_INT >= 31
                ? new String[] { Manifest.permission.BLUETOOTH_SCAN, Manifest.permission.BLUETOOTH_CONNECT }
                : new String[] { Manifest.permission.ACCESS_FINE_LOCATION };
    }

    boolean hasPerms() {
        for (String p : perms()) if (act.checkSelfPermission(p) != PackageManager.PERMISSION_GRANTED) return false;
        return true;
    }

    /** {"bt":있음/없음, "on":켜짐, "perm":권한} */
    String state() {
        BluetoothAdapter a = adapter();
        JSONObject o = new JSONObject();
        try {
            o.put("bt", a != null).put("perm", hasPerms());
            o.put("on", a != null && a.isEnabled());
        } catch (JSONException | SecurityException ignored) { }
        return o.toString();
    }

    /** 찾기 시작: 권한 → 블루투스 켜기 → 20초 동안 검색 */
    void scan() {
        BluetoothAdapter a = adapter();
        if (a == null) { js.call("rcScanDone", "nobt"); return; }
        if (!hasPerms()) { wantScan = true; act.requestPermissions(perms(), REQ_PERM); return; }
        if (!a.isEnabled()) {
            wantScan = true;
            try { act.startActivityForResult(new Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE), REQ_ENABLE); }
            catch (RuntimeException e) { js.call("rcScanDone", "off"); }
            return;
        }
        wantScan = false;
        stopScan();
        found.clear();
        register();
        // 이미 짝지어진 삼성 리모컨도 목록에 (다시 연결하기 쉽게)
        try {
            for (BluetoothDevice d : a.getBondedDevices()) if (looksRemote(d.getName(), false)) emit(d, true, false);
        } catch (SecurityException ignored) { }
        scanning = true;
        try { a.startDiscovery(); } catch (SecurityException ignored) { }
        try {
            le = a.getBluetoothLeScanner();
            if (le != null) le.startScan(null, new ScanSettings.Builder().setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY).build(), leCb);
        } catch (RuntimeException ignored) { }
        main.postDelayed(this::finishScan, 20000);
    }

    private void finishScan() {
        if (!scanning) return;
        stopScan();
        js.call("rcScanDone", "ok");
    }

    void stopScan() {
        main.removeCallbacksAndMessages(null);
        scanning = false;
        BluetoothAdapter a = adapter();
        try { if (a != null) a.cancelDiscovery(); } catch (SecurityException ignored) { }
        try { if (le != null) le.stopScan(leCb); } catch (RuntimeException ignored) { }
    }

    /** 고른 장치와 짝짓기 */
    void pair(String addr) {
        BluetoothDevice d = found.get(addr);
        BluetoothAdapter a = adapter();
        if (d == null && a != null) try { d = a.getRemoteDevice(addr); } catch (IllegalArgumentException ignored) { }
        if (d == null) { bond(addr, "fail"); return; }
        stopScan();
        register();
        try {
            if (d.getBondState() == BluetoothDevice.BOND_BONDED) { bond(addr, "bonded"); return; }
            bond(addr, d.createBond() ? "bonding" : "fail");
        } catch (SecurityException e) { bond(addr, "fail"); }
    }

    void onPermResult(int code) {
        if (code != REQ_PERM) return;
        if (hasPerms()) { if (wantScan) scan(); }
        else { wantScan = false; js.call("rcScanDone", "perm"); }
    }

    void onEnableResult(int code) {
        if (code != REQ_ENABLE) return;
        BluetoothAdapter a = adapter();
        if (a != null && a.isEnabled() && wantScan) scan();
        else { wantScan = false; js.call("rcScanDone", "off"); }
    }

    void destroy() {
        stopScan();
        if (receiverOn) { try { act.unregisterReceiver(rx); } catch (RuntimeException ignored) { } receiverOn = false; }
    }

    // ---------- 내부 ----------

    private void register() {
        if (receiverOn) return;
        IntentFilter f = new IntentFilter(BluetoothDevice.ACTION_FOUND);
        f.addAction(BluetoothDevice.ACTION_BOND_STATE_CHANGED);
        f.addAction(BluetoothDevice.ACTION_ACL_CONNECTED);
        f.addAction(BluetoothDevice.ACTION_ACL_DISCONNECTED);
        f.addAction(BluetoothAdapter.ACTION_DISCOVERY_FINISHED);
        if (Build.VERSION.SDK_INT >= 33) act.registerReceiver(rx, f, Context.RECEIVER_EXPORTED);
        else act.registerReceiver(rx, f);
        receiverOn = true;
    }

    private final BroadcastReceiver rx = new BroadcastReceiver() {
        @Override public void onReceive(Context c, Intent i) {
            String a = i.getAction();
            BluetoothDevice d = i.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
            if (BluetoothDevice.ACTION_FOUND.equals(a) && d != null) {
                emit(d, false, false);
            } else if (BluetoothDevice.ACTION_BOND_STATE_CHANGED.equals(a) && d != null) {
                int s = i.getIntExtra(BluetoothDevice.EXTRA_BOND_STATE, BluetoothDevice.BOND_NONE);
                int p = i.getIntExtra(BluetoothDevice.EXTRA_PREVIOUS_BOND_STATE, BluetoothDevice.BOND_NONE);
                bond(d.getAddress(), s == BluetoothDevice.BOND_BONDED ? "bonded" : s == BluetoothDevice.BOND_BONDING ? "bonding" : p == BluetoothDevice.BOND_BONDING ? "fail" : "none");
            } else if (BluetoothDevice.ACTION_ACL_CONNECTED.equals(a) || BluetoothDevice.ACTION_ACL_DISCONNECTED.equals(a)) {
                // 리모컨이 붙거나 떨어지면 연결 상태 칸 새로 고침 (입력 장치 등록이 조금 늦어 잠시 뒤)
                main.postDelayed(() -> js.call("rcChanged", ""), 1200);
            }
        }
    };

    private final ScanCallback leCb = new ScanCallback() {
        @Override public void onScanResult(int type, ScanResult r) {
            boolean samsung = r.getScanRecord() != null && r.getScanRecord().getManufacturerSpecificData(SAMSUNG_COMPANY_ID) != null;
            String name = null;
            try { name = r.getDevice().getName(); } catch (SecurityException ignored) { }
            if (name == null && r.getScanRecord() != null) name = r.getScanRecord().getDeviceName();
            emitNamed(r.getDevice(), name, false, samsung);
        }
    };

    private void emit(BluetoothDevice d, boolean bonded, boolean samsungData) {
        String name = null;
        try { name = d.getName(); } catch (SecurityException ignored) { }
        emitNamed(d, name, bonded, samsungData);
    }

    private void emitNamed(BluetoothDevice d, String name, boolean bonded, boolean samsungData) {
        if (name == null || name.trim().isEmpty()) return; // 이름 없는 장치는 고르기 어려워 숨김
        String addr = d.getAddress();
        boolean first = !found.containsKey(addr);
        found.put(addr, d);
        if (!first && !bonded) return;
        try {
            int bs = BluetoothDevice.BOND_NONE;
            try { bs = d.getBondState(); } catch (SecurityException ignored) { }
            JSONObject o = new JSONObject()
                    .put("addr", addr).put("name", name.trim())
                    .put("remote", looksRemote(name, samsungData))
                    .put("samsung", samsungData || name.toLowerCase(Locale.ROOT).contains("samsung") || name.toLowerCase(Locale.ROOT).contains("smart control"))
                    .put("bonded", bonded || bs == BluetoothDevice.BOND_BONDED);
            js.call("rcFound", o.toString());
        } catch (JSONException ignored) { }
    }

    static boolean looksRemote(String name, boolean samsungData) {
        if (name == null) return false;
        String n = name.toLowerCase(Locale.ROOT);
        return n.contains("remote") || n.contains("smart control") || n.contains("smart touch") || n.contains("리모컨")
                || (samsungData && (n.contains("[tv]") || n.contains("rmc") || n.contains("one ")));
    }

    private void bond(String addr, String st) {
        try { js.call("rcBond", new JSONObject().put("addr", addr).put("state", st).toString()); } catch (JSONException ignored) { }
    }
}
