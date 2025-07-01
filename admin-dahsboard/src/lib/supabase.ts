import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for the database schema
export interface WaterReport {
  id: string;
  user_id: string;
  issue_type: 'leakage' | 'water_quality_problem' | 'other'; // Standardized
  severity: 'low' | 'medium' | 'high' | 'critical'; // Standardized
  description: string;
  location_address?: string | null; // For manual text address
  latitude?: number | null; // Optional if manual address is provided
  longitude?: number | null; // Optional if manual address is provided
  image_url?: string | null; // Standardized and optional
  status: 'pending' | 'in_progress' | 'resolved'; // Standardized
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  user?: { // This is a joined field, definition seems fine
    email: string;
    full_name?: string;
  };
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: 'user' | 'admin' | 'technician';
  created_at: string;
}