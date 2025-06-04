import { Box, Typography, Button } from '@mui/material';
import { useState, useEffect } from 'react';
import { useListPinjam } from '../context/ListPinjamContext';

interface AssetCardProps {
  id: string;
  nama: string;
  stok: number;
  gambar: string; // This will now contain display_url
}

const AssetCard = ({ id, nama, stok, gambar }: AssetCardProps) => {
  const [jumlah, setJumlah] = useState(0);
  const { addToListPinjam } = useListPinjam();

  const handleAddToList = () => {
    if (jumlah > 0 && jumlah <= stok) {
      addToListPinjam({
        id_product: id,
        name: nama,
        stock: stok,
        image: gambar,
        jumlah
      });
      setJumlah(0);
    }
  };

  // Fungsi untuk mengubah jumlah
  const decreaseJumlah = () => setJumlah(prev => Math.max(0, prev - 1));
  const increaseJumlah = () => setJumlah(prev => Math.min(stok, prev + 1));

  // Update getImageUrl function
  const getImageUrl = (url: string) => {
    try {
      if (!url) return 'https://via.placeholder.com/150';
      
      console.log('Processing image URL:', url);
      
      // If URL is already a valid image URL, use it directly
      if (url.startsWith('http') && (url.endsWith('.jpg') || url.endsWith('.png') || url.endsWith('.jpeg'))) {
        return url;
      }

      // Try to parse if it's a JSON string
      try {
        const parsed = JSON.parse(url);
        if (parsed.data?.url) {
          return parsed.data.url;
        }
      } catch {
        // Not JSON, continue with URL as is
      }

      return url;
    } catch (error) {
      console.error('Error processing image URL:', error);
      return 'https://via.placeholder.com/150';
    }
  };

  // Add debug logging for image URL
  useEffect(() => {
    console.log('Original image URL:', gambar);
    console.log('Processed image URL:', getImageUrl(gambar));
  }, [gambar]);

  return (
    <Box sx={{ 
      bgcolor: '#4E71FF',
      borderRadius: '12px',
      p: 1.5,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      height: '280px', // Mengurangi tinggi card
      width: '220px', // Set fixed width
      boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.08)',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.12)'
      }
    }}>
      <Box sx={{ 
        width: '100%',
        height: 130,
        borderRadius: '8px',
        overflow: 'hidden',
        mb: 1.5,
        bgcolor: '#fff',
        position: 'relative'
      }}>
        <img
          src={getImageUrl(gambar)}
          alt={nama}
          onError={(e) => {
            console.error('Image load failed:', gambar);
            e.currentTarget.src = 'https://via.placeholder.com/150';
          }}
          loading="lazy"
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            backgroundColor: '#f5f5f5'
          }} 
        />
      </Box>

      <Typography 
        fontFamily="'Poppins', sans-serif"
        fontWeight="600"
        fontSize={14} // Mengubah ukuran font
        color="white"
        align="center"
        sx={{ 
          mb: 0.5,
          maxWidth: '90%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
      >
        {nama}
      </Typography>

      <Typography 
        fontFamily="'Poppins', sans-serif"
        fontSize={12} // Mengubah ukuran font
        color="#e3f2fd"
        mb={1.5}
      >
        Stok: {stok}
      </Typography>

      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        mb: 1,
        gap: 0.5 // Mengurangi gap
      }}>
        <Button
          onClick={decreaseJumlah}
          sx={{ 
            minWidth: 28, // Mengubah ukuran button
            height: 28,
            borderRadius: '50%', 
            bgcolor: 'white', 
            color: '#4E71FF',
            p: 0,
            '&:hover': {
              bgcolor: '#e3e3e3'
            }
          }}
        >
          -
        </Button>
        <Typography sx={{ 
          mx: 1.5, 
          fontWeight: 'bold',
          color: 'white',
          minWidth: '24px',
          textAlign: 'center',
          fontSize: 14
        }}>
          {jumlah}
        </Typography>
        <Button
          onClick={increaseJumlah}
          sx={{ 
            minWidth: 28, // Mengubah ukuran button
            height: 28,
            borderRadius: '50%', 
            bgcolor: 'white', 
            color: '#4E71FF',
            p: 0,
            '&:hover': {
              bgcolor: '#e3e3e3'
            }
          }}
        >
          +
        </Button>
      </Box>

      <Button
        fullWidth
        variant="contained"
        disabled={jumlah === 0}
        onClick={handleAddToList}
        sx={{
          mt: 'auto', // Push button to bottom
          height: 32, // Mengubah tinggi button
          borderRadius: '8px',
          bgcolor: jumlah > 0 ? 'white' : '#bdbdbd',
          color: jumlah > 0 ? '#4E71FF' : '#fff',
          fontWeight: 'bold',
          textTransform: 'none',
          fontSize: 13,
          boxShadow: 'none',
          '&:hover': {
            bgcolor: jumlah > 0 ? '#e3e3e3' : '#bdbdbd',
            color: jumlah > 0 ? '#4E71FF' : '#fff'
          }
        }}
      >
        Tambahkan ke List
      </Button>
    </Box>
  );
};

export default AssetCard;