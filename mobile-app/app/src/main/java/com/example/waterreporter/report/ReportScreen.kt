package com.example.waterreporter.report

import android.Manifest
import android.content.Context
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import coil.compose.rememberAsyncImagePainter
import com.google.accompanist.permissions.*

@OptIn(ExperimentalMaterial3Api::class, ExperimentalPermissionsApi::class)
@Composable
fun ReportScreen(reportViewModel: ReportViewModel = viewModel()) {
    val context = LocalContext.current
    val formState by reportViewModel.reportFormState
    val submissionResult by reportViewModel.submissionResult.collectAsState()

    // Initialize location client
    LaunchedEffect(Unit) {
        reportViewModel.initLocationClient(context)
    }

    // Permission states
    val locationPermissionsState = rememberMultiplePermissionsState(
        permissions = listOf(
            Manifest.permission.ACCESS_COARSE_LOCATION,
            Manifest.permission.ACCESS_FINE_LOCATION
        )
    )
    val cameraPermissionState = rememberPermissionState(Manifest.permission.CAMERA)
    // For gallery access, on API 33+ READ_MEDIA_IMAGES, below READ_EXTERNAL_STORAGE
    // For simplicity, focusing on camera first, gallery uses different contract.

    // Image picker launcher
    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        reportViewModel.updateImageUri(uri)
    }

    // Camera launcher
    // Temporary URI for camera photo
    var tempCameraUri by remember { mutableStateOf<Uri?>(null) }
    // This needs a FileProvider setup in AndroidManifest.xml and res/xml/file_paths.xml for production
    // For now, we'll just try to get a URI, but saving to shared storage is complex.
    val cameraLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.TakePicture()
    ) { success: Boolean ->
        if (success) {
            reportViewModel.updateImageUri(tempCameraUri)
        }
    }


    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("Report Water Issue", style = MaterialTheme.typography.headlineMedium)
        Spacer(modifier = Modifier.height(16.dp))

        // Issue Type Dropdown
        IssueTypeDropdown(
            selectedType = formState.issueType,
            onTypeSelected = { reportViewModel.updateIssueType(it) }
        )
        Spacer(modifier = Modifier.height(8.dp))

        // Severity Dropdown
        SeverityDropdown(
            selectedSeverity = formState.severity,
            onSeveritySelected = { reportViewModel.updateSeverity(it) }
        )
        Spacer(modifier = Modifier.height(8.dp))

        // Description
        OutlinedTextField(
            value = formState.description,
            onValueChange = { reportViewModel.updateDescription(it) },
            label = { Text("Description") },
            modifier = Modifier.fillMaxWidth(),
            minLines = 3
        )
        Spacer(modifier = Modifier.height(16.dp))

        // Location
        Text("Location: ${formState.latitude ?: "N/A"}, ${formState.longitude ?: "N/A"}")
        Button(onClick = {
            if (locationPermissionsState.allPermissionsGranted) {
                reportViewModel.fetchCurrentLocation(context)
            } else {
                locationPermissionsState.launchMultiplePermissionRequest()
            }
        }) {
            Text("Get Current Location")
        }
        PermissionRationaleDialog(permissionsState = locationPermissionsState)
        Spacer(modifier = Modifier.height(16.dp))


        // Image Preview
        formState.imageUri?.let {
            Image(
                painter = rememberAsyncImagePainter(model = it),
                contentDescription = "Selected image",
                modifier = Modifier
                    .size(150.dp)
                    .padding(bottom = 8.dp)
            )
        }

        // Photo Upload Buttons
        Row(horizontalArrangement = Arrangement.SpaceEvenly, modifier = Modifier.fillMaxWidth()) {
            Button(onClick = { imagePickerLauncher.launch("image/*") }) {
                Text("From Gallery")
            }
            Button(onClick = {
                if (cameraPermissionState.status.isGranted) {
                    // Create a temporary file URI for the camera to write to
                    // This is a simplified version. Production needs FileProvider.
                    tempCameraUri = ComposeFileProvider.getImageUri(context) // Helper to create URI
                    cameraLauncher.launch(tempCameraUri)
                } else {
                    cameraPermissionState.launchPermissionRequest()
                }
            }) {
                Text("From Camera")
            }
        }
        PermissionRationaleDialog(permissionState = cameraPermissionState, rationaleText = "Camera access is needed to take photos for the report.")
        Spacer(modifier = Modifier.height(24.dp))

        // Submission Status and Button
        if (formState.isLoading) {
            CircularProgressIndicator()
        } else {
            Button(
                onClick = {
                    // Here, if imageUri is present, actual upload to Supabase Storage should happen.
                    // This is a complex part. For now, ViewModel assumes it gets uploaded.
                    // We'll refine this part.
                    reportViewModel.submitReport()
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = formState.issueType.isNotBlank() && formState.description.isNotBlank() && !formState.isLoading
            ) {
                Text("Submit Report")
            }
        }

        submissionResult?.let {
            val messageColor = if (formState.submissionStatus == SubmissionStatus.Error) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary
            Text(
                text = it,
                color = messageColor,
                modifier = Modifier.padding(top = 8.dp)
            )
        }
    }
}

@Composable
fun IssueTypeDropdown(selectedType: String, onTypeSelected: (String) -> Unit) {
    val issueTypes = listOf("Water Leakage", "Contamination/Discoloration", "No Water", "Low Pressure", "Other")
    var expanded by remember { mutableStateOf(false) }
    var currentSelection by remember { mutableStateOf(selectedType.ifBlank { "Select Issue Type" }) }

    LaunchedEffect(selectedType) {
        currentSelection = selectedType.ifBlank { "Select Issue Type" }
    }

    Box {
        OutlinedTextField(
            value = currentSelection,
            onValueChange = { },
            readOnly = true,
            label = { Text("Issue Type") },
            trailingIcon = { Icon(Icons.Filled.ArrowDropDown, "Dropdown", Modifier.clickable { expanded = !expanded }) },
            modifier = Modifier
                .fillMaxWidth()
                .clickable { expanded = !expanded }
        )
        DropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false },
            modifier = Modifier.fillMaxWidth()
        ) {
            issueTypes.forEach { type ->
                DropdownMenuItem(
                    text = { Text(type) },
                    onClick = {
                        onTypeSelected(type)
                        currentSelection = type
                        expanded = false
                    }
                )
            }
        }
    }
}

@Composable
fun SeverityDropdown(selectedSeverity: String, onSeveritySelected: (String) -> Unit) {
    val severityLevels = listOf("Low", "Medium", "High", "Critical")
    var expanded by remember { mutableStateOf(false) }
    var currentSelection by remember(selectedSeverity) { mutableStateOf(selectedSeverity) }


    Box {
        OutlinedTextField(
            value = currentSelection,
            onValueChange = { },
            readOnly = true,
            label = { Text("Severity Level") },
            trailingIcon = { Icon(Icons.Filled.ArrowDropDown, "Dropdown", Modifier.clickable { expanded = !expanded }) },
            modifier = Modifier
                .fillMaxWidth()
                .clickable { expanded = !expanded }
        )
        DropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false },
            modifier = Modifier.fillMaxWidth()
        ) {
            severityLevels.forEach { level ->
                DropdownMenuItem(
                    text = { Text(level) },
                    onClick = {
                        onSeveritySelected(level)
                        currentSelection = level
                        expanded = false
                    }
                )
            }
        }
    }
}


@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun PermissionRationaleDialog(
    permissionsState: MultiplePermissionsState,
    rationaleText: String = "This permission is important for the app functionality. Please grant it."
) {
    if (permissionsState.shouldShowRationale) {
        AlertDialog(
            onDismissRequest = { /* User dismissed the dialog */ },
            title = { Text("Permission Required") },
            text = { Text(rationaleText) },
            confirmButton = {
                Button(onClick = { permissionsState.launchMultiplePermissionRequest() }) {
                    Text("Grant Permission")
                }
            },
            dismissButton = {
                 Button(onClick = { /* User declined */ }) {
                    Text("Dismiss")
                }
            }
        )
    }
}

@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun PermissionRationaleDialog(
    permissionState: PermissionState,
    rationaleText: String = "This permission is important for the app functionality. Please grant it."
) {
    if (permissionState.status.shouldShowRationale) {
        AlertDialog(
            onDismissRequest = { /* User dismissed the dialog */ },
            title = { Text("Permission Required") },
            text = { Text(rationaleText) },
            confirmButton = {
                Button(onClick = { permissionState.launchPermissionRequest() }) {
                    Text("Grant Permission")
                }
            },
            dismissButton = {
                 Button(onClick = { /* User declined */ }) {
                    Text("Dismiss")
                }
            }
        )
    }
}

import androidx.core.content.FileProvider
import java.io.File

// Helper to create URI for camera using FileProvider.
object ComposeFileProvider {
    fun getImageUri(context: Context): Uri {
        val directory = File(context.cacheDir, "images")
        directory.mkdirs()
        val file = File.createTempFile(
            "temp_image_${System.currentTimeMillis()}",
            ".jpg",
            directory
        )
        val authority = "${context.packageName}.provider"
        return FileProvider.getUriForFile(context, authority, file)
    }
}
}
