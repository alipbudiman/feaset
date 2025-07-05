// hooks/useProductDataOptimized.ts
// Optimized product data hook with request deduplication

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

export const useProductDataOptimized = ({
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

  // Request management with refs to prevent race conditions
  const activeRequests = useRef<Set<string>>(new Set());
  const lastFetchedPage = useRef<number | null>(null);
  const backgroundLoadingRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Get user role
  const getUserRole = () => sessionStorage.getItem('userRole') || 'user';

  // Cleanup function
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    activeRequests.current.clear();
    backgroundLoadingRef.current = false;
  }, []);

  // Fetch single page with deduplication
  const fetchPageProducts = useCallback(async (page: number, forceRefresh = false) => {
    const role = getUserRole();
    const requestKey = `page_${page}_${role}`;
    const cacheKey = `products_page_${page}_${role}`;
    
    // Prevent duplicate requests
    if (!forceRefresh && activeRequests.current.has(requestKey)) {
      console.log(`⚠️ Duplicate request prevented for page ${page}`);
      return;
    }

    // Skip if same page recently loaded
    if (!forceRefresh && lastFetchedPage.current === page && products.length > 0) {
      console.log(`✅ Page ${page} already loaded, using existing data`);
      return;
    }

    try {
      // Check cache first
      if (!forceRefresh) {
        const cachedData = cache.getCache<{product_list: Product[], total_products: number}>(cacheKey);
        if (cachedData) {
          console.log(`✅ Cache hit for page ${page}`);
          setProducts(cachedData.product_list || []);
          setTotalProducts(cachedData.total_products || 0);
          lastFetchedPage.current = page;
          setLoading(false);
          return;
        }
      }

      // Mark request as active
      activeRequests.current.add(requestKey);
      setLoading(true);
      setError(null);

      console.log(`🌐 Fetching page ${page} (index: ${page - 1})`);
      
      // Create abort controller for this request
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const response = await apiService.get(
        `/product/list?index=${page - 1}&role=${role}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      
      console.log(`📊 Page ${page} API response:`, {
        requestedPage: page,
        requestedIndex: page - 1,
        responseIndex: data.index,
        lastIndex: data.last_index,
        totalProducts: data.total_products,
        productsInPage: data.product_list?.length || 0,
        productSample: data.product_list?.slice(0, 2).map((p: Product) => p.name) || []
      });

      // Cache and update state
      cache.setCache(cacheKey, data);
      setProducts(data.product_list || []);
      setTotalProducts(data.total_products || 0);
      lastFetchedPage.current = page;

      // Update allProducts for search
      if (data.product_list?.length > 0) {
        setAllProducts(prev => {
          const existingIds = new Set(prev.map(p => p.id_product));
          const newProducts = data.product_list.filter((p: Product) => 
            !existingIds.has(p.id_product)
          );
          
          if (newProducts.length > 0) {
            console.log(`📦 Added ${newProducts.length} products to search data`);
            return [...prev, ...newProducts];
          }
          return prev;
        });
      }

    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('❌ Error fetching products:', err);
        setError(err.message);
      }
    } finally {
      setLoading(false);
      activeRequests.current.delete(requestKey);
      if (abortControllerRef.current?.signal === abortControllerRef.current?.signal) {
        abortControllerRef.current = null;
      }
    }
  }, [cache, products.length]);

  // Background loading with better control
  const backgroundLoadAllProducts = useCallback(async () => {
    if (!enableBackgroundLoading || backgroundLoadingRef.current) {
      console.log(`⚠️ Background loading skipped: enabled=${enableBackgroundLoading}, active=${backgroundLoadingRef.current}`);
      return;
    }

    const role = getUserRole();
    const cacheKey = `all_products_${role}`;

    try {
      // Check cache first
      const cachedData = cache.getCache<Product[]>(cacheKey, 5 * 60 * 1000);
      if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
        console.log(`✅ Using cached all products: ${cachedData.length} items`);
        setAllProducts(cachedData);
        setBackgroundLoadingComplete(true);
        return;
      }

      backgroundLoadingRef.current = true;
      console.log(`🔄 Starting background loading to fetch ALL products...`);

      let currentIndex = 0;
      let allLoadedProducts: Product[] = [...allProducts];
      let lastIndex = 0;
      let totalProductsFromAPI = 0;
      let attempts = 0;
      const maxAttempts = 50; // Increase for larger datasets

      // First request to get the total and last_index
      console.log(`📡 Making initial request to get total_products and last_index...`);
      const initialResponse = await apiService.get(`/product/list?index=0&role=${role}`);
      
      if (!initialResponse.ok) {
        throw new Error('Failed to fetch initial product data');
      }
      
      const initialData = await initialResponse.json();
      lastIndex = initialData.last_index || 0;
      totalProductsFromAPI = initialData.total_products || 0;
      
      console.log(`📊 API Response Summary:`, {
        currentIndex: initialData.index,
        lastIndex: lastIndex,
        totalProducts: totalProductsFromAPI,
        productsInThisPage: initialData.product_list?.length || 0
      });

      // Add initial products
      if (initialData.product_list?.length > 0) {
        const existingIds = new Set(allLoadedProducts.map(p => p.id_product));
        const newProducts = initialData.product_list.filter((p: Product) => 
          !existingIds.has(p.id_product)
        );
        allLoadedProducts = [...allLoadedProducts, ...newProducts];
        setAllProducts(allLoadedProducts);
        console.log(`📦 Initial load: +${newProducts.length} products (total: ${allLoadedProducts.length})`);
      }

      // Continue loading from index 1 to last_index
      currentIndex = 1;
      while (currentIndex <= lastIndex && attempts < maxAttempts && backgroundLoadingRef.current) {
        try {
          console.log(`� Loading index ${currentIndex}/${lastIndex}...`);
          const response = await apiService.get(`/product/list?index=${currentIndex}&role=${role}`);
          
          if (!response.ok) {
            console.warn(`⚠️ Failed to load index ${currentIndex}, skipping...`);
            currentIndex++;
            attempts++;
            continue;
          }
          
          const data = await response.json();
          
          console.log(`📊 Index ${currentIndex} response:`, {
            index: data.index,
            lastIndex: data.last_index,
            totalProducts: data.total_products,
            productsCount: data.product_list?.length || 0
          });

          // Update last_index and total_products if they've changed
          if (data.last_index !== undefined) lastIndex = data.last_index;
          if (data.total_products !== undefined) totalProductsFromAPI = data.total_products;

          if (!data.product_list?.length) {
            console.log(`📭 No products at index ${currentIndex}, continuing...`);
            currentIndex++;
            attempts++;
            continue;
          }

          // Add new products
          const existingIds = new Set(allLoadedProducts.map(p => p.id_product));
          const newProducts = data.product_list.filter((p: Product) => 
            !existingIds.has(p.id_product)
          );
          
          allLoadedProducts = [...allLoadedProducts, ...newProducts];
          setAllProducts(allLoadedProducts);
          
          console.log(`📦 Index ${currentIndex}: +${newProducts.length} new products (total loaded: ${allLoadedProducts.length}/${totalProductsFromAPI})`);
          
          currentIndex++;
          attempts++;
          
          // Shorter delay to load faster
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (err) {
          console.error(`❌ Error loading index ${currentIndex}:`, err);
          currentIndex++;
          attempts++;
          continue;
        }
      }

      // Final verification
      console.log(`🏁 Background loading finished:`, {
        totalLoaded: allLoadedProducts.length,
        expectedTotal: totalProductsFromAPI,
        lastIndexReached: currentIndex - 1,
        targetLastIndex: lastIndex,
        complete: allLoadedProducts.length >= totalProductsFromAPI || currentIndex > lastIndex
      });

      // Cache complete dataset
      cache.setCache(cacheKey, allLoadedProducts);
      setBackgroundLoadingComplete(true);
      
      console.log(`✅ Background loading complete: ${allLoadedProducts.length} products loaded (expected: ${totalProductsFromAPI})`);

    } catch (err) {
      console.error('❌ Background loading failed:', err);
    } finally {
      backgroundLoadingRef.current = false;
    }
  }, [cache, allProducts, itemsPerPage, enableBackgroundLoading]);

  // Refresh all data
  const refreshProducts = useCallback(async () => {
    console.log('🔄 Refreshing all products...');
    
    cleanup();
    cache.invalidateRoute();
    
    setAllProducts([]);
    setBackgroundLoadingComplete(false);
    lastFetchedPage.current = null;
    setError(null);
    
    // Reload current page
    await fetchPageProducts(1, true);
    
    // Restart background loading
    if (enableBackgroundLoading) {
      setTimeout(() => {
        backgroundLoadAllProducts();
      }, 1000);
    }
  }, [cache, cleanup, fetchPageProducts, enableBackgroundLoading, backgroundLoadAllProducts]);

  // Invalidate cache
  const invalidateCache = useCallback(() => {
    cleanup();
    cache.invalidateRoute();
    setAllProducts([]);
    setBackgroundLoadingComplete(false);
    lastFetchedPage.current = null;
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
