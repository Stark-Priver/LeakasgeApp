package com.example.waterreporter.auth

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AuthScreen(
    authViewModel: AuthViewModel = viewModel(),
    onLoginSuccess: () -> Unit
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var emailError by remember { mutableStateOf<String?>(null) }
    var passwordError by remember { mutableStateOf<String?>(null) }
    val authState by authViewModel.authState.collectAsState()
    var showVerificationMessage by remember { mutableStateOf(false) }


    // Navigate on successful login
    LaunchedEffect(authState) {
        if (authState is AuthState.Success) {
            val successMessage = (authState as AuthState.Success).message
            if (successMessage == "Sign in successful") {
                showVerificationMessage = false
                onLoginSuccess()
            } else if (successMessage.contains("Sign up successful")) {
                showVerificationMessage = true
            }
        } else if (authState is AuthState.Error || authState is AuthState.Idle) {
            showVerificationMessage = false // Clear verification message if there's an error or idle state
        }
    }

    fun validateFields(): Boolean {
        emailError = if (email.isBlank() || !android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            "Invalid email address."
        } else {
            null
        }
        passwordError = if (password.length < 6) { // Supabase default minimum password length
            "Password must be at least 6 characters."
        } else {
            null
        }
        return emailError == null && passwordError == null
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("Water Reporter Login", style = MaterialTheme.typography.headlineMedium)
        Spacer(modifier = Modifier.height(24.dp))

        OutlinedTextField(
            value = email,
            onValueChange = { email = it; emailError = null },
            label = { Text("Email") },
            modifier = Modifier.fillMaxWidth(),
            isError = emailError != null,
            singleLine = true
        )
        emailError?.let { Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall) }
        Spacer(modifier = Modifier.height(8.dp))

        OutlinedTextField(
            value = password,
            onValueChange = { password = it; passwordError = null },
            label = { Text("Password") },
            visualTransformation = PasswordVisualTransformation(),
            modifier = Modifier.fillMaxWidth(),
            isError = passwordError != null,
            singleLine = true
        )
        passwordError?.let { Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall) }
        Spacer(modifier = Modifier.height(16.dp))

        if (showVerificationMessage && authState is AuthState.Success) {
            Text(
                text = (authState as AuthState.Success).message, // This will be the "Sign up successful! Please check..."
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.padding(bottom = 8.dp)
            )
        } else {
            when (authState) {
                is AuthState.Loading -> {
                    CircularProgressIndicator()
                }
                is AuthState.Error -> {
                    Text(
                        text = (authState as AuthState.Error).message,
                        color = MaterialTheme.colorScheme.error,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                }
                // Success case for login is handled by navigation, signup success by showVerificationMessage
                // Idle state shows nothing here
                else -> {}
            }
        }

        Button(
            onClick = {
                if (validateFields()) {
                    authViewModel.signIn(email, password)
                }
            },
            modifier = Modifier.fillMaxWidth(),
            enabled = authState !is AuthState.Loading
        ) {
            Text("Sign In")
        }
        Spacer(modifier = Modifier.height(8.dp))
        Button(
            onClick = {
                if (validateFields()) {
                    authViewModel.signUp(email, password)
                }
            },
            modifier = Modifier.fillMaxWidth(),
            enabled = authState !is AuthState.Loading,
            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary)
        ) {
            Text("Sign Up")
        }
    }
}
