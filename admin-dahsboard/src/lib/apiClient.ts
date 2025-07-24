interface User {
  _id: string;
  email: string;
  full_name?: string;
  role: string;
  is_banned: boolean;
  createdAt: string;
  updatedAt: string;
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

interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

interface ReportStats {
  totalReports: number;
  statusCounts: Array<{ _id: string; count: number }>;
  severityCounts: Array<{ _id: string; count: number }>;
  issueTypeCounts: Array<{ _id: string; count: number }>;
  recentReports: WaterReport[];
}

class AdminApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    this.token = localStorage.getItem('adminToken');
  }

  private getAuthHeader(): { Authorization?: string } {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          this.logout();
        }
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
    
    this.token = response.token;
    localStorage.setItem('adminToken', response.token);
    localStorage.setItem('adminUser', JSON.stringify(response.user));
    
    return response;
  }

  logout(): void {
    this.token = null;
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
  }

  getCurrentUser(): User | null {
    try {
      const userStr = localStorage.getItem('adminUser');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  // User methods
  async getUsers(): Promise<User[]> {
    return this.request('/users');
  }

  async getUserCount(): Promise<{ count: number }> {
    return this.request('/users/count');
  }

  async banUser(userId: string, is_banned: boolean): Promise<{ message: string; user: User }> {
    return this.request(`/users/${userId}/ban`, {
      method: 'PUT',
      body: JSON.stringify({ is_banned }),
    });
  }

  // Report methods
  async getReports(): Promise<WaterReport[]> {
    return this.request('/reports');
  }

  async getReport(id: string): Promise<WaterReport> {
    return this.request(`/reports/${id}`);
  }

  async updateReport(id: string, updates: { status?: string; assigned_to?: string }): Promise<{ message: string; report: WaterReport }> {
    return this.request(`/reports/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteReport(id: string): Promise<{ message: string }> {
    return this.request(`/reports/${id}`, {
      method: 'DELETE',
    });
  }

  async getReportStats(): Promise<ReportStats> {
    return this.request('/reports/stats/overview');
  }
}

export const adminApiClient = new AdminApiClient();
export type { User, WaterReport, LoginResponse, ReportStats };
