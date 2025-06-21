import { 
  Box, 
  Button, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle, 
  TextField, 
  Typography, 
  MenuItem, 
  IconButton, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Chip,
  Alert,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import { toast } from 'react-hot-toast';
import { apiService } from '../../utils/apiService';
import { useAuth } from '../../contexts/useAuth';
import EditUserModal from '../../components/EditUserModal';
import DeleteUserDialog from '../../components/DeleteUserDialog';
import UserDetailsModal from '../../components/UserDetailsModal';

interface UserData {
  username: string;
  full_name: string;
  address: string;
  phone_number: string;
  role: 'master' | 'admin' | 'user';
  password?: string;
}

interface CreateUserResponse {
  id: string;
  success: boolean;
  message: string;
}

const BuatAkun = () => {
  const { userRole } = useAuth();
  const [openDialog, setOpenDialog] = useState(false);
  
  // User Management states (moved from UserManagement)
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  // Check if current user has permission to access this page
  const hasAccess = userRole === 'master' || userRole === 'admin';
  
  // Role filtering function
  const getAvailableRoles = () => {
    const baseRoles = [
      { value: '', label: '-- Pilih role anda --' },
      { value: 'user', label: 'User' },
      { value: 'admin', label: 'Admin' }
    ];
    
    // If current user is master, they can assign any role including master
    if (userRole === 'master') {
      return [
        ...baseRoles,
        { value: 'master', label: 'Master' }
      ];
    }
    
    // If current user is admin, they can assign user and admin roles
    if (userRole === 'admin') {
      return baseRoles;
    }
    
    // For other roles, only allow user role
    return [
      { value: '', label: '-- Pilih role anda --' },
      { value: 'user', label: 'User' }
    ];
  };
  
  const availableRoles = getAvailableRoles();
  
  // Debug logging
  console.log('BuatAkun - Current user role:', userRole);
  console.log('BuatAkun - Available roles:', availableRoles);  const [formData, setFormData] = useState({
    nama: '',
    username: '',
    email: '',
    password: '',
    konfirmasiPassword: '',
    alamat: '',
    noTelpon: '',
    role: '',
  });

  const [errors, setErrors] = useState({
    password: '',
    konfirmasiPassword: ''
  });

  // Fetch users function (moved from UserManagement)
  const fetchUsers = useCallback(async () => {
    if (!hasAccess) {
      setError('Anda tidak memiliki akses untuk melihat halaman ini');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching users list...');
      const response = await apiService.getUsers();
      
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Users data:', data);
      
      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        console.error('Unexpected user data format:', data);
        setError('Format data user tidak sesuai');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error instanceof Error ? error.message : 'Gagal mengambil data user');
      toast.error('Gagal mengambil data user');
    } finally {
      setLoading(false);
    }
  }, [hasAccess]);

  // Effect to fetch users on component mount
  useEffect(() => {
    if (hasAccess) {
      fetchUsers();
    }
  }, [hasAccess, fetchUsers]);

  // User management handlers (moved from UserManagement)
  const handleEditUser = (user: UserData) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const handleDeleteUser = (user: UserData) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleViewUserDetails = (user: UserData) => {
    setSelectedUser(user);
    setDetailsModalOpen(true);
  };

  const handleUserUpdated = async () => {
    setEditModalOpen(false);
    setSelectedUser(null);
    await fetchUsers();
    toast.success('User berhasil diperbarui');
  };

  const handleUserDeleted = async () => {
    setDeleteDialogOpen(false);
    setSelectedUser(null);
    await fetchUsers();
    toast.success('User berhasil dihapus');
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

  const handleOpenDialog = () => setOpenDialog(true);
  const handleCloseDialog = () => setOpenDialog(false);

  const validatePassword = (password: string) => {
    if (password.length < 6) {
      setErrors(prev => ({
        ...prev,
        password: 'Password harus minimal 6 karakter'
      }));
      return false;
    }
    setErrors(prev => ({ ...prev, password: '' }));
    return true;
  };

  const validatePasswordMatch = (password: string, konfirmasi: string) => {
    if (password !== konfirmasi) {
      setErrors(prev => ({
        ...prev,
        konfirmasiPassword: 'Password tidak cocok'
      }));
      return false;
    }
    setErrors(prev => ({ ...prev, konfirmasiPassword: '' }));
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Validasi saat input berubah
    if (name === 'password') {
      validatePassword(value);
      if (formData.konfirmasiPassword) {
        validatePasswordMatch(value, formData.konfirmasiPassword);
      }
    }
    if (name === 'konfirmasiPassword') {
      validatePasswordMatch(formData.password, value);
    }
  };
  const handleSubmit = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) throw new Error('Token tidak ditemukan');

      // Validasi password
      if (formData.password !== formData.konfirmasiPassword) {
        throw new Error('Password dan konfirmasi password tidak cocok');
      }

      const response = await apiService.post('/user/create', {
        username: formData.username,
        password: formData.password,
        full_name: formData.nama,
        address: formData.alamat,
        phone_number: formData.noTelpon,
        role: formData.role
      });

      const data: CreateUserResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal membuat akun');
      }      if (data.success) {
        Swal.fire({
          title: 'Sukses!',
          text: 'Akun berhasil dibuat',
          icon: 'success',
          confirmButtonText: 'OK'
        });
        // Reset form
        setFormData({
          nama: '',
          username: '',
          email: '',
          password: '',
          konfirmasiPassword: '',
          alamat: '',
          noTelpon: '',
          role: ''
        });
        handleCloseDialog();
        
        // Refresh users list
        await fetchUsers();
        toast.success('User baru berhasil ditambahkan');
      } else {
        throw new Error(data.message);
      }

    } catch (err) {
      console.error('Error creating account:', err);
      Swal.fire({
        title: 'Error',
        text: (err as Error).message,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };
  // Check access first
  if (!hasAccess) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Anda tidak memiliki akses untuk melihat halaman ini. Hanya Master dan Admin yang dapat mengakses manajemen user.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: '#8bb6e6', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
      <Box sx={{ width: '100%', maxWidth: '1200px' }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', color: '#fff', textAlign: 'center' }}>
          Manajemen User
        </Typography>
        
        {/* Header with actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Tooltip title="Refresh Data">
            <IconButton 
              onClick={fetchUsers} 
              disabled={loading}
              sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenDialog}
            sx={{
              textTransform: 'none',
              fontWeight: 'bold',
              borderRadius: '20px',
              px: 3,
            }}
          >
            Tambah User
          </Button>
        </Box>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Loading Indicator */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4, bgcolor: 'rgba(255,255,255,0.9)', borderRadius: 2 }}>
            <CircularProgress />
          </Box>
        )}        {/* Dialog Form Tambah User */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle
            sx={{
              bgcolor: '#1976d2',
              color: '#fff',
              textAlign: 'center',
              fontWeight: 'bold',
              position: 'relative',
            }}
          >
            Form Tambah User
            <IconButton
              onClick={handleCloseDialog}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: '#fff',
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ py: 3, bgcolor: '#f5f5f5' }}>
            {/* Ganti Grid dengan Box agar lebih aman jika error */}
            <Box component="form" autoComplete="off" sx={{ width: '100%' }}>
              <TextField
                fullWidth
                label="Nama"
                name="nama"
                value={formData.nama}
                onChange={handleChange}
                variant="outlined"
                sx={{ mb: 2, bgcolor: '#e0e0e0', borderRadius: '8px' }}
              />
              <TextField
                fullWidth
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                variant="outlined"
                sx={{ mb: 2, bgcolor: '#e0e0e0', borderRadius: '8px' }}
              />
              <TextField
                fullWidth
                label="Email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                variant="outlined"
                sx={{ mb: 2, bgcolor: '#e0e0e0', borderRadius: '8px' }}
              />
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password}
                variant="outlined"
                sx={{ mb: 2, bgcolor: '#e0e0e0', borderRadius: '8px' }}
              />
              <TextField
                fullWidth
                label="Konfirmasi Password"
                name="konfirmasiPassword"
                type="password"
                value={formData.konfirmasiPassword}
                onChange={handleChange}
                error={!!errors.konfirmasiPassword}
                helperText={errors.konfirmasiPassword}
                variant="outlined"
                sx={{ mb: 2, bgcolor: '#e0e0e0', borderRadius: '8px' }}
              />
              <TextField
                fullWidth
                label="Alamat"
                name="alamat"
                value={formData.alamat}
                onChange={handleChange}
                variant="outlined"
                sx={{ mb: 2, bgcolor: '#e0e0e0', borderRadius: '8px' }}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="No Telpon"
                  name="noTelpon"
                  value={formData.noTelpon}
                  onChange={handleChange}
                  variant="outlined"
                  sx={{ mb: 2, bgcolor: '#e0e0e0', borderRadius: '8px' }}
                />                <TextField
                  fullWidth
                  select
                  label="Role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  variant="outlined"
                  sx={{ mb: 2, bgcolor: '#e0e0e0', borderRadius: '8px' }}
                >
                  {availableRoles.map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      {role.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
            <Button
              onClick={handleSubmit}
              variant="contained"
              color="primary"
              sx={{
                textTransform: 'none',
                fontWeight: 'bold',
                borderRadius: '20px',
                px: 3,
                bgcolor: '#002855',
                '&:hover': {
                  bgcolor: '#001f3f',
                },
              }}
            >
              Tambah
            </Button>
          </DialogActions>
        </Dialog>        {/* Users Table */}
        {!loading && !error && (
          <TableContainer component={Paper} sx={{ borderRadius: 0, boxShadow: 'none', border: '1.5px solid #000' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#4267F6' }}>
                  <TableCell align="center" sx={{ color: '#fff', fontWeight: 'bold', border: '1.5px solid #000', fontSize: 18 }}>No</TableCell>
                  <TableCell align="center" sx={{ color: '#fff', fontWeight: 'bold', border: '1.5px solid #000', fontSize: 18 }}>Nama</TableCell>
                  <TableCell align="center" sx={{ color: '#fff', fontWeight: 'bold', border: '1.5px solid #000', fontSize: 18 }}>Username</TableCell>
                  <TableCell align="center" sx={{ color: '#fff', fontWeight: 'bold', border: '1.5px solid #000', fontSize: 18 }}>Alamat</TableCell>
                  <TableCell align="center" sx={{ color: '#fff', fontWeight: 'bold', border: '1.5px solid #000', fontSize: 18 }}>No Telepon</TableCell>
                  <TableCell align="center" sx={{ color: '#fff', fontWeight: 'bold', border: '1.5px solid #000', fontSize: 18 }}>Role</TableCell>
                  <TableCell align="center" sx={{ color: '#fff', fontWeight: 'bold', border: '1.5px solid #000', fontSize: 18 }}>Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4, border: '1.5px solid #000' }}>
                      <Typography variant="body1" color="text.secondary">
                        Tidak ada data user ditemukan
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user, index) => (
                    <TableRow key={user.username} hover>
                      <TableCell align="center" sx={{ border: '1.5px solid #000', fontSize: 16 }}>
                        {index + 1}
                      </TableCell>
                      <TableCell align="center" sx={{ border: '1.5px solid #000', fontSize: 16 }}>
                        {user.full_name || '-'}
                      </TableCell>
                      <TableCell align="center" sx={{ border: '1.5px solid #000', fontSize: 16 }}>
                        {user.username}
                      </TableCell>
                      <TableCell align="center" sx={{ border: '1.5px solid #000', fontSize: 16 }}>
                        {user.address || '-'}
                      </TableCell>
                      <TableCell align="center" sx={{ border: '1.5px solid #000', fontSize: 16 }}>
                        {user.phone_number || '-'}
                      </TableCell>
                      <TableCell align="center" sx={{ border: '1.5px solid #000', fontSize: 16 }}>
                        <Chip
                          label={getRoleLabel(user.role)}
                          color={getRoleColor(user.role)}
                          size="small"
                          variant="filled"
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ border: '1.5px solid #000', fontSize: 16 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                          <Tooltip title="Lihat Detail">
                            <IconButton
                              size="small"
                              onClick={() => handleViewUserDetails(user)}
                              sx={{ color: 'info.main' }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit User">
                            <IconButton
                              size="small"
                              onClick={() => handleEditUser(user)}
                              sx={{ color: 'primary.main' }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Hapus User">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteUser(user)}
                              sx={{ color: 'error.main' }}
                              disabled={user.role === 'master' && userRole !== 'master'}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Summary */}
        {!loading && !error && users.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'rgba(255,255,255,0.9)', p: 2, borderRadius: 1 }}>
            <Typography variant="body2" color="text.primary">
              Total: {users.length} user
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Typography variant="body2" color="text.primary">
                Master: {users.filter(u => u.role === 'master').length}
              </Typography>
              <Typography variant="body2" color="text.primary">
                Admin: {users.filter(u => u.role === 'admin').length}
              </Typography>
              <Typography variant="body2" color="text.primary">
                User: {users.filter(u => u.role === 'user').length}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Edit User Modal */}
        {editModalOpen && selectedUser && (
          <EditUserModal
            open={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setSelectedUser(null);
            }}
            user={selectedUser}
            onUserUpdated={handleUserUpdated}
            currentUserRole={userRole}
          />
        )}

        {/* Delete User Dialog */}
        {deleteDialogOpen && selectedUser && (
          <DeleteUserDialog
            open={deleteDialogOpen}
            onClose={() => {
              setDeleteDialogOpen(false);
              setSelectedUser(null);
            }}
            user={selectedUser}
            onUserDeleted={handleUserDeleted}
          />
        )}

        {/* User Details Modal */}
        {detailsModalOpen && selectedUser && (
          <UserDetailsModal
            open={detailsModalOpen}
            onClose={() => {
              setDetailsModalOpen(false);
              setSelectedUser(null);
            }}
            userData={selectedUser}
          />
        )}
      </Box>
    </Box>
  );
};

export default BuatAkun;
