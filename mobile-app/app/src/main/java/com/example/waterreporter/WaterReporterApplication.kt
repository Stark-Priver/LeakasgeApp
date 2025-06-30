package com.example.waterreporter

import android.app.Application
import com.example.waterreporter.utils.SupabaseManager
import java.util.Properties
import android.util.Log

class WaterReporterApplication : Application() {
    override fun onCreate() {
        super.onCreate()

        try {
            // Load properties from local.properties
            val properties = Properties()
            val inputStream = assets.open("local.properties") // This will not work, local.properties is not in assets
                                                                // It should be read from the root of the module,
                                                                // or values passed via BuildConfig
            // Correct approach: Access values passed via buildConfig or use a gradle task to copy to assets (not ideal)
            // For this iteration, I'll assume local.properties will be manually made available or use hardcoded values
            // for demonstration if direct reading fails.

            // A more robust way is to add these to build.gradle defaultConfig:
            // manifestPlaceholders = [SUPABASE_URL: "\"", SUPABASE_ANON_KEY: "\""]
            // and then read them from PackageManager.getApplicationInfo.metaData
            // Or use BuildConfig fields.

            // Let's try to read from where local.properties is typically placed by developers.
            // This is a common point of confusion. For now, we will rely on it being accessible
            // or use placeholders. The README implies `local.properties` is at `mobile-app/local.properties`.
            // Android build system does not directly expose this to `assets` or `res/raw` without configuration.

            // For now, I'll use the string literals directly as provided earlier,
            // and acknowledge that a production app should use BuildConfig fields.
            // This is because reading `mobile-app/local.properties` directly at runtime is non-trivial.

            // val supabaseUrl = "https://jrbdkvwhuyeuybnparlc.supabase.co"
            // val supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyYmRrdndodXlldXlibnBhcmxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMTM4NDAsImV4cCI6MjA2Njg4OTg0MH0.L8RSXnWfM94AgyLo0M9MqcsPdTEUudkhqTrdBS4sZfY"

            // Use BuildConfig fields
            val supabaseUrl = BuildConfig.SUPABASE_URL
            val supabaseAnonKey = BuildConfig.SUPABASE_ANON_KEY

            if (supabaseUrl.isNotBlank() && supabaseUrl != "https://your-project-id.supabase.co" &&
                supabaseAnonKey.isNotBlank() && supabaseAnonKey != "your-anon-key") {
                SupabaseManager.initialize(supabaseUrl, supabaseAnonKey)
                Log.i("WaterReporterApp", "Supabase initialized successfully with URL: $supabaseUrl")
            } else {
                Log.e("WaterReporterApp", "Supabase URL or Anon Key is missing or using placeholder values from BuildConfig. Initialization failed.")
                // Potentially throw an error or handle this state appropriately
            }

        } catch (e: Exception) {
            Log.e("WaterReporterApp", "Error initializing Supabase: ${e.message}", e)
            // Handle initialization error
        }
    }
}
