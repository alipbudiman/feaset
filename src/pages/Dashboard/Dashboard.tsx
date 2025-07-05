import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import AssetCard from '../../components/AssetCard';
import EditProductModal from '../../components/EditProductModal';
import DeleteProductDialog from '../../components/DeleteProductDialog';
import ProductDescriptionModal from '../../components/ProductDescriptionModal';
import { 
  Box, 
  CircularProgress, 
  Typography, 
  IconButton, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Avatar
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import Pengembalian from '../Pengembalian/Pengembalian';
import BuatAkun from '../BuatAkun/BuatAkun';
import TerimaAset from '../TerimaAset/TerimaAset';
import Persetujuan from '../Persetujuan/Persetujuan';
import { apiService } from '../../utils/apiService';
import { useListPinjam } from '../../context/ListPinjamContext';
import { useAuth } from '../../contexts/useAuth';
import { useProductDataSafe, type Product } from '../../hooks/useProductDataSafe';

// Komponen untuk halaman Peminjaman
const PeminjamanPage = () => {
  // State untuk pencarian dan filter
  const [page, setPage] = useState(1);
  const [searchValue, setSearchValue] = useState('');
  
  // New states for view mode and filters
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // States for modals and table actions
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productQuantities, setProductQuantities] = useState<{[key: string]: number}>({});

  // Use improved product data hook with anti-spam protection
  const {
    products,
    allProducts,
    loading,
    error,
    totalProducts,
    backgroundLoadingComplete,
    fetchPageProducts,
    refreshProducts,
    backgroundLoadAllProducts
  } = useProductDataSafe({
    itemsPerPage: 12,
    enableBackgroundLoading: true
  });

  // Hooks
  const { addToListPinjam } = useListPinjam();
  const auth = useAuth();

  const itemsPerPage = 12;
  console.log('🔧 PeminjamanPage initialized with smart cache system');

  // Check if user has admin privileges
  const userRole = auth?.userRole;
  const canManageProducts = userRole === 'master' || userRole === 'admin';

  // Handler functions for table actions
  const handleQuantityChange = (productId: string, change: number) => {
    setProductQuantities(prev => {
      const currentQty = prev[productId] || 0;
      const product = products.find(p => p.id_product === productId);
      const maxStock = product?.stock || 0;
      const newQty = Math.max(0, Math.min(maxStock, currentQty + change));
      return { ...prev, [productId]: newQty };
    });
  };

  const handleAddToList = (product: Product) => {
    const quantity = productQuantities[product.id_product] || 0;
    if (quantity > 0 && quantity <= product.stock) {
      addToListPinjam({
        id_product: product.id_product,
        name: product.name,
        stock: product.stock,
        image: product.image,
        jumlah: quantity
      });
      // Reset quantity after adding
      setProductQuantities(prev => ({ ...prev, [product.id_product]: 0 }));
    }
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  const handleDeleteProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowDeleteDialog(true);
  };

  const handleShowDescription = (product: Product) => {
    setSelectedProduct(product);
    setShowDescriptionModal(true);
  };

  const handleProductUpdated = () => {
    setShowEditModal(false);
    setSelectedProduct(null);
    // Trigger refresh of products
    refreshProducts();
  };

  const handleProductDeleted = () => {
    setShowDeleteDialog(false);
    setSelectedProduct(null);
    // Trigger refresh of products
    refreshProducts();
  };

  // Function to extract filter options from products
  const extractFilterOptions = (productList: Product[]) => {
    const categories = new Set<string>();
    const locations = new Set<string>();
    const tags = new Set<string>();

    productList.forEach(product => {
      // Extract categories
      if (product.product_category) {
        categories.add(product.product_category);
      }

      // Extract locations
      if (product.product_location) {
        locations.add(product.product_location);
      }

      // Extract tags from category (assuming categories might contain multiple tags)
      if (product.product_category) {
        // If category contains multiple tags separated by commas or spaces
        const categoryTags = product.product_category
          .split(/[,\s]+/)
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0);
        
        categoryTags.forEach(tag => {
          // Remove # prefix if exists for tags
          const cleanTag = tag.startsWith('#') ? tag.substring(1) : tag;
          if (cleanTag) {
            tags.add(cleanTag);
          }
        });
      }
    });

    return {
      categories: Array.from(categories).sort(),
      locations: Array.from(locations).sort(),
      tags: Array.from(tags).sort()
    };
  };

  // Update filter options when products change
  useEffect(() => {
    const dataSource = allProducts.length > 0 ? allProducts : products;
    if (dataSource.length > 0) {
      const filterOptions = extractFilterOptions(dataSource);
      setAvailableCategories(filterOptions.categories);
      setAvailableLocations(filterOptions.locations);
      setAvailableTags(filterOptions.tags);
      
      console.log('🏷️ Filter options updated:', {
        categories: filterOptions.categories.length,
        locations: filterOptions.locations.length,
        tags: filterOptions.tags.length
      });
    }
  }, [products, allProducts]);

  // Load data when page changes using the new hook (consolidated effect)
  useEffect(() => {
    console.log(`📄 Page changed to ${page}, fetching products...`);
    fetchPageProducts(page);
  }, [page, fetchPageProducts]);

  // Initialize background loading only once after component mount
  const backgroundLoadingInitialized = useRef(false);
  useEffect(() => {
    if (!backgroundLoadingComplete && !backgroundLoadingInitialized.current) {
      console.log('🚀 Starting initial background loading...');
      backgroundLoadingInitialized.current = true;
      backgroundLoadAllProducts();
    }
  }, [backgroundLoadingComplete, backgroundLoadAllProducts]);

  // Reset page when filters change (optimized to prevent spam)
  useEffect(() => {
    if (page !== 1) {
      console.log('🔄 Filters changed, resetting to page 1');
      setPage(1); // This will trigger the page useEffect above
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue, selectedCategory, selectedLocation, selectedTag]);

  // Handle search with smart cache system (simplified to prevent spam)
  useEffect(() => {
    const handleSearch = (event: CustomEvent<string>) => {
      const newSearchValue = event.detail;
      setSearchValue(newSearchValue);
      setPage(1);
      // Background loading is managed by the initialization effect only
    };

    console.log('🎧 Setting up search listener');
    window.addEventListener('searchChange', handleSearch as EventListener);
    
    return () => {
      console.log('🧹 Cleaning up search listener');
      window.removeEventListener('searchChange', handleSearch as EventListener);
    };
  }, []); // No dependencies needed for event listener setup

  // Enhanced filtering function with multiple search criteria including tags  // Enhanced filter function that handles both search and dropdown filters
  const applyAllFilters = useCallback((productList: Product[]) => {
    let filtered = [...productList];
    
    // Apply search filter
    if (searchValue) {
      const lowerSearchTerm = searchValue.toLowerCase().trim();
      filtered = filtered.filter((product) => {
        const nameMatch = product.name.toLowerCase().includes(lowerSearchTerm);
        const idMatch = product.id_product.toLowerCase().includes(lowerSearchTerm);
        const stockMatch = !isNaN(Number(lowerSearchTerm)) && 
          product.stock.toString() === lowerSearchTerm;
        const stockStatusMatch = 
          (lowerSearchTerm.includes('habis') || lowerSearchTerm.includes('kosong')) && product.stock === 0 ||
          (lowerSearchTerm.includes('tersedia') || lowerSearchTerm.includes('ada')) && product.stock > 0;
        const categoryMatch = product.product_category && (
          product.product_category.toLowerCase().includes(lowerSearchTerm) ||
          (lowerSearchTerm.startsWith('#') && product.product_category.toLowerCase().includes(lowerSearchTerm.substring(1))) ||
          (!lowerSearchTerm.startsWith('#') && product.product_category.toLowerCase().includes('#' + lowerSearchTerm)) ||
          product.product_category.toLowerCase().replace('#', '').includes(lowerSearchTerm.replace('#', ''))
        );
        const locationMatch = product.product_location && 
          product.product_location.toLowerCase().includes(lowerSearchTerm);
        const addedByMatch = product.added_by && 
          product.added_by.toLowerCase().includes(lowerSearchTerm);
        
        return nameMatch || idMatch || stockMatch || stockStatusMatch || categoryMatch || locationMatch || addedByMatch;
      });
    }
    
    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(product => 
        product.product_category === selectedCategory
      );
    }
    
    // Apply location filter
    if (selectedLocation) {
      filtered = filtered.filter(product => 
        product.product_location === selectedLocation
      );
    }
    
    // Apply tag filter
    if (selectedTag) {
      filtered = filtered.filter(product => {
        if (!product.product_category) return false;
        const cleanTag = selectedTag.startsWith('#') ? selectedTag : '#' + selectedTag;
        const cleanCategory = product.product_category.toLowerCase();
        return cleanCategory.includes(cleanTag.toLowerCase()) || 
               cleanCategory.includes(selectedTag.toLowerCase());
      });
    }
    
    console.log(`🔍 Applied filters - Search: "${searchValue}", Category: "${selectedCategory}", Location: "${selectedLocation}", Tag: "${selectedTag}"`);
    console.log(`🔍 Filtered results: ${filtered.length} from ${productList.length} total products`);
    
    return filtered;
  }, [searchValue, selectedCategory, selectedLocation, selectedTag]);

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
  };// Filter dan tampilkan produk dengan enhanced search  // Filter dan tampilkan produk dengan enhanced search and dropdown filters
  const displayedProducts = useMemo(() => {
    // ALWAYS use allProducts for filtering if available, to ensure all items can be filtered/searched
    // This allows filters to work across all pages, not just current page
    const dataset = allProducts.length > 0 ? allProducts : products;
    
    console.log(`🔍 Filtering dataset: ${dataset.length} products (using ${allProducts.length > 0 ? 'allProducts (complete dataset)' : 'current page products only'})`);
    console.log(`📊 Current page: ${page}, itemsPerPage: ${itemsPerPage}, searchValue: "${searchValue}"`);
    
    if (dataset.length === 0) {
      console.log('⚠️ No products available in any dataset');
      return [];
    }
    
    // Apply all filters (search + dropdown filters) to the complete dataset
    const filtered = applyAllFilters(dataset);
    console.log(`🔍 After filters applied: ${filtered.length} products from complete dataset`);
    
    // Apply pagination logic based on the context
    if (searchValue || selectedCategory || selectedLocation || selectedTag) {
      // When filtering/searching, apply pagination to filtered results
      const start = (page - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      const paginated = filtered.slice(start, end);
      
      console.log(`🔍 Filter/Search mode: showing ${paginated.length} of ${filtered.length} filtered results (page ${page})`);
      console.log(`📄 Products to display:`, paginated.map(p => ({ id: p.id_product, name: p.name })));
      
      return paginated;
    } else {
      // For normal browsing without filters, use backend pagination
      console.log(`📄 Browse mode: showing ${products.length} products from backend page ${page} (no filters active)`);
      console.log(`📄 Products to display:`, products.map(p => ({ id: p.id_product, name: p.name })));
      
      // Use current page products when no filters are applied
      return products;
    }
  }, [searchValue, selectedCategory, selectedLocation, selectedTag, allProducts, products, page, applyAllFilters]);
    // Update total pages calculation with enhanced filtering
  const totalPages = useMemo(() => {
    // If any filters are active, calculate pages based on filtered results
    if (searchValue || selectedCategory || selectedLocation || selectedTag) {
      const dataset = allProducts.length > 0 ? allProducts : products;
      const filtered = applyAllFilters(dataset);
      const totalPagesCalculated = Math.ceil(filtered.length / itemsPerPage);
      
      console.log(`📄 Filter mode: ${filtered.length} filtered results, ${totalPagesCalculated} pages`);
      
      return Math.max(1, totalPagesCalculated); // At least 1 page
    }
    
    // For normal browsing without filters, use backend total
    const totalPagesCalculated = Math.ceil(totalProducts / itemsPerPage);
    
    console.log(`📄 Browse mode: totalProducts=${totalProducts}, itemsPerPage=${itemsPerPage}, totalPages=${totalPagesCalculated}`);
    
    return Math.max(1, totalPagesCalculated); // At least 1 page
  }, [searchValue, selectedCategory, selectedLocation, selectedTag, allProducts, products, totalProducts, applyAllFilters]);

  // Monitor background loading progress
  useEffect(() => {
    if (backgroundLoadingComplete && allProducts.length > 0) {
      console.log(`Background loading completed! Total products available for search: ${allProducts.length}`);
    }
  }, [backgroundLoadingComplete, allProducts.length]);

  // Note: Page reset on filter changes is handled by the effect above (line ~220)
  // No need for duplicate effect here to prevent request spam
  
  // Handler functions for filters
  const handleViewModeChange = (_event: React.MouseEvent<HTMLElement>, newViewMode: 'card' | 'list' | null) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  };

  const handleClearFilters = () => {
    setSelectedCategory('');
    setSelectedLocation('');
    setSelectedTag('');
    setSearchValue('');
    setPage(1);
  };

  // Check if any filters are active
  const hasActiveFilters = searchValue || selectedCategory || selectedLocation || selectedTag;  // Product List View Component
  const ProductListView = ({ products }: { products: Product[] }) => (
    <TableContainer 
      component={Paper} 
      sx={{ 
        mb: 3, 
        borderRadius: 2,
        maxHeight: '70vh', // Fixed height for scrollable table
        overflow: 'auto',  // Enable scrolling
        '& .MuiTable-root': {
          minWidth: 650
        },
        // Enhanced table scrollbar styling - more prominent for table content
        '&::-webkit-scrollbar': {
          width: '10px',
          height: '10px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'rgba(0,0,0,0.05)',
          borderRadius: '12px',
          margin: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'linear-gradient(45deg, rgba(78, 113, 255, 0.7), rgba(78, 113, 255, 0.9))',
          borderRadius: '12px',
          border: '2px solid rgba(255,255,255,0.3)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          '&:hover': {
            background: 'linear-gradient(45deg, rgba(78, 113, 255, 0.8), rgba(78, 113, 255, 1))',
            transform: 'scale(1.1)',
          }
        },
        '&::-webkit-scrollbar-thumb:active': {
          background: 'linear-gradient(45deg, rgba(60, 90, 224, 0.9), rgba(60, 90, 224, 1))',
        },
        // Smooth scrolling behavior
        scrollBehavior: 'smooth',
      }}
    >
      <Table stickyHeader>        <TableHead>
          <TableRow sx={{ bgcolor: '#4E71FF' }}>
            <TableCell sx={{ color: 'white', fontWeight: 'bold', bgcolor: '#4E71FF', position: 'sticky', top: 0, zIndex: 100, padding: '16px', fontSize: '1rem' }}>Gambar</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 'bold', bgcolor: '#4E71FF', position: 'sticky', top: 0, zIndex: 100, padding: '16px', fontSize: '1rem' }}>Nama Produk</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 'bold', bgcolor: '#4E71FF', position: 'sticky', top: 0, zIndex: 100, padding: '16px', fontSize: '1rem' }}>ID Produk</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 'bold', bgcolor: '#4E71FF', position: 'sticky', top: 0, zIndex: 100, padding: '16px', fontSize: '1rem' }}>Kategori</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 'bold', bgcolor: '#4E71FF', position: 'sticky', top: 0, zIndex: 100, padding: '16px', fontSize: '1rem' }}>Lokasi</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 'bold', bgcolor: '#4E71FF', position: 'sticky', top: 0, zIndex: 100, padding: '16px', fontSize: '1rem' }}>Quantity</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 'bold', bgcolor: '#4E71FF', position: 'sticky', top: 0, zIndex: 100, padding: '16px', fontSize: '1rem' }}>Deskripsi</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 'bold', bgcolor: '#4E71FF', position: 'sticky', top: 0, zIndex: 100, padding: '16px', fontSize: '1rem' }}>Aksi</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id_product} hover sx={{ height: 80 }}>
              <TableCell sx={{ padding: '16px' }}>
                <Avatar
                  src={product.image}
                  alt={product.name}
                  sx={{ width: 60, height: 60 }}
                  variant="rounded"
                />
              </TableCell>
              <TableCell sx={{ fontWeight: 500, fontSize: '1rem', padding: '16px' }}>{product.name}</TableCell>
              <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.95rem', padding: '16px' }}>{product.id_product}</TableCell>
              <TableCell sx={{ padding: '16px' }}>
                <Chip 
                  label={product.product_category || 'No Category'} 
                  size="medium" 
                  color="primary" 
                  variant="outlined" 
                  sx={{ fontSize: '0.875rem', height: 32 }}
                />
              </TableCell>
              <TableCell sx={{ fontSize: '1rem', padding: '16px' }}>{product.product_location || '-'}</TableCell>
              <TableCell sx={{ padding: '16px' }}>
                <Chip 
                  label={product.stock} 
                  size="medium" 
                  color={product.stock > 0 ? 'success' : 'error'}
                  sx={{ fontSize: '0.875rem', height: 32, minWidth: 50 }}
                />
              </TableCell>
              <TableCell sx={{ padding: '16px' }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<InfoIcon />}
                  onClick={() => handleShowDescription(product)}
                  sx={{
                    fontSize: '0.75rem',
                    padding: '6px 12px',
                    minWidth: 100,
                    borderColor: '#4E71FF',
                    color: '#4E71FF',
                    '&:hover': {
                      borderColor: '#3c5ae0',
                      bgcolor: 'rgba(78, 113, 255, 0.1)'
                    }
                  }}
                >
                  Lihat Detail
                </Button>
              </TableCell>              <TableCell sx={{ padding: '16px' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, alignItems: 'flex-start' }}>
                  {/* Quantity selector and Add to List */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Button
                      size="small"
                      onClick={() => handleQuantityChange(product.id_product, -1)}
                      sx={{ 
                        minWidth: 30,
                        height: 30,
                        borderRadius: '50%',
                        bgcolor: '#4E71FF',
                        color: 'white',
                        '&:hover': { bgcolor: '#3c5ae0' }
                      }}
                    >
                      -
                    </Button>
                    <Typography sx={{ minWidth: 20, textAlign: 'center', fontWeight: 'bold' }}>
                      {productQuantities[product.id_product] || 0}
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => handleQuantityChange(product.id_product, 1)}
                      sx={{ 
                        minWidth: 30,
                        height: 30,
                        borderRadius: '50%',
                        bgcolor: '#4E71FF',
                        color: 'white',
                        '&:hover': { bgcolor: '#3c5ae0' }
                      }}
                    >
                      +
                    </Button>
                    <Button 
                      variant="contained" 
                      size="small"
                      disabled={(productQuantities[product.id_product] || 0) === 0}
                      onClick={() => handleAddToList(product)}
                      sx={{ 
                        fontSize: '0.75rem',
                        padding: '6px 12px',
                        ml: 1
                      }}
                    >
                      Tambahkan ke List
                    </Button>
                  </Box>
                  
                  {/* Admin Actions */}
                  {canManageProducts && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button 
                        variant="outlined" 
                        size="small" 
                        startIcon={<EditIcon />}
                        onClick={() => handleEditProduct(product)}
                        sx={{ 
                          fontSize: '0.75rem',
                          padding: '6px 12px',
                          minWidth: 80
                        }}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="outlined" 
                        size="small"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDeleteProduct(product)}
                        sx={{ 
                          fontSize: '0.75rem',
                          padding: '6px 12px',
                          minWidth: 80,
                          color: '#ff6b6b',
                          borderColor: '#ff6b6b',
                          '&:hover': {
                            borderColor: '#ff6b6b',
                            bgcolor: 'rgba(255,107,107,0.1)'
                          }
                        }}
                      >
                        Hapus
                      </Button>
                    </Box>
                  )}
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

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
  }  return (
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
          }}>            <SearchIcon fontSize="small" />
            Mencari: "<strong>{searchValue}</strong>" - 
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
        </Box>      )}

      {/* View Toggle and Filter Controls */}
      <Box sx={{ 
        mb: 3, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2,
        bgcolor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 2,
        p: 2,
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        {/* Filter Dropdowns */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <FilterListIcon sx={{ color: '#fff' }} />
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel sx={{ color: '#fff' }}>Kategori</InputLabel>
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              label="Kategori"
              sx={{
                color: '#fff',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                '& .MuiSvgIcon-root': { color: '#fff' }
              }}
            >
              <MenuItem value="">Semua</MenuItem>
              {availableCategories.map((category) => (
                <MenuItem key={category} value={category}>{category}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel sx={{ color: '#fff' }}>Lokasi</InputLabel>
            <Select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              label="Lokasi"
              sx={{
                color: '#fff',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                '& .MuiSvgIcon-root': { color: '#fff' }
              }}
            >
              <MenuItem value="">Semua</MenuItem>
              {availableLocations.map((location) => (
                <MenuItem key={location} value={location}>{location}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel sx={{ color: '#fff' }}>Tag</InputLabel>
            <Select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              label="Tag"
              sx={{
                color: '#fff',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                '& .MuiSvgIcon-root': { color: '#fff' }
              }}
            >
              <MenuItem value="">Semua</MenuItem>
              {availableTags.map((tag) => (
                <MenuItem key={tag} value={tag}>#{tag}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {hasActiveFilters && (
            <Button
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
              sx={{ 
                color: '#fff',
                borderColor: 'rgba(255,255,255,0.3)',
                '&:hover': { borderColor: '#fff' }
              }}
              variant="outlined"
              size="small"
            >
              Hapus Filter
            </Button>
          )}
        </Box>

        {/* View Toggle */}
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={handleViewModeChange}
          sx={{
            '& .MuiToggleButton-root': {
              color: 'rgba(255,255,255,0.7)',
              borderColor: 'rgba(255,255,255,0.3)',
              '&.Mui-selected': {
                color: '#fff',
                bgcolor: 'rgba(255,255,255,0.2)',
                borderColor: '#fff'
              },
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.1)'
              }
            }
          }}
        >
          <ToggleButton value="card" aria-label="card view">
            <ViewModuleIcon />
          </ToggleButton>
          <ToggleButton value="list" aria-label="list view">
            <ViewListIcon />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {loading ? (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          minHeight: '400px'
        }}>
          <CircularProgress />
        </Box>      ) : displayedProducts.length === 0 && hasActiveFilters ? (
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
            {searchValue ? `Tidak ada hasil untuk "${searchValue}"` : 'Tidak ada produk yang sesuai filter'}
          </Typography>
          <Typography 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '1rem',
              mb: 2
            }}
          >
            {searchValue ? 'Coba gunakan kata kunci lain atau gunakan tips pencarian:' : 'Coba ubah filter atau hapus beberapa filter:'}
          </Typography>

          {/* Active Filters Display */}
          {(selectedCategory || selectedLocation || selectedTag) && (
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem', mb: 1 }}>
                Filter aktif:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                {selectedCategory && (
                  <Chip 
                    label={`Kategori: ${selectedCategory}`} 
                    size="small" 
                    onDelete={() => setSelectedCategory('')}
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                )}
                {selectedLocation && (
                  <Chip 
                    label={`Lokasi: ${selectedLocation}`} 
                    size="small" 
                    onDelete={() => setSelectedLocation('')}
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                )}
                {selectedTag && (
                  <Chip 
                    label={`Tag: #${selectedTag}`} 
                    size="small" 
                    onDelete={() => setSelectedTag('')}
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                )}
              </Box>
            </Box>
          )}

          {searchValue && (
            <Box sx={{ 
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
          )}
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
          {viewMode === 'card' ? (
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
                  onProductUpdated={refreshProducts}
                  currentQuantity={productQuantities[product.id_product] || 0}
                  onQuantityChange={handleQuantityChange}                  onAddToList={(productId) => {
                    const productData = displayedProducts.find(p => p.id_product === productId);
                    if (productData) {
                      handleAddToList(productData);
                    }
                  }}
                  onShowDescription={(productId) => {
                    const productData = displayedProducts.find(p => p.id_product === productId);
                    if (productData) {
                      handleShowDescription(productData);
                    }
                  }}
                />
              ))}
            </Box>
          ) : (
            <ProductListView products={displayedProducts} />
          )}            {/* Pagination - Hidden during search */}
          {!searchValue && totalPages > 1 && (
            <Box sx={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              pb: 2
            }}>
              <Box sx={{
                bgcolor: 'white',
                borderRadius: '25px',
                py: 0.5,
                px: 1.5,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.08)',
              }}>
                <IconButton
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={page === 1}
                  size="small"
                  sx={{
                    color: page === 1 ? 'rgba(0,0,0,0.26)' : '#4E71FF',
                    width: 28,
                    height: 28,
                  }}
                >
                  <NavigateBeforeIcon fontSize="small" />
                </IconButton>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                  <Button
                    key={number}
                    onClick={() => setPage(number)}
                    variant={page === number ? 'contained' : 'text'}
                    size="small"
                    sx={{
                      minWidth: 28,
                      height: 28,
                      borderRadius: '50%',
                      fontSize: '0.75rem',
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
                  size="small"
                  sx={{
                    color: page === totalPages ? 'rgba(0,0,0,0.26)' : '#4E71FF',
                    width: 28,
                    height: 28,
                  }}
                >
                  <NavigateNextIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          )}        </>
      )}      {/* Edit Product Modal */}
      {selectedProduct && (
        <EditProductModal
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          product={{
            id_product: selectedProduct.id_product,
            name: selectedProduct.name,
            stock: selectedProduct.stock,
            image: selectedProduct.image,
            product_category: selectedProduct.product_category || '',
            product_location: selectedProduct.product_location || '',
            visible_to_user: selectedProduct.visible_to_user,
            product_description: selectedProduct.product_description || ''
          }}
          onProductUpdated={handleProductUpdated}
          currentUserRole={userRole}
        />
      )}

      {/* Delete Product Dialog */}
      {selectedProduct && (
        <DeleteProductDialog
          open={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          product={{
            id_product: selectedProduct.id_product,
            name: selectedProduct.name,
            stock: selectedProduct.stock,
            image: selectedProduct.image,
            product_category: selectedProduct.product_category || '',
            product_location: selectedProduct.product_location || ''
          }}
          onProductDeleted={handleProductDeleted}
          currentUserRole={userRole}
        />
      )}

      {/* Product Description Modal */}
      <ProductDescriptionModal
        open={showDescriptionModal}
        onClose={() => setShowDescriptionModal(false)}
        product={selectedProduct}
      />
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

      console.log('🔍 Dashboard: Checking authentication...');
      console.log('🔑 Dashboard: Token available =', token ? `${token.slice(0, 20)}...` : 'null');
      console.log('👤 Dashboard: Saved role =', savedRole);

      if (!token) {
        console.log('❌ Dashboard: No token found, redirecting to login');
        navigate('/login');
        return;
      }      try {
        console.log('📡 Dashboard: Fetching user account data...');
        const response = await apiService.get('/user/get_account');

        if (response.ok) {
          const data = await response.json();
          const role = data.role || savedRole || 'user';
          console.log('✅ Dashboard: User role fetched =', role);
          setUserRole(role);
          sessionStorage.setItem('userRole', role);
        } else {
          console.log('⚠️ Dashboard: Failed to fetch user data, using saved role');
          setUserRole(savedRole || 'user');
        }
      } catch (error) {
        console.error('❌ Dashboard: Error fetching user role:', error);
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
        <Header />        <Box 
          className="dashboard-scrollbar"
          sx={{ 
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
            <Route index element={<Navigate to="peminjaman" replace />} />            <Route path="peminjaman" element={<PeminjamanPage />} />
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