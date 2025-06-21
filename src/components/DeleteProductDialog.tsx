import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  Box,
  CircularProgress,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { apiService } from '../utils/apiService';

interface ProductData {
  id_product: string;
  name: string;
  stock: number;
  image: string;
  product_category?: string;
  product_location?: string;
}

interface DeleteProductDialogProps {
  open: boolean;
  onClose: () => void;
  product: ProductData | null;
  onProductDeleted: () => void;
  currentUserRole: string | null;
}

const DeleteProductDialog: React.FC<DeleteProductDialogProps> = ({
  open,
  onClose,
  product,
  onProductDeleted,
  currentUserRole,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!product?.id_product) {
      setError('Product ID tidak ditemukan');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Deleting product:', product.id_product);
      
      const response = await apiService.deleteProduct(product.id_product);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Delete failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Product delete result:', result);

      toast.success('Produk berhasil dihapus');
      onProductDeleted();
      onClose();
    } catch (error) {
      console.error('Error deleting product:', error);
      const errorMessage = error instanceof Error ? error.message : 'Gagal menghapus produk';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Check if user can delete products
  const canDeleteProduct = currentUserRole === 'master' || currentUserRole === 'admin';

  if (!canDeleteProduct) {
    return null;
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center',
        gap: 2,
        borderBottom: '1px solid #e0e0e0',
        pb: 2,
      }}>
        <WarningIcon color="warning" />
        <Typography variant="h6" component="div">
          Hapus Produk
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" gutterBottom>
            Apakah Anda yakin ingin menghapus produk ini?
          </Typography>
          
          {product && (
            <Box sx={{ 
              mt: 2, 
              p: 2, 
              backgroundColor: '#f5f5f5', 
              borderRadius: 1,
              border: '1px solid #e0e0e0'
            }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Detail Produk:
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>ID:</strong> {product.id_product}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Nama:</strong> {product.name}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Stok:</strong> {product.stock}
              </Typography>
              {product.product_category && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Kategori:</strong> {product.product_category}
                </Typography>
              )}
              {product.product_location && (
                <Typography variant="body2">
                  <strong>Lokasi:</strong> {product.product_location}
                </Typography>
              )}
            </Box>
          )}

          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Peringatan:</strong> Tindakan ini tidak dapat dibatalkan. 
              Semua data produk akan dihapus secara permanen.
            </Typography>
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 2, borderTop: '1px solid #e0e0e0' }}>
        <Button 
          onClick={onClose} 
          disabled={loading}
          variant="outlined"
        >
          Batal
        </Button>
        <Button
          onClick={handleDelete}
          variant="contained"
          color="error"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <WarningIcon />}
          sx={{ minWidth: 120 }}
        >
          {loading ? 'Menghapus...' : 'Hapus Produk'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteProductDialog;
