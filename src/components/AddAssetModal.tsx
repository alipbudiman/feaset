import {
    Dialog,
    DialogContent,
    TextField,
    Button,
    Box,
    Typography,
    IconButton,
    FormControlLabel,
    Checkbox
  } from '@mui/material';
  import CloseIcon from '@mui/icons-material/Close';
  import { useState } from 'react';
  import { apiService } from '../utils/apiService';
  
  interface AddAssetModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
  }
  
  interface ImageUploadResponse {
    success: boolean;
    message: string;
    data: {
      id: string;
      url: string;
      display_url: string;
      delete_url: string;
      size: number;
    };
  }
    const AddAssetModal = ({ open, onClose, onSuccess }: AddAssetModalProps) => {
    const [formData, setFormData] = useState({
      name: '',
      id_product: '',
      stock: '',
      image: null as File | null,
      product_category: '',
      visible_to_user: true,
      product_location: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value, type, checked } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    };

    const handleCategoryKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        const value = (e.target as HTMLInputElement).value.trim();
        if (value && !value.startsWith('#')) {
          setFormData(prev => ({
            ...prev,
            product_category: '#' + value
          }));
        }
      }
    };
  
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files[0]) {
        setFormData(prev => ({
          ...prev,
          image: event.target.files![0]
        }));
      }
    };
    // Add debug logging to see API response
    const uploadImage = async (file: File): Promise<string> => {
      const formData = new FormData();
      formData.append('file', file);
  
      const response = await apiService.uploadFile('/image/upload', formData);
  
      const data: ImageUploadResponse = await response.json();
      console.log('Image upload response:', data); // Debug log
  
      if (!response.ok) {
        throw new Error(data.message || 'Gagal mengupload gambar');
      }
  
      // Return direct URL from response
      return data.data.url; // Use direct url instead of display_url
    };
    const handleSubmit = async () => {
      try {
        setLoading(true);
        setError(null);
        setFieldErrors({});
  
        // Upload image first if exists
        let imageUrl = '';
        if (formData.image) {
          try {
            imageUrl = await uploadImage(formData.image);
          } catch (error) {
            throw new Error(`Gagal upload gambar: ${(error as Error).message}`);
          }
        }        // Ensure category has # prefix before submitting
        const categoryValue = formData.product_category.trim();
        const formattedCategory = categoryValue && !categoryValue.startsWith('#') ? '#' + categoryValue : categoryValue;

        const requestData = {
          name: formData.name,
          id_product: formData.id_product,
          stock: parseInt(formData.stock),
          image: imageUrl || 'https://via.placeholder.com/150',
          added_by: sessionStorage.getItem('username') || 'unknown',
          product_category: formattedCategory,
          visible_to_user: formData.visible_to_user,
          product_location: formData.product_location
        };console.log('Mengirim data produk:', requestData);
  
        const response = await apiService.post('/product/create', requestData);
  
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const responseData = await response.json().catch(() => ({}));
          
          if (responseData.message?.toLowerCase().includes('duplicate') || 
              responseData.message?.toLowerCase().includes('already exists')) {
            setFieldErrors({
              id_product: 'ID Produk sudah digunakan, silakan gunakan ID lain'
            });
            throw new Error('ID Produk sudah digunakan');
          }
          
          if (response.status === 500) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Server error details:', errorData);
            throw new Error(`Server error: ${errorData.message || 'Gagal menambahkan produk'}. Silakan coba lagi.`);
          }
          throw new Error(responseData.message || 'Gagal menambahkan produk');
        }
  
        const responseData = await response.json();
        console.log('Response data:', responseData);        // Reset form
        setFormData({
          name: '',
          id_product: '',
          stock: '',
          image: null,
          product_category: '',
          visible_to_user: true,
          product_location: ''
        });

        // Trigger refresh data products untuk update product list
        window.dispatchEvent(new CustomEvent('dataRefresh'));
        console.log('🔄 Triggering data refresh after successful product creation');
  
        onSuccess?.();
        onClose();
      } catch (err) {
        console.error('Error saat menambahkan produk:', err);
        if (!fieldErrors.id_product) {
          setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat menambahkan produk');
        }
      } finally {
        setLoading(false);
      }
    };
    return (
      <Dialog 
        open={open} 
        onClose={onClose}
        sx={{
          '& .MuiDialog-container': {
            alignItems: 'center', // Center vertically
            justifyContent: 'center' // Center horizontally
          },
          '& .MuiDialog-paper': {
            width: 400,
            maxHeight: '85vh', // Limit height for better UX
            borderRadius: '10px',
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: 'white',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        {/* Header */}        <Box
          sx={{
            width: '100%',
            height: 36,
            bgcolor: '#4E71FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderTopLeftRadius: '10px',
            borderTopRightRadius: '10px',
            position: 'relative',
            px: 2
          }}
        >
          <Typography
            sx={{
              color: 'white',
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            Form Tambah Produk
          </Typography>

          {/* Tombol Close dengan ikon X */}
          <IconButton
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 4,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'white',
              width: 28,
              height: 28,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>        {/* Form Content */}
        <DialogContent sx={{ 
          p: 2, 
          flex: 1, 
          overflow: 'auto', // Make content scrollable
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#c1c1c1',
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#a8a8a8',
          }
        }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {error && (
              <Typography color="error" fontSize="12px" mb={1}>
                {error}
              </Typography>
            )}
  
            {/* Nama Produk */}
            <Box>
              <Typography variant="caption" sx={{ mb: 0.5, display: 'block', color: '#666' }}>
                Nama Produk
              </Typography>
              <TextField
                fullWidth
                size="small"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: 32,
                    fontSize: '13px',
                    bgcolor: '#F5F5F5'
                  }
                }}
              />
            </Box>
  
            {/* ID Produk */}
            <Box>
              <Typography variant="caption" sx={{ mb: 0.5, display: 'block', color: '#666' }}>
                ID Produk
              </Typography>
              <TextField
                fullWidth
                size="small"
                name="id_product"
                value={formData.id_product}
                onChange={handleInputChange}
                variant="outlined"
                error={!!fieldErrors.id_product}
                helperText={fieldErrors.id_product}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: 32,
                    fontSize: '13px',
                    bgcolor: '#F5F5F5'
                  }
                }}
              />
            </Box>
  
            {/* Stok */}
            <Box>
              <Typography variant="caption" sx={{ mb: 0.5, display: 'block', color: '#666' }}>
                Stok
              </Typography>
              <TextField
                fullWidth
                size="small"
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: 32,
                    fontSize: '13px',
                    bgcolor: '#F5F5F5'
                  }
                }}
              />
            </Box>            {/* Kategori Produk */}
            <Box>
              <Typography variant="caption" sx={{ mb: 0.5, display: 'block', color: '#666' }}>
                Kategori Produk
              </Typography>
              <TextField
                fullWidth
                size="small"
                name="product_category"
                value={formData.product_category}
                onChange={handleInputChange}
                onKeyPress={handleCategoryKeyPress}
                variant="outlined"
                placeholder="contoh: computer, electronics"
                helperText="Tekan Enter untuk menambahkan # otomatis"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: 32,
                    fontSize: '13px',
                    bgcolor: '#F5F5F5'
                  },
                  '& .MuiFormHelperText-root': {
                    fontSize: '11px',
                    color: '#999',
                    marginTop: '4px'
                  }
                }}
              />
            </Box>
  
            {/* Lokasi Produk */}
            <Box>
              <Typography variant="caption" sx={{ mb: 0.5, display: 'block', color: '#666' }}>
                Lokasi Produk
              </Typography>
              <TextField
                fullWidth
                size="small"
                name="product_location"
                value={formData.product_location}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="contoh: labor 404"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: 32,
                    fontSize: '13px',
                    bgcolor: '#F5F5F5'
                  }
                }}
              />
            </Box>
  
            {/* Visible to User */}
            <Box>
              <FormControlLabel
                control={
                  <Checkbox
                    name="visible_to_user"
                    checked={formData.visible_to_user}
                    onChange={handleInputChange}
                    size="small"
                    sx={{
                      color: '#666',
                      '&.Mui-checked': {
                        color: '#142356',
                      },
                    }}
                  />
                }
                label={
                  <Typography variant="caption" sx={{ color: '#666', fontSize: '13px' }}>
                    Tampilkan produk ke pengguna
                  </Typography>
                }
                sx={{ ml: 0 }}
              />
            </Box>
  
            {/* Gambar Produk */}
            <Box>
              <Typography variant="caption" sx={{ mb: 0.5, display: 'block', color: '#666' }}>
                Gambar Produk
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button
                  variant="contained"
                  component="label"
                  size="small"
                  sx={{
                    minWidth: 'unset',
                    height: 24,
                    fontSize: '12px',
                    bgcolor: '#E0E0E0',
                    color: '#000000',
                    textTransform: 'none',
                    boxShadow: 'none',
                    px: 1,
                    '&:hover': {
                      bgcolor: '#D0D0D0',
                      boxShadow: 'none'
                    }
                  }}
                >
                  Pilih File
                  <input
                    type="file"
                    hidden
                    onChange={handleFileSelect}
                    accept="image/*"
                  />
                </Button>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#666666',
                    fontSize: '12px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '180px'
                  }}
                >
                  {formData.image ? formData.image.name : 'Nama file gambar'}
                </Typography>
              </Box>
            </Box>            {/* Tombol Tambah dan Batal */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 1, mt: 0.5 }}>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading || !formData.name || !formData.id_product || !formData.stock || !formData.product_category || !formData.product_location}
                sx={{
                  minWidth: 'unset',
                  height: 28,
                  fontSize: '13px',
                  bgcolor: '#142356',
                  color: 'white',
                  textTransform: 'none',
                  borderRadius: '5px',
                  boxShadow: 'none',
                  px: 3,
                  '&:hover': {
                    bgcolor: '#1a2d6e',
                    boxShadow: 'none'
                  },
                  '&.Mui-disabled': {
                    bgcolor: 'rgba(20, 35, 86, 0.5)'
                  }
                }}
              >
                {loading ? 'Menambahkan...' : 'Tambah'}
              </Button>
              <Button
                variant="outlined"
                onClick={onClose}
                disabled={loading}
                sx={{
                  minWidth: 'unset',
                  height: 28,
                  fontSize: '13px',
                  borderColor: '#142356',
                  color: '#142356',
                  textTransform: 'none',
                  borderRadius: '5px',
                  boxShadow: 'none',
                  px: 3,
                  '&:hover': {
                    borderColor: '#1a2d6e',
                    color: '#1a2d6e',
                    bgcolor: 'rgba(20, 35, 86, 0.04)',
                    boxShadow: 'none'
                  },
                  '&.Mui-disabled': {
                    borderColor: 'rgba(20, 35, 86, 0.3)',
                    color: 'rgba(20, 35, 86, 0.3)'
                  }
                }}
              >
                Batal
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    );
  };
  
  export default AddAssetModal;
