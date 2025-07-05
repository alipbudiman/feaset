// utils/requestThrottler.ts
// Advanced request throttling and deduplication system

interface RequestConfig {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

interface ThrottledRequest {
  config: RequestConfig;
  timestamp: number;
  promise: Promise<Response>;
  resolve: (value: Response) => void;
  reject: (error: any) => void;
}

class RequestThrottler {
  private activeRequests = new Map<string, ThrottledRequest>();
  private requestQueue = new Map<string, ThrottledRequest[]>();
  private lastRequestTime = new Map<string, number>();
  private readonly minInterval: number; // Minimum time between requests to same endpoint
  private readonly maxConcurrent: number; // Maximum concurrent requests
  private readonly timeout: number; // Request timeout

  constructor(minInterval = 100, maxConcurrent = 3, timeout = 30000) {
    this.minInterval = minInterval;
    this.maxConcurrent = maxConcurrent;
    this.timeout = timeout;
  }

  private getRequestKey(config: RequestConfig): string {
    const { url, method = 'GET' } = config;
    // Create a unique key for the request
    return `${method}:${url}`;
  }

  private getEndpointKey(config: RequestConfig): string {
    const { url } = config;
    // Extract endpoint from URL (remove query parameters for throttling)
    const urlObj = new URL(url, 'http://localhost');
    return urlObj.pathname;
  }

  private canMakeRequest(endpointKey: string): boolean {
    const now = Date.now();
    const lastTime = this.lastRequestTime.get(endpointKey) || 0;
    return now - lastTime >= this.minInterval;
  }

  private getActiveRequestCount(): number {
    return this.activeRequests.size;
  }

  private processQueue() {
    // Process queued requests when slots become available
    if (this.getActiveRequestCount() >= this.maxConcurrent) {
      return;
    }

    for (const [endpointKey, queue] of this.requestQueue.entries()) {
      if (queue.length === 0) continue;
      
      if (this.canMakeRequest(endpointKey) && this.getActiveRequestCount() < this.maxConcurrent) {
        const queuedRequest = queue.shift();
        if (queuedRequest) {
          this.executeRequest(queuedRequest);
        }
      }
    }
  }

  private async executeRequest(request: ThrottledRequest) {
    const requestKey = this.getRequestKey(request.config);
    const endpointKey = this.getEndpointKey(request.config);
    
    try {
      console.log(`🚀 Executing request: ${requestKey}`);
      
      // Update last request time
      this.lastRequestTime.set(endpointKey, Date.now());
      
      // Make the actual request
      const response = await fetch(request.config.url, {
        method: request.config.method || 'GET',
        headers: request.config.headers,
        body: request.config.body,
        signal: AbortSignal.timeout(this.timeout)
      });

      request.resolve(response);
      
    } catch (error) {
      console.error(`❌ Request failed: ${requestKey}`, error);
      request.reject(error);
    } finally {
      // Clean up
      this.activeRequests.delete(requestKey);
      
      // Process next queued requests
      setTimeout(() => this.processQueue(), this.minInterval);
    }
  }

  async request(config: RequestConfig): Promise<Response> {
    const requestKey = this.getRequestKey(config);
    const endpointKey = this.getEndpointKey(config);

    // Check for duplicate active request
    const existingRequest = this.activeRequests.get(requestKey);
    if (existingRequest) {
      console.log(`🔄 Reusing existing request: ${requestKey}`);
      return existingRequest.promise;
    }

    // Create new request promise
    let resolve: (value: Response) => void;
    let reject: (error: any) => void;
    
    const promise = new Promise<Response>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    const throttledRequest: ThrottledRequest = {
      config,
      timestamp: Date.now(),
      promise,
      resolve: resolve!,
      reject: reject!
    };

    // Check if we can execute immediately
    if (this.canMakeRequest(endpointKey) && this.getActiveRequestCount() < this.maxConcurrent) {
      this.activeRequests.set(requestKey, throttledRequest);
      this.executeRequest(throttledRequest);
    } else {
      // Queue the request
      console.log(`⏳ Queueing request: ${requestKey} (active: ${this.getActiveRequestCount()}/${this.maxConcurrent})`);
      
      if (!this.requestQueue.has(endpointKey)) {
        this.requestQueue.set(endpointKey, []);
      }
      this.requestQueue.get(endpointKey)!.push(throttledRequest);
      
      // Set active request for deduplication
      this.activeRequests.set(requestKey, throttledRequest);
    }

    return promise;
  }

  // Clear all queued requests (useful for navigation)
  clearQueue() {
    console.log('🧹 Clearing request queue');
    
    // Reject all queued requests
    for (const queue of this.requestQueue.values()) {
      for (const request of queue) {
        request.reject(new Error('Request cancelled'));
      }
    }
    
    this.requestQueue.clear();
    this.activeRequests.clear();
  }

  // Get statistics
  getStats() {
    return {
      activeRequests: this.getActiveRequestCount(),
      queuedRequests: Array.from(this.requestQueue.values()).reduce((sum, queue) => sum + queue.length, 0),
      totalEndpoints: this.requestQueue.size
    };
  }
}

// Create singleton instance
export const requestThrottler = new RequestThrottler(150, 3, 30000); // 150ms between requests, max 3 concurrent

// Enhanced API service with throttling
export class ThrottledAPIService {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL = '', defaultHeaders = {}) {
    this.baseURL = baseURL;
    this.defaultHeaders = defaultHeaders;
  }

  private getAuthHeaders(): Record<string, string> {
    const token = sessionStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private buildURL(path: string): string {
    const url = path.startsWith('http') ? path : `${this.baseURL}${path}`;
    return url;
  }

  async get(path: string, headers?: Record<string, string>): Promise<Response> {
    const url = this.buildURL(path);
    const requestHeaders = {
      ...this.defaultHeaders,
      ...this.getAuthHeaders(),
      ...headers
    };

    console.log(`📡 Throttled GET request: ${url}`);
    
    return requestThrottler.request({
      url,
      method: 'GET',
      headers: requestHeaders
    });
  }

  async post(path: string, body?: any, headers?: Record<string, string>): Promise<Response> {
    const url = this.buildURL(path);
    const requestHeaders = {
      'Content-Type': 'application/json',
      ...this.defaultHeaders,
      ...this.getAuthHeaders(),
      ...headers
    };

    console.log(`📡 Throttled POST request: ${url}`);
    
    return requestThrottler.request({
      url,
      method: 'POST',
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined
    });
  }

  async put(path: string, body?: any, headers?: Record<string, string>): Promise<Response> {
    const url = this.buildURL(path);
    const requestHeaders = {
      'Content-Type': 'application/json',
      ...this.defaultHeaders,
      ...this.getAuthHeaders(),
      ...headers
    };

    console.log(`📡 Throttled PUT request: ${url}`);
    
    return requestThrottler.request({
      url,
      method: 'PUT',
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined
    });
  }

  async delete(path: string, headers?: Record<string, string>): Promise<Response> {
    const url = this.buildURL(path);
    const requestHeaders = {
      ...this.defaultHeaders,
      ...this.getAuthHeaders(),
      ...headers
    };

    console.log(`📡 Throttled DELETE request: ${url}`);
    
    return requestThrottler.request({
      url,
      method: 'DELETE',
      headers: requestHeaders
    });
  }

  // Clear pending requests (useful for navigation)
  clearPendingRequests() {
    requestThrottler.clearQueue();
  }

  // Get request statistics
  getRequestStats() {
    return requestThrottler.getStats();
  }
}

// Create throttled API service instance
export const throttledApiService = new ThrottledAPIService('https://manpro-mansetdig.vercel.app');
