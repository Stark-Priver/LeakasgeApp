import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('auth_token');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const token = await this.getAuthToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Request failed' };
      }

      return { data };
    } catch (error) {
      console.error('API request error:', error);
      return { error: 'Network error' };
    }
  }

  // Auth methods
  async signUp(email: string, password: string, full_name?: string): Promise<ApiResponse> {
    return this.request('/api/users/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name }),
    });
  }

  async signIn(email: string, password: string): Promise<ApiResponse> {
    const response = await this.request('/api/users/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.data?.token) {
      await AsyncStorage.setItem('auth_token', response.data.token);
      await AsyncStorage.setItem('user_data', JSON.stringify(response.data.user));
    }

    return response;
  }

  async signOut(): Promise<void> {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user_data');
  }

  async getCurrentUser(): Promise<ApiResponse> {
    const userData = await AsyncStorage.getItem('user_data');
    if (userData) {
      return { data: { user: JSON.parse(userData) } };
    }
    return { error: 'No user found' };
  }

  // Reports methods
  async getReports(): Promise<ApiResponse> {
    return this.request('/api/reports/user-reports');
  }

  async createReport(reportData: any): Promise<ApiResponse> {
    return this.request('/api/reports', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  }

  async getReport(id: string): Promise<ApiResponse> {
    return this.request(`/api/reports/${id}`);
  }
}

export const apiClient = new ApiClient(API_URL);

// For backward compatibility, export auth-related functions
export const auth = {
  signUp: apiClient.signUp.bind(apiClient),
  signInWithPassword: ({ email, password }: { email: string; password: string }) =>
    apiClient.signIn(email, password),
  signOut: apiClient.signOut.bind(apiClient),
  getUser: apiClient.getCurrentUser.bind(apiClient),
};

// For backward compatibility with existing code that uses 'supabase'
export const supabase = {
  auth,
  from: (table: string) => ({
    select: (columns?: string) => ({
      eq: (column: string, value: any) => apiClient.getReports(),
    }),
    insert: (data: any) => apiClient.createReport(data),
  }),
};