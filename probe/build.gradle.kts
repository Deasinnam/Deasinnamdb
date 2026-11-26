plugins { java }
repositories { google(); mavenCentral() }
val aar by configurations.creating
dependencies { aar("com.google.ai.edge.litertlm:litertlm-android:latest.release") }
tasks.register("dump") {
    doLast {
        aar.resolvedConfiguration.resolvedArtifacts.forEach { println("ART " + it.moduleVersion.id + " " + it.file) }
    }
}
