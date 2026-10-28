package com.daesinnam.amp;

import android.service.notification.NotificationListenerService;

/**
 * 알림 접근 권한을 받기 위한 빈 서비스입니다.
 * 이 권한이 있어야 다른 앱(YouTube Music, Spotify)의 재생 정보를 읽고 조작할 수 있습니다.
 * 알림 내용은 읽거나 저장하지 않습니다.
 */
public class MediaListener extends NotificationListenerService {
}
