package com.daesinnam.work;

/** 동영상 편집 (FilmCraft 웹 빌드, MIT/Apache-2.0 — 정보 화면 참고) */
public class FilmActivity extends CraftActivity {
    @Override protected String assetDir() { return "film"; }
    @Override protected String bridgeAsset() { return "film-bridge.js"; }
    @Override protected String bridgeName() { return "FilmCraftAndroid"; }
    @Override protected String selftestName() { return "film"; }
    @Override protected String closeQuestion() {
        return "동영상 편집을 닫을까요?\n저장하지 않은 변경은 다음에 열 때 복구를 시도하지만, 중요한 작업은 먼저 저장(File › Save)해 두세요.";
    }
}
