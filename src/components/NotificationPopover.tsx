import {
  Popover,
  Box,
  Typography,
  Avatar,
} from '@mui/material';

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  image: string;
  time: string;
  isRead: boolean;
}

interface NotificationPopoverProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

const NotificationPopover = ({ open, anchorEl, onClose }: NotificationPopoverProps) => {
  // Dummy data untuk notifikasi
  const notifications: NotificationItem[] = [
    {
      id: 1,
      title: "SALE IS LIVE",
      message: "Pengajuan peminjaman kamu telah disetujui",
      image: "/assets/item1.jpg",
      time: "2 menit yang lalu",
      isRead: false
    },
    {
      id: 2,
      title: "SALE IS LIVE",
      message: "Pengajuan peminjaman kamu ditolak",
      image: "/assets/item2.jpg",
      time: "5 menit yang lalu",
      isRead: false
    }
  ];

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
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
          width: 320, // Mengurangi lebar
          borderRadius: 1,
          mt: 1,
          boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.1)'
        }
      }}
    >
      <Box sx={{ 
        bgcolor: '#4267F6', // Mengubah warna biru
        py: 1.5,
        px: 2,
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <Typography
          color="white"
          fontWeight="600"
          fontSize={16} // Mengurangi ukuran font
        >
          Notification
        </Typography>
      </Box>

      <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
        {notifications.map((notification) => (
          <Box
            key={notification.id}
            sx={{
              p: 1.5, // Mengurangi padding
              display: 'flex',
              gap: 1.5,
              borderBottom: '1px solid #eee',
              bgcolor: notification.isRead ? 'transparent' : 'rgba(66, 103, 246, 0.03)',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.02)'
              }
            }}
          >
            <Avatar 
              src={notification.image} 
              sx={{ 
                width: 40, // Mengurangi ukuran avatar
                height: 40,
                borderRadius: 1.5
              }}
            />
            <Box sx={{ flex: 1, minWidth: 0 }}> {/* Added minWidth: 0 for text truncation */}
              <Typography
                fontWeight="600"
                fontSize={13}
                sx={{ 
                  mb: 0.5,
                  color: '#1a1a1a'
                }}
              >
                {notification.title}
              </Typography>
              <Typography
                fontSize={12}
                sx={{ 
                  mb: 0.5,
                  color: '#666',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: 1.3
                }}
              >
                {notification.message}
              </Typography>
              <Typography
                fontSize={11}
                sx={{ color: '#999' }}
              >
                {notification.time}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Popover>
  );
};

export default NotificationPopover;
