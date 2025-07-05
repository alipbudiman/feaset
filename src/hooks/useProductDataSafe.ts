// hooks/useProductDataSafe.ts
// Enhanced product data hook with anti-spam protection and API compliance

import { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { apiService } from '../utils/apiService';
import { useSmartCache } from '../utils/smartCacheManager';
import { eventDispatcher } from '../utils/eventDispatcher';

export interface Product {
  name: string;
  id_product: string;
  stock: number;
  image: string;
  added_by: string;
  product_category: string;
  visible_to_user: boolean;
  product_location: string;
  product_description?: string; // New field from API update
}

interface ProductDataResponse {
  index: number;
  product_list: Product[];
  last_index: number;
  total_products: number;
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

export const useProductDataSafe = ({
  itemsPerPage: _itemsPerPage = 12, // Renamed to indicate it's intentionally unused
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

  // Request management with refs to prevent race conditions
  const activeRequestsRef = useRef<Set<string>>(new Set());
  const lastFetchedPageRef = useRef<number | null>(null);
  const backgroundLoadingRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Get user role
  const getUserRole = () => sessionStorage.getItem('userRole') || 'user';

  // Cleanup function
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    
    // Clear pending API requests
    // Note: apiService doesn't have clearPendingRequests method, 
    // but it handles cleanup automatically
    
    activeRequestsRef.current.clear();
    backgroundLoadingRef.current = false;
  }, []);

  // Enhanced API request function with proper error handling
  const makeAPIRequest = useCallback(async (index: number): Promise<ProductDataResponse> => {
    console.log('🔍 useProductDataSafe: Making API request for index =', index);
    
    // Check if token exists before making request
    const token = sessionStorage.getItem('token');
    console.log('🔑 useProductDataSafe: Token available =', token ? `${token.slice(0, 20)}...` : 'null');
    
    if (!token) {
      throw new Error('No authentication token available. Please login again.');
    }
    
    const response = await apiService.get(`/product/list?index=${index}`);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as ProductDataResponse;
    
    // Validate response structure according to OpenAPI spec
    if (typeof data !== 'object' || data === null) {
      throw new Error('Invalid response format: not an object');
    }

    if (typeof data.index !== 'number') {
      throw new Error('Invalid response format: missing or invalid index');
    }

    if (!Array.isArray(data.product_list)) {
      throw new Error('Invalid response format: product_list is not an array');
    }

    if (typeof data.last_index !== 'number') {
      throw new Error('Invalid response format: missing or invalid last_index');
    }

    if (typeof data.total_products !== 'number') {
      throw new Error('Invalid response format: missing or invalid total_products');
    }

    return data;
  }, []);

  // Debounced fetch to prevent request spam
  const debouncedFetchPageProducts = useCallback(async (page: number, forceRefresh = false) => {
    const requestKey = `page_${page}_${getUserRole()}`;
    const cacheKey = `products_page_${page}_${getUserRole()}`;
    
    // Clear any pending debounced requests
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // Prevent duplicate requests
    if (!forceRefresh && activeRequestsRef.current.has(requestKey)) {
      console.log(`⚠️ Request spam prevented for page ${page}`);
      return;
    }

    // Skip if same page recently loaded
    if (!forceRefresh && lastFetchedPageRef.current === page && products.length > 0) {
      console.log(`✅ Page ${page} already loaded, using existing data`);
      return;
    }

    try {
      // Check cache first (with shorter TTL for page data)
      if (!forceRefresh) {
        const cachedData = cache.getCache<ProductDataResponse>(cacheKey, 2 * 60 * 1000); // 2 minutes TTL
        if (cachedData) {
          console.log(`✅ Cache hit for page ${page}`);
          setProducts(cachedData.product_list || []);
          setTotalProducts(cachedData.total_products || 0);
          lastFetchedPageRef.current = page;
          setLoading(false);
          return;
        }
      }

      // Mark request as active
      activeRequestsRef.current.add(requestKey);
      setLoading(true);
      setError(null);

      console.log(`🌐 Fetching page ${page} (API index: ${page - 1})`);
      
      // Convert page to index (page is 1-based, API expects 0-based index)
      const apiIndex = page - 1;
      const data = await makeAPIRequest(apiIndex);
      
      console.log(`📊 Page ${page} API response:`, {
        requestedPage: page,
        requestedIndex: apiIndex,
        responseIndex: data.index,
        lastIndex: data.last_index,
        totalProducts: data.total_products,
        productsInPage: data.product_list?.length || 0
      });

      // Cache and update state
      cache.setCache(cacheKey, data);
      setProducts(data.product_list || []);
      setTotalProducts(data.total_products || 0);
      lastFetchedPageRef.current = page;

      // Update allProducts for search functionality
      if (data.product_list?.length > 0) {
        setAllProducts(prev => {
          const existingIds = new Set(prev.map(p => p.id_product));
          const newProducts = data.product_list.filter((p: Product) => 
            !existingIds.has(p.id_product)
          );
          
          if (newProducts.length > 0) {
            console.log(`📦 Added ${newProducts.length} new products to search index`);
            return [...prev, ...newProducts];
          }
          return prev;
        });
      }

    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('❌ Error fetching products:', err.message);
        setError(err.message);
      }
    } finally {
      setLoading(false);
      activeRequestsRef.current.delete(requestKey);
    }
  }, [cache, products.length, makeAPIRequest]);

  // Public fetch function with anti-spam protection
  const fetchPageProducts = useCallback(async (page: number, forceRefresh = false) => {
    // Debounce to prevent rapid successive calls
    return new Promise<void>((resolve) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        await debouncedFetchPageProducts(page, forceRefresh);
        resolve();
      }, 50); // 50ms debounce
    });
  }, [debouncedFetchPageProducts]);

  // Intelligent background loading with smart request management
  const backgroundLoadAllProducts = useCallback(async () => {
    // Guard clauses to prevent unnecessary loading
    if (!enableBackgroundLoading) {
      console.log(`⚠️ Background loading disabled`);
      return;
    }

    if (backgroundLoadingRef.current) {
      console.log(`⚠️ Background loading already in progress`);
      return;
    }

    const cacheKey = `all_products_${getUserRole()}`;

    try {
      // Check if we have fresh cached data (5 minutes TTL)
      const cachedData = cache.getCache<Product[]>(cacheKey, 5 * 60 * 1000);
      if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
        console.log(`✅ Using cached all products: ${cachedData.length} items`);
        setAllProducts(cachedData);
        setBackgroundLoadingComplete(true);
        return;
      }

      // Mark as active to prevent duplicate runs
      backgroundLoadingRef.current = true;
      console.log(`🔄 Starting intelligent background loading...`);

      let allLoadedProducts: Product[] = [];
      let currentIndex = 0;
      let lastIndex = 0;
      let totalProductsFromAPI = 0;
      const maxConsecutiveFailures = 3;
      let consecutiveFailures = 0;

      // Step 1: Get initial metadata from index 0
      console.log(`📡 Fetching initial metadata from index 0...`);
      
      const initialData = await makeAPIRequest(0);
      lastIndex = initialData.last_index || 0;
      totalProductsFromAPI = initialData.total_products || 0;

      console.log(`📊 API Metadata:`, {
        lastIndex,
        totalProducts: totalProductsFromAPI,
        indexRange: `0 to ${lastIndex}`,
        estimatedRequests: lastIndex + 1
      });

      // Step 2: Sequential loading with optimized error handling
      for (currentIndex = 0; currentIndex <= lastIndex; currentIndex++) {
        // Check if we should continue (user might have navigated away)
        if (!backgroundLoadingRef.current) {
          console.log(`🛑 Background loading cancelled (navigation detected)`);
          return;
        }

        try {
          const progressPercent = lastIndex > 0 ? Math.round((currentIndex / lastIndex) * 100) : 100;
          console.log(`📄 Loading index ${currentIndex}/${lastIndex} (${progressPercent}% complete)`);
          
          const data = await makeAPIRequest(currentIndex);
          consecutiveFailures = 0; // Reset failure counter on success

          // Update metadata if it has changed
          if (data.last_index !== undefined && data.last_index !== lastIndex) {
            console.log(`📋 Last index updated: ${lastIndex} → ${data.last_index}`);
            lastIndex = data.last_index;
          }

          if (data.total_products !== undefined && data.total_products !== totalProductsFromAPI) {
            console.log(`📊 Total products updated: ${totalProductsFromAPI} → ${data.total_products}`);
            totalProductsFromAPI = data.total_products;
          }

          // Add new products (deduplication)
          if (data.product_list.length > 0) {
            const existingIds = new Set(allLoadedProducts.map(p => p.id_product));
            const newProducts = data.product_list.filter((p: Product) => 
              !existingIds.has(p.id_product)
            );

            if (newProducts.length > 0) {
              allLoadedProducts = [...allLoadedProducts, ...newProducts];
              
              // Update state periodically (every 5 pages or at the end)
              if (currentIndex % 5 === 0 || currentIndex === lastIndex) {
                setAllProducts([...allLoadedProducts]);
                console.log(`📦 Progress update: ${allLoadedProducts.length}/${totalProductsFromAPI} products loaded`);
              }
            }
          }

          // Smart delay - adaptive based on dataset size
          const delay = lastIndex > 20 ? 300 : lastIndex > 10 ? 200 : 100;
          await new Promise(resolve => setTimeout(resolve, delay));

        } catch (err) {
          consecutiveFailures++;
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          console.error(`❌ Error loading index ${currentIndex}:`, errorMessage);
          
          if (consecutiveFailures >= maxConsecutiveFailures) {
            console.error(`❌ Too many consecutive failures, stopping background loading`);
            break;
          }
          
          // Wait longer before retrying after error
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Final state update and caching
      const loadingStats = {
        totalLoaded: allLoadedProducts.length,
        expectedTotal: totalProductsFromAPI,
        lastIndexReached: currentIndex - 1,
        targetLastIndex: lastIndex,
        completionRate: Math.round((allLoadedProducts.length / Math.max(totalProductsFromAPI, 1)) * 100)
      };

      console.log(`🏁 Background loading completed:`, loadingStats);

      if (allLoadedProducts.length > 0) {
        setAllProducts(allLoadedProducts);
        cache.setCache(cacheKey, allLoadedProducts);
        console.log(`💾 Cached ${allLoadedProducts.length} products for future use`);
      }

      setBackgroundLoadingComplete(true);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Background loading failed:', errorMessage);
      setError('Failed to load all products in background');
    } finally {
      backgroundLoadingRef.current = false;
    }
  }, [cache, enableBackgroundLoading, makeAPIRequest]);

  // Refresh all data with improved cleanup
  const refreshProducts = useCallback(async () => {
    console.log('🔄 Refreshing all products...');
    
    cleanup();
    cache.invalidateRoute();
    
    setAllProducts([]);
    setBackgroundLoadingComplete(false);
    lastFetchedPageRef.current = null;
    setError(null);
    
    // Reload current page
    await fetchPageProducts(1, true);
    
    // Restart background loading after a short delay
    if (enableBackgroundLoading) {
      setTimeout(() => {
        backgroundLoadAllProducts();
      }, 1500);
    }
  }, [cache, cleanup, fetchPageProducts, enableBackgroundLoading, backgroundLoadAllProducts]);

  // Invalidate cache
  const invalidateCache = useCallback(() => {
    cleanup();
    cache.invalidateRoute();
    setAllProducts([]);
    setBackgroundLoadingComplete(false);
    lastFetchedPageRef.current = null;
  }, [cache, cleanup]);

  // Setup data refresh listeners
  useEffect(() => {
    const handleDataRefresh = () => {
      console.log('📢 Data refresh event received');
      refreshProducts();
    };

    window.addEventListener('dataRefresh', handleDataRefresh);
    window.addEventListener(`${routePath}_dataRefresh`, handleDataRefresh);

    return () => {
      window.removeEventListener('dataRefresh', handleDataRefresh);
      window.removeEventListener(`${routePath}_dataRefresh`, handleDataRefresh);
    };
  }, [routePath, refreshProducts]);

  // Setup auto-refresh listeners for CRUD operations
  useEffect(() => {
    console.log('🎧 Setting up auto-refresh listeners...');
    
    const unsubscribeAdded = eventDispatcher.onProductAdded((detail) => {
      console.log('📥 Product added event received, refreshing data...', detail);
      refreshProducts();
    });

    const unsubscribeUpdated = eventDispatcher.onProductUpdated((detail) => {
      console.log('📝 Product updated event received, refreshing data...', detail);
      refreshProducts();
    });

    const unsubscribeDeleted = eventDispatcher.onProductDeleted((detail) => {
      console.log('🗑️ Product deleted event received, refreshing data...', detail);
      refreshProducts();
    });

    const unsubscribeDataRefresh = eventDispatcher.onDataRefresh((detail) => {
      console.log('🔄 Data refresh event received, refreshing data...', detail);
      refreshProducts();
    });

    return () => {
      console.log('🧹 Cleaning up auto-refresh listeners...');
      unsubscribeAdded();
      unsubscribeUpdated();
      unsubscribeDeleted();
      unsubscribeDataRefresh();
    };
  }, [refreshProducts]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    products,
    allProducts,
    loading,
    error,
    totalProducts,
    backgroundLoadingComplete,
    fetchPageProducts,
    refreshProducts,
    invalidateCache,
    backgroundLoadAllProducts
  };
};
