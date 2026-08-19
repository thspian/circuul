package com.thspian.circuul

import android.content.Context
import android.os.Handler
import android.os.Looper
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.UUID
import kotlin.concurrent.thread

/**
 * Circuul Android client — Play Install Referrer first, clipboard last.
 * Call [match] on first open; never block the main thread / launch.
 */
object Circuul {
    private const val PREFS = "circuul"
    private const val INSTALL_KEY = "install_id"
    private const val MATCHED_KEY = "matched"

    private var appToken: String = ""
    private var apiBase: String = ""

    fun configure(appToken: String, apiBase: String) {
        this.appToken = appToken
        this.apiBase = apiBase.trimEnd('/')
    }

    fun installId(context: Context): String {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val existing = prefs.getString(INSTALL_KEY, null)
        if (existing != null) return existing
        val id = UUID.randomUUID().toString()
        prefs.edit().putString(INSTALL_KEY, id).apply()
        return id
    }

    fun match(
        context: Context,
        platform: String = "android",
        androidReferrer: String? = null,
        code: String? = null,
        clipboardCode: String? = null,
        gaid: String? = null,
        onResult: ((JSONObject) -> Unit)? = null,
    ) {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        if (prefs.getBoolean(MATCHED_KEY, false)) {
            onResult?.invoke(JSONObject(mapOf("attributed" to false, "reason" to "already_matched")))
            return
        }

        thread {
            val result = try {
                val body = JSONObject()
                    .put("app_token", appToken)
                    .put("platform", platform)
                    .put("install_id", installId(context))
                if (androidReferrer != null) body.put("android_referrer", androidReferrer)
                if (code != null) body.put("code", code)
                if (clipboardCode != null) body.put("clipboard_code", clipboardCode)
                if (gaid != null) body.put("gaid", gaid)

                val conn = (URL("$apiBase/circuul/match").openConnection() as HttpURLConnection)
                conn.requestMethod = "POST"
                conn.setRequestProperty("Content-Type", "application/json")
                conn.doOutput = true
                conn.outputStream.use { it.write(body.toString().toByteArray()) }
                val text = conn.inputStream.bufferedReader().readText()
                val json = JSONObject(text)
                json.optJSONObject("data")
                    ?: JSONObject(mapOf("attributed" to false, "reason" to "invalid_response"))
            } catch (_: Exception) {
                JSONObject(mapOf("attributed" to false, "reason" to "network_error"))
            }

            prefs.edit().putBoolean(MATCHED_KEY, true).apply()
            Handler(Looper.getMainLooper()).post { onResult?.invoke(result) }
        }
    }
}
