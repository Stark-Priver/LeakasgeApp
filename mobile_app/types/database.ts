export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface WaterIssue {
  id: string;
  user_id: string;
  type: 'Leakage' | 'Water Quality Problem' | 'Other';
  description: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  image_url: string;
  latitude: number;
  longitude: number;
  status: 'Pending' | 'In Progress' | 'Resolved';
  timestamp: string;
}

export interface WaterIssueInsert {
  user_id: string;
  type: 'Leakage' | 'Water Quality Problem' | 'Other';
  description: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  image_url: string;
  latitude: number;
  longitude: number;
}