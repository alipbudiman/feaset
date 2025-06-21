import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
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

const UserManagement: React.FC = () => {
  const { userRole } = useAuth();  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  // Check if current user has permission to access this page
  const hasAccess = userRole === 'master' || userRole === 'admin';

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

  useEffect(() => {
    if (hasAccess) {
      fetchUsers();
    }
  }, [hasAccess, fetchUsers]);
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
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Manajemen User
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Refresh Data">
            <IconButton onClick={fetchUsers} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              // Navigate to create user page or open create modal
              // For now, we'll show a toast
              toast('Fitur tambah user akan tersedia di halaman Buat Akun', { icon: 'ℹ️' });
            }}
          >
            Tambah User
          </Button>
        </Box>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Loading Indicator */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Users Table */}
      {!loading && !error && (
        <TableContainer component={Paper} sx={{ border: '1.5px solid #000' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#6366f1' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
                  No
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
                  Nama
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
                  Username
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
                  Alamat
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
                  No Telepon
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
                  Role
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
                  Aksi
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      Tidak ada data user ditemukan
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user, index) => (
                  <TableRow key={user.username} hover>
                    <TableCell sx={{ textAlign: 'center' }}>
                      {index + 1}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      {user.full_name || '-'}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      {user.username}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      {user.address || '-'}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      {user.phone_number || '-'}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Chip
                        label={getRoleLabel(user.role)}
                        color={getRoleColor(user.role)}
                        size="small"
                        variant="filled"
                      />
                    </TableCell>                    <TableCell sx={{ textAlign: 'center' }}>
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
                    </TableCell></TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Summary */}
      {!loading && !error && users.length > 0 && (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Total: {users.length} user
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Master: {users.filter(u => u.role === 'master').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Admin: {users.filter(u => u.role === 'admin').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
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
      )}      {/* Delete User Dialog */}
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
  );
};

export default UserManagement;
