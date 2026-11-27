package com.daesinnam.work;

/** 사진 정리 · 보정 (LightCraft 웹 빌드, MIT/Apache-2.0 — 정보 화면 참고) */
public class LightActivity extends CraftActivity {
    @Override protected String assetDir() { return "light"; }
    @Override protected String bridgeAsset() { return "egui-bridge.js"; }
    @Override protected String bridgeName() { return "LightCraftAndroid"; }
    @Override protected String selftestName() { return "light"; }
    @Override protected String closeQuestion() {
        return "사진 정리를 닫을까요?\n보관함과 보정 내용은 이 앱 안에 남지만, 원본 사진은 따로 보관해 두세요.";
    }
}
