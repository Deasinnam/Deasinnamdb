package com.daesinnam.meeting;

import android.Manifest;
import android.accounts.Account;
import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.ContentValues;
import android.content.Context;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.provider.CalendarContract;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

/**
 * 휴대폰 캘린더(CalendarContract)에 일정을 넣고 뺍니다.
 * 구글 계정 캘린더에 넣으면 안드로이드가 구글 캘린더와 동기화합니다(따로 로그인 불필요).
 */
final class Calendars {
    private final Context context;

    Calendars(Context c) {
        context = c.getApplicationContext();
    }

    boolean permitted() {
        return context.checkSelfPermission(Manifest.permission.READ_CALENDAR) == PackageManager.PERMISSION_GRANTED
                && context.checkSelfPermission(Manifest.permission.WRITE_CALENDAR) == PackageManager.PERMISSION_GRANTED;
    }

    /** 일정을 쓸 수 있는 캘린더 목록 (구글 계정 기본 캘린더가 앞) */
    JSONArray list() {
        JSONArray out = new JSONArray();
        if (!permitted()) return out;
        String[] cols = {CalendarContract.Calendars._ID, CalendarContract.Calendars.CALENDAR_DISPLAY_NAME,
                CalendarContract.Calendars.ACCOUNT_NAME, CalendarContract.Calendars.ACCOUNT_TYPE,
                CalendarContract.Calendars.IS_PRIMARY, CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL};
        try (Cursor c = context.getContentResolver().query(CalendarContract.Calendars.CONTENT_URI, cols,
                CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL + ">=" + CalendarContract.Calendars.CAL_ACCESS_CONTRIBUTOR,
                null, CalendarContract.Calendars.IS_PRIMARY + " DESC")) {
            while (c != null && c.moveToNext()) {
                JSONObject o = new JSONObject();
                o.put("id", c.getLong(0));
                o.put("name", c.getString(1));
                o.put("account", c.getString(2));
                o.put("google", "com.google".equals(c.getString(3)));
                o.put("primary", c.getInt(4) == 1);
                out.put(o);
            }
        } catch (Exception ignored) {
        }
        return out;
    }

    /** 고른 캘린더가 없으면 구글 계정 기본 캘린더 → 아무 쓸 수 있는 캘린더 */
    long pick(long preferred) {
        JSONArray l = list();
        long first = -1;
        long google = -1;
        for (int i = 0; i < l.length(); i++) {
            JSONObject o = l.optJSONObject(i);
            long id = o.optLong("id");
            if (id == preferred) return id;
            if (first < 0) first = id;
            if (google < 0 && o.optBoolean("google") && o.optBoolean("primary")) google = id;
        }
        return google >= 0 ? google : first;
    }

    /** 분석 결과의 일정 하나를 넣고 일정 번호를 돌려줍니다 */
    long insert(long calendarId, JSONObject s, String meetingTitle, String summary) throws Exception {
        String start = s.optString("start", "");
        if (start.isEmpty()) throw new IllegalArgumentException("시작 날짜가 없습니다");
        boolean allDay = s.optBoolean("allDay", false) || !start.contains("T");
        TimeZone tz = TimeZone.getDefault();
        ContentValues v = new ContentValues();
        v.put(CalendarContract.Events.CALENDAR_ID, calendarId);
        v.put(CalendarContract.Events.TITLE, s.optString("title", "회의에서 정한 일정"));
        StringBuilder desc = new StringBuilder();
        desc.append("회의비서가 '").append(meetingTitle).append("' 회의에서 찾은 일정입니다.");
        if (!s.optString("evidence").isEmpty()) desc.append("\n\n“").append(s.optString("evidence")).append("”");
        if (!s.optString("notes").isEmpty()) desc.append("\n\n").append(s.optString("notes"));
        if (summary != null && !summary.isEmpty()) desc.append("\n\n[회의 요약]\n").append(summary);
        v.put(CalendarContract.Events.DESCRIPTION, desc.toString());
        if (!s.optString("location").isEmpty()) v.put(CalendarContract.Events.EVENT_LOCATION, s.optString("location"));
        if (allDay) {
            long day = parseDay(start);
            v.put(CalendarContract.Events.ALL_DAY, 1);
            v.put(CalendarContract.Events.EVENT_TIMEZONE, "UTC");
            v.put(CalendarContract.Events.DTSTART, day);
            v.put(CalendarContract.Events.DTEND, day + 86400000L);
        } else {
            long from = parseLocal(start, tz);
            String end = s.optString("end", "");
            long to = end.contains("T") ? parseLocal(end, tz) : from + 3600000L;
            if (to <= from) to = from + 3600000L;
            v.put(CalendarContract.Events.EVENT_TIMEZONE, tz.getID());
            v.put(CalendarContract.Events.DTSTART, from);
            v.put(CalendarContract.Events.DTEND, to);
        }
        ContentResolver cr = context.getContentResolver();
        Uri uri = cr.insert(CalendarContract.Events.CONTENT_URI, v);
        if (uri == null) throw new IllegalStateException("캘린더에 넣지 못했습니다");
        long eventId = ContentUris.parseId(uri);
        ContentValues r = new ContentValues();
        r.put(CalendarContract.Reminders.EVENT_ID, eventId);
        r.put(CalendarContract.Reminders.METHOD, CalendarContract.Reminders.METHOD_ALERT);
        r.put(CalendarContract.Reminders.MINUTES, allDay ? 9 * 60 : 30);
        try {
            cr.insert(CalendarContract.Reminders.CONTENT_URI, r);
        } catch (Exception ignored) {
        }
        return eventId;
    }

    void delete(long eventId) {
        context.getContentResolver().delete(ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, eventId), null, null);
    }

    /** 앞으로의 일정이고 날짜(와 시간)가 분명한지 */
    static boolean autoEligible(JSONObject s) {
        String start = s.optString("start", "");
        if (start.isEmpty()) return false;
        if (s.optDouble("confidence", 0) < 0.7) return false;
        try {
            long when = start.contains("T") ? parseLocal(start, TimeZone.getDefault()) : parseDay(start) + 86400000L;
            return when > System.currentTimeMillis() - 3600000L;
        } catch (ParseException e) {
            return false;
        }
    }

    static long parseLocal(String s, TimeZone tz) throws ParseException {
        String t = s.length() >= 16 ? s.substring(0, 16) : s;
        SimpleDateFormat f = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm", Locale.ROOT);
        f.setTimeZone(tz);
        Date d = f.parse(t);
        if (d == null) throw new ParseException(s, 0);
        return d.getTime();
    }

    static long parseDay(String s) throws ParseException {
        SimpleDateFormat f = new SimpleDateFormat("yyyy-MM-dd", Locale.ROOT);
        f.setTimeZone(TimeZone.getTimeZone("UTC"));
        Date d = f.parse(s.substring(0, Math.min(10, s.length())));
        if (d == null) throw new ParseException(s, 0);
        return d.getTime();
    }

    /** 자동 점검용: 계정 없는 기기(에뮬레이터)에 로컬 캘린더를 하나 만듭니다 */
    long createLocalCalendar() {
        Account acc = new Account("회의비서 점검", CalendarContract.ACCOUNT_TYPE_LOCAL);
        Uri uri = CalendarContract.Calendars.CONTENT_URI.buildUpon()
                .appendQueryParameter(CalendarContract.CALLER_IS_SYNCADAPTER, "true")
                .appendQueryParameter(CalendarContract.Calendars.ACCOUNT_NAME, acc.name)
                .appendQueryParameter(CalendarContract.Calendars.ACCOUNT_TYPE, acc.type).build();
        ContentValues v = new ContentValues();
        v.put(CalendarContract.Calendars.ACCOUNT_NAME, acc.name);
        v.put(CalendarContract.Calendars.ACCOUNT_TYPE, acc.type);
        v.put(CalendarContract.Calendars.NAME, "selftest");
        v.put(CalendarContract.Calendars.CALENDAR_DISPLAY_NAME, "점검용");
        v.put(CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL, CalendarContract.Calendars.CAL_ACCESS_OWNER);
        v.put(CalendarContract.Calendars.OWNER_ACCOUNT, acc.name);
        v.put(CalendarContract.Calendars.VISIBLE, 1);
        v.put(CalendarContract.Calendars.SYNC_EVENTS, 1);
        Uri r = context.getContentResolver().insert(uri, v);
        return r == null ? -1 : ContentUris.parseId(r);
    }

    boolean exists(long eventId) {
        try (Cursor c = context.getContentResolver().query(
                ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, eventId),
                new String[]{CalendarContract.Events.TITLE}, null, null, null)) {
            return c != null && c.moveToFirst();
        }
    }
}
