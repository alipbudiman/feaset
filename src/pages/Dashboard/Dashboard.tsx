import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import AssetCard from '../../components/AssetCard';
import { Box, CircularProgress, Typography, IconButton, Button } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useEffect, useState, useMemo } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import Pengembalian from '../Pengembalian/Pengembalian';
import BuatAkun from '../BuatAkun/BuatAkun';
import TerimaAset from '../TerimaAset/TerimaAset';
import Persetujuan from '../Persetujuan/Persetujuan';
import UserManagement from '../UserManagement/UserManagement';
import { apiService } from '../../utils/apiService';

interface Product {
  name: string;
  id_product: string;
  stock: number;
  image: string;
  added_by: string;
  product_category: string;
  visible_to_user: boolean;
  product_location: string;
}

// Komponen untuk halaman Peminjaman
const PeminjamanPage = () => {
  const [products, setProducts] = useState<Product[]>([]);  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [searchValue, setSearchValue] = useState('');
  const [totalProducts, setTotalProducts] = useState(0);  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [backgroundLoadingComplete, setBackgroundLoadingComplete] = useState(false);  const itemsPerPage = 12;
  const location = useLocation();  // Function untuk force refresh semua data (clear cache dan reload)
  const forceRefreshProducts = async () => {
    try {
      console.log('🚀 Starting force refresh of products data...');
      console.log('📊 Current state before refresh:', {
        productsCount: products.length,
        allProductsCount: allProducts.length,
        currentPage: page,
        backgroundLoadingComplete,
        searchValue,
        currentPath: location.pathname
      });
      
      // Clear all related cache
      const keysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.startsWith('products_') || key.startsWith('all_products_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => sessionStorage.removeItem(key));
      console.log('🗑️ Cleared cache keys:', keysToRemove);
      
      // Reset state
      setBackgroundLoadingComplete(false);
      setAllProducts([]);
      console.log('🔄 Reset background loading state and products');
      
      // Force reload current page data
      console.log('📄 Force reloading current page data...');
      setLoading(true); // Show loading indicator
      await fetchPageProducts(true);
      
      // Start background loading again
      setTimeout(() => {
        console.log('🔄 Starting background loading again...');
        backgroundLoadAllProducts(0); // Start from index 0 to include first page
      }, 500);
      
      console.log('✅ Products data force refreshed successfully after stock change');
      
      // Additional verification
      setTimeout(() => {
        console.log('🔍 Post-refresh state verification:', {
          productsCount: products.length,
          allProductsCount: allProducts.length,
          loading: loading,
          backgroundLoadingComplete: backgroundLoadingComplete
        });
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error force refreshing products:', error);
      setLoading(false); // Ensure loading state is cleared on error
    }
  };

  // Optimasi fetch data dengan cache dan background loading
  const fetchPageProducts = async (forceRefresh = false) => {
    try {
      const role = sessionStorage.getItem('userRole') || 'user';
        // Check cache first
      const cacheKey = `products_${page}_${role}`;
      const cachedData = sessionStorage.getItem(cacheKey);
      
      if (cachedData && !forceRefresh) {
        const { data, timestamp } = JSON.parse(cachedData);
        // Cache valid for 5 minutes
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          setProducts(data.product_list);
          setTotalProducts(data.total_products);
            // Start background loading jika belum complete dan ini page 1
          if (page === 1 && !backgroundLoadingComplete) {            // Include cached data (index 0) in allProducts first
            setAllProducts(prevProducts => {
              const existingProductIds = prevProducts.map((p: Product) => p.id_product);
              const newProducts = (data.product_list || []).filter(
                (product: Product) => !existingProductIds.includes(product.id_product)
              );
              const updatedProducts = [...prevProducts, ...newProducts];
              console.log(`📦 Added ${newProducts.length} cached products from page 1 to search dataset. Total: ${updatedProducts.length}`);
              return updatedProducts;
            });
            
            backgroundLoadAllProducts(1); // Start from index 1 since we already have index 0
          }
          return;
        }
      }

      setLoading(true);
      
      const response = await apiService.get(`/product/list?index=${page-1}&role=${role}`);

      if (!response.ok) throw new Error('Gagal mengambil data');
      
      const data = await response.json();
      
      // Save to cache
      sessionStorage.setItem(cacheKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
        setProducts(data.product_list || []);
      setTotalProducts(data.total_products || 0);
      
      console.log(`📦 Fetched page ${page} data:`, data.product_list);
      
      // Start background loading untuk semua data jika ini page 1
      if (page === 1 && !backgroundLoadingComplete) {
        // Include current page data (index 0) in allProducts first
        setAllProducts(prevProducts => {
          const existingProductIds = prevProducts.map((p: Product) => p.id_product);
          const newProducts = (data.product_list || []).filter(
            (product: Product) => !existingProductIds.includes(product.id_product)
          );
          const updatedProducts = [...prevProducts, ...newProducts];
          console.log(`📦 Added ${newProducts.length} products from page 1 to search dataset. Total: ${updatedProducts.length}`);
          console.log(`📦 Updated allProducts:`, updatedProducts);
          return updatedProducts;
        });
        
        // Start background loading from next index
        setTimeout(() => {
          console.log('Starting background loading from index 1...');
          backgroundLoadAllProducts(1);
        }, 500); // Delay 500ms agar tidak mengganggu loading page pertama
      }
      
      // Also ensure current page products are always in allProducts for immediate search
      if (data.product_list && data.product_list.length > 0) {
        setAllProducts(prevProducts => {
          const existingProductIds = prevProducts.map((p: Product) => p.id_product);
          const newProducts = (data.product_list || []).filter(
            (product: Product) => !existingProductIds.includes(product.id_product)
          );
          if (newProducts.length > 0) {
            const updatedProducts = [...prevProducts, ...newProducts];
            console.log(`📦 Ensured current page products in allProducts. Added: ${newProducts.length}, Total: ${updatedProducts.length}`);
            return updatedProducts;
          }
          return prevProducts;
        });
      }

    } catch (err) {
      console.error('Error:', err);
      setError('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };// Background loading semua produk secara bertahap
  const backgroundLoadAllProducts = async (startIndex: number = 0) => {
    try {
      const role = sessionStorage.getItem('userRole') || 'user';
      let currentIndex = startIndex;
      let allLoadedProducts: Product[] = [...allProducts];
      
      // Cek cache untuk data lengkap
      const allProductsCacheKey = `all_products_${role}`;
      const cachedAllProducts = sessionStorage.getItem(allProductsCacheKey);
      
      if (cachedAllProducts) {
        const { data, timestamp } = JSON.parse(cachedAllProducts);
        // Cache valid for 10 minutes untuk data lengkap
        if (Date.now() - timestamp < 10 * 60 * 1000) {
          setAllProducts(data);
          setBackgroundLoadingComplete(true);
          return;
        }
      }

      while (true) {
        const response = await apiService.get(`/product/list?index=${currentIndex}&role=${role}`);
        
        if (!response.ok) break;
        
        const data = await response.json();
        
        if (!data.product_list || data.product_list.length === 0) {
          break; // No more data
        }
          // Append new products to existing ones
        allLoadedProducts = [...allLoadedProducts, ...data.product_list];
        setAllProducts(allLoadedProducts);
        
        // Check if we've reached the last page
        if (currentIndex >= data.last_index || data.product_list.length < itemsPerPage) {
          break;
        }
        
        currentIndex++;
        
        // Add small delay to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Save complete data to cache
      sessionStorage.setItem(allProductsCacheKey, JSON.stringify({
        data: allLoadedProducts,
        timestamp: Date.now()
      }));
      
      setBackgroundLoadingComplete(true);
      console.log(`Background loading complete: ${allLoadedProducts.length} products loaded`);
      
    } catch (err) {
      console.error('Error in background loading:', err);
    }
  };  // Optimasi useEffect untuk loading data
  useEffect(() => {
    if (searchValue) {
      // Jika sedang search dan background loading belum complete, tunggu atau gunakan data yang ada
      if (!backgroundLoadingComplete && allProducts.length === 0) {
        // Trigger background loading jika belum ada data sama sekali, mulai dari index 0
        backgroundLoadAllProducts(0);
      }
      // Search akan menggunakan allProducts yang tersedia
    } else {
      // Fetch page products untuk tampilan normal
      fetchPageProducts();
    }
  }, [searchValue, page]);  // Check for refresh flag when PeminjamanPage mounts
  useEffect(() => {
    console.log('🎯 PeminjamanPage mounted, checking for refresh flag...');
    
    // Check immediately
    const checkRefreshFlag = () => {
      const needsRefresh = sessionStorage.getItem('peminjamanNeedsRefresh');
      console.log('🔍 Checking refresh flag:', { needsRefresh, currentPath: location.pathname });
      
      if (needsRefresh === 'true') {
        console.log('✅ Refresh flag detected! Triggering force refresh...');
        sessionStorage.removeItem('peminjamanNeedsRefresh');
        forceRefreshProducts();
        return true;
      }
      return false;
    };

    // Check immediately
    if (!checkRefreshFlag()) {
      // Also check after a short delay to catch race conditions
      const checkTimer = setTimeout(() => {
        console.log('⏰ Delayed check for refresh flag...');
        checkRefreshFlag();
      }, 100);

      return () => clearTimeout(checkTimer);
    }
  }, []); // Run only on mount

  // Check for refresh flag when user navigates to peminjaman page
  useEffect(() => {
    console.log('🧭 Location changed to:', location.pathname);
    
    if (location.pathname === '/dashboard/peminjaman') {
      console.log('📍 Navigation to peminjaman detected, checking refresh flag...');
      
      // Multiple checks with different delays to ensure we catch the flag
      const timers: NodeJS.Timeout[] = [];
      
      [50, 150, 300].forEach((delay, index) => {
        const timer = setTimeout(() => {
          const needsRefresh = sessionStorage.getItem('peminjamanNeedsRefresh');
          console.log(`⏱️ Check ${index + 1} (${delay}ms delay):`, { needsRefresh });
          
          if (needsRefresh === 'true') {
            console.log(`✅ Refresh flag found on check ${index + 1}! Triggering refresh...`);
            sessionStorage.removeItem('peminjamanNeedsRefresh');
            forceRefreshProducts();
          }
        }, delay);
        
        timers.push(timer);
      });

      return () => {
        console.log('🧹 Cleaning up navigation timers');
        timers.forEach(timer => clearTimeout(timer));
      };
    }
  }, [location.pathname]); // Run when location changes

// Handle search
  useEffect(() => {
    const handleSearch = (event: CustomEvent<string>) => {
      const newSearchValue = event.detail;
      setSearchValue(newSearchValue);
      setPage(1);
      
      // If user starts searching and we don't have all products yet, 
      // ensure we at least have the first page products included
      if (newSearchValue && allProducts.length === 0 && products.length > 0) {
        console.log('🔍 Starting search - ensuring first page products are included');
        setAllProducts(products);
        // Then start background loading from index 1
        setTimeout(() => {
          backgroundLoadAllProducts(1);
        }, 100);
      }
      
      // Force immediate update if we have products but not in allProducts
      if (newSearchValue && products.length > 0 && allProducts.length < products.length) {
        console.log('🔍 Force updating allProducts with current products');
        setAllProducts(prevAll => {
          const existingIds = prevAll.map(p => p.id_product);
          const newProducts = products.filter(p => !existingIds.includes(p.id_product));
          return [...prevAll, ...newProducts];
        });
      }
    };

    const handleDataRefresh = () => {
      console.log('📢 Received data refresh event in PeminjamanPage');
      forceRefreshProducts();
    };

    const handlePeminjamanDataRefresh = () => {
      console.log('🏠 Received peminjaman-specific data refresh event');
      console.log('🏠 Force refreshing PeminjamanPage products data...');
      forceRefreshProducts();
    };

    console.log('🎧 Setting up event listeners in PeminjamanPage');
    window.addEventListener('searchChange', handleSearch as EventListener);
    window.addEventListener('dataRefresh', handleDataRefresh as EventListener);
    window.addEventListener('peminjamanDataRefresh', handlePeminjamanDataRefresh as EventListener);
    
    return () => {
      console.log('🧹 Cleaning up event listeners in PeminjamanPage');
      window.removeEventListener('searchChange', handleSearch as EventListener);
      window.removeEventListener('dataRefresh', handleDataRefresh as EventListener);
      window.removeEventListener('peminjamanDataRefresh', handlePeminjamanDataRefresh as EventListener);
    };
  }, [allProducts.length, products]);

  // Periodic check for refresh flag (safety net)
  useEffect(() => {
    const intervalId = setInterval(() => {
      const needsRefresh = sessionStorage.getItem('peminjamanNeedsRefresh');
      if (needsRefresh === 'true' && location.pathname === '/dashboard/peminjaman') {
        console.log('🔄 Periodic check found refresh flag, triggering refresh...');
        sessionStorage.removeItem('peminjamanNeedsRefresh');
        forceRefreshProducts();
      }
    }, 2000); // Check every 2 seconds

    return () => {
      clearInterval(intervalId);
    };
  }, [location.pathname]);  // Enhanced filtering function with multiple search criteria including tags
  const filterProducts = (products: Product[], searchTerm: string) => {
    if (!searchTerm) return products;
    
    const lowerSearchTerm = searchTerm.toLowerCase().trim();
    
    const filtered = products.filter((product) => {
      // Search by product name (primary)
      const nameMatch = product.name.toLowerCase().includes(lowerSearchTerm);
      
      // Search by product ID (secondary)  
      const idMatch = product.id_product.toLowerCase().includes(lowerSearchTerm);
      
      // Search by exact stock number (if search term is numeric)
      const stockMatch = !isNaN(Number(lowerSearchTerm)) && 
        product.stock.toString() === lowerSearchTerm;
      
      // Search for products with stock status
      const stockStatusMatch = 
        (lowerSearchTerm.includes('habis') || lowerSearchTerm.includes('kosong')) && product.stock === 0 ||
        (lowerSearchTerm.includes('tersedia') || lowerSearchTerm.includes('ada')) && product.stock > 0;
        // Search by product category (enhanced with # handling)
      const categoryMatch = product.product_category && (
        // Direct category match
        product.product_category.toLowerCase().includes(lowerSearchTerm) ||
        // Search term with # matches category
        (lowerSearchTerm.startsWith('#') && product.product_category.toLowerCase().includes(lowerSearchTerm.substring(1))) ||
        // Search term without # matches category that starts with #
        (!lowerSearchTerm.startsWith('#') && product.product_category.toLowerCase().includes('#' + lowerSearchTerm)) ||
        // Flexible category matching
        product.product_category.toLowerCase().replace('#', '').includes(lowerSearchTerm.replace('#', ''))
      );
      
      // Search by product location
      const locationMatch = product.product_location && 
        product.product_location.toLowerCase().includes(lowerSearchTerm);
      
      // Search by added_by user
      const addedByMatch = product.added_by && 
        product.added_by.toLowerCase().includes(lowerSearchTerm);
      
      return nameMatch || idMatch || stockMatch || stockStatusMatch || categoryMatch || locationMatch || addedByMatch;
    });
    
    console.log(`🔍 Search "${searchTerm}": ${filtered.length} results from ${products.length} total products`);
    if (filtered.length > 0) {
      console.log(`🔍 Found products:`, filtered.map(p => `${p.name} (#${p.product_category}) - ${p.product_location}`));
    }
    return filtered;
  };// Filter dan tampilkan produk dengan enhanced search
  const displayedProducts = useMemo(() => {
    if (searchValue) {
      // Use combined dataset: allProducts if available, otherwise fallback to current products
      const searchDataset = allProducts.length > 0 ? allProducts : products;
      
      console.log(`🔍 Searching in dataset: ${searchDataset.length} products (using ${allProducts.length > 0 ? 'allProducts' : 'current products'})`);
      
      if (searchDataset.length === 0) {
        console.log('⚠️ Search attempted but no products available in any dataset');
        return [];
      }
      
      const filtered = filterProducts(searchDataset, searchValue);
      const start = (page - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      return filtered.slice(start, end);
    }
    return products || [];
  }, [searchValue, allProducts, products, page]);
  // Update total pages calculation with enhanced filtering
  const totalPages = useMemo(() => {
    if (searchValue) {
      // Use combined dataset: allProducts if available, otherwise fallback to current products
      const searchDataset = allProducts.length > 0 ? allProducts : products;
      const filtered = filterProducts(searchDataset, searchValue);
      return Math.ceil(filtered.length / itemsPerPage);
    }
    return Math.ceil(totalProducts / itemsPerPage);
  }, [searchValue, allProducts, products, totalProducts]);

  // Monitor background loading progress
  useEffect(() => {
    if (backgroundLoadingComplete && allProducts.length > 0) {
      console.log(`Background loading completed! Total products available for search: ${allProducts.length}`);
    }
  }, [backgroundLoadingComplete, allProducts.length]);

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        p: 3, 
        textAlign: 'center',
        color: 'error.main'
      }}>
        <Typography>{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{
      p: 3,
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100%',
      width: '100%',
      maxWidth: '1400px',
      mx: 'auto',
      position: 'relative'
    }}>      {/* Search Results Info dengan Background Loading Status */}
      {searchValue && (
        <Box sx={{ 
          mb: 3, 
          bgcolor: 'rgba(255, 255, 255, 0.1)', 
          borderRadius: 2, 
          p: 2,
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <Typography sx={{ 
            color: '#fff', 
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: !backgroundLoadingComplete ? 1 : 0
          }}>
            <SearchIcon fontSize="small" />            Mencari: "<strong>{searchValue}</strong>" - 
            Ditemukan {(() => {
              const searchDataset = allProducts.length > 0 ? allProducts : products;
              const filtered = filterProducts(searchDataset, searchValue);
              return filtered.length;
            })()} hasil
            {!backgroundLoadingComplete && allProducts.length > 0 && (
              <Typography component="span" sx={{ 
                color: 'rgba(255, 255, 255, 0.7)', 
                fontSize: '0.9rem',
                ml: 1 
              }}>
                ({allProducts.length} dari {totalProducts} produk dimuat)
              </Typography>
            )}
          </Typography>
          
          {!backgroundLoadingComplete && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              mt: 1 
            }}>
              <CircularProgress size={16} sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
              <Typography sx={{ 
                color: 'rgba(255, 255, 255, 0.7)', 
                fontSize: '0.85rem'
              }}>
                Memuat lebih banyak produk untuk pencarian yang lebih akurat...
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {loading ? (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          minHeight: '400px'
        }}>
          <CircularProgress />
        </Box>      ) : displayedProducts.length === 0 && searchValue ? (
        <Box sx={{ 
          textAlign: 'center', 
          mt: 4,
          bgcolor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 2,
          p: 4,
          maxWidth: '600px',
          mx: 'auto'
        }}>
          <Typography 
            sx={{ 
              color: '#fff',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              mb: 2
            }}
          >
            Tidak ada hasil untuk "{searchValue}"
          </Typography>
          <Typography 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '1rem',
              mb: 2
            }}
          >
            Coba gunakan kata kunci lain atau gunakan tips pencarian:
          </Typography>          <Box sx={{ 
            textAlign: 'left', 
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '0.9rem',
            lineHeight: 1.6
          }}>
            <Typography>• Cari berdasarkan nama produk (contoh: "laptop")</Typography>
            <Typography>• Cari berdasarkan ID produk (contoh: "LT001")</Typography>
            <Typography>• Cari berdasarkan stok (contoh: "10")</Typography>
            <Typography>• Cari berdasarkan kategori (contoh: "#computer" atau "electronics")</Typography>
            <Typography>• Cari berdasarkan lokasi (contoh: "labor 404")</Typography>
            <Typography>• Cari status stok (contoh: "habis", "tersedia")</Typography>
          </Box>
        </Box>
      ) : products.length === 0 ? (
        <Typography 
          sx={{ 
            color: '#fff',
            fontSize: '1.2rem',
            textAlign: 'center',
            mt: 4 
          }}
        >
          Tidak ada produk yang tersedia
        </Typography>
      ) : (
        <>
          <Box sx={{
            display: 'grid',
            gap: 4, // Memperbesar gap
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', // Mengurangi ukuran minimum card
            width: '100%',
            mb: products.length > itemsPerPage ? 8 : 0,
            px: 4, // Menambah padding horizontal
            py: 2, // Menambah padding vertical
            '& > *': {
              justifySelf: 'center' // Memastikan card berada di tengah kolom
            }
          }}>            {displayedProducts.map((product) => (
              <AssetCard
                key={product.id_product}
                id={product.id_product}
                nama={product.name}
                stok={product.stock}
                gambar={product.image}
                product_category={product.product_category}
                product_location={product.product_location}
                onProductUpdated={forceRefreshProducts}
              />
            ))}
          </Box>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              pb: 4
            }}>
              <Box sx={{
                bgcolor: 'white',
                borderRadius: '50px',
                py: 1,
                px: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
              }}>
                <IconButton
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={page === 1}
                  sx={{
                    color: page === 1 ? 'rgba(0,0,0,0.26)' : '#4E71FF',
                  }}
                >
                  <NavigateBeforeIcon />
                </IconButton>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                  <Button
                    key={number}
                    onClick={() => setPage(number)}
                    variant={page === number ? 'contained' : 'text'}
                    sx={{
                      minWidth: 40,
                      height: 40,
                      borderRadius: '50%',
                      color: page === number ? 'white' : '#4E71FF',
                      bgcolor: page === number ? '#4E71FF' : 'transparent',
                      '&:hover': {
                        bgcolor: page === number ? '#3c5ae0' : 'rgba(78,113,255,0.04)'
                      }
                    }}
                  >
                    {number}
                  </Button>
                ))}

                <IconButton
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages}
                  sx={{
                    color: page === totalPages ? 'rgba(0,0,0,0.26)' : '#4E71FF',
                  }}
                >
                  <NavigateNextIcon />
                </IconButton>
              </Box>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

const Dashboard = () => {
  const [userRole, setUserRole] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserRole = async () => {
      const token = sessionStorage.getItem('token');
      const savedRole = sessionStorage.getItem('userRole');

      if (!token) {
        navigate('/login');
        return;
      }      try {
        const response = await apiService.get('/user/get_account');

        if (response.ok) {
          const data = await response.json();
          const role = data.role || savedRole || 'user';
          setUserRole(role);
          sessionStorage.setItem('userRole', role);
        } else {
          setUserRole(savedRole || 'user');
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setUserRole(savedRole || 'user');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, [navigate]);  // Add global data refresh listener at Dashboard level
  useEffect(() => {
    const handleGlobalDataRefresh = () => {
      console.log('🌐 Global data refresh triggered from Dashboard level');
      console.log('🗺️ Current location:', location.pathname);
      console.log('📊 SessionStorage before setting flag:', {
        currentFlag: sessionStorage.getItem('peminjamanNeedsRefresh'),
        allKeys: Object.keys(sessionStorage)
      });
      
      // Set a flag in sessionStorage to indicate data needs refresh
      sessionStorage.setItem('peminjamanNeedsRefresh', 'true');
      console.log('🏷️ Set peminjamanNeedsRefresh flag in sessionStorage');
      
      // Verify the flag was set
      const verifyFlag = sessionStorage.getItem('peminjamanNeedsRefresh');
      console.log('✅ Flag verification:', { flagValue: verifyFlag, flagSet: verifyFlag === 'true' });
      
      // If currently on peminjaman page, refresh immediately
      if (location.pathname === '/dashboard/peminjaman') {
        console.log('🔄 Currently on peminjaman page, refreshing immediately');
        window.dispatchEvent(new CustomEvent('peminjamanDataRefresh'));
      } else {
        console.log('📝 Not on peminjaman page, data will refresh when navigating to it');
        console.log('📝 Current path:', location.pathname, 'Target path: /dashboard/peminjaman');
      }
      
      console.log('📢 Global dataRefresh handling completed');
    };

    console.log('🎯 Setting up global dataRefresh listener in Dashboard');
    window.addEventListener('dataRefresh', handleGlobalDataRefresh);
    
    return () => {
      console.log('🧹 Cleaning up global dataRefresh listener in Dashboard');
      window.removeEventListener('dataRefresh', handleGlobalDataRefresh);
    };
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname === '/dashboard') {
      navigate('peminjaman');
    }
  }, [location.pathname, navigate]);

  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        bgcolor: '#8bb6e6',
        width: '100vw'
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh',
      width: '100vw',
      bgcolor: '#8bb6e6',
      overflow: 'hidden'
    }}>
      <Sidebar userRole={userRole} />
      <Box sx={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        ml: { xs: 0, md: '280px' },
        width: { xs: '100%', md: 'calc(100% - 280px)' },
        transition: 'all 0.3s ease',
        position: 'relative',
        height: '100vh',
        overflow: 'hidden'
      }}>
        <Header />
        <Box sx={{ 
          flex: 1,
          overflow: 'auto',
          bgcolor: '#8bb6e6',
          display: 'flex',
          justifyContent: 'center',
          pt: 2,
          pb: 4,
          px: 3,
          '& > *': {
            width: '100%',
            maxWidth: '1400px'
          }
        }}>          <Routes>
            <Route index element={<Navigate to="peminjaman" replace />} />
            <Route path="peminjaman" element={<PeminjamanPage />} />
            <Route path="pengembalian" element={<Pengembalian />} />
            <Route path="buat-akun" element={<BuatAkun />} />
            <Route path="terima-aset" element={<TerimaAset />} />
            <Route path="persetujuan" element={<Persetujuan />} />
            <Route path="user-management" element={<UserManagement />} />
          </Routes>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;