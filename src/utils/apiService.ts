/**
 * API Service with automatic token refresh functionality
 * Handles 403 errors by refreshing the token and retrying the request
 */

const HOST = "https://manpro-mansetdig.vercel.app";

interface RefreshTokenResponse {
  access_token: string;
  refresh_token?: string;
}

class ApiService {
  private isRefreshing = false;
  private refreshPromise: Promise<string> | null = null;

  /**
   * Get current access token from sessionStorage
   */
  private getAccessToken(): string | null {
    return sessionStorage.getItem('token');
  }

  /**
   * Get current refresh token from sessionStorage
   */
  private getRefreshToken(): string | null {
    return sessionStorage.getItem('refresh_token');
  }

  /**
   * Update tokens in sessionStorage
   */
  private updateTokens(accessToken: string, refreshToken?: string): void {
    sessionStorage.setItem('token', accessToken);
    if (refreshToken) {
      sessionStorage.setItem('refresh_token', refreshToken);
    }
  }

  /**
   * Clear tokens and redirect to login
   */
  private clearTokensAndRedirect(): void {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('refresh_token');
    window.location.href = '/login';
  }

  /**
   * Refresh the access token using refresh token
   */
  private async refreshAccessToken(): Promise<string> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh();

    try {
      const newToken = await this.refreshPromise;
      return newToken;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * Perform the actual token refresh API call
   */
  private async performTokenRefresh(): Promise<string> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${HOST}/auth/refresh/${refreshToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data: RefreshTokenResponse = await response.json();
      console.log('Token refreshed successfully');
      
      // Update tokens in storage
      this.updateTokens(data.access_token, data.refresh_token);
      
      return data.access_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      this.clearTokensAndRedirect();
      throw error;
    }
  }

  /**
   * Make an authenticated API request with automatic token refresh
   */
  async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const token = this.getAccessToken();
    
    if (!token) {
      throw new Error('No access token available');
    }

    // Prepare headers with authorization
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };

    // Make the initial request
    let response = await fetch(url, {
      ...options,
      headers,
    });

    // If we get a 403, try to refresh the token and retry
    if (response.status === 403) {
      console.log('Token expired, attempting to refresh...');
      
      try {
        const newToken = await this.refreshAccessToken();
        
        // Retry the original request with the new token
        const retryHeaders = {
          ...headers,
          'Authorization': `Bearer ${newToken}`,
        };

        response = await fetch(url, {
          ...options,
          headers: retryHeaders,
        });

        if (!response.ok && response.status === 403) {
          // If still 403 after refresh, clear tokens and redirect
          this.clearTokensAndRedirect();
          throw new Error('Authentication failed after token refresh');
        }

      } catch (refreshError) {
        console.error('Failed to refresh token:', refreshError);
        this.clearTokensAndRedirect();
        throw refreshError;
      }
    }

    return response;
  }

  /**
   * GET request with auto token refresh
   */
  async get(endpoint: string): Promise<Response> {
    const url = endpoint.startsWith('http') ? endpoint : `${HOST}${endpoint}`;
    return this.fetchWithAuth(url, { method: 'GET' });
  }

  /**
   * POST request with auto token refresh
   */
  async post(endpoint: string, data?: any): Promise<Response> {
    const url = endpoint.startsWith('http') ? endpoint : `${HOST}${endpoint}`;
    return this.fetchWithAuth(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request with auto token refresh
   */
  async put(endpoint: string, data?: any): Promise<Response> {
    const url = endpoint.startsWith('http') ? endpoint : `${HOST}${endpoint}`;
    return this.fetchWithAuth(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request with auto token refresh
   */
  async delete(endpoint: string): Promise<Response> {
    const url = endpoint.startsWith('http') ? endpoint : `${HOST}${endpoint}`;
    return this.fetchWithAuth(url, { method: 'DELETE' });
  }

  /**
   * Upload files with auto token refresh
   */
  async uploadFile(endpoint: string, formData: FormData): Promise<Response> {
    const token = this.getAccessToken();
    
    if (!token) {
      throw new Error('No access token available');
    }

    const url = endpoint.startsWith('http') ? endpoint : `${HOST}${endpoint}`;
    
    // For file upload, don't set Content-Type (let browser set it)
    const headers = {
      'Authorization': `Bearer ${token}`,
    };

    let response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    // Handle 403 with token refresh
    if (response.status === 403) {
      console.log('Token expired during file upload, attempting to refresh...');
      
      try {
        const newToken = await this.refreshAccessToken();
        
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${newToken}`,
          },
          body: formData,
        });

        if (!response.ok && response.status === 403) {
          this.clearTokensAndRedirect();
          throw new Error('Authentication failed after token refresh');
        }

      } catch (refreshError) {
        console.error('Failed to refresh token during file upload:', refreshError);
        this.clearTokensAndRedirect();
        throw refreshError;
      }
    }

    return response;
  }
  /**
   * Login request without authentication (for initial login)
   */
  async login(endpoint: string, body: URLSearchParams | FormData): Promise<Response> {
    const url = endpoint.startsWith('http') ? endpoint : `${HOST}${endpoint}`;
    
    const headers: HeadersInit = {};
    if (body instanceof URLSearchParams) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }
    
    return fetch(url, {
      method: 'POST',
      headers,
      body: body,
    });
  }

  /**
   * Health check request (no authentication required)
   */
  async healthCheck(): Promise<Response> {
    const url = `${HOST}/health`;
    return fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
    });
  }
}

// Export a singleton instance
export const apiService = new ApiService();
export default apiService;
