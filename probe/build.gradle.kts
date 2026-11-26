plugins { java }
repositories { google(); mavenCentral() }
val aar by configurations.creating
dependencies { aar("com.google.ai.edge.litertlm:litertlm-android:0.20.0") { isTransitive = false } }
tasks.register("dump") { doLast { aar.resolve().forEach { println(it) } } }
