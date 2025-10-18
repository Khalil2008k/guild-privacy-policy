import { auth } from '../utils/firebase';
import { environment } from '../config/environment';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = environment.apiUrl;
  }

  /**
   * Get authentication headers with Firebase ID token
   */
  private async getAuthHeaders(): Promise<HeadersInit> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get fresh ID token
    const idToken = await user.getIdToken();
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    };
  }

  /**
   * Make authenticated API request
   */
  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Admin-specific endpoints
  
  /**
   * Get admin dashboard data
   */
  async getDashboard() {
    return this.get('/admin/dashboard');
  }

  /**
   * Get users with filters
   */
  async getUsers(params?: Record<string, any>) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.get(`/admin/users${queryString}`);
  }

  /**
   * Update user status
   */
  async updateUserStatus(userId: string, status: string) {
    return this.patch(`/admin/users/${userId}/status`, { status });
  }

  /**
   * Update user role
   */
  async updateUserRole(userId: string, role: string) {
    return this.post(`/admin/users/${userId}/role`, { role });
  }

  /**
   * Ban/unban user
   */
  async banUser(userId: string, reason: string, duration?: number) {
    return this.post(`/admin/users/${userId}/ban`, { reason, duration });
  }

  async unbanUser(userId: string) {
    return this.delete(`/admin/users/${userId}/ban`);
  }

  /**
   * Get jobs with filters
   */
  async getJobs(params?: Record<string, any>) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.get(`/admin/jobs${queryString}`);
  }

  /**
   * Update job status
   */
  async updateJobStatus(jobId: string, status: string) {
    return this.patch(`/admin/jobs/${jobId}/status`, { status });
  }

  /**
   * Get guilds
   */
  async getGuilds(params?: Record<string, any>) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.get(`/admin/guilds${queryString}`);
  }

  /**
   * Get analytics data
   */
  async getAnalytics(type: string, params?: Record<string, any>) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.get(`/admin/analytics/${type}${queryString}`);
  }

  /**
   * Get platform stats
   */
  async getPlatformStats() {
    return this.get('/admin/stats');
  }

  /**
   * Send performance metrics
   */
  async sendPerformanceMetrics(metrics: any) {
    return this.post('/admin/analytics/performance', metrics);
  }

  /**
   * Report error
   */
  async reportError(error: any) {
    return this.post('/admin/error-reports', error);
  }
}

export const apiService = new ApiService();

