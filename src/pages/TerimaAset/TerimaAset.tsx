import { Box, Button, Checkbox, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, CircularProgress } from '@mui/material';
import { useEffect, useState } from 'react';
import { validateApiResponse } from '../../utils/arrayUtils';
import { apiService } from '../../utils/apiService';
import Swal from 'sweetalert2';

interface BorrowedProduct {
  product_id: string;
  amount: number;
}

interface ReturnRequest {
  id: string;
  username: string;
  list_borrowing: BorrowedProduct[];
  date_borrowed: string;
  return_date: string;
  status: boolean;
}

const TerimaAset = () => {
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const fetchReturnRequests = async () => {
    try {
      const response = await apiService.get('/product/borrow/approved/return/accept/list');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal mengambil data');
      }

      const data = await response.json();
      console.log('Return requests:', data); // Debug log
      
      // Use utility function to validate and structure the data
      const validatedRequests = validateApiResponse<ReturnRequest>(data, ['list_borrowing']);
      setReturnRequests(validatedRequests);
    } catch (err) {
      console.error('Error:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };  const handleAcceptReturn = async () => {
    try {
      setAcceptLoading(true);
      
      for (const id of selectedItems) {
        const response = await apiService.post('/product/borrow/approved/return/accept', {
          id: id,
          status: true
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Gagal memproses pengembalian');
        }
      }Swal.fire({
        title: 'Sukses!',
        text: 'Pengembalian berhasil diterima',
        icon: 'success',
        confirmButtonText: 'OK'
      });
      setSelectedItems([]);
      
      // Trigger refresh data products untuk update stock setelah pengembalian
      window.dispatchEvent(new CustomEvent('dataRefresh'));
      console.log('🔄 Triggering data refresh after successful return acceptance');
      
      fetchReturnRequests(); // Refresh list
    } catch (err) {
      Swal.fire({
        title: 'Oops...',
        text: `${(err as Error).message}`,
        icon: 'error',        confirmButtonText: 'OK',
        footer: '<a href="https://wa.me/6282113791904">Laporkan error ke pengembang!</a>'
      });
    } finally {
      setAcceptLoading(false);
    }
  };

  useEffect(() => {
    fetchReturnRequests();
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
        color: 'error.main'
      }}>
        <Typography>{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#6CA2DF', minHeight: '100vh', p: 3 }}>
      <Box sx={{ maxWidth: '1300px', mx: 'auto', mt: 2 }}>        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>          <Button
            variant="contained"
            onClick={handleAcceptReturn}
            disabled={selectedItems.length === 0 || acceptLoading}
            startIcon={acceptLoading ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{
              bgcolor: '#4E71FF',
              color: '#fff',
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 'bold',
              px: 3,
              boxShadow: 'none',
              '&:hover': { bgcolor: '#3c5ae0' },
              '&:disabled': {
                bgcolor: '#cccccc',
                color: '#888888'
              },
              minWidth: '140px',
              transition: 'all 0.3s ease',
              transform: acceptLoading ? 'scale(0.98)' : 'scale(1)',
              '&:active': {
                transform: 'scale(0.95)'
              }
            }}
          >
            {acceptLoading ? 'Memproses...' : 'Terima Aset'}
          </Button>
        </Box>

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
                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>No</TableCell>
                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Peminjam</TableCell>
                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Nama Aset</TableCell>
                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Jumlah</TableCell>
                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Tgl Pengembalian</TableCell>
                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Aksi</TableCell>
              </TableRow>
            </TableHead>            <TableBody>
              {!Array.isArray(returnRequests) || returnRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Tidak ada permintaan pengembalian aset
                  </TableCell>
                </TableRow>
              ) : (
                Array.isArray(returnRequests) && returnRequests.map((request, idx) => (
                  <TableRow key={request.id}>
                    <TableCell align="center">{idx + 1}</TableCell>
                    <TableCell align="center">{request.username}</TableCell>                    <TableCell align="center">
                      {(request.list_borrowing || []).map(item => item.product_id).join(', ')}
                    </TableCell>
                    <TableCell align="center">
                      {(request.list_borrowing || []).reduce((sum, item) => sum + item.amount, 0)}
                    </TableCell>
                    <TableCell align="center">
                      {new Date(request.return_date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </TableCell>
                    <TableCell align="center">
                      <Checkbox
                        checked={selectedItems.includes(request.id)}
                        onChange={(e) => {
                          setSelectedItems(prev => 
                            e.target.checked
                              ? [...prev, request.id]
                              : prev.filter(id => id !== request.id)
                          );
                        }}
                        sx={{
                          color: selectedItems.includes(request.id) ? '#4E71FF' : '#666',
                          '&.Mui-checked': {
                            color: '#4E71FF',
                          },
                          '& .MuiSvgIcon-root': {
                            fontSize: 24,
                          },
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default TerimaAset;
