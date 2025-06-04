import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Button, Paper, Dialog, DialogActions, DialogContent, DialogContentText, CircularProgress } from '@mui/material';
import { useState, useEffect } from 'react';

interface BorrowedItem {
  product_id: string;
  amount: number;
}

interface BorrowedAsset {
  id: string;
  username: string;
  list_borrowing: BorrowedItem[];
  date_borrowed: string;
}

const Pengembalian = () => {
  const [assets, setAssets] = useState<BorrowedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<BorrowedAsset | null>(null);

  const fetchBorrowedAssets = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) throw new Error('Token tidak ditemukan');

      const response = await fetch('https://manpro-mansetdig.vercel.app/product/borrow/approved/list', {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      const data = await response.json();
      console.log('Borrowed assets:', data);

      if (Array.isArray(data)) {
        setAssets(data);
      }
    } catch (err) {
      console.error('Error fetching borrowed assets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReturnAsset = async () => {
    try {
      if (!selectedAsset) return;

      const token = sessionStorage.getItem('token');
      if (!token) throw new Error('Token tidak ditemukan');

      const response = await fetch('https://manpro-mansetdig.vercel.app/product/borrow/approved/return', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: selectedAsset.id
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('Pengembalian berhasil diajukan!');
        fetchBorrowedAssets(); // Refresh list
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setOpenDialog(false);
      setSelectedAsset(null);
    }
  };

  useEffect(() => {
    fetchBorrowedAssets();
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

  return (
    <Box sx={{ p: 3, bgcolor: '#8bb6e6', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
      <Box sx={{ width: '100%', maxWidth: '1200px' }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', color: '#fff', textAlign: 'center' }}>
          Pengembalian Aset
        </Typography>
        <TableContainer component={Paper} sx={{ borderRadius: '10px', overflow: 'hidden' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#1976d2' }}>
              <TableRow>
                <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>ID Peminjaman</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Peminjam</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Tanggal Peminjaman</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Detail Aset</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assets.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell>{asset.id}</TableCell>
                  <TableCell>{asset.username}</TableCell>
                  <TableCell>
                    {new Date(asset.date_borrowed).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </TableCell>                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {(asset.list_borrowing || []).map((item, idx) => (
                        <Typography key={idx}>
                          {item.product_id} ({item.amount} unit)
                        </Typography>
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      onClick={() => {
                        setSelectedAsset(asset);
                        setOpenDialog(true);
                      }}
                      sx={{
                        bgcolor: '#4E71FF',
                        '&:hover': { bgcolor: '#3c5ae0' }
                      }}
                    >
                      Kembalikan
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogContent>
            <DialogContentText>
              Apakah Anda yakin ingin mengembalikan aset ini?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Batal</Button>
            <Button onClick={handleReturnAsset} variant="contained">
              Ya, Kembalikan
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default Pengembalian;
