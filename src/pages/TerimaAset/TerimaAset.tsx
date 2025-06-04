import { Box, Button, Checkbox, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, CircularProgress } from '@mui/material';
import { useEffect, useState } from 'react';

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

  const fetchReturnRequests = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) throw new Error('Token tidak ditemukan');

      const response = await fetch('https://manpro-mansetdig.vercel.app/product/borrow/approved/return/accept/list', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal mengambil data');
      }

      const data = await response.json();
      console.log('Return requests:', data); // Debug log
      setReturnRequests(data);
    } catch (err) {
      console.error('Error:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptReturn = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) throw new Error('Token tidak ditemukan');

      for (const id of selectedItems) {
        const response = await fetch('https://manpro-mansetdig.vercel.app/product/borrow/approved/return/accept', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            id: id,
            status: true
          })
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Gagal memproses pengembalian');
        }
      }

      alert('Pengembalian berhasil diterima');
      setSelectedItems([]);
      fetchReturnRequests(); // Refresh list
    } catch (err) {
      alert((err as Error).message);
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
      <Box sx={{ maxWidth: '1300px', mx: 'auto', mt: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Button
            variant="contained"
            onClick={handleAcceptReturn}
            disabled={selectedItems.length === 0}
            sx={{
              bgcolor: '#4267F6',
              color: '#fff',
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 'bold',
              px: 3,
              boxShadow: 'none',
              '&:hover': { bgcolor: '#274bb5' }
            }}
          >
            Terima Aset
          </Button>
        </Box>

        <TableContainer component={Paper} sx={{ borderRadius: 0, boxShadow: 'none', border: '1.5px solid #000' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#4267F6' }}>
                <TableCell align="center" sx={{ color: '#fff', fontWeight: 'bold', border: '1.5px solid #000', fontSize: 18 }}>No</TableCell>
                <TableCell align="center" sx={{ color: '#fff', fontWeight: 'bold', border: '1.5px solid #000', fontSize: 18 }}>Peminjam</TableCell>
                <TableCell align="center" sx={{ color: '#fff', fontWeight: 'bold', border: '1.5px solid #000', fontSize: 18 }}>Nama Aset</TableCell>
                <TableCell align="center" sx={{ color: '#fff', fontWeight: 'bold', border: '1.5px solid #000', fontSize: 18 }}>Jumlah</TableCell>
                <TableCell align="center" sx={{ color: '#fff', fontWeight: 'bold', border: '1.5px solid #000', fontSize: 18 }}>Tgl Pengembalian</TableCell>
                <TableCell align="center" sx={{ color: '#fff', fontWeight: 'bold', border: '1.5px solid #000', fontSize: 18 }}>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {returnRequests.map((request, idx) => (
                <TableRow key={request.id}>
                  <TableCell align="center" sx={{ border: '1.5px solid #000', fontSize: 16 }}>{idx + 1}</TableCell>
                  <TableCell align="center" sx={{ border: '1.5px solid #000', fontSize: 16 }}>{request.username}</TableCell>                  <TableCell align="center" sx={{ border: '1.5px solid #000', fontSize: 16 }}>
                    {(request.list_borrowing || []).map(item => item.product_id).join(', ')}
                  </TableCell>
                  <TableCell align="center" sx={{ border: '1.5px solid #000', fontSize: 16 }}>
                    {(request.list_borrowing || []).reduce((sum, item) => sum + item.amount, 0)}
                  </TableCell>
                  <TableCell align="center" sx={{ border: '1.5px solid #000', fontSize: 16 }}>
                    {new Date(request.return_date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </TableCell>
                  <TableCell align="center" sx={{ border: '1.5px solid #000', fontSize: 16 }}>
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
                        color: selectedItems.includes(request.id) ? '#2ecc40' : '#222',
                        '&.Mui-checked': {
                          color: '#2ecc40',
                        },
                        '& .MuiSvgIcon-root': {
                          fontSize: 28,
                        },
                        verticalAlign: 'middle'
                      }}
                      icon={<span style={{
                        display: 'inline-block',
                        width: 24,
                        height: 24,
                        border: '2px solid #222',
                        borderRadius: 4,
                        background: '#fff'
                      }} />}
                      checkedIcon={<span style={{
                        display: 'flex',
                        width: 24,
                        height: 24,
                        border: '2px solid #2ecc40',
                        borderRadius: 4,
                        background: '#2ecc40',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <svg width="18" height="18" viewBox="0 0 18 18">
                          <polyline
                            points="4,10 8,14 14,6"
                            style={{
                              fill: 'none',
                              stroke: '#fff',
                              strokeWidth: 2.5,
                              strokeLinecap: 'round',
                              strokeLinejoin: 'round'
                            }}
                          />
                        </svg>
                      </span>}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default TerimaAset;
