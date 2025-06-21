import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  IconButton,
  Typography,
  Stack,
} from '@mui/material';
import {
  Close as CloseIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { apiService } from '../utils/apiService';

interface UserData {
  username: string;
  full_name: string;
  address: string;
  phone_number: string;
  role: 'master' | 'admin' | 'user';
  password?: string;
}

interface UpdateUserData {
  password?: string;
  full_name: string;
  address: string;
  phone_number: string;
  role: 'master' | 'admin' | 'user';
}

interface EditUserModalProps {
  open: boolean;
  onClose: () => void;
  user: UserData;
  onUserUpdated: () => void;
  currentUserRole: string | null;
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  open,
  onClose,
  user,
  onUserUpdated,
  currentUserRole,
}) => {  const [formData, setFormData] = useState<UpdateUserData>({
    full_name: '',
    address: '',
    phone_number: '',
    role: 'user',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  // Initialize form data when user prop changes
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        address: user.address || '',
        phone_number: user.phone_number || '',
        role: user.role,
        password: '', // Don't pre-fill password for security
      });
    }
  }, [user]);
  const handleInputChange = (field: keyof UpdateUserData) => (
    event: React.ChangeEvent<HTMLInputElement | { value: unknown }>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value as string,
    }));
    setError(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);    try {
      // Validate required fields
      if (!formData.full_name.trim()) {
        throw new Error('Nama lengkap tidak boleh kosong');
      }

      // Prepare the data to send - sesuai format yang diminta
      const updateData: UpdateUserData = {
        full_name: formData.full_name.trim(),
        address: formData.address.trim(),
        phone_number: formData.phone_number.trim(),
        role: formData.role,
      };

      // Only include password if it's provided
      if (formData.password?.trim()) {
        updateData.password = formData.password.trim();
      }console.log('Updating user with data:', { ...updateData, password: updateData.password ? '[HIDDEN]' : undefined });

      // Use the apiService updateUser method
      const response = await apiService.updateUser(user.username, updateData);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Update failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('User update result:', result);

      onUserUpdated();
    } catch (error) {
      console.error('Error updating user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Gagal memperbarui user';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const availableRoles = () => {
    if (currentUserRole === 'master') {
      return ['master', 'admin', 'user'];
    } else if (currentUserRole === 'admin') {
      return ['admin', 'user'];
    } else {
      return ['user'];
    }
  };

  const canEditRole = currentUserRole === 'master' || 
    (currentUserRole === 'admin' && user.role !== 'master');

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
          Edit User: {user.username}
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
        )}        <Stack spacing={3}>          {/* Username - Display only, not editable */}
          <TextField
            label="Username"
            value={user.username}
            fullWidth
            disabled
            helperText="Username tidak dapat diubah"
            InputProps={{
              readOnly: true,
            }}
          />

          {/* Full Name */}
          <TextField
            label="Nama Lengkap"
            value={formData.full_name}
            onChange={handleInputChange('full_name')}
            fullWidth
            required
            disabled={loading}
          />

          {/* Phone Number */}
          <TextField
            label="Nomor Telepon"
            value={formData.phone_number}
            onChange={handleInputChange('phone_number')}
            fullWidth
            disabled={loading}
            type="tel"
          />

          {/* Role */}
          <FormControl fullWidth required disabled={!canEditRole || loading}>
            <InputLabel>Role</InputLabel>
            <Select
              value={formData.role}
              onChange={(event) => {
                setFormData(prev => ({
                  ...prev,
                  role: event.target.value as 'master' | 'admin' | 'user',
                }));
                setError(null);
              }}
              label="Role"
            >
              {availableRoles().map((role) => (
                <MenuItem key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </MenuItem>
              ))}
            </Select>
            {!canEditRole && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                Anda tidak memiliki akses untuk mengubah role ini
              </Typography>
            )}
          </FormControl>

          {/* Address */}
          <TextField
            label="Alamat"
            value={formData.address}
            onChange={handleInputChange('address')}
            fullWidth
            multiline
            rows={3}
            disabled={loading}
          />

          {/* Password */}
          <TextField
            label="Password Baru (opsional)"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleInputChange('password')}
            fullWidth
            disabled={loading}
            helperText="Kosongkan jika tidak ingin mengubah password"
            InputProps={{
              endAdornment: (
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                  size="small"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              ),
            }}
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
          disabled={loading}
          sx={{ minWidth: 100 }}
        >
          {loading ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditUserModal;
