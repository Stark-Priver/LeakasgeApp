export interface User {
  id: string;
  email: string;
  created_at: string;
}

// Represents a water report fetched from the database
export interface WaterReport {
  id: string;
  user_id: string;
  issue_type: 'leakage' | 'water_quality_problem' | 'other';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  image_urls?: string[] | null; // Multiple images are optional
  image_url?: string | null; // Optional: for backward compatibility if needed, but prefer image_urls
  latitude?: number | null; // Optional if manual address is provided
  longitude?: number | null; // Optional if manual address is provided
  location_address?: string | null; // For manually entered address
  status: 'pending' | 'in_progress' | 'resolved';
  created_at: string; // Supabase typically uses created_at
  updated_at?: string;
}

// Represents the data structure for inserting a new water report
export interface WaterReportInsert {
  user_id: string;
  issue_type: 'leakage' | 'water_quality_problem' | 'other';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  image_urls?: string[] | null; // Changed from image_url to image_urls
  latitude?: number | null;
  longitude?: number | null;
  location_address?: string | null;
  // status will likely be set to 'pending' by default on insertion by a trigger or backend logic
}