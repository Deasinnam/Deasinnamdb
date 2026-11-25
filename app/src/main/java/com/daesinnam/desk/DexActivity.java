package com.daesinnam.desk;

/**
 * 앱 서랍에서 여는 덜누름 데스크 (홈 앱 등록 없음).
 *
 * 예전 삼성 DeX(One UI 6 이하의 노트20 · 탭 S9 등)는 홈 앱(CATEGORY_HOME)으로 등록된 화면을
 * "휴대전화 홈 화면에서만 실행 가능한 앱"이라며 DeX 안에서 열지 않습니다.
 * 그래서 화면과 기능은 MainActivity와 똑같이 쓰되, 홈 앱 등록이 없는 이 화면을 앱 아이콘에 연결합니다.
 * 휴대전화의 기본 홈으로 고르면 여전히 MainActivity가 열립니다.
 */
public class DexActivity extends MainActivity {
}
