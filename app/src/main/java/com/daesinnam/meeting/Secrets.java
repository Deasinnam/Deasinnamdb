package com.daesinnam.meeting;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;

import java.nio.charset.StandardCharsets;
import java.security.KeyStore;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

/** OpenAI API 키를 안드로이드 키 저장소(Keystore)의 키로 암호화해 둡니다. 키는 기기 밖으로 나가지 않습니다. */
final class Secrets {
    private static final String ALIAS = "meeting-api-key";
    private static final String PREFS = "secrets";
    private final SharedPreferences prefs;

    Secrets(Context c) {
        prefs = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    boolean hasApiKey() {
        return prefs.contains("apiKey");
    }

    void setApiKey(String key) throws Exception {
        Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
        c.init(Cipher.ENCRYPT_MODE, key());
        byte[] enc = c.doFinal(key.getBytes(StandardCharsets.UTF_8));
        prefs.edit()
                .putString("apiKey", Base64.encodeToString(enc, Base64.NO_WRAP))
                .putString("iv", Base64.encodeToString(c.getIV(), Base64.NO_WRAP))
                .putString("hint", key.length() > 4 ? key.substring(key.length() - 4) : "")
                .apply();
    }

    String apiKey() throws Exception {
        String enc = prefs.getString("apiKey", null);
        if (enc == null) return null;
        Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
        c.init(Cipher.DECRYPT_MODE, key(), new GCMParameterSpec(128, Base64.decode(prefs.getString("iv", ""), Base64.NO_WRAP)));
        return new String(c.doFinal(Base64.decode(enc, Base64.NO_WRAP)), StandardCharsets.UTF_8);
    }

    String hint() {
        return prefs.getString("hint", "");
    }

    private static SecretKey key() throws Exception {
        KeyStore ks = KeyStore.getInstance("AndroidKeyStore");
        ks.load(null);
        if (ks.containsAlias(ALIAS)) return ((KeyStore.SecretKeyEntry) ks.getEntry(ALIAS, null)).getSecretKey();
        KeyGenerator g = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
        g.init(new KeyGenParameterSpec.Builder(ALIAS, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256)
                .build());
        return g.generateKey();
    }
}
