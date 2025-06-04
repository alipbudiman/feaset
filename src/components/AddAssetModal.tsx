import {
    Dialog,
    DialogContent,
    TextField,
    Button,
    Box,
    Typography,
    IconButton
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
      image: null as File | null
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
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
        }
  
        const requestData = {
          name: formData.name,
          id_product: formData.id_product,
          stock: parseInt(formData.stock),
          image: imageUrl || 'https://via.placeholder.com/150'
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
        console.log('Response data:', responseData);
  
        // Reset form
        setFormData({
          name: '',
          id_product: '',
          stock: '',
          image: null
        });
  
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
            alignItems: 'flex-start',
            pt: '100px'
          },
          '& .MuiDialog-paper': {
            width: 400,
            maxHeight: 'fit-content',
            borderRadius: '10px',
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: 'white'
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
        </Box>
  
        {/* Form Content */}
        <DialogContent sx={{ p: 2 }}>
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
            </Box>
  
            {/* Tombol Tambah */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 0.5 }}>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading || !formData.name || !formData.id_product || !formData.stock}
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
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    );
  };
  
  export default AddAssetModal;
