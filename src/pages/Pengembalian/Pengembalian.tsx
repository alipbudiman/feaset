/* eslint-disable @typescript-eslint/no-explicit-any */
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Button, Paper, Dialog, DialogActions, DialogContent, DialogContentText, CircularProgress } from '@mui/material';
import { useState, useEffect } from 'react';
import { apiService } from '../../utils/apiService';
import Swal from 'sweetalert2';

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
  const [returnLoading, setReturnLoading] = useState(false);
  const fetchBorrowedAssets = async () => {
    try {
      const response = await apiService.get('/product/borrow/approved/list');
      const data = await response.json();
      console.log('Borrowed assets:', data);

      if (Array.isArray(data)) {
        // Validate and ensure list_borrowing is always an array
        const validatedAssets = data.map((asset: any) => ({
          ...asset,
          list_borrowing: Array.isArray(asset.list_borrowing) ? asset.list_borrowing : []
        }));
        setAssets(validatedAssets);
      } else {
        setAssets([]);
      }
    } catch (err) {
      console.error('Error fetching borrowed assets:', err);
    } finally {
      setLoading(false);
    }
  };  const handleReturnAsset = async () => {
    try {
      if (!selectedAsset) return;

      setReturnLoading(true);
      
      const response = await apiService.post('/product/borrow/approved/return', {
        id: selectedAsset.id
      });

      const data = await response.json();if (data.success) {
        Swal.fire({
          title: "Sukses!",
          text: "Pengembalian berhasil diajukan!",
          icon: "success",
          confirmButtonText: "OK"
        });
        
        // Trigger refresh data products untuk update stock setelah pengembalian diajukan
        window.dispatchEvent(new CustomEvent('dataRefresh'));
        console.log('🔄 Triggering data refresh after successful return request');
        
        fetchBorrowedAssets(); // Refresh list
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Oops...!",
        text: `${(err as Error).message}`,
        confirmButtonText: "OK",
        footer: '<a href="https://wa.me/6282113791904">Laporkan error ke pengembang!</a>'      });
    } finally {
      setReturnLoading(false);
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
                <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Aksi</TableCell>              </TableRow>
            </TableHead>
            <TableBody>
              {!Array.isArray(assets) || assets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    Tidak ada peminjaman yang perlu dikembalikan
                  </TableCell>
                </TableRow>
              ) : (
                Array.isArray(assets) && assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell sx={{ color: '#000' }}>{asset.id}</TableCell>
                    <TableCell sx={{ color: '#000' }}>{asset.username}</TableCell>
                    <TableCell sx={{ color: '#000' }}>
                      {new Date(asset.date_borrowed).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </TableCell>                    <TableCell sx={{ color: '#000' }}>
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
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>        <Dialog open={openDialog} onClose={() => !returnLoading && setOpenDialog(false)}>
          <DialogContent>
            <DialogContentText>
              Apakah Anda yakin ingin mengembalikan aset ini?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setOpenDialog(false)}
              disabled={returnLoading}
            >
              Batal
            </Button>            <Button 
              onClick={handleReturnAsset} 
              variant="contained"
              disabled={returnLoading}
              startIcon={returnLoading ? <CircularProgress size={16} color="inherit" /> : null}
              sx={{
                bgcolor: '#4E71FF',
                '&:hover': { bgcolor: '#3c5ae0' },
                '&:disabled': {
                  bgcolor: '#cccccc',
                  color: '#888888'
                },
                minWidth: '140px',
                transition: 'all 0.3s ease',
                transform: returnLoading ? 'scale(0.98)' : 'scale(1)',
                '&:active': {
                  transform: 'scale(0.95)'
                }
              }}
            >
              {returnLoading ? 'Memproses...' : 'Ya, Kembalikan'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default Pengembalian;
