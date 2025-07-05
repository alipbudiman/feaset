// hooks/useProductData.ts
// Custom hook untuk mengelola data produk dengan smart caching

import { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { apiService } from '../utils/apiService';
import { useSmartCache } from '../utils/smartCacheManager';

export interface Product {
  name: string;
  id_product: string;
  stock: number;
  image: string;
  added_by: string;
  product_category: string;
  visible_to_user: boolean;
  product_location: string;
}

interface UseProductDataProps {
  itemsPerPage?: number;
  enableBackgroundLoading?: boolean;
}

interface UseProductDataReturn {
  // Data states
  products: Product[];
  allProducts: Product[];
  loading: boolean;
  error: string | null;
  totalProducts: number;
  backgroundLoadingComplete: boolean;
  
  // Actions
  fetchPageProducts: (page: number, forceRefresh?: boolean) => Promise<void>;
  refreshProducts: () => Promise<void>;
  invalidateCache: () => void;
  
  // Background loading
  backgroundLoadAllProducts: () => Promise<void>;
}

export const useProductData = ({
  itemsPerPage = 12,
  enableBackgroundLoading = true
}: UseProductDataProps = {}): UseProductDataReturn => {
  
  const location = useLocation();
  const routePath = location.pathname;
  const cache = useSmartCache(routePath);
  
  // States
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [backgroundLoadingComplete, setBackgroundLoadingComplete] = useState(false);

  // Request deduplication - prevent multiple requests to same endpoint
  const [activeRequests, setActiveRequests] = useState<Set<string>>(new Set());
  const [lastFetchedPage, setLastFetchedPage] = useState<number | null>(null);

  // Get user role
  const getUserRole = () => sessionStorage.getItem('userRole') || 'user';

  // Request deduplication helpers
  const isRequestActive = useCallback((requestKey: string): boolean => {
    return activeRequests.has(requestKey);
  }, [activeRequests]);

  const markRequestActive = useCallback((requestKey: string) => {
    setActiveRequests(prev => new Set([...prev, requestKey]));
  }, []);

  const markRequestCompleted = useCallback((requestKey: string) => {
    setActiveRequests(prev => {
      const newSet = new Set(prev);
      newSet.delete(requestKey);
      return newSet;
    });
  }, []);

  // Fetch single page of products with deduplication
  const fetchPageProducts = useCallback(async (page: number, forceRefresh = false) => {
    try {
      const role = getUserRole();
      const apiIndex = page - 1; // Convert to 0-based
      const cacheKey = `products_page_${page}_${role}`;
      const requestKey = `fetch_page_${page}_${role}`;
      
      // Prevent duplicate requests for same page
      if (!forceRefresh && isRequestActive(requestKey)) {
        console.log(`⚠️ Request already in progress for page ${page}, skipping...`);
        return;
      }

      // Skip if same page already loaded recently
      if (!forceRefresh && lastFetchedPage === page && products.length > 0) {
        console.log(`✅ Page ${page} already loaded, skipping fetch`);
        return;
      }
      
      console.log(`🔄 Fetching page ${page} for route ${routePath}`, { forceRefresh, role });

      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cachedData = cache.getCache<{product_list: Product[], total_products: number}>(cacheKey);
        if (cachedData) {
          console.log(`✅ Using cached data for page ${page}`);
          setProducts(cachedData.product_list || []);
          setTotalProducts(cachedData.total_products || 0);
          setLastFetchedPage(page);
          setLoading(false);
          return;
        }
      }

      // Mark request as active to prevent duplicates
      markRequestActive(requestKey);
      setLoading(true);
      setError(null);

      // API call
      console.log(`🌐 API call for page ${page} (index: ${apiIndex})`);
      const response = await apiService.get(`/product/list?index=${apiIndex}&role=${role}`);

      if (!response.ok) {
        throw new Error('Gagal mengambil data produk');
      }
      
      const data = await response.json();
      console.log(`📊 API response for page ${page}:`, {
        productCount: data.product_list?.length || 0,
        totalProducts: data.total_products
      });

      // Cache the response
      cache.setCache(cacheKey, data);

      // Update states
      setProducts(data.product_list || []);
      setTotalProducts(data.total_products || 0);
      setLastFetchedPage(page);

      // Also add to allProducts if not already there
      if (data.product_list && data.product_list.length > 0) {
        setAllProducts(prevAll => {
          const existingIds = prevAll.map(p => p.id_product);
          const newProducts = data.product_list.filter((p: Product) => 
            !existingIds.includes(p.id_product)
          );
          
          if (newProducts.length > 0) {
            console.log(`📦 Added ${newProducts.length} new products to allProducts`);
            return [...prevAll, ...newProducts];
          }
          return prevAll;
        });
      }

    } catch (err) {
      console.error('❌ Error fetching page products:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
      markRequestCompleted(`page_${page}`);
    }
  }, [cache, routePath, isRequestActive, lastFetchedPage, products.length, markRequestActive, markRequestCompleted]);

  // Background loading of all products with better control
  const backgroundLoadAllProducts = useCallback(async () => {
    if (!enableBackgroundLoading) return;
    
    const requestKey = 'background_load_all';
    
    // Prevent multiple background loading
    if (isRequestActive(requestKey)) {
      console.log(`⚠️ Background loading already in progress, skipping...`);
      return;
    }

    try {
      const role = getUserRole();
      const cacheKey = `all_products_${role}`;
      
      console.log(`🔄 Starting background loading for route ${routePath}`);

      // Check if we have complete cached data
      const cachedAllProducts = cache.getCache<Product[]>(cacheKey, 5 * 60 * 1000); // 5 minutes TTL
      if (cachedAllProducts && cachedAllProducts.length > 0) {
        console.log(`✅ Using cached all products: ${cachedAllProducts.length} items`);
        setAllProducts(cachedAllProducts);
        setBackgroundLoadingComplete(true);
        return;
      }

      // Mark background loading as active
      markRequestActive(requestKey);

      // Load all products page by page
      let currentIndex = 0;
      let allLoadedProducts: Product[] = [...allProducts];
      
      while (true) {
        // Check if we should stop loading
        if (!enableBackgroundLoading) break;

        const pageRequestKey = `background_page_${currentIndex}`;
        
        // Skip if this page is already being loaded
        if (isRequestActive(pageRequestKey)) {
          await new Promise(resolve => setTimeout(resolve, 200));
          continue;
        }

        markRequestActive(pageRequestKey);
        
        const response = await apiService.get(`/product/list?index=${currentIndex}&role=${role}`);
        
        markRequestCompleted(pageRequestKey);
        
        if (!response.ok) break;
        
        const data = await response.json();
        
        if (!data.product_list || data.product_list.length === 0) {
          break; // No more data
        }

        // Add new products
        const existingIds = allLoadedProducts.map(p => p.id_product);
        const newProducts = data.product_list.filter((p: Product) => 
          !existingIds.includes(p.id_product)
        );
        
        allLoadedProducts = [...allLoadedProducts, ...newProducts];
        setAllProducts(allLoadedProducts);
        
        console.log(`📦 Background loaded page ${currentIndex + 1}: +${newProducts.length} products (total: ${allLoadedProducts.length})`);
        
        // Check if we've reached the end
        if (currentIndex >= data.last_index || data.product_list.length < itemsPerPage) {
          break;
        }
        
        currentIndex++;
        
        // Longer delay to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      // Cache complete dataset
      cache.setCache(cacheKey, allLoadedProducts);
      setBackgroundLoadingComplete(true);
      
      console.log(`✅ Background loading complete: ${allLoadedProducts.length} products loaded`);
      
    } catch (err) {
      console.error('❌ Error in background loading:', err);
    } finally {
      markRequestCompleted(requestKey);
    }
  }, [cache, routePath, enableBackgroundLoading, allProducts, itemsPerPage, isRequestActive, markRequestActive, markRequestCompleted]);

  // Refresh all product data
  const refreshProducts = useCallback(async () => {
    console.log(`🔄 Refreshing products for route ${routePath}`);
    
    // Clear cache for this route
    cache.invalidateRoute();
    
    // Reset states
    setAllProducts([]);
    setBackgroundLoadingComplete(false);
    setError(null);
    
    // Reload current page
    await fetchPageProducts(1, true);
    
    // Restart background loading
    if (enableBackgroundLoading) {
      setTimeout(() => {
        backgroundLoadAllProducts();
      }, 500);
    }
    
    console.log(`✅ Products refreshed for route ${routePath}`);
  }, [cache, routePath, fetchPageProducts, enableBackgroundLoading, backgroundLoadAllProducts]);

  // Invalidate cache manually
  const invalidateCache = useCallback(() => {
    console.log(`🗑️ Invalidating cache for route ${routePath}`);
    cache.invalidateRoute();
    setAllProducts([]);
    setBackgroundLoadingComplete(false);
  }, [cache, routePath]);

  // Setup data refresh event listeners
  useEffect(() => {
    const handleDataRefresh = () => {
      console.log(`📢 Data refresh event received for route ${routePath}`);
      refreshProducts();
    };

    const handleRouteSpecificRefresh = () => {
      console.log(`🏠 Route-specific refresh event received for route ${routePath}`);
      refreshProducts();
    };

    // Listen for global and route-specific refresh events
    window.addEventListener('dataRefresh', handleDataRefresh);
    window.addEventListener(`${routePath}_dataRefresh`, handleRouteSpecificRefresh);

    return () => {
      window.removeEventListener('dataRefresh', handleDataRefresh);
      window.removeEventListener(`${routePath}_dataRefresh`, handleRouteSpecificRefresh);
    };
  }, [routePath, refreshProducts]);

  // Check for route changes and invalidate if needed
  useEffect(() => {
    console.log(`🧭 Route changed to: ${routePath}`);
    
    // Clean up old cache from other routes periodically
    cache.cleanup();
    
    // Check if current route has fresh data
    if (!cache.isRouteFresh()) {
      console.log(`🔄 Route data not fresh, invalidating cache for ${routePath}`);
      invalidateCache();
    }
  }, [routePath, cache, invalidateCache]);

  return {
    // Data states
    products,
    allProducts,
    loading,
    error,
    totalProducts,
    backgroundLoadingComplete,
    
    // Actions
    fetchPageProducts,
    refreshProducts,
    invalidateCache,
    backgroundLoadAllProducts
  };
};
