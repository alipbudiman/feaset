import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Chip
} from '@mui/material';
import { useEffect, useState } from 'react';
import { apiService } from '../../utils/apiService';
import Swal from 'sweetalert2';

// Update interface sesuai response API
interface BorrowingItem {
  product_id: string;
  amount: number;
}

interface BorrowingData {
  id: string;
  username: string;
  list_borrowing: BorrowingItem[];
  date_borrowed: string;
}

const Persetujuan = () => {
  const [borrowings, setBorrowings] = useState<BorrowingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchBorrowings = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/product/borrow/list');
      const data = await response.json();
      console.log('Borrow response:', data); // Debug log

      // Jika data adalah array, gunakan langsung
      if (Array.isArray(data)) {
        const validatedBorrowings = data.map((borrow: any) => ({
          ...borrow,
          list_borrowing: Array.isArray(borrow.list_borrowing) ? borrow.list_borrowing : []
        }));
        setBorrowings(validatedBorrowings);
      }// Jika data memiliki property borrowed_list
      else if (data.borrowed_list && Array.isArray(data.borrowed_list)) {
        const validatedBorrowings = data.borrowed_list.map((borrow: any) => ({
          ...borrow,
          list_borrowing: Array.isArray(borrow.list_borrowing) ? borrow.list_borrowing : []
        }));
        setBorrowings(validatedBorrowings);
      }
      // Jika tidak ada data
      else {
        setBorrowings([]);
      }

    } catch (err) {
      console.error('Error fetching borrows:', err);
      setError('Gagal memuat data peminjaman');
    } finally {
      setLoading(false);
    }
  };

    const handleApprove = async (borrowId: string, username: string, approve: boolean = true) => {
    try {
      const response = await apiService.post('/product/borrow/approved', {
        username: username,
        id: borrowId,
        status: approve
      });

      const data = await response.json();
      console.log('Approve response:', data); // Debug log
      
      if (!response.ok) {
        throw new Error(data.message || 'Gagal memproses permintaan');
      }      if (data.success) {
        Swal.fire({
          title: 'Sukses!',
          text: approve ? 'Peminjaman berhasil disetujui!' : 'Peminjaman ditolak',
          icon: 'success',
          confirmButtonText: 'OK'
        });
        
        // Trigger refresh data products untuk update stock setelah approve/reject
        window.dispatchEvent(new CustomEvent('dataRefresh'));
        console.log('🔄 Triggering data refresh after borrow approval/rejection');
        
        fetchBorrowings(); // Refresh data
      } else {
        throw new Error(data.message);
      }

    } catch (err) {
      console.error('Error processing borrow:', err);
      Swal.fire({
        title: 'Oops...',
        text: `${(err as Error).message}`,
        icon: 'error',
        confirmButtonText: 'OK',
        footer: '<a href="https://wa.me/6282113791904">Laporkan error ke pengembang!</a>'
      });
    }
  };

  useEffect(() => {
    fetchBorrowings();
  }, []);

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '400px',
        width: '100%'
      }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        p: 3, 
        textAlign: 'center',
        color: 'white'
      }}>
        <Typography>{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{
      p: 3,
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100%',
      width: '100%',
      maxWidth: '1400px',
      mx: 'auto',
      bgcolor: 'transparent' // Tambahkan ini untuk menghindari background hitam
    }}>
      <Typography variant="h5" sx={{ mb: 3, color: 'white', fontWeight: 'bold' }}>
        Persetujuan Peminjaman Aset
      </Typography>

      <TableContainer 
        component={Paper} 
        sx={{ 
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: 'white',
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#4E71FF' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ID Peminjaman</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Peminjam</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Tanggal Pengajuan</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Detail Peminjaman</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Aksi</TableCell>
            </TableRow>
          </TableHead>          <TableBody>
            {!Array.isArray(borrowings) || borrowings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Tidak ada peminjaman yang menunggu persetujuan
                </TableCell>
              </TableRow>            ) : (
              Array.isArray(borrowings) && borrowings.map((borrow) => (
                <TableRow key={borrow.id}>
                  <TableCell>{borrow.id}</TableCell>
                  <TableCell>{borrow.username}</TableCell>
                  <TableCell>
                    {new Date(borrow.date_borrowed).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </TableCell>                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {(borrow.list_borrowing || []).map((item, index) => (
                        <Chip
                          key={index}
                          label={`${item.product_id} (${item.amount} unit)`}
                          sx={{ maxWidth: 'fit-content' }}
                        />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        onClick={() => handleApprove(borrow.id, borrow.username, true)}
                        sx={{
                          bgcolor: '#4E71FF',
                          '&:hover': { bgcolor: '#3c5ae0' }
                        }}
                      >
                        Setujui
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => handleApprove(borrow.id, borrow.username, false)}
                        sx={{
                          borderColor: '#ff4444',
                          color: '#ff4444',
                          '&:hover': {
                            borderColor: '#cc0000',
                            bgcolor: 'rgba(255,68,68,0.04)'
                          }
                        }}
                      >
                        Tolak
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Persetujuan;
