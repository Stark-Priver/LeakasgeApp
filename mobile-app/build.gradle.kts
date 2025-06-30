plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.example.waterreporter"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.example.waterreporter"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }

        // Read Supabase URL and Key from local.properties and expose them as BuildConfig fields
        // Assuming local.properties is in the same directory as this build.gradle.kts file (mobile-app/)
        val localProps = java.util.Properties()
        val localPropsFile = project.file("local.properties")
        if (localPropsFile.exists()) {
            localProps.load(java.io.FileInputStream(localPropsFile))
            println("Loaded Supabase credentials from local.properties into buildConfig.")
        } else {
            println("Warning: local.properties not found in mobile-app/. Using placeholder values for BuildConfig.")
            // Attempt to load from root project as a fallback, if it's a common setup for the user
            val rootLocalPropsFile = project.rootProject.file("local.properties")
            if (rootLocalPropsFile.exists()) {
                 println("Found local.properties in root project. Consider placing it in mobile-app/ for this project structure or adjust path in build.gradle.")
                 // localProps.load(java.io.FileInputStream(rootLocalPropsFile)) // Uncomment if you want to use this as fallback
            }
        }

        buildConfigField("String", "SUPABASE_URL", "\"${localProps.getProperty("SUPABASE_URL", "https://your-project-id.supabase.co")}\"")
        buildConfigField("String", "SUPABASE_ANON_KEY", "\"${localProps.getProperty("SUPABASE_ANON_KEY", "your-anon-key")}\"")
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }
    kotlinOptions {
        jvmTarget = "1.8"
    }
    buildFeatures {
        compose = true
    }
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.1" // Ensure this is compatible with your Kotlin version
    }
    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    // Core
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.activity:activity-compose:1.8.2")
    implementation(platform("androidx.compose:compose-bom:2023.08.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.navigation:navigation-compose:2.7.7")

    // Supabase
    implementation("io.github.jan-tennert.supabase:supabase-kt-android:1.3.3") // As per README, ensure this version is correct and exists
    // Check for the latest Supabase Kotlin client version if issues arise, README might be outdated.
    // As of my last update, the official Supabase Kotlin library is recommended:
    // implementation("io.supabase.gotrue:gotrue-kt:2.0.0")
    // implementation("io.supabase.postgrest:postgrest-kt:2.0.0")
    // implementation("io.supabase.storage:storage-kt:2.0.0")
    // For this task, I will stick to the README's specified version.

    // Location
    implementation("com.google.android.gms:play-services-location:21.2.0")

    // Image & Camera
    implementation("androidx.camera:camera-core:1.3.3") // CameraX core
    implementation("androidx.camera:camera-camera2:1.3.3")
    implementation("androidx.camera:camera-lifecycle:1.3.3")
    implementation("androidx.camera:camera-view:1.3.3") // For PreviewView
    implementation("io.coil-kt:coil-compose:2.5.0") // Coil for image loading (updated from 2.2.2 for compatibility)

    // Permissions
    implementation("com.google.accompanist:accompanist-permissions:0.31.5-beta") // Updated from 0.31.1-alpha

    // Testing
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
    androidTestImplementation(platform("androidx.compose:compose-bom:2023.08.00"))
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}
