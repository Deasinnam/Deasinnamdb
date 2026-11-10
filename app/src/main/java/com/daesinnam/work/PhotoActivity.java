package com.daesinnam.work;

/** 사진 편집 (PhotoCraft 웹 빌드, MIT/Apache-2.0 — 정보 화면 참고) */
public class PhotoActivity extends CraftActivity {
    @Override protected String assetDir() { return "photo"; }
    @Override protected String bridgeAsset() { return "photo-bridge.js"; }
    @Override protected String bridgeName() { return "PhotoCraftAndroid"; }
    @Override protected String selftestName() { return "photo"; }
    @Override protected String closeQuestion() { return "사진 편집을 닫을까요?\n저장하지 않은 작업은 사라집니다."; }
}
