package com.example.waterreporter

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.example.waterreporter.auth.AuthScreen
import com.example.waterreporter.auth.AuthViewModel
import com.example.waterreporter.report.ReportScreen
import com.example.waterreporter.report.ViewReportsScreen // Import for ViewReportsScreen
import com.example.waterreporter.ui.theme.WaterReporterTheme
import com.example.waterreporter.utils.SupabaseManager
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            WaterReporterTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    AppNavigation()
                }
            }
        }
    }
}

@Composable
fun AppNavigation(authViewModel: AuthViewModel = viewModel()) {
    val navController = rememberNavController()
    val userSession by SupabaseManager.client.auth.sessionStatus.collectAsState()
    val coroutineScope = rememberCoroutineScope()

    // Attempt to load user session on app start
    LaunchedEffect(Unit) {
        authViewModel.getCurrentSession()
    }

    NavHost(navController = navController, startDestination = "splash") {
        composable("splash") {
            // Simple splash or loading indicator
            Text("Loading...")
            LaunchedEffect(userSession) {
                when (userSession) {
                    is io.github.jan.supabase.gotrue.SessionStatus.Authenticated -> {
                        navController.navigate("main") { popUpTo("splash") { inclusive = true } }
                    }
                    is io.github.jan.supabase.gotrue.SessionStatus.NotAuthenticated -> {
                        navController.navigate("auth") { popUpTo("splash") { inclusive = true } }
                    }
                    else -> { /* Handle loading or initial state */ }
                }
            }
        }
        composable("auth") {
            AuthScreen(
                authViewModel = authViewModel,
                onLoginSuccess = {
                    coroutineScope.launch {
                        // Session status will update, triggering navigation from splash logic if still there
                        // or directly navigate if splash is already popped
                        navController.navigate("main") {
                            popUpTo("auth") { inclusive = true }
                        }
                    }
                }
            )
        }
        composable("main") { // This will now be the ViewReportsScreen
            ViewReportsScreen(
                onNavigateToCreateReport = { navController.navigate("create_report") }
            )
        }
        composable("create_report") {
            ReportScreen() // This is our existing screen for creating reports
        }
    }
}

@Preview(showBackground = true)
@Composable
fun DefaultPreview() {
    WaterReporterTheme {
        // For preview, you might want to show a specific screen
        // For now, it will try to run AppNavigation which might be complex for preview
        // Consider creating a simpler preview if needed.
        Text("App Preview - Navigation will handle screen display")
    }
}
