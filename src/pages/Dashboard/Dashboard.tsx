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
import { apiService } from '../../utils/apiService';

interface Product {
  name: string;
  id_product: string;
  stock: number;
  image: string;
  added_by: string;
}

// Komponen untuk halaman Peminjaman
const PeminjamanPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [searchValue, setSearchValue] = useState('');
  const [totalProducts, setTotalProducts] = useState(0);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const itemsPerPage = 12;  // Optimasi fetch data dengan cache
  const fetchPageProducts = async () => {
    try {
      const role = sessionStorage.getItem('userRole') || 'user';
      
      // Check cache first
      const cacheKey = `products_${page}_${role}`;
      const cachedData = sessionStorage.getItem(cacheKey);
      
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        // Cache valid for 5 minutes
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          setProducts(data.product_list);
          setTotalProducts(data.total_products);
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
      }));      setProducts(data.product_list || []);
      setTotalProducts(data.total_products || 0);

    } catch (err) {
      console.error('Error:', err);
      setError('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };  // Ubah cara fetch all products
  const fetchAllProducts = async () => {
    try {
      if (!sessionStorage.getItem('token')) return;
      
      const role = sessionStorage.getItem('userRole') || 'user';
      const response = await apiService.get(`/product/list?role=${role}`);
      
      const data = await response.json();
      setAllProducts(data.product_list || []);
    } catch (err) {
      console.error('Error fetching all products:', err);
    }
  };

  // Ubah useEffect untuk menghindari fetch berlebihan
  useEffect(() => {
    if (searchValue) {
      // Fetch all products hanya jika dalam mode pencarian
      fetchAllProducts();
    } else {
      // Fetch page products untuk tampilan normal
      fetchPageProducts();
    }
  }, [searchValue, page]);

  // Handle search
  useEffect(() => {
    const handleSearch = (event: CustomEvent<string>) => {
      setSearchValue(event.detail);
      setPage(1);
    };
    window.addEventListener('searchChange', handleSearch as EventListener);
    return () => window.removeEventListener('searchChange', handleSearch as EventListener);
  }, []);  // Enhanced filtering function with multiple search criteria
  const filterProducts = (products: Product[], searchTerm: string) => {
    if (!searchTerm) return products;
    
    const lowerSearchTerm = searchTerm.toLowerCase().trim();
    
    return products.filter(product => {
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
      
      return nameMatch || idMatch || stockMatch || stockStatusMatch;
    });
  };

  // Filter dan tampilkan produk dengan enhanced search
  const displayedProducts = useMemo(() => {
    if (searchValue) {
      const filtered = filterProducts(allProducts || [], searchValue);
      const start = (page - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      return filtered.slice(start, end);
    }
    return products || [];
  }, [searchValue, allProducts, products, page]);

  // Update total pages calculation with enhanced filtering
  const totalPages = useMemo(() => {
    if (searchValue) {
      const filtered = filterProducts(allProducts || [], searchValue);
      return Math.ceil(filtered.length / itemsPerPage);
    }
    return Math.ceil(totalProducts / itemsPerPage);
  }, [searchValue, allProducts, totalProducts]);

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
    }}>
      {/* Search Results Info */}
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
            gap: 1
          }}>
            <SearchIcon fontSize="small" />
            Mencari: "<strong>{searchValue}</strong>" - 
            Ditemukan {(() => {
              const filtered = filterProducts(allProducts || [], searchValue);
              return filtered.length;
            })()} hasil
          </Typography>
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
          </Typography>
          <Box sx={{ 
            textAlign: 'left', 
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '0.9rem',
            lineHeight: 1.6
          }}>
            <Typography>• Cari berdasarkan nama produk (contoh: "laptop")</Typography>
            <Typography>• Cari berdasarkan ID produk (contoh: "LT001")</Typography>
            <Typography>• Cari berdasarkan stok (contoh: "10")</Typography>
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
          }}>
            {displayedProducts.map((product) => (
              <AssetCard
                key={product.id_product}
                id={product.id_product}
                nama={product.name}
                stok={product.stock}
                gambar={product.image}
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
  }, [navigate]);

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
        }}>
          <Routes>
            <Route index element={<Navigate to="peminjaman" replace />} />
            <Route path="peminjaman" element={<PeminjamanPage />} />
            <Route path="pengembalian" element={<Pengembalian />} />
            <Route path="buat-akun" element={<BuatAkun />} />
            <Route path="terima-aset" element={<TerimaAset />} />
            <Route path="persetujuan" element={<Persetujuan />} />
          </Routes>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;