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
  Chip,
} from '@mui/material';
import {
  Warning as WarningIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { apiService } from '../utils/apiService';

interface UserData {
  username: string;
  full_name: string;
  address: string;
  phone_number: string;
  role: 'master' | 'admin' | 'user';
}

interface DeleteUserDialogProps {
  open: boolean;
  onClose: () => void;
  user: UserData;
  onUserDeleted: () => void;
}

const DeleteUserDialog: React.FC<DeleteUserDialogProps> = ({
  open,
  onClose,
  user,
  onUserDeleted,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {      console.log('Deleting user:', user.username);

      // Use the apiService deleteUser method
      const response = await apiService.deleteUser(user.username);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Delete failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('User delete result:', result);

      onUserDeleted();
    } catch (error) {
      console.error('Error deleting user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Gagal menghapus user';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'master':
        return 'error';
      case 'admin':
        return 'warning';
      case 'user':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'master':
        return 'Master';
      case 'admin':
        return 'Admin';
      case 'user':
        return 'User';
      default:
        return role;
    }
  };

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
        color: 'error.main',
      }}>
        <WarningIcon />
        Konfirmasi Hapus User
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Typography variant="body1" sx={{ mb: 3 }}>
          Apakah Anda yakin ingin menghapus user berikut?
        </Typography>

        <Box sx={{ 
          p: 2, 
          border: '1px solid #e0e0e0', 
          borderRadius: 1, 
          backgroundColor: '#f9f9f9',
          mb: 2,
        }}>
          <Typography variant="subtitle2" gutterBottom>
            Detail User:
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Username:
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {user.username}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Nama:
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {user.full_name || '-'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Telepon:
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {user.phone_number || '-'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Role:
              </Typography>
              <Chip
                label={getRoleLabel(user.role)}
                color={getRoleColor(user.role)}
                size="small"
                variant="filled"
              />
            </Box>
          </Box>
        </Box>

        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Peringatan:</strong> Tindakan ini tidak dapat dibatalkan. 
            Semua data terkait user ini akan dihapus secara permanen.
          </Typography>
        </Alert>

        {user.role === 'master' && (
          <Alert severity="error">
            <Typography variant="body2">
              <strong>Perhatian:</strong> Anda akan menghapus user dengan role Master. 
              Pastikan masih ada user Master lain dalam sistem.
            </Typography>
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={loading}>
          Batal
        </Button>
        <Button
          onClick={handleDelete}
          color="error"
          variant="contained"
          disabled={loading}
          sx={{ minWidth: 100 }}
        >
          {loading ? 'Menghapus...' : 'Hapus'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteUserDialog;
