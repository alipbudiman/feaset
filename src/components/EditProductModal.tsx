import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  IconButton,
  Typography,
  Stack,
  Box,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { apiService } from '../utils/apiService';
import { useProductEvents } from '../utils/eventDispatcher';

interface ProductData {
  id_product?: string;
  name: string;
  stock: number;
  image: string;
  product_category: string;
  product_location: string;
  visible_to_user: boolean;
  product_description?: string;
}

interface EditProductModalProps {
  open: boolean;
  onClose: () => void;
  product: ProductData | null;
  onProductUpdated: () => void;
  currentUserRole: string | null;
}

const EditProductModal: React.FC<EditProductModalProps> = ({
  open,
  onClose,
  product,
  onProductUpdated,
  currentUserRole,
}) => {
  const { productUpdated } = useProductEvents();
  
  const [formData, setFormData] = useState<ProductData>({
    name: '',
    stock: 0,
    image: '',
    product_category: '',
    product_location: '',
    visible_to_user: true,
    product_description: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Initialize form data when product prop changes
  useEffect(() => {
    if (product && open) {
      setFormData({
        name: product.name || '',
        stock: product.stock || 0,
        image: product.image || '',
        product_category: product.product_category || '',
        product_location: product.product_location || '',
        visible_to_user: product.visible_to_user !== false,
        product_description: product.product_description || '',
      });
      setImagePreview(product.image || '');
    }
  }, [product, open]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setFormData({
        name: '',
        stock: 0,
        image: '',
        product_category: '',
        product_location: '',
        visible_to_user: true,
        product_description: '',
      });
      setError(null);
    }
  }, [open]);

  const handleInputChange = (field: keyof ProductData) => (
    event: React.ChangeEvent<HTMLInputElement | { value: unknown }>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    setError(null);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipe file tidak didukung. Gunakan JPG, PNG, GIF, atau WEBP.');
      return;
    }

    // Validate file size (25MB limit based on API)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxSize) {
      toast.error('Ukuran file terlalu besar. Maksimal 25MB.');
      return;
    }    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload image
    setUploadingImage(true);
    try {
      const response = await apiService.uploadImage(file);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Image upload result:', result);
        
        if (result.success && result.data?.url) {
          setFormData(prev => ({
            ...prev,
            image: result.data.url,
          }));
          toast.success('Gambar berhasil diupload');
        } else {
          throw new Error(result.message || 'Upload gagal');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Upload failed: ${response.status}`);
      }
    } catch (error) {      console.error('Error uploading image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Gagal mengupload gambar';
      toast.error(errorMessage);
      setImagePreview(product?.image || '');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    if (!product?.id_product) {
      setError('Product ID tidak ditemukan');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error('Nama produk tidak boleh kosong');
      }
      if (formData.stock < 0) {
        throw new Error('Stok tidak boleh negatif');
      }

      // Prepare the data to send - match API schema
      const updateData = {
        name: formData.name.trim(),
        stock: formData.stock,
        image: formData.image.trim(),
        product_category: formData.product_category.trim(),
        product_location: formData.product_location.trim(),
        visible_to_user: formData.visible_to_user,
        product_description: formData.product_description?.trim() || '',
      };

      console.log('Updating product with data:', updateData);

      const response = await apiService.updateProduct(product.id_product, updateData);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Update failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Product update result:', result);

      // Dispatch product updated event untuk auto-refresh
      productUpdated(product.id_product, updateData);
      console.log('✏️ Product updated event dispatched for auto-refresh');

      toast.success('Produk berhasil diperbarui');
      onProductUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating product:', error);
      const errorMessage = error instanceof Error ? error.message : 'Gagal memperbarui produk';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Check if user can edit products
  const canEditProduct = currentUserRole === 'master' || currentUserRole === 'admin';

  if (!canEditProduct) {
    return null;
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh',
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid #e0e0e0',
        pb: 2,
      }}>
        <Typography variant="h6" component="div">
          Edit Produk: {product?.name || 'Unknown Product'}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Stack spacing={3}>
          {/* Product Name */}
          <TextField
            label="Nama Produk"
            value={formData.name}
            onChange={handleInputChange('name')}
            fullWidth
            required
            disabled={loading}
          />

          {/* Stock */}
          <TextField
            label="Stok"
            type="number"
            value={formData.stock}
            onChange={handleInputChange('stock')}
            fullWidth
            required
            disabled={loading}
            InputProps={{
              inputProps: { min: 0 }
            }}
          />

          {/* Product Category */}
          <TextField
            label="Kategori Produk"
            value={formData.product_category}
            onChange={handleInputChange('product_category')}
            fullWidth
            disabled={loading}
            placeholder="e.g. computer, office, electronics"
          />

          {/* Product Location */}
          <TextField
            label="Lokasi Produk"
            value={formData.product_location}
            onChange={handleInputChange('product_location')}
            fullWidth
            disabled={loading}
            placeholder="e.g. labor 404, warehouse A"
          />

          {/* Product Description */}
          <TextField
            label="Deskripsi Produk"
            value={formData.product_description}
            onChange={handleInputChange('product_description')}
            fullWidth
            disabled={loading}
            multiline
            rows={4}
            placeholder="Masukkan deskripsi produk..."
          />

          {/* Visible to User */}
          <FormControlLabel
            control={
              <Switch
                checked={formData.visible_to_user}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    visible_to_user: e.target.checked,
                  }));
                }}
                disabled={loading}
              />
            }
            label="Terlihat oleh pengguna"
          />

          {/* Image Upload */}
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Gambar Produk
            </Typography>
              {imagePreview && (
              <Box sx={{ mb: 2 }}>
                <Box
                  component="img"
                  src={imagePreview}
                  alt="Product preview"
                  sx={{
                    width: '200px',
                    height: '150px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0'
                  }}
                />
              </Box>
            )}

            <Button
              component="label"
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              disabled={loading || uploadingImage}
              sx={{ mb: 1 }}
            >
              {uploadingImage ? 'Mengupload...' : 'Upload Gambar Baru'}
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleImageUpload}
              />
            </Button>
            
            <Typography variant="caption" display="block" color="text.secondary">
              Format yang didukung: JPG, PNG, GIF, WEBP (Maksimal 25MB)
            </Typography>
          </Box>

          {/* Current Image URL (for reference) */}
          <TextField
            label="URL Gambar Saat Ini"
            value={formData.image}
            fullWidth
            disabled
            size="small"
            sx={{ '& .MuiInputBase-input': { fontSize: '0.875rem' } }}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 2, borderTop: '1px solid #e0e0e0' }}>
        <Button onClick={onClose} disabled={loading}>
          Batal
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || uploadingImage}
          sx={{ minWidth: 100 }}
        >
          {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditProductModal;
