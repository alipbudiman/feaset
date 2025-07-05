import { Box, Typography, Button } from '@mui/material';
import { useState, useEffect } from 'react';
import { Edit as EditIcon, Delete as DeleteIcon, Info as InfoIcon } from '@mui/icons-material';
import { useListPinjam } from '../context/ListPinjamContext';
import { useAuth } from '../contexts/useAuth';
import EditProductModal from './EditProductModal';
import DeleteProductDialog from './DeleteProductDialog';

interface AssetCardProps {
  id: string;
  nama: string;
  stok: number;
  gambar: string; // This will now contain display_url
  product_category?: string;
  product_location?: string;
  onProductUpdated?: () => void; // Callback when product is updated  // New props for quantity synchronization
  currentQuantity?: number;
  onQuantityChange?: (productId: string, change: number) => void;
  onAddToList?: (productId: string) => void;
  // New prop for product description
  onShowDescription?: (productId: string) => void;
}

const AssetCard = ({ 
  id, 
  nama, 
  stok, 
  gambar, 
  product_category, 
  product_location, 
  onProductUpdated,
  currentQuantity = 0,
  onQuantityChange,
  onAddToList,
  onShowDescription
}: AssetCardProps) => {
  // Use external quantity if provided, otherwise use internal state for backward compatibility
  const [internalJumlah, setInternalJumlah] = useState(0);
  const jumlah = currentQuantity !== undefined ? currentQuantity : internalJumlah;
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { addToListPinjam } = useListPinjam();
  const auth = useAuth();
    const handleAddToList = () => {
    if (jumlah > 0 && jumlah <= stok) {
      if (onAddToList) {
        // Use external handler if provided
        onAddToList(id);
      } else {
        // Fallback to internal logic
        addToListPinjam({
          id_product: id,
          name: nama,
          stock: stok,
          image: gambar,
          jumlah
        });
        setInternalJumlah(0);
      }
    }
  };

  // Handler functions for admin actions
  const handleEditProduct = () => {
    setShowEditModal(true);
  };

  const handleDeleteProduct = () => {
    setShowDeleteDialog(true);
  };

  const handleProductUpdated = () => {
    setShowEditModal(false);
    if (onProductUpdated) {
      onProductUpdated();
    }
  };

  const handleProductDeleted = () => {
    setShowDeleteDialog(false);
    if (onProductUpdated) {
      onProductUpdated();
    }
  };
  // Check if user has admin privileges
  const userRole = auth?.userRole;
  const canManageProducts = userRole === 'master' || userRole === 'admin';

  // Fungsi untuk mengubah jumlah - use external handlers if provided
  const decreaseJumlah = () => {
    if (onQuantityChange) {
      onQuantityChange(id, -1);
    } else {
      setInternalJumlah(prev => Math.max(0, prev - 1));
    }
  };
  
  const increaseJumlah = () => {
    if (onQuantityChange) {
      onQuantityChange(id, 1);
    } else {
      setInternalJumlah(prev => Math.min(stok, prev + 1));
    }
  };

  // Update getImageUrl function
  const getImageUrl = (url: string) => {
    try {
      if (!url) return 'https://via.placeholder.com/150';
      
      console.log('Processing image URL:', url);
      
      // If URL is already a valid image URL, use it directly
      if (url.startsWith('http') && (url.endsWith('.jpg') || url.endsWith('.png') || url.endsWith('.jpeg'))) {
        return url;
      }

      // Try to parse if it's a JSON string
      try {
        const parsed = JSON.parse(url);
        if (parsed.data?.url) {
          return parsed.data.url;
        }
      } catch {
        // Not JSON, continue with URL as is
      }

      return url;
    } catch (error) {
      console.error('Error processing image URL:', error);
      return 'https://via.placeholder.com/150';
    }
  };

  // Add debug logging for image URL
  useEffect(() => {
    console.log('Original image URL:', gambar);
    console.log('Processed image URL:', getImageUrl(gambar));
  }, [gambar]);

  return (    <Box sx={{ 
      bgcolor: '#4E71FF',
      borderRadius: '12px',
      p: 1.5,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      height: '380px', // Increased height to accommodate admin buttons
      width: '220px', // Set fixed width
      boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.08)',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.12)'
      }
    }}>
      <Box sx={{ 
        width: '100%',
        height: 110, // Slightly reduce image height
        borderRadius: '8px',
        overflow: 'hidden',
        mb: 1,
        bgcolor: '#fff',
        position: 'relative'
      }}>        <Box
          component="img"
          src={getImageUrl(gambar)}
          alt={nama}
          onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
            console.error('Image load failed:', gambar);
            e.currentTarget.src = 'https://via.placeholder.com/150';
          }}
          loading="lazy"
          sx={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            backgroundColor: '#f5f5f5'
          }} 
        />
      </Box>      <Typography 
        fontFamily="'Poppins', sans-serif"
        fontWeight="600"
        fontSize={14} // Mengubah ukuran font
        color="white"
        align="center"
        sx={{ 
          mb: 0.5,
          maxWidth: '90%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
      >
        {nama}
      </Typography>

      {/* Product ID */}
      <Typography 
        fontFamily="'Poppins', sans-serif"
        fontSize={10}
        color="#e3f2fd"
        align="center"
        sx={{ 
          mb: 0.5,
          maxWidth: '90%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
      >
        ID: {id}
      </Typography>

      {/* Product Category Tag */}
      {product_category && (
        <Typography 
          fontFamily="'Poppins', sans-serif"
          fontSize={10}
          color="#fff"
          align="center"
          sx={{ 
            mb: 0.5,
            bgcolor: 'rgba(255,255,255,0.2)',
            px: 1,
            py: 0.2,
            borderRadius: '8px',
            maxWidth: '90%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          #{product_category}
        </Typography>
      )}

      {/* Product Location */}
      {product_location && (
        <Typography 
          fontFamily="'Poppins', sans-serif"
          fontSize={10}
          color="#e3f2fd"
          align="center"
          sx={{ 
            mb: 0.5,
            maxWidth: '90%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          📍 {product_location}
        </Typography>
      )}

      <Typography 
        fontFamily="'Poppins', sans-serif"
        fontSize={12} // Mengubah ukuran font
        color="#e3f2fd"
        mb={1}
      >
        Quantity: {stok}
      </Typography>

      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        mb: 1,
        gap: 0.5 // Mengurangi gap
      }}>
        <Button
          onClick={decreaseJumlah}
          sx={{ 
            minWidth: 28, // Mengubah ukuran button
            height: 28,
            borderRadius: '50%', 
            bgcolor: 'white', 
            color: '#4E71FF',
            p: 0,
            '&:hover': {
              bgcolor: '#e3e3e3'
            }
          }}
        >
          -
        </Button>
        <Typography sx={{ 
          mx: 1.5, 
          fontWeight: 'bold',
          color: 'white',
          minWidth: '24px',
          textAlign: 'center',
          fontSize: 14
        }}>
          {jumlah}
        </Typography>
        <Button
          onClick={increaseJumlah}
          sx={{ 
            minWidth: 28, // Mengubah ukuran button
            height: 28,
            borderRadius: '50%', 
            bgcolor: 'white', 
            color: '#4E71FF',
            p: 0,
            '&:hover': {
              bgcolor: '#e3e3e3'
            }
          }}
        >
          +
        </Button>
      </Box>      <Button
        fullWidth
        variant="contained"
        disabled={jumlah === 0}
        onClick={handleAddToList}
        sx={{
          mt: 'auto', // Push button to bottom
          height: 32, // Mengubah tinggi button
          borderRadius: '8px',
          bgcolor: jumlah > 0 ? 'white' : '#bdbdbd',
          color: jumlah > 0 ? '#4E71FF' : '#fff',
          fontWeight: 'bold',
          textTransform: 'none',
          fontSize: 13,
          boxShadow: 'none',
          '&:hover': {
            bgcolor: jumlah > 0 ? '#e3e3e3' : '#bdbdbd',
            color: jumlah > 0 ? '#4E71FF' : '#fff'
          }
        }}
      >
        Tambahkan ke List
      </Button>

      {/* Product Description Button */}
      <Button
        fullWidth
        variant="outlined"
        onClick={() => onShowDescription && onShowDescription(id)}
        startIcon={<InfoIcon />}
        sx={{
          mt: 1,
          height: 32,
          borderRadius: '8px',
          borderColor: 'white',
          color: 'white',
          fontWeight: 'bold',
          textTransform: 'none',
          fontSize: 13,
          '&:hover': {
            borderColor: 'white',
            bgcolor: 'rgba(255,255,255,0.1)'
          }
        }}
      >
        Lihat Detail
      </Button>

      {/* Admin Action Buttons */}
      {canManageProducts && (
        <Box sx={{ 
          display: 'flex', 
          gap: 1, 
          mt: 1, 
          width: '100%' 
        }}>
          <Button
            variant="outlined"
            size="small"
            onClick={handleEditProduct}
            startIcon={<EditIcon />}
            sx={{
              flex: 1,
              height: 28,
              fontSize: 11,
              color: 'white',
              borderColor: 'white',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.1)',
                borderColor: 'white'
              }
            }}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={handleDeleteProduct}
            startIcon={<DeleteIcon />}
            sx={{
              flex: 1,
              height: 28,
              fontSize: 11,
              color: '#ff6b6b',
              borderColor: '#ff6b6b',
              '&:hover': {
                bgcolor: 'rgba(255,107,107,0.1)',
                borderColor: '#ff6b6b'
              }
            }}
          >
            Hapus
          </Button>
        </Box>
      )}

      {/* Edit Product Modal */}
      <EditProductModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        product={{
          id_product: id,
          name: nama,
          stock: stok,
          image: gambar,
          product_category: product_category || '',
          product_location: product_location || '',
          visible_to_user: true,
        }}
        onProductUpdated={handleProductUpdated}
        currentUserRole={userRole}
      />

      {/* Delete Product Dialog */}
      <DeleteProductDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        product={{
          id_product: id,
          name: nama,
          stock: stok,
          image: gambar,
          product_category: product_category || '',
          product_location: product_location || '',
        }}
        onProductDeleted={handleProductDeleted}
        currentUserRole={userRole}
      />
    </Box>
  );
};

export default AssetCard;