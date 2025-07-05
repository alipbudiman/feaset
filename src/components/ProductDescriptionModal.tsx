import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Chip,
  Avatar,
  Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/Info';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CategoryIcon from '@mui/icons-material/Category';
import PersonIcon from '@mui/icons-material/Person';
import InventoryIcon from '@mui/icons-material/Inventory';

interface Product {
  id_product: string;
  name: string;
  stock: number;
  image: string;
  product_category?: string;
  product_location?: string;
  product_description?: string;
  added_by?: string;
}

interface ProductDescriptionModalProps {
  open: boolean;
  onClose: () => void;
  product: Product | null;
}

const ProductDescriptionModal: React.FC<ProductDescriptionModalProps> = ({
  open,
  onClose,
  product
}) => {
  if (!product) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 3,
          minHeight: '400px'
        }
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: '#4E71FF',
          color: 'white',
          position: 'relative',
          pb: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <InfoIcon />
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
            Detail Produk
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'white'
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Product Header */}
        <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
          <Avatar
            src={product.image}
            alt={product.name}
            sx={{
              width: 120,
              height: 120,
              borderRadius: 2,
              border: '3px solid #e0e0e0'
            }}
            variant="rounded"
          />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1, color: '#333' }}>
              {product.name}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#666', 
                fontFamily: 'monospace', 
                bgcolor: '#f5f5f5',
                p: 0.5,
                borderRadius: 1,
                display: 'inline-block',
                mb: 2
              }}
            >
              ID: {product.id_product}
            </Typography>

            {/* Product Info Chips */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              <Chip
                icon={<InventoryIcon />}
                label={`Quantity: ${product.stock}`}
                color={product.stock > 0 ? 'success' : 'error'}
                variant="outlined"
                size="medium"
              />
              {product.product_category && (
                <Chip
                  icon={<CategoryIcon />}
                  label={product.product_category}
                  color="primary"
                  variant="outlined"
                  size="medium"
                />
              )}
            </Box>

            {/* Location and Added By */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {product.product_location && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOnIcon sx={{ color: '#666', fontSize: 20 }} />
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    <strong>Lokasi:</strong> {product.product_location}
                  </Typography>
                </Box>
              )}
              {product.added_by && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon sx={{ color: '#666', fontSize: 20 }} />
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    <strong>Ditambahkan oleh:</strong> {product.added_by}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Product Description */}
        <Box>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 'bold', 
              mb: 2, 
              color: '#333',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <InfoIcon sx={{ color: '#4E71FF' }} />
            Deskripsi Produk
          </Typography>
          
          {product.product_description ? (
            <Box 
              sx={{ 
                bgcolor: '#f8f9fa',
                border: '1px solid #e0e0e0',
                borderRadius: 2,
                p: 3,
                minHeight: '120px'
              }}
            >
              <Typography 
                variant="body1" 
                sx={{ 
                  lineHeight: 1.6,
                  color: '#444',
                  whiteSpace: 'pre-wrap' // Preserve line breaks
                }}
              >
                {product.product_description}
              </Typography>
            </Box>
          ) : (
            <Box 
              sx={{ 
                bgcolor: '#f8f9fa',
                border: '1px dashed #ccc',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                minHeight: '120px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#999',
                  fontStyle: 'italic'
                }}
              >
                Tidak ada deskripsi tersedia untuk produk ini.
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button 
          onClick={onClose} 
          variant="contained"
          sx={{
            bgcolor: '#4E71FF',
            '&:hover': { bgcolor: '#3c5ae0' },
            borderRadius: 2,
            px: 3
          }}
        >
          Tutup
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductDescriptionModal;
