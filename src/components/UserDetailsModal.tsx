import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Avatar,
  Divider,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Stack
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import HomeIcon from '@mui/icons-material/Home';
import RefreshIcon from '@mui/icons-material/Refresh';
import { apiService } from '../utils/apiService';
import { toast } from 'react-hot-toast';

interface UserData {
  username: string;
  full_name: string;
  address: string;
  phone_number: string;
  role: string; // Changed from strict union to string to match AuthContext
  email?: string;
}

interface UserDetailsModalProps {
  open: boolean;
  onClose: () => void;
  userData: UserData | null;
  username?: string; // Optional username to fetch specific user details
}

const UserDetailsModal = ({ open, onClose, userData }: Omit<UserDetailsModalProps, 'username'>) => {
  const [userDetails, setUserDetails] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set user details when userData changes or modal opens
  useEffect(() => {
    if (open && userData) {
      console.log('Setting user details from userData:', userData);
      setUserDetails(userData);
      setError(null);
    } else if (open && !userData) {
      console.log('No userData provided, showing error');
      setError('Data pengguna tidak tersedia');
    }
  }, [open, userData]);
  // Fetch detailed user information only when explicitly requested
  const fetchUserDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching fresh user details from API...');
      const response = await apiService.getUserAccount();
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user details: ${response.status} ${response.statusText}`);
      }      const data = await response.json();
      console.log('Fresh user details response:', data);
      
      // Handle API response format - direct user object
      if (data.username) {
        const userInfo: UserData = {
          username: data.username,
          full_name: data.full_name || '',
          address: data.address || '',
          phone_number: data.phone_number || '',
          role: data.role,
          email: data.email
        };
        setUserDetails(userInfo);
        console.log('Updated user details:', userInfo);
      } else {
        throw new Error('Invalid user data format from API');
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      const errorMessage = error instanceof Error ? error.message : 'Gagal mengambil detail user';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'master':
        return { color: '#d32f2f', bgColor: '#ffebee' };
      case 'admin':
        return { color: '#ed6c02', bgColor: '#fff3e0' };
      case 'user':
        return { color: '#1976d2', bgColor: '#e3f2fd' };
      default:
        return { color: '#666', bgColor: '#f5f5f5' };
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role.toLowerCase()) {
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

  const getInitials = (name: string, username: string) => {
    if (name && name.trim()) {
      return name
        .trim()
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return username.charAt(0).toUpperCase();
  };

  const roleColors = userDetails ? getRoleColor(userDetails.role) : { color: '#666', bgColor: '#f5f5f5' };
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 1,
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        pb: 2, 
        fontWeight: 'bold' 
      }}>
        Detail Pengguna
        <Box sx={{ display: 'flex', gap: 1 }}>          {userDetails && (
            <IconButton 
              onClick={() => fetchUserDetails()} 
              size="small"
              disabled={loading}
              title="Refresh data"
            >
              <RefreshIcon />
            </IconButton>
          )}
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 0 }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {userDetails && !loading ? (
          <Box>
            {/* User Avatar and Basic Info */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar
                sx={{ 
                  width: 80, 
                  height: 80, 
                  mr: 3, 
                  fontSize: 24, 
                  fontWeight: 'bold',
                  bgcolor: roleColors.color,
                  color: 'white'
                }}
              >
                {getInitials(userDetails.full_name, userDetails.username)}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
                  {userDetails.full_name || userDetails.username}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                  @{userDetails.username}
                </Typography>
                <Chip
                  icon={<AdminPanelSettingsIcon />}
                  label={getRoleLabel(userDetails.role)}
                  size="small"
                  sx={{
                    bgcolor: roleColors.bgColor,
                    color: roleColors.color,
                    fontWeight: 'bold',
                    fontSize: '12px'
                  }}
                />
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* User Details */}
            <Stack spacing={2}>
              <Typography variant="h6" gutterBottom>
                Informasi Detail
              </Typography>

              {/* Full Name */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon sx={{ color: '#666', mr: 2 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Nama Lengkap
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {userDetails.full_name || '-'}
                  </Typography>
                </Box>
              </Box>

              {/* Username */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AdminPanelSettingsIcon sx={{ color: '#666', mr: 2 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Username
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {userDetails.username}
                  </Typography>
                </Box>
              </Box>

              {/* Email */}
              {userDetails.email && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <EmailIcon sx={{ color: '#666', mr: 2 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {userDetails.email}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Phone */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PhoneIcon sx={{ color: '#666', mr: 2 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Nomor Telepon
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {userDetails.phone_number || '-'}
                  </Typography>
                </Box>
              </Box>

              {/* Address */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <HomeIcon sx={{ color: '#666', mr: 2, mt: 0.5 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Alamat
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {userDetails.address || '-'}
                  </Typography>
                </Box>
              </Box>

              {/* Role */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AdminPanelSettingsIcon sx={{ color: '#666', mr: 2 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Role
                  </Typography>
                  <Chip
                    label={getRoleLabel(userDetails.role)}
                    size="medium"
                    sx={{
                      bgcolor: roleColors.bgColor,
                      color: roleColors.color,
                      fontWeight: 'bold'
                    }}
                  />
                </Box>
              </Box>
            </Stack>

            {/* Role Description */}
            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Deskripsi Role:</strong>
              </Typography>
              <Typography variant="body2">
                {userDetails.role === 'master' && 
                  'Master memiliki akses penuh ke semua fitur sistem, termasuk mengelola pengguna, aset, dan persetujuan.'}
                {userDetails.role === 'admin' && 
                  'Admin dapat mengelola aset, pengguna (kecuali master), dan melakukan persetujuan untuk transaksi.'}
                {userDetails.role === 'user' && 
                  'User dapat meminjam dan mengembalikan aset, serta melihat riwayat transaksi mereka.'}
              </Typography>
            </Box>
          </Box>
        ) : !loading && !error && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary" gutterBottom>
              Data pengguna tidak tersedia
            </Typography>            <Button 
              variant="outlined" 
              onClick={() => fetchUserDetails()}
              startIcon={<RefreshIcon />}
            >
              Coba Lagi
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailsModal;
