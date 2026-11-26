// Chat DNR Ai 그림 엔진(JNI): stable-diffusion.cpp로 기기 안에서 그림 만들기
#include <jni.h>
#include <android/log.h>
#include <atomic>
#include <mutex>
#include <string>
#include <cstring>
#include "stable-diffusion.h"

#define TAG "DnrImg"
static JavaVM* g_vm = nullptr;
static jclass g_cls = nullptr;
static jmethodID g_onProgress = nullptr;
static sd_ctx_t* g_ctx = nullptr;
static std::string g_path;
static std::mutex g_mu;

static void log_cb(enum sd_log_level_t level, const char* text, void*) {
    int pr = level == SD_LOG_ERROR ? ANDROID_LOG_ERROR : level == SD_LOG_WARN ? ANDROID_LOG_WARN : ANDROID_LOG_INFO;
    if (level == SD_LOG_DEBUG || level == SD_LOG_VERBOSE) return;
    __android_log_print(pr, TAG, "%s", text);
}

static void progress_cb(int step, int steps, float, void*) {
    if (!g_vm || !g_cls || !g_onProgress) return;
    JNIEnv* env = nullptr; bool attached = false;
    if (g_vm->GetEnv((void**)&env, JNI_VERSION_1_6) != JNI_OK) {
        if (g_vm->AttachCurrentThread(&env, nullptr) != JNI_OK) return;
        attached = true;
    }
    env->CallStaticVoidMethod(g_cls, g_onProgress, step, steps);
    if (attached) g_vm->DetachCurrentThread();
}

extern "C" JNIEXPORT jint JNI_OnLoad(JavaVM* vm, void*) {
    g_vm = vm;
    JNIEnv* env; vm->GetEnv((void**)&env, JNI_VERSION_1_6);
    jclass c = env->FindClass("com/daesinnam/localai/ImageGen");
    g_cls = (jclass)env->NewGlobalRef(c);
    g_onProgress = env->GetStaticMethodID(g_cls, "onProgress", "(II)V");
    sd_set_log_callback(log_cb, nullptr);
    sd_set_progress_callback(progress_cb, nullptr);
    return JNI_VERSION_1_6;
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_daesinnam_localai_ImageGen_nLoad(JNIEnv* env, jclass, jstring jpath, jint threads) {
    std::lock_guard<std::mutex> lk(g_mu);
    const char* p = env->GetStringUTFChars(jpath, nullptr);
    std::string path(p); env->ReleaseStringUTFChars(jpath, p);
    if (g_ctx && g_path == path) return JNI_TRUE;
    if (g_ctx) { free_sd_ctx(g_ctx); g_ctx = nullptr; }
    sd_ctx_params_t cp; sd_ctx_params_init(&cp);
    cp.model_path = path.c_str();
    cp.n_threads = threads > 0 ? threads : sd_get_num_physical_cores();
    cp.enable_mmap = true;
    g_ctx = new_sd_ctx(&cp);
    if (!g_ctx) { __android_log_print(ANDROID_LOG_ERROR, TAG, "new_sd_ctx failed"); return JNI_FALSE; }
    g_path = path;
    return JNI_TRUE;
}

extern "C" JNIEXPORT void JNICALL
Java_com_daesinnam_localai_ImageGen_nFree(JNIEnv*, jclass) {
    std::lock_guard<std::mutex> lk(g_mu);
    if (g_ctx) { free_sd_ctx(g_ctx); g_ctx = nullptr; g_path.clear(); }
}

extern "C" JNIEXPORT void JNICALL
Java_com_daesinnam_localai_ImageGen_nCancel(JNIEnv*, jclass) {
    sd_ctx_t* c = g_ctx; // 생성 중에는 잠금을 잡고 있으므로 잠그지 않고 신호만
    if (c) sd_cancel_generation(c, SD_CANCEL_ALL);
}

/** RGB 바이트(width*height*3)를 돌려줌. 실패하면 null */
extern "C" JNIEXPORT jbyteArray JNICALL
Java_com_daesinnam_localai_ImageGen_nGenerate(JNIEnv* env, jclass, jstring jprompt, jstring jneg,
                                              jint w, jint h, jint steps, jfloat cfg, jlong seed) {
    std::lock_guard<std::mutex> lk(g_mu);
    if (!g_ctx) return nullptr;
    sd_cancel_generation(g_ctx, SD_CANCEL_RESET);
    const char* pp = env->GetStringUTFChars(jprompt, nullptr);
    const char* np = env->GetStringUTFChars(jneg, nullptr);
    std::string prompt(pp), neg(np);
    env->ReleaseStringUTFChars(jprompt, pp); env->ReleaseStringUTFChars(jneg, np);

    sd_img_gen_params_t gp; sd_img_gen_params_init(&gp);
    gp.prompt = prompt.c_str();
    gp.negative_prompt = neg.c_str();
    gp.width = w; gp.height = h;
    gp.seed = seed;
    gp.batch_count = 1;
    gp.sample_params.sample_method = LCM_SAMPLE_METHOD;
    gp.sample_params.scheduler = LCM_SCHEDULER;
    gp.sample_params.sample_steps = steps;
    gp.sample_params.guidance.txt_cfg = cfg;

    sd_image_generation_result_t* res = nullptr;
    bool ok = generate_image(g_ctx, &gp, &res);
    if (!ok || !res || res->count < 1 || !res->items[0].image.data) {
        __android_log_print(ANDROID_LOG_ERROR, TAG, "generate failed: %s", ok ? "empty" : "error");
        if (res) free_sd_image_generation_result(res);
        return nullptr;
    }
    sd_image_t& im = res->items[0].image;
    jsize n = (jsize)(im.width * im.height * im.channel);
    jbyteArray out = env->NewByteArray(n);
    env->SetByteArrayRegion(out, 0, n, (const jbyte*)im.data);
    __android_log_print(ANDROID_LOG_INFO, TAG, "image %ux%u ch=%u", im.width, im.height, im.channel);
    free_sd_image_generation_result(res);
    return out;
}
