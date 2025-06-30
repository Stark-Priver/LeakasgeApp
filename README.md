

```markdown
# 💧 Water Quality Issues Reporting System

A full-stack mobile and web solution for reporting and managing community-based water-related issues like leakages and water contamination. This project consists of:

- A **Kotlin Android app** built with **Jetpack Compose UI**
- A **React + Vite admin dashboard**
- A **shared Supabase backend** for authentication, database, and image storage

This documentation serves as a complete guide for setting up, running, and understanding the core architecture, making it easy for contributors (e.g., Jules) to get started quickly.

---

## 📱 Mobile App – Kotlin + Jetpack Compose

### ✅ Features

- **User Authentication**
  - Supabase Auth with email/password login
  - Secure JWT session handling

- **Issue Reporting Workflow**
  - Users can report:
    - Water leakages
    - Contamination or discoloration
    - Other related issues
  - Input fields include:
    - **Issue Type**
    - **Severity Level** (Low, Medium, High, Critical)
    - **Textual Description**
    - **Photo Upload** via Camera or Gallery (Camera integration uses Android's `ActivityResultContracts.TakePicture` which simplifies CameraX usage.)
    - **Real-time GPS Location** (Coordinates are fetched using Fused Location Provider and saved to the database. Embedding GPS in image EXIF metadata is a potential future enhancement.)

- **Image Capture**
  - Utilizes Android's Activity Result APIs for camera capture, which may use CameraX internally.
  - Images are saved and uploaded to Supabase Storage.

- **Geo-Tagging**
  - Uses Fused Location Provider to get device location.
  - Coordinates are saved to the Supabase Database alongside the report. (Note: Embedding coordinates directly into image EXIF metadata is not currently implemented).

- **Report Viewer**
  - Users can view the status of all their submitted reports
  - Reports show location, timestamp, and image preview

---

### 📂 Mobile Project Structure

```

mobile-app/
├── app/
│   └── src/main/java/com/example/waterreporter/
│       ├── auth/          # Login, Register
│       ├── report/        # Create & view reports
│       ├── components/    # Reusable Jetpack Compose components
│       ├── utils/         # Supabase client, Location utils, etc.
│       └── MainActivity.kt
├── build.gradle.kts
└── local.properties

````

---

### 🧪 Dependencies

```kotlin
// Core
implementation("androidx.compose.ui:ui")
implementation("androidx.navigation:navigation-compose")
implementation("io.github.jan-tennert.supabase:supabase-kt-android:1.3.3")

// Location
implementation("com.google.android.gms:play-services-location")

// Image & Camera
implementation("androidx.camera:camera-camera2:1.1.0")
implementation("androidx.camera:camera-lifecycle:1.1.0")
implementation("androidx.camera:camera-view:1.0.0-alpha32")
implementation("io.coil-kt:coil-compose:2.2.2")

// Permissions
implementation("com.google.accompanist:accompanist-permissions:0.31.1-alpha")
````

---

## 🌐 Web Admin Dashboard – React + Vite

### ✅ Features

* **Secure Admin Login** via Supabase
* **Dashboard View**:

  * Table of all reported issues with filters by severity or status. (Filtering by date is a potential future enhancement.)
  * Clickable rows to open a full report detail.
* **Status Management**:

  * Admin can update report status (e.g. Pending → Resolved)
* **Image + Location**:

  * View uploaded photo
  * Display map with coordinates using Leaflet or Google Maps

---

### 📂 Web Project Structure

```
admin-dashboard/
├── public/
├── src/
│   ├── components/      # UI components
│   ├── pages/           # Login, Dashboard, Report Detail
│   ├── services/        # Supabase service
│   └── App.tsx
├── .env
├── vite.config.ts
└── package.json
```

---

### 🧪 Dependencies

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.11.0",
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1",
    "tailwindcss": "^3.4.1"
  }
}
```

---

## 📦 Shared Supabase Backend

* **Authentication**

  * Supabase Auth used in both mobile and web
* **Database (PostgreSQL)**

```sql
-- users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- water_issues
CREATE TABLE water_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type TEXT,
  description TEXT,
  severity TEXT,
  image_url TEXT,
  latitude FLOAT,
  longitude FLOAT,
  status TEXT DEFAULT 'Pending',
  timestamp TIMESTAMP DEFAULT now()
);
```

* **Storage**

  * Bucket: `water_issues_images`
  * Image access: Authenticated users upload images to a path corresponding to their user ID (e.g., `auth.uid()/image_name.ext`). This is enforced by Storage RLS policies. For images to be viewable in the app and admin panel, the `water_issues_images` bucket (or relevant paths like `/public/*` if images are stored there, though current setup is `user_id/*`) should be configured for public read access, or your application logic would need to generate signed URLs if the bucket is private. The current implementation uses public URLs.
    * **Note on Bucket Access:** For the current setup (using `publicUrl()`): In your Supabase dashboard, navigate to **Storage** > **Policies**. Select the `water_issues_images` bucket. Ensure there's a policy allowing public read access (SELECT) for all files or specifically for files under user folders if you want more granularity (e.g., `(bucket_id = 'water_issues_images') AND ((storage.foldername(name))[1] = auth.uid()::text)` for owner-only read, or a simpler public read policy). A common approach for public images is to have no SELECT RLS, or a policy that allows SELECT for `anon` or `authenticated` roles. The upload (INSERT) policy is already restrictive.

* **Row-Level Security (RLS)** for Database:

```sql
-- Only allow users to access their own reports
CREATE POLICY "Users can insert their own reports"
ON water_issues FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own reports"
ON water_issues FOR SELECT
USING (auth.uid() = user_id);
```

---

## ⚙️ Environment Setup

### 📲 Android App

1. Clone:

   ```bash
   git clone https://github.com/your-org/water-issues-mobile.git
   ```

2. Add `local.properties`:

   ```
   SUPABASE_URL=https://yourproject.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   ```

3. Open in Android Studio and run on a device/emulator

---

### 🖥️ Admin Dashboard

1. Clone:

   ```bash
   git clone https://github.com/your-org/water-issues-dashboard.git
   cd water-issues-dashboard
   ```

2. Create `.env`:

   ```
   VITE_SUPABASE_URL=https://yourproject.supabase.co
   VITE_SUPABASE_KEY=your-service-role-key
   ```

3. Install dependencies & run:

   ```bash
   npm install
   npm run dev
   ```

---

## 🔐 Access Control

* **Mobile App**

  * Users must log in to submit/view reports
  * RLS restricts access to own data

* **Admin Panel**

  * Admin uses service role key to access all reports
  * Admin can modify report status and view all data

---

## 📌 Future Enhancements

* Push notifications for report updates
* Offline caching and sync for remote users
* Multilingual UI (English + Swahili)
* AI-enhanced image processing (optional future feature)

---

## 📄 License

MIT License © 2025 — Your Organization

---

## 📚 References

* [Supabase Docs](https://supabase.com/docs)
* [Jetpack Compose](https://developer.android.com/jetpack/compose)
* [CameraX Guide](https://developer.android.com/training/camerax)
* [Leaflet Maps](https://leafletjs.com/)
* [Vite + React Docs](https://vitejs.dev/guide/)

```

---
```
