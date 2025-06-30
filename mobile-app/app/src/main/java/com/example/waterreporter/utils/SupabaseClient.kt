package com.example.waterreporter.utils

import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.gotrue.GoTrue
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.storage.Storage

// These would ideally be loaded from local.properties or buildConfig
// For now, placeholders. They will be replaced by actual values during app initialization.
const val SUPABASE_URL_PLACEHOLDER = "YOUR_SUPABASE_URL"
const val SUPABASE_ANON_KEY_PLACEHOLDER = "YOUR_SUPABASE_ANON_KEY"

object SupabaseManager {
    private var _client: SupabaseClient? = null

    val client: SupabaseClient
        get() = _client ?: throw IllegalStateException("Supabase client not initialized. Call initialize() first.")

    fun initialize(url: String, apiKey: String) {
        if (_client == null) {
            _client = createSupabaseClient(
                supabaseUrl = url,
                supabaseKey = apiKey
            ) {
                install(GoTrue)
                install(Postgrest)
                install(Storage)
                // Add any other plugins you need, e.g., Realtime
            }
        }
    }
}

// Example usage (conceptual, actual initialization happens in Application class or MainActivity)
// fun getSupabaseClient(): SupabaseClient {
//     SupabaseManager.initialize( BuildConfig.SUPABASE_URL, BuildConfig.SUPABASE_ANON_KEY)
//     return SupabaseManager.client
// }
