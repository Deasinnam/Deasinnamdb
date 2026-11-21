# 화면(JS)에서 부르는 다리 메서드는 이름을 줄이지 않음
-keepclassmembers class com.daesinnam.tableorder.MainActivity$Bridge {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface
