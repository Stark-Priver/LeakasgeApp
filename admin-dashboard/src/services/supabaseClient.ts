import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY // This should be the service_role key for admin panel

if (!supabaseUrl) {
  console.error("Error: VITE_SUPABASE_URL is not defined in .env file");
  throw new Error("Supabase URL not defined");
}
if (!supabaseAnonKey) {
  console.error("Error: VITE_SUPABASE_KEY is not defined in .env file (this should be Service Role key for Admin)");
  throw new Error("Supabase Key not defined");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // When using Supabase Auth for admin *user* logins (as we are with LoginPage and AuthContext),
    // we want standard session behavior for those users.
    // The fact that supabaseAnonKey is the service_role_key grants this client instance broad DB access,
    // but admin user sessions should still persist and refresh as normal.
    autoRefreshToken: true, // Default, keep user session fresh
    persistSession: true,   // Default, persist user session across browser restarts
    detectSessionInUrl: true, // Default, useful for OAuth or magic links if ever used
  }
});

// Note: The VITE_SUPABASE_KEY is intended to be the service_role key.
// This gives this Supabase client instance full administrative access to the database, bypassing RLS.
// This is a common and accepted pattern for trusted admin dashboards.
// The AuthProvider and LoginPage handle the authentication of the *admin user* to this dashboard application.
// It's crucial that the dashboard application itself is secured (e.g., not publicly accessible, strong admin passwords).

console.log("Supabase client initialized for Admin Dashboard.");
// Heuristic check for the key type based on typical characteristics.
if (supabaseAnonKey && supabaseAnonKey.startsWith("eyJ") && supabaseAnonKey.length > 150) {
  // This looks like a service role key (long JWT).
  console.info("Supabase client is configured with VITE_SUPABASE_KEY that appears to be a Service Role Key, as expected for admin panel backend operations.");
} else if (supabaseAnonKey && supabaseAnonKey.startsWith("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9")) {
  // This looks like a typical anon key prefix.
    console.warn("VITE_SUPABASE_KEY appears to be an ANONYMOUS KEY. For the Admin Panel to have full unrestricted access as intended, this should typically be the SERVICE ROLE KEY. If using anon key, ensure RLS policies grant necessary admin privileges.");
} else {
    console.warn("VITE_SUPABASE_KEY format is unrecognized or potentially incorrect. Ensure it is the SERVICE ROLE KEY for full admin privileges if that is the intended setup.");
}
