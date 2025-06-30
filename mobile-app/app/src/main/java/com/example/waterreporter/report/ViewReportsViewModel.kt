package com.example.waterreporter.report

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.waterreporter.utils.SupabaseManager
import io.github.jan.supabase.gotrue.auth
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Order
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import kotlinx.datetime.Instant
import kotlinx.serialization.Serializable

// Re-defining WaterIssue here for deserialization from DB, including 'id' and 'timestamp'
// Ensure field names match DB columns exactly for deserialization.
@Serializable
data class WaterIssueItem(
    val id: String, // UUID from DB
    val user_id: String,
    val type: String,
    val description: String,
    val severity: String,
    val image_url: String? = null,
    val latitude: Double?,
    val longitude: Double?,
    val status: String,
    val timestamp: Instant // kotlinx-datetime Instant for ISO strings
)

class ViewReportsViewModel : ViewModel() {

    private val _reportsState = MutableStateFlow<ReportsUiState>(ReportsUiState.Loading)
    val reportsState: StateFlow<ReportsUiState> = _reportsState

    fun fetchUserReports() {
        viewModelScope.launch {
            _reportsState.value = ReportsUiState.Loading
            val currentUser = SupabaseManager.client.auth.currentUserOrNull()
            if (currentUser == null) {
                _reportsState.value = ReportsUiState.Error("User not authenticated.")
                return@launch
            }

            try {
                // RLS policy: "Users can view their own reports" ON water_issues FOR SELECT USING (auth.uid() = user_id);
                // So, no explicit .eq("user_id", currentUser.id) filter is needed here if RLS is correctly set up.
                // The Supabase client will automatically apply the RLS based on the authenticated user.
                val reports = SupabaseManager.client.postgrest
                    .from("water_issues")
                    .select {
                        order("timestamp", Order.DESCENDING) // Fetch newest first
                    }
                    .decodeList<WaterIssueItem>()

                _reportsState.value = ReportsUiState.Success(reports)
                Log.d("ViewReportsVM", "Fetched ${reports.size} reports.")

            } catch (e: Exception) {
                Log.e("ViewReportsVM", "Error fetching reports", e)
                _reportsState.value = ReportsUiState.Error("Failed to fetch reports: ${e.message}")
            }
        }
    }
}

sealed class ReportsUiState {
    object Loading : ReportsUiState()
    data class Success(val reports: List<WaterIssueItem>) : ReportsUiState()
    data class Error(val message: String) : ReportsUiState()
}
