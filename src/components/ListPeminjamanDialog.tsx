import {
  Popover,
  Box,
  Typography,
  Button,
  Checkbox,
  IconButton
} from '@mui/material';
import { useState } from 'react';
import { useListPinjam } from '../context/ListPinjamContext';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import Swal from 'sweetalert2';
import { apiService } from '../utils/apiService';

interface ListPeminjamanDialogProps {
  open: boolean;
  onClose: () => void;
  anchorEl: HTMLElement | null;
}

const ListPeminjamanDialog = ({ open, onClose, anchorEl }: ListPeminjamanDialogProps) => {
  const { listPinjam, removeFromList, updateItemAmount } = useListPinjam();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const handleSelectItem = (id: string, checked: boolean) => {
    setSelectedItems(prev => 
      checked 
        ? [...prev, id]
        : prev.filter(item => item !== id)
    );
  };
  const handleSelectAll = (checked: boolean) => {
    setSelectedItems(checked ? (listPinjam || []).map(item => item.id_product) : []);
  };

  const handleDelete = () => {
    selectedItems.forEach(id => removeFromList(id));
    setSelectedItems([]);
  };
  const handleChangeAmount = (id: string, change: number) => {
    const item = (listPinjam || []).find(item => item.id_product === id);
    if (item) {
      const newAmount = Math.max(0, Math.min(item.stock, item.jumlah + change));
      updateItemAmount(id, newAmount);
    }
  };
  const handleSubmitBorrow = async () => {
    try {
      if (selectedItems.length === 0) {
        throw new Error('Pilih item yang akan diajukan');
      }

      // Filter hanya item yang diseleksi
      const selectedProducts = (listPinjam || []).filter(item => 
        selectedItems.includes(item.id_product)
      );

      const borrowData = {
        list_borrowing: selectedProducts.map(item => ({
          product_id: item.id_product,
          amount: item.jumlah
        }))
      };

      const response = await apiService.post('/product/borrow', borrowData);

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Gagal mengajukan peminjaman');      if (data.success) {
        Swal.fire({
          title: "Sukses!",
          text: "Peminjaman berhasil diajukan!",
          icon: "success",
          confirmButtonText: "OK"
        });       
        selectedProducts.forEach(item => removeFromList(item.id_product));
        setSelectedItems([]);
        
        // Trigger refresh data products untuk update stock
        window.dispatchEvent(new CustomEvent('dataRefresh'));
        console.log('🔄 Triggering data refresh after successful borrow');
        
        if ((listPinjam || []).length === selectedProducts.length) {
          onClose();
        }
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Oops...!",
        text: `${(error as Error).message}`,
        confirmButtonText: "OK",
        footer: '<a href="https://wa.me/6282113791904">Laporkan error ke pengembang!</a>'
      });
    }
  };

  return (
    <Popover
      open={open}
      onClose={onClose}
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      PaperProps={{
        sx: { 
          width: '400px', // Mengurangi lebar
          borderRadius: 2,
          mt: 1,
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden'
        }
      }}
    >
      <Box sx={{ 
        bgcolor: '#4267F6', 
        py: 1.5, 
        px: 2,
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <Typography
          color="white"
          fontWeight="600"
          fontSize={18}
          textAlign="center"
        >
          List Peminjaman
        </Typography>
      </Box>
      
      <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
        {/* Header */}
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: '40px 2fr 1fr 1fr',
          bgcolor: '#4267F6',
          p: 1,
          gap: 1
        }}>
          <Box>            <Checkbox 
              size="small"
              sx={{ 
                color: '#fff', 
                '&.Mui-checked': { color: '#fff' },
                p: 0.5
              }}
              checked={selectedItems.length === (listPinjam || []).length}
              onChange={(e) => handleSelectAll(e.target.checked)}
            />
          </Box>
          <Typography color="white" fontSize={14} fontWeight="600">Nama Aset</Typography>
          <Typography color="white" fontSize={14} fontWeight="600">Jumlah</Typography>
          <Typography color="white" fontSize={14} fontWeight="600">Atur</Typography>
        </Box>        {/* List Items */}
        <Box sx={{ p: 1 }}>
          {(listPinjam || []).length === 0 ? (
            <Typography sx={{ p: 2, textAlign: 'center', fontSize: 14 }}>
              Belum ada item yang ditambahkan
            </Typography>
          ) : (
            (listPinjam || []).map(item => (
              <Box 
                key={item.id_product}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '40px 2fr 1fr 1fr',
                  p: 1,
                  gap: 1,
                  alignItems: 'center',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' }
                }}
              >
                <Checkbox 
                  size="small"
                  checked={selectedItems.includes(item.id_product)}
                  onChange={(e) => handleSelectItem(item.id_product, e.target.checked)}
                  sx={{ p: 0.5 }}
                />
                <Typography fontSize={14} noWrap>{item.name}</Typography>
                <Typography fontSize={14}>{item.jumlah}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <IconButton 
                    size="small"
                    onClick={() => handleChangeAmount(item.id_product, -1)}
                    disabled={item.jumlah <= 1}
                    sx={{ p: 0.5 }}
                  >
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                  <Typography sx={{ mx: 0.5, fontSize: 14 }}>{item.jumlah}</Typography>
                  <IconButton 
                    size="small"
                    onClick={() => handleChangeAmount(item.id_product, 1)}
                    disabled={item.jumlah >= item.stock}
                    sx={{ p: 0.5 }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            ))
          )}
        </Box>
      </Box>

      {/* Footer */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        p: 1.5,
        borderTop: '1px solid #eee',
        bgcolor: '#fff'
      }}>
        <Button 
          startIcon={<DeleteIcon />}
          size="small"
          sx={{ 
            color: 'error.main',
            fontSize: 13
          }}
          onClick={handleDelete}
          disabled={selectedItems.length === 0}
        >
          Hapus
        </Button>
        <Button 
          variant="contained"
          size="small"
          onClick={handleSubmitBorrow}
          disabled={selectedItems.length === 0}
          sx={{ 
            bgcolor: '#4267F6',
            fontSize: 13,
            '&:hover': { bgcolor: '#3c5ae0' }
          }}
        >
          Ajukan
        </Button>
      </Box>
    </Popover>
  );
};

export default ListPeminjamanDialog;
