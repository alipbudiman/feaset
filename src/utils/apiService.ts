/* eslint-disable @typescript-eslint/no-explicit-any */
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
      console.error('❌ ApiService.fetchWithAuth: No access token available');
      throw new Error('No access token available');
    }

    console.log('✅ ApiService.fetchWithAuth: making request to URL =', url);
    console.log('🔑 ApiService.fetchWithAuth: token available =', token ? `${token.slice(0, 20)}...` : 'null');

    // Prepare headers with authorization
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };

    console.log('📤 ApiService.fetchWithAuth: request headers =', {
      ...headers,
      Authorization: `Bearer ${token.slice(0, 20)}...` // Mask token in logs
    });

    // Make the initial request
    let response = await fetch(url, {
      ...options,
      headers,
    });

    console.log('📥 ApiService.fetchWithAuth: response status =', response.status);

    // If we get a 403, try to refresh the token and retry
    if (response.status === 403) {
      console.log('🔄 Token expired, attempting to refresh...');
      
      try {
        const newToken = await this.refreshAccessToken();
        
        // Retry the original request with the new token
        const retryHeaders = {
          ...headers,
          'Authorization': `Bearer ${newToken}`,
        };

        console.log('🔄 Retrying request with refreshed token...');
        response = await fetch(url, {
          ...options,
          headers: retryHeaders,
        });

        console.log('📥 ApiService.fetchWithAuth: retry response status =', response.status);

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
  }  /**
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
  }  /**
   * Get user account information
   */
  async getUserAccount(): Promise<Response> {
    console.log('Making request to /user/get_account');
    return this.fetchWithAuth(`${HOST}/user/get_account`);
  }

  /**
   * Get list of all users
   */
  async getUsers(): Promise<Response> {
    console.log('Making request to /user/list');
    return this.fetchWithAuth(`${HOST}/user/list`);
  }

  /**
   * Update user information
   * Note: This endpoint may not exist in the current API, but we'll implement it for future use
   */
  async updateUser(username: string, userData: any): Promise<Response> {
    console.log('Making request to update user:', username);
    return this.fetchWithAuth(`${HOST}/user/update/${username}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  /**
   * Delete user
   * Note: This endpoint may not exist in the current API, but we'll implement it for future use
   */
  async deleteUser(username: string): Promise<Response> {
    console.log('Making request to delete user:', username);
    return this.fetchWithAuth(`${HOST}/user/delete/${username}`, {
      method: 'DELETE',
    });
  }

  // ===============================
  // PRODUCT MANAGEMENT METHODS
  // ===============================

  /**
   * Get list of products with pagination
   */
  async getProducts(index: number = 0): Promise<Response> {
    console.log('Making request to /product/list with index:', index);
    return this.fetchWithAuth(`${HOST}/product/list?index=${index}`);
  }

  /**
   * Create a new product
   */
  async createProduct(productData: any): Promise<Response> {
    console.log('Making request to create product:', productData);
    return this.fetchWithAuth(`${HOST}/product/create`, {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  /**
   * Update an existing product
   */
  async updateProduct(productId: string, productData: any): Promise<Response> {
    console.log('Making request to update product:', productId, productData);
    return this.fetchWithAuth(`${HOST}/product/update/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  /**
   * Delete a product by ID
   */
  async deleteProduct(productId: string): Promise<Response> {
    console.log('Making request to delete product:', productId);
    return this.fetchWithAuth(`${HOST}/product/delete/${productId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Upload image for product
   */
  async uploadImage(file: File): Promise<Response> {
    console.log('Making request to upload image:', file.name);
    const formData = new FormData();
    formData.append('file', file);
    return this.uploadFile(`${HOST}/image/upload`, formData);
  }
}

// Export a singleton instance
export const apiService = new ApiService();
export default apiService;
