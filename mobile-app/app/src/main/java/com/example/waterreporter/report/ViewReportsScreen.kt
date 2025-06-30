package com.example.waterreporter.report

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import coil.compose.rememberAsyncImagePainter
import com.example.waterreporter.utils.SupabaseManager // Required for constructing image URLs
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle


@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ViewReportsScreen(
    viewReportsViewModel: ViewReportsViewModel = viewModel(),
    onNavigateToCreateReport: () -> Unit // For a FAB or button to create new report
) {
    val reportsState by viewReportsViewModel.reportsState.collectAsState()

    LaunchedEffect(Unit) {
        viewReportsViewModel.fetchUserReports()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("My Reported Issues") },
                actions = {
                    IconButton(onClick = { viewReportsViewModel.fetchUserReports() }) {
                        Icon(Icons.Filled.Refresh, contentDescription = "Refresh Reports")
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = onNavigateToCreateReport) {
                Text("Report New Issue", modifier = Modifier.padding(horizontal = 16.dp) ) // Or an Icon
            }
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when (val state = reportsState) {
                is ReportsUiState.Loading -> {
                    CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
                }
                is ReportsUiState.Success -> {
                    if (state.reports.isEmpty()) {
                        Text(
                            "You haven't reported any issues yet.",
                            modifier = Modifier.align(Alignment.Center)
                        )
                    } else {
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(16.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(state.reports) { report ->
                                ReportCard(report)
                            }
                        }
                    }
                }
                is ReportsUiState.Error -> {
                    Text(
                        "Error: ${state.message}",
                        color = MaterialTheme.colorScheme.error,
                        modifier = Modifier.align(Alignment.Center)
                    )
                }
            }
        }
    }
}

@Composable
fun ReportCard(report: WaterIssueItem) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            report.image_url?.let { path ->
                // Construct the full public URL for the image
                // The path stored is relative to the bucket.
                // Example: if path is "userid/image.jpg", and bucket is "water_issues_images"
                // Full URL: SUPABASE_URL/storage/v1/object/public/water_issues_images/userid/image.jpg
                val imageUrl = SupabaseManager.client.storage.from("water_issues_images").publicUrl(path)

                Image(
                    painter = rememberAsyncImagePainter(model = imageUrl),
                    contentDescription = "Report image for ${report.type}",
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(180.dp)
                        .clip(MaterialTheme.shapes.medium),
                    contentScale = ContentScale.Crop
                )
                Spacer(modifier = Modifier.height(8.dp))
            }

            Text(
                text = report.type,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text("Severity: ${report.severity}", style = MaterialTheme.typography.bodyMedium)
            Text("Status: ${report.status}", style = MaterialTheme.typography.bodyMedium)
            Text("Description: ${report.description}", style = MaterialTheme.typography.bodySmall, maxLines = 2)

            val formattedTimestamp = remember(report.timestamp) {
                val localDateTime = report.timestamp.toLocalDateTime(TimeZone.currentSystemDefault())
                // Using java.time formatter for better localization if needed
                val formatter = DateTimeFormatter.ofLocalizedDateTime(FormatStyle.MEDIUM)
                localDateTime.toJavaLocalDateTime().format(formatter)
            }
            Text("Reported: $formattedTimestamp", style = MaterialTheme.typography.bodySmall)

            if (report.latitude != null && report.longitude != null) {
                Text(
                    "Location: ${String.format("%.4f", report.latitude)}, ${String.format("%.4f", report.longitude)}",
                    style = MaterialTheme.typography.bodySmall
                )
            }
        }
    }
}

// Helper extension for kotlinx.datetime.LocalDateTime to java.time.LocalDateTime
fun kotlinx.datetime.LocalDateTime.toJavaLocalDateTime(): java.time.LocalDateTime {
    return java.time.LocalDateTime.of(this.year, this.monthNumber, this.dayOfMonth, this.hour, this.minute, this.second, this.nanosecond)
}
