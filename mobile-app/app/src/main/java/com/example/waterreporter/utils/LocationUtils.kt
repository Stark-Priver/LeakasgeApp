package com.example.waterreporter.utils

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import androidx.core.content.ContextCompat
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import com.google.android.gms.tasks.Task
import android.location.Location

// Placeholder for LocationUtils
// Actual implementation will require more context and error handling

class LocationHelper(private val context: Context) {

    private val fusedLocationClient: FusedLocationProviderClient =
        LocationServices.getFusedLocationProviderClient(context)

    fun getCurrentLocation(onSuccess: (Location) -> Unit, onFailure: (Exception) -> Unit) {
        if (ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.ACCESS_FINE_LOCATION
            ) == PackageManager.PERMISSION_GRANTED || ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.ACCESS_COARSE_LOCATION
            ) == PackageManager.PERMISSION_GRANTED
        ) {
            val locationTask: Task<Location> = fusedLocationClient.lastLocation
            locationTask.addOnSuccessListener { location: Location? ->
                if (location != null) {
                    onSuccess(location)
                } else {
                    // Handle case where location is null (e.g., location services disabled)
                    // For simplicity, calling onFailure, but might need specific handling
                    onFailure(Exception("Last known location is null. Location services might be off or new."))
                }
            }
            locationTask.addOnFailureListener { exception ->
                onFailure(exception)
            }
        } else {
            // This should ideally be handled by requesting permission before calling this function.
            onFailure(SecurityException("Location permission not granted."))
        }
    }
}
