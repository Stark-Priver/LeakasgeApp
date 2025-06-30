package com.example.waterreporter.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.waterreporter.utils.SupabaseManager
import io.github.jan.supabase.gotrue.auth
import io.github.jan.supabase.gotrue.providers.builtin.Email
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class AuthViewModel : ViewModel() {

    private val supabaseClient = SupabaseManager.client

    private val _authState = MutableStateFlow<AuthState>(AuthState.Idle)
    val authState: StateFlow<AuthState> = _authState

    private val _currentUserEmail = MutableStateFlow<String?>(null)
    // val currentUserEmail: StateFlow<String?> = _currentUserEmail // If needed publicly

    // Function to check current session status (can be called from MainActivity or a splash screen)
    fun getCurrentSession() {
        viewModelScope.launch {
            supabaseClient.auth.sessionStatus.collect { status ->
                when (status) {
                    is io.github.jan.supabase.gotrue.SessionStatus.Authenticated -> {
                        _currentUserEmail.value = status.session.user?.email
                        // User is logged in, potentially update UI or navigate
                    }
                    is io.github.jan.supabase.gotrue.SessionStatus.NotAuthenticated -> {
                        _currentUserEmail.value = null
                        // User is not logged in
                    }
                    io.github.jan.supabase.gotrue.SessionStatus.LoadingFromStorage -> {
                        // Session is being loaded
                    }
                    is io.github.jan.supabase.gotrue.SessionStatus.NetworkError -> {
                        // Network error while checking session
                         _authState.value = AuthState.Error("Network error: ${status.exception.message}")
                    }
                }
            }
        }
    }


    fun signUp(email: String, password: String) {
        viewModelScope.launch {
            _authState.value = AuthState.Loading
            try {
                supabaseClient.auth.signUpWith(Email) {
                    this.email = email
                    this.password = password
                }
                _authState.value = AuthState.Success("Sign up successful! Please check your email for verification.")
                // Supabase might require email verification. Handle this flow.
            } catch (e: Exception) {
                _authState.value = AuthState.Error(e.message ?: "Sign up failed")
            }
        }
    }

    fun signIn(email: String, password: String) {
        viewModelScope.launch {
            _authState.value = AuthState.Loading
            try {
                supabaseClient.auth.signInWith(Email) {
                    this.email = email
                    this.password = password
                }
                _authState.value = AuthState.Success("Sign in successful")
                _currentUserEmail.value = supabaseClient.auth.currentUserOrNull()?.email
            } catch (e: Exception) {
                _authState.value = AuthState.Error(e.message ?: "Sign in failed")
            }
        }
    }

    fun signOut() {
        viewModelScope.launch {
            _authState.value = AuthState.Loading
            try {
                supabaseClient.auth.signOut()
                _authState.value = AuthState.Idle // Or a specific "SignedOut" state
                _currentUserEmail.value = null
            } catch (e: Exception) {
                _authState.value = AuthState.Error(e.message ?: "Sign out failed")
            }
        }
    }
}

sealed class AuthState {
    object Idle : AuthState()
    object Loading : AuthState()
    data class Success(val message: String) : AuthState()
    data class Error(val message: String) : AuthState()
}
