package com.daesinnam.localai

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager

class App : Application() {
    lateinit var models: Models
    lateinit var chats: Chats
    lateinit var ai: Ai

    override fun onCreate() {
        super.onCreate()
        app = this
        models = Models(this)
        chats = Chats(this)
        ai = Ai(this)
        getSystemService(NotificationManager::class.java).createNotificationChannel(
            NotificationChannel(CH_DL, "AI 모델 내려받기", NotificationManager.IMPORTANCE_LOW)
        )
    }

    companion object {
        const val CH_DL = "download"
        lateinit var app: App
    }
}
