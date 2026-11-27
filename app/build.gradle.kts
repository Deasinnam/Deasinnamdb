plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.daesinnam.localai"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.daesinnam.localai"
        // LiteRT-LM(GPU · 멀티모달)이 안드로이드 12 이상에서 안정적 → 폴드8 울트라(안드로이드 17) 기준
        minSdk = 31
        targetSdk = 36
        versionCode = 10
        versionName = "0.6.0"
        ndk { abiFilters += listOf("arm64-v8a", "x86_64") } // x86_64는 에뮬레이터 자동 점검용
        externalNativeBuild { cmake { arguments += listOf("-DANDROID_STL=c++_shared", "-DCMAKE_BUILD_TYPE=Release"); cppFlags += "-std=c++17" } }
    }

    buildFeatures { buildConfig = true }

    // 그림 엔진(stable-diffusion.cpp)을 폰용으로 직접 빌드 — 소스는 CI가 고정 커밋으로 받아 옴(app/src/main/cpp/sdcpp)
    ndkVersion = "28.2.13676358"
    externalNativeBuild { cmake { path = file("src/main/cpp/CMakeLists.txt"); version = "3.22.1" } }

    // 서명 키는 저장소에 두지 않습니다. CI가 GitHub 비밀값에서 꺼내 씁니다 (다른 덜누름 앱과 같은 키).
    val keystore = System.getenv("AMP_KEYSTORE_FILE")
    signingConfigs {
        create("daesinnam") {
            if (keystore != null) {
                storeFile = file(keystore)
                storeType = "pkcs12"
                storePassword = System.getenv("AMP_KEYSTORE_PASSWORD")
                keyAlias = System.getenv("AMP_KEY_ALIAS") ?: "amp"
                keyPassword = System.getenv("AMP_KEY_PASSWORD")
            }
        }
    }

    buildTypes {
        release {
            // LiteRT-LM은 JNI가 클래스 이름으로 찾아 들어오므로 줄이기 · 이름 바꾸기를 하지 않음
            isMinifyEnabled = false
            if (keystore != null) signingConfig = signingConfigs.getByName("daesinnam")
        }
    }

    packaging { jniLibs { useLegacyPackaging = false } }
    lint { checkReleaseBuilds = false; abortOnError = false }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

kotlin { jvmToolchain(17) }

dependencies {
    implementation("com.google.ai.edge.litertlm:litertlm-android:0.20.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.11.0")
    implementation("androidx.core:core-ktx:1.17.0")
}
