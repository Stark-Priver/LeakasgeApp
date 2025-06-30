# 💧 Water Quality Issues Reporting System

A Kotlin-based mobile app and React-based web admin dashboard for reporting and managing water-related issues such as leakages and water quality concerns. Built using **Supabase** for shared backend services including authentication, database, and file storage.

---

## 📱 Mobile App – Kotlin (Android)

### ✅ Features

- **User Registration and Login**  
  Powered by Supabase Auth with secure JWT-based session handling.

- **Issue Reporting**  
  - Report types: Leakage, Water Quality Problem, etc.
  - Fields: Description, Severity Level (Low, Medium, High, Critical)
  - Image upload from Camera or Gallery
  - GPS-based location embedded into image EXIF
  - Reports are submitted with image and location metadata

- **Report Management**  
  - Users can view their submitted reports and their statuses
  - Real-time status updates from the admin

---

## 🌐 Web Admin Dashboard – React (for Authorities)

### ✅ Features

- **Admin Authentication**  
  Login via Supabase (with role-based access control)

- **Reports Dashboard**  
  - List all reports with filter options (by status, date, severity)
  - View full details of each report: image, map location, description
  - Update report status (e.g., Pending, In Progress, Resolved)

- **Map Integration**  
  - Optional integration with Google Maps or Leaflet to visualize report location

---

## 📦 Shared Backend – Supabase

- **Authentication**  
  Supabase Auth used for both users and admins

- **Database** – PostgreSQL schema shared across apps:
  - `users` – Authenticated users
  - `water_issues` – Submitted issue reports

```sql
-- Table: users
id UUID PRIMARY KEY
email TEXT
created_at TIMESTAMP

-- Table: water_issues
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
type TEXT
description TEXT
severity TEXT
image_url TEXT
latitude FLOAT
longitude FLOAT
status TEXT DEFAULT 'Pending'
timestamp TIMESTAMP DEFAULT now()
Storage
Supabase Storage used for storing uploaded images securely
Images include GPS location embedded as EXIF data

Security Policies

Row Level Security (RLS) ensures users can only access their own data

Admin dashboard uses service role for elevated permissions

⚙️ Tech Stack Summary
Mobile App:
Kotlin + Jetpack Compose

CameraX for image capture

Supabase Kotlin SDK

Android Location APIs

Coil or Glide for image display

Admin Dashboard:
React + Vite or Next.js

Supabase JS SDK

Tailwind CSS or Material UI

Map (Google Maps / Leaflet)

Axios for HTTP requests

Backend:
Supabase (PostgreSQL, Auth, Storage)

Shared DB used by both apps

🚀 Getting Started
📲 Mobile App
Clone the repo:

bash
Copy
Edit
git clone https://github.com/your-org/water-issues-mobile.git
Set up your local.properties:

ini
Copy
Edit
SUPABASE_URL=https://yourproject.supabase.co
SUPABASE_ANON_KEY=your-anon-key
Open in Android Studio and run.

🖥️ Web Admin Dashboard
Clone the repo:

bash
Copy
Edit
git clone https://github.com/your-org/water-issues-dashboard.git
Set up .env:

ini
Copy
Edit
VITE_SUPABASE_URL=https://yourproject.supabase.co
VITE_SUPABASE_KEY=your-service-role-key
Run the dashboard:

arduino
Copy
Edit
npm install
npm run dev
🔐 Access Control
Authenticated users submit reports

Admins can view and manage all reports

Supabase RLS ensures data integrity and privacy

