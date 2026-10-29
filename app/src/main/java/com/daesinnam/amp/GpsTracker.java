package com.daesinnam.amp;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.hardware.GeomagneticField;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.location.GnssStatus;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.view.Surface;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * GPS 속도계용 위치·방향 수집기.
 * - 속도와 진행 방향: GPS
 * - 멈춰 있을 때 방향: 기기 나침반(회전 벡터 센서)
 */
final class GpsTracker implements LocationListener, SensorEventListener {

    private final Activity act;
    private final LocationManager lm;
    private final SensorManager sm;
    private final Sensor rot;
    private final Sensor game;
    private volatile boolean sensOn = false;
    private volatile boolean attWanted = false;
    // 콕핏 PFD용: 마지막 회전 행렬(기기→지구), 화면 회전, 시각
    private final float[] lastR = new float[9];
    private volatile int lastRot = 0;
    private volatile long rTs = 0;
    private volatile boolean rCompass = false;
    private GnssStatus.Callback gnssCb;

    private volatile Location last;
    private volatile float azimuth = -1f;
    private volatile int satsUsed = 0;
    private volatile int satsSeen = 0;
    private volatile boolean running = false;

    GpsTracker(Activity a) {
        act = a;
        lm = a.getSystemService(LocationManager.class);
        sm = a.getSystemService(SensorManager.class);
        rot = sm != null ? sm.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR) : null;
        game = sm != null ? sm.getDefaultSensor(Sensor.TYPE_GAME_ROTATION_VECTOR) : null;
    }

    /** 나침반·기울기 센서: GPS가 꺼져 있어도 콕핏 PFD가 보이면 켭니다. */
    private void sensorsOn() {
        if (sensOn || sm == null) return;
        Sensor s = rot != null ? rot : game;
        if (s == null) return;
        sm.registerListener(this, s, SensorManager.SENSOR_DELAY_GAME);
        sensOn = true;
    }

    private void sensorsMaybeOff() {
        if (!sensOn || running || attWanted || sm == null) return;
        try { sm.unregisterListener(this); } catch (Exception ignored) {}
        sensOn = false;
    }

    void attStart() {
        attWanted = true;
        sensorsOn();
    }

    void attStop() {
        attWanted = false;
        sensorsMaybeOff();
    }

    /** {"ok":bool,"r":[9],"srot":0~3,"decl":도,"compass":bool,"age":ms} */
    String attitude() {
        JSONObject o = new JSONObject();
        try {
            long age = rTs == 0 ? -1 : (SystemClock.elapsedRealtime() - rTs);
            o.put("ok", rTs != 0 && age < 2000);
            JSONArray a = new JSONArray();
            synchronized (lastR) { for (float v : lastR) a.put((double) v); }
            o.put("r", a);
            o.put("srot", lastRot);
            o.put("compass", rCompass);
            o.put("age", age);
            Location l = last;
            o.put("decl", l == null ? 0 : new GeomagneticField((float) l.getLatitude(), (float) l.getLongitude(), (float) l.getAltitude(), System.currentTimeMillis()).getDeclination());
        } catch (Exception ignored) {}
        return o.toString();
    }

    boolean hasPerm() {
        return act.checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    @SuppressLint("MissingPermission")
    void start() {
        if (running || !hasPerm() || lm == null) return;
        try {
            if (lm.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                lm.requestLocationUpdates(LocationManager.GPS_PROVIDER, 500, 0, this, Looper.getMainLooper());
            }
            if (lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                lm.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, 3000, 0, this, Looper.getMainLooper());
            }
            gnssCb = new GnssStatus.Callback() {
                @Override
                public void onSatelliteStatusChanged(GnssStatus st) {
                    int used = 0;
                    for (int i = 0; i < st.getSatelliteCount(); i++) if (st.usedInFix(i)) used++;
                    satsUsed = used;
                    satsSeen = st.getSatelliteCount();
                }
            };
            lm.registerGnssStatusCallback(gnssCb, new Handler(Looper.getMainLooper()));
            Location l = lm.getLastKnownLocation(LocationManager.GPS_PROVIDER);
            if (l != null) last = l;
        } catch (Exception ignored) {}
        running = true;
        sensorsOn();
    }

    void stop() {
        if (!running) return;
        try { lm.removeUpdates(this); } catch (Exception ignored) {}
        try { if (gnssCb != null) lm.unregisterGnssStatusCallback(gnssCb); } catch (Exception ignored) {}
        running = false;
        sensorsMaybeOff();
    }

    boolean isRunning() {
        return running;
    }

    private static long ageMs(Location l) {
        return (SystemClock.elapsedRealtimeNanos() - l.getElapsedRealtimeNanos()) / 1_000_000L;
    }

    @Override
    public void onLocationChanged(Location l) {
        Location p = last;
        // GPS가 잡혀 있으면 덜 정확한 네트워크 위치는 무시합니다.
        if (LocationManager.NETWORK_PROVIDER.equals(l.getProvider()) && p != null
                && LocationManager.GPS_PROVIDER.equals(p.getProvider()) && ageMs(p) < 5000) return;
        last = l;
    }

    @Override public void onStatusChanged(String provider, int status, Bundle extras) {}
    @Override public void onProviderEnabled(String provider) {}
    @Override public void onProviderDisabled(String provider) {}

    @Override
    public void onSensorChanged(SensorEvent e) {
        float[] r = new float[9], r2 = new float[9], o = new float[3];
        SensorManager.getRotationMatrixFromVector(r, e.values);
        int rotation = Surface.ROTATION_0;
        try {
            rotation = act.getWindowManager().getDefaultDisplay().getRotation();
        } catch (Exception ignored) {}
        switch (rotation) {
            case Surface.ROTATION_90:
                SensorManager.remapCoordinateSystem(r, SensorManager.AXIS_Y, SensorManager.AXIS_MINUS_X, r2);
                break;
            case Surface.ROTATION_180:
                SensorManager.remapCoordinateSystem(r, SensorManager.AXIS_MINUS_X, SensorManager.AXIS_MINUS_Y, r2);
                break;
            case Surface.ROTATION_270:
                SensorManager.remapCoordinateSystem(r, SensorManager.AXIS_MINUS_Y, SensorManager.AXIS_X, r2);
                break;
            default:
                System.arraycopy(r, 0, r2, 0, 9);
        }
        synchronized (lastR) { System.arraycopy(r, 0, lastR, 0, 9); }
        lastRot = rotation;
        rCompass = e.sensor.getType() == Sensor.TYPE_ROTATION_VECTOR;
        rTs = SystemClock.elapsedRealtime();
        if (!rCompass) return;
        SensorManager.getOrientation(r2, o);
        float az = (float) Math.toDegrees(o[0]);
        Location l = last;
        if (l != null) {
            // 자북을 진북으로 보정
            az += new GeomagneticField((float) l.getLatitude(), (float) l.getLongitude(), (float) l.getAltitude(), System.currentTimeMillis()).getDeclination();
        }
        azimuth = (az % 360 + 360) % 360;
    }

    @Override public void onAccuracyChanged(Sensor sensor, int accuracy) {}

    String status() {
        JSONObject o = new JSONObject();
        try {
            o.put("perm", hasPerm());
            o.put("on", running);
            o.put("enabled", lm != null && lm.isProviderEnabled(LocationManager.GPS_PROVIDER));
            o.put("satsUsed", satsUsed);
            o.put("satsSeen", satsSeen);
            o.put("azimuth", azimuth);
            Location l = last;
            if (l != null) {
                long age = ageMs(l);
                o.put("fix", age < 6000);
                o.put("age", age);
                o.put("ts", l.getTime());
                o.put("lat", l.getLatitude());
                o.put("lon", l.getLongitude());
                o.put("acc", l.hasAccuracy() ? l.getAccuracy() : -1);
                o.put("alt", l.hasAltitude() ? l.getAltitude() : -9999);
                o.put("speed", l.hasSpeed() ? l.getSpeed() : -1);
                o.put("bearing", l.hasBearing() ? l.getBearing() : -1);
                o.put("provider", l.getProvider());
            } else {
                o.put("fix", false);
            }
        } catch (Exception ignored) {}
        return o.toString();
    }
}
