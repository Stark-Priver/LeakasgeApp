import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for the database schema
export interface WaterReport {
  id: string;
  user_id: string;
  issue_type: 'leakage' | 'water_quality' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  photo_url?: string;
  status: 'pending' | 'in_progress' | 'resolved';
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  user?: {
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