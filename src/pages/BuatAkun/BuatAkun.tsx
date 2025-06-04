import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography, MenuItem, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useState } from 'react';
import Swal from 'sweetalert2';
import { apiService } from '../../utils/apiService';

interface Member {
  no: number;
  nama: string;
  username: string;
  email: string;
  alamat: string;
  noTelepon: string;
  role: string;
}

interface CreateUserResponse {
  id: string;
  success: boolean;
  message: string;
}

const BuatAkun = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    nama: '',
    username: '',
    email: '',
    password: '',
    konfirmasiPassword: '',
    alamat: '',
    noTelpon: '',
    role: '',
  });
  const [members] = useState<Member[]>(
    [
      { no: 1, nama: 'Table Cell', username: 'Table Cell', email: 'Table Cell', alamat: 'Table Cell', noTelepon: 'Table Cell', role: 'Table Cell' },
      { no: 2, nama: 'Table Cell', username: 'Table Cell', email: 'Table Cell', alamat: 'Table Cell', noTelepon: 'Table Cell', role: 'Table Cell' },
      { no: 3, nama: 'Table Cell', username: 'Table Cell', email: 'Table Cell', alamat: 'Table Cell', noTelepon: 'Table Cell', role: 'Table Cell' },
      { no: 4, nama: 'Table Cell', username: 'Table Cell', email: 'Table Cell', alamat: 'Table Cell', noTelepon: 'Table Cell', role: 'Table Cell' },
    ]
  );
  const [errors, setErrors] = useState({
    password: '',
    konfirmasiPassword: ''
  });

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
      }

      if (data.success) {
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
        // Refresh data tabel jika diperlukan
        // fetchMembers();
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

  return (
    <Box sx={{ p: 3, bgcolor: '#8bb6e6', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
      <Box sx={{ width: '100%', maxWidth: '1200px' }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', color: '#fff', textAlign: 'center' }}>
          Daftar Anggota
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
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
            Tambah Anggota
          </Button>
        </Box>

        {/* Dialog Form Tambah Anggota */}
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
            Form Tambah Anggota
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
                />
                <TextField
                  fullWidth
                  select
                  label="Role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  variant="outlined"
                  sx={{ mb: 2, bgcolor: '#e0e0e0', borderRadius: '8px' }}
                >
                  <MenuItem value="">-- Pilih role anda --</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="user">User</MenuItem>
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
        </Dialog>

        <TableContainer component={Paper} sx={{ borderRadius: 0, boxShadow: 'none', border: '1.5px solid #000' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#4267F6' }}>
                <TableCell align="center" sx={{ color: '#fff', fontWeight: 'bold', border: '1.5px solid #000', fontSize: 18 }}>No</TableCell>
                <TableCell align="center" sx={{ color: '#fff', fontWeight: 'bold', border: '1.5px solid #000', fontSize: 18 }}>Nama</TableCell>
                <TableCell align="center" sx={{ color: '#fff', fontWeight: 'bold', border: '1.5px solid #000', fontSize: 18 }}>Username</TableCell>
                <TableCell align="center" sx={{ color: '#fff', fontWeight: 'bold', border: '1.5px solid #000', fontSize: 18 }}>Email</TableCell>
                <TableCell align="center" sx={{ color: '#fff', fontWeight: 'bold', border: '1.5px solid #000', fontSize: 18 }}>Alamat</TableCell>
                <TableCell align="center" sx={{ color: '#fff', fontWeight: 'bold', border: '1.5px solid #000', fontSize: 18 }}>No Telepon</TableCell>
                <TableCell align="center" sx={{ color: '#fff', fontWeight: 'bold', border: '1.5px solid #000', fontSize: 18 }}>Role</TableCell>
              </TableRow>
            </TableHead>            <TableBody>
              {Array.isArray(members) && members.map((row) => (
                <TableRow key={row.no}>
                  <TableCell align="center" sx={{ border: '1.5px solid #000', fontSize: 16 }}>{row.no}</TableCell>
                  <TableCell align="center" sx={{ border: '1.5px solid #000', fontSize: 16 }}>{row.nama}</TableCell>
                  <TableCell align="center" sx={{ border: '1.5px solid #000', fontSize: 16 }}>{row.username}</TableCell>
                  <TableCell align="center" sx={{ border: '1.5px solid #000', fontSize: 16 }}>{row.email}</TableCell>
                  <TableCell align="center" sx={{ border: '1.5px solid #000', fontSize: 16 }}>{row.alamat}</TableCell>
                  <TableCell align="center" sx={{ border: '1.5px solid #000', fontSize: 16 }}>{row.noTelepon}</TableCell>
                  <TableCell align="center" sx={{ border: '1.5px solid #000', fontSize: 16 }}>{row.role}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default BuatAkun;
