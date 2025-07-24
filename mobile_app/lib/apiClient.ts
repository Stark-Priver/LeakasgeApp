import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

interface User {
  id: string;
  email: string;
  full_name?: string;
  role: string;
}

interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

interface RegisterResponse {
  message: string;
  token: string;
  user: User;
}

interface WaterReport {
  _id: string;
  user_id: string | User;
  issue_type: 'LEAKAGE' | 'WATER_QUALITY_PROBLEM' | 'OTHER';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  location_address?: string;
  latitude?: number;
  longitude?: number;
  image_base64_data: string[];
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
  assigned_to?: string;
  createdAt: string;
  updatedAt: string;
}

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async getAuthHeader(): Promise<{ Authorization?: string }> {
    const token = await AsyncStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;
    const authHeader = await this.getAuthHeader();
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeader,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth methods
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await this.request('/users/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    // Store token
    await AsyncStorage.setItem('authToken', response.token);
    await AsyncStorage.setItem('user', JSON.stringify(response.user));
    
    return response;
  }

  async register(email: string, password: string, full_name?: string): Promise<RegisterResponse> {
    const response = await this.request('/users/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name }),
    });
    
    // Store token
    await AsyncStorage.setItem('authToken', response.token);
    await AsyncStorage.setItem('user', JSON.stringify(response.user));
    
    return response;
  }

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const userStr = await AsyncStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  async getUserProfile(): Promise<User> {
    return this.request('/users/profile');
  }

  // Report methods
  async getReports(): Promise<WaterReport[]> {
    return this.request('/reports/user-reports');
  }

  async getReport(id: string): Promise<WaterReport> {
    return this.request(`/reports/${id}`);
  }

  async createReport(reportData: {
    issue_type: string;
    severity: string;
    description: string;
    location_address?: string;
    latitude?: number;
    longitude?: number;
    image_base64_data?: string[];
  }): Promise<{ message: string; report: WaterReport }> {
    return this.request('/reports', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem('authToken');
    return !!token;
  }
}

export const apiClient = new ApiClient();
export type { User, WaterReport, LoginResponse, RegisterResponse };
