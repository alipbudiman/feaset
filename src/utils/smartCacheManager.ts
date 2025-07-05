// utils/cacheManager.ts
// Smart cache manager untuk mengatasi masalah data tidak sinkron dengan backend

export interface CacheData<T> {
  data: T;
  timestamp: number;
  lastAccess: number;
  routePath: string;
}

export class SmartCacheManager {
  private static instance: SmartCacheManager;
  private static readonly CACHE_PREFIX = 'smart_cache_';
  
  // Cache TTL berdasarkan tipe data
  private static readonly CACHE_TTL = {
    PAGE_DATA: 2 * 60 * 1000,      // 2 menit untuk data halaman
    ALL_PRODUCTS: 5 * 60 * 1000,   // 5 menit untuk data lengkap
    ROUTE_SPECIFIC: 1 * 60 * 1000, // 1 menit untuk data spesifik route
  };

  // Singleton pattern
  public static getInstance(): SmartCacheManager {
    if (!SmartCacheManager.instance) {
      SmartCacheManager.instance = new SmartCacheManager();
    }
    return SmartCacheManager.instance;
  }

  // Generate cache key dengan route context
  private generateCacheKey(key: string, routePath: string): string {
    return `${SmartCacheManager.CACHE_PREFIX}${routePath}_${key}`;
  }

  // Set data dengan route-aware caching
  public setRouteData<T>(key: string, data: T, routePath: string): void {
    const cacheKey = this.generateCacheKey(key, routePath);
    const cacheData: CacheData<T> = {
      data,
      timestamp: Date.now(),
      lastAccess: Date.now(),
      routePath
    };

    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log(`📦 Cache set for route ${routePath}:`, { key, dataSize: JSON.stringify(data).length });
    } catch (error) {
      console.warn('⚠️ Failed to set cache:', error);
      this.cleanupOldCache(); // Clean up if storage is full
    }
  }

  // Get data dengan validasi route dan TTL
  public getRouteData<T>(key: string, routePath: string, ttl: number = SmartCacheManager.CACHE_TTL.PAGE_DATA): T | null {
    const cacheKey = this.generateCacheKey(key, routePath);
    
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (!cached) return null;

      const cacheData: CacheData<T> = JSON.parse(cached);
      const now = Date.now();

      // Check TTL
      if (now - cacheData.timestamp > ttl) {
        console.log(`⏰ Cache expired for ${routePath}/${key}:`, {
          age: now - cacheData.timestamp,
          ttl
        });
        sessionStorage.removeItem(cacheKey);
        return null;
      }

      // Check route consistency
      if (cacheData.routePath !== routePath) {
        console.log(`🛣️ Route mismatch for cache ${key}:`, {
          cached: cacheData.routePath,
          current: routePath
        });
        sessionStorage.removeItem(cacheKey);
        return null;
      }

      // Update last access
      cacheData.lastAccess = now;
      sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
      
      console.log(`✅ Cache hit for ${routePath}/${key}`);
      return cacheData.data;
    } catch (error) {
      console.warn('⚠️ Failed to get cache:', error);
      return null;
    }
  }

  // Invalidate cache for specific route
  public invalidateRoute(routePath: string): void {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(SmartCacheManager.CACHE_PREFIX)) {
        try {
          const cached = sessionStorage.getItem(key);
          if (cached) {
            const cacheData = JSON.parse(cached);
            if (cacheData.routePath === routePath) {
              keysToRemove.push(key);
            }
          }
        } catch {
          // Invalid cache entry, remove it
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach(key => sessionStorage.removeItem(key));
    console.log(`🗑️ Invalidated cache for route ${routePath}:`, keysToRemove.length, 'items removed');
  }

  // Invalidate all cache
  public invalidateAll(): void {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(SmartCacheManager.CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => sessionStorage.removeItem(key));
    console.log(`🗑️ Invalidated all smart cache:`, keysToRemove.length, 'items removed');
  }

  // Clean up old or unused cache entries
  public cleanupOldCache(): void {
    const now = Date.now();
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(SmartCacheManager.CACHE_PREFIX)) {
        try {
          const cached = sessionStorage.getItem(key);
          if (cached) {
            const cacheData = JSON.parse(cached);
            
            // Remove if older than max TTL or not accessed recently
            if (now - cacheData.timestamp > SmartCacheManager.CACHE_TTL.ALL_PRODUCTS ||
                now - cacheData.lastAccess > SmartCacheManager.CACHE_TTL.ALL_PRODUCTS) {
              keysToRemove.push(key);
            }
          }
        } catch (error) {
          // Invalid cache entry, remove it
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach(key => sessionStorage.removeItem(key));
    console.log(`🧹 Cleaned up old cache:`, keysToRemove.length, 'items removed');
  }

  // Check if route data is fresh
  public isRouteFresh(routePath: string): boolean {
    let hasValidCache = false;
    
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(SmartCacheManager.CACHE_PREFIX)) {
        try {
          const cached = sessionStorage.getItem(key);
          if (cached) {
            const cacheData = JSON.parse(cached);
            if (cacheData.routePath === routePath) {
              const now = Date.now();
              if (now - cacheData.timestamp < SmartCacheManager.CACHE_TTL.PAGE_DATA) {
                hasValidCache = true;
                break;
              }
            }
          }
        } catch (error) {
          continue;
        }
      }
    }

    console.log(`🔍 Route freshness check for ${routePath}:`, hasValidCache);
    return hasValidCache;
  }
}

// Helper hooks untuk React components
export const useSmartCache = (routePath: string) => {
  const cacheManager = SmartCacheManager.getInstance();

  const setCache = <T>(key: string, data: T) => {
    cacheManager.setRouteData(key, data, routePath);
  };

  const getCache = <T>(key: string, ttl?: number): T | null => {
    return cacheManager.getRouteData<T>(key, routePath, ttl);
  };

  const invalidateRoute = () => {
    cacheManager.invalidateRoute(routePath);
  };

  const isRouteFresh = () => {
    return cacheManager.isRouteFresh(routePath);
  };

  return {
    setCache,
    getCache,
    invalidateRoute,
    invalidateAll: () => cacheManager.invalidateAll(),
    isRouteFresh,
    cleanup: () => cacheManager.cleanupOldCache()
  };
};

export default SmartCacheManager;
