# Water Reporting Project

This project consists of a mobile application, an admin web dashboard, and a backend API to manage water issue reports. It uses Prisma for database migrations and as an ORM for the backend API, connecting to a PostgreSQL database. Supabase is used for authentication and file storage.

## Project Structure

-   `/admin-dahsboard`: React (Vite) application for the admin web dashboard.
-   `/mobile_app`: Expo (React Native) application for mobile users.
-   `/api`: Node.js (Express.js) backend API that serves both frontends.
-   `/prisma`: Contains Prisma schema and migration files.

## Prerequisites

-   Node.js (v16 or later recommended)
-   npm or yarn
-   Access to a PostgreSQL database (e.g., a Supabase project)
-   Supabase project for Authentication and Storage.

## Setup Instructions

1.  **Clone the Repository:**
    ```bash
    git clone <repository-url>
    cd <repository-name>
    ```

2.  **Root Project Setup:**
    *   Install root dependencies (Prisma CLI, dotenv-cli for running scripts if any):
        ```bash
        npm install
        ```
    *   **Configure Root Environment Variables:**
        Create a `.env` file in the project root by copying `.env.example`:
        ```bash
        cp .env.example .env
        ```
        Edit the root `.env` file and set your `DATABASE_URL` for Prisma migrations. This URL points to your PostgreSQL database.
        Example for Supabase: `DATABASE_URL="postgresql://postgres:[YOUR-DB-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"`

3.  **Backend API Setup (`/api`):**
    *   Navigate to the API directory:
        ```bash
        cd api
        ```
    *   Install API dependencies:
        ```bash
        npm install
        ```
    *   **Configure API Environment Variables:**
        Create an `.env` file in the `api/` directory by copying `api/.env.example`:
        ```bash
        cp .env.example .env
        ```
        Edit `api/.env` and set:
        -   `DATABASE_URL`: Same PostgreSQL connection string as in the root `.env`.
        -   `SUPABASE_URL`: Your Supabase project URL (e.g., `https://your-project-ref.supabase.co`).
        -   `SUPABASE_ANON_KEY`: Your Supabase project's public anon key.
        -   `PORT` (optional, defaults to 3001).
    *   Navigate back to the root directory:
        ```bash
        cd ..
        ```

4.  **Admin Dashboard Setup (`/admin-dahsboard`):**
    *   Navigate to the admin dashboard directory:
        ```bash
        cd admin-dahsboard
        ```
    *   Install admin dashboard dependencies:
        ```bash
        npm install
        ```
    *   **Configure Admin Dashboard Environment Variables:**
        Create a `.env` file in the `admin-dahsboard/` directory (usually by copying `admin-dahsboard/.env.example` if it exists, or based on its Supabase client setup).
        Set the following for Supabase client:
        -   `VITE_SUPABASE_URL`: Your Supabase project URL.
        -   `VITE_SUPABASE_ANON_KEY`: Your Supabase project's public anon key.
        *(Ensure these match the variables expected in `admin-dahsboard/src/lib/supabase.ts`)*
    *   Navigate back to the root directory:
        ```bash
        cd ..
        ```

5.  **Mobile App Setup (`/mobile_app`):**
    *   Navigate to the mobile app directory:
        ```bash
        cd mobile_app
        ```
    *   Install mobile app dependencies:
        ```bash
        npm install
        ```
    *   **Configure Mobile App Environment Variables:**
        Create a `.env` file in the `mobile_app/` directory (usually by copying `mobile_app/.env.example` if it exists, or based on its Supabase client setup).
        Set the following for Supabase client:
        -   `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase project URL.
        -   `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase project's public anon key.
        *(Ensure these match the variables expected in `mobile_app/lib/supabase.ts`)*
    *   Navigate back to the root directory:
        ```bash
        cd ..
        ```

6.  **Database Migration:**
    *   Run Prisma migrations to set up your database schema. Ensure your `DATABASE_URL` in the root `.env` file is correctly configured.
        ```bash
        npx prisma migrate dev --name init
        ```
        *(If you've already run an initial migration, this might try to create a new one or inform you that the DB is up to date.)*
    *   Generate Prisma Client (should be done automatically by `migrate dev`, but can be run manually):
        ```bash
        npx prisma generate
        ```

## Running the Project

You'll typically need to run the Backend API, Admin Dashboard, and Mobile App simultaneously in different terminal sessions.

1.  **Run the Backend API:**
    ```bash
    cd api
    npm run dev
    ```
    The API server should start, usually on `http://localhost:3001`.

2.  **Run the Admin Dashboard:**
    ```bash
    cd admin-dahsboard
    npm run dev
    ```
    The admin dashboard should open in your browser, usually at `http://localhost:5173` (or another port specified by Vite).

3.  **Run the Mobile App:**
    ```bash
    cd mobile_app
    npm start
    ```
    This will start the Expo development server. You can then run the app on a simulator/emulator or scan the QR code with the Expo Go app on your physical device.

## Database Schema Changes (Future Migrations)

1.  Modify your schema in `prisma/schema.prisma`.
2.  Create a new migration:
    ```bash
    npx prisma migrate dev --name your_migration_name
    ```
    This will generate SQL migration files and apply them to your development database.
3.  Commit the changes in the `prisma/migrations` directory and `prisma/schema.prisma`.
4.  To apply migrations to staging or production, use:
    ```bash
    npx prisma migrate deploy
    ```

## Notes

-   Ensure the API URL (e.g., `http://localhost:3001/api`) is correctly configured in the frontend applications where they make `fetch` calls. Currently, it's hardcoded in `admin-dahsboard/src/pages/Reports.tsx` and should ideally be an environment variable.
-   The `.env` files contain sensitive credentials and should **never** be committed to version control. Ensure they are listed in the relevant `.gitignore` files (root `.gitignore` should cover the root `.env`, and ideally each sub-project has its own `.gitignore` for its specific `.env`).
-   This README provides basic setup. Refer to individual sub-project READMEs (if they exist) for more detailed information.
```
