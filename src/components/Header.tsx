import {
  Box, 
  InputBase, 
  Avatar, 
  Badge, 
  IconButton, 
  Typography, 
  Button,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import AddAssetModal from './AddAssetModal';
import ListAltIcon from '@mui/icons-material/ListAlt';
import { useState, useEffect } from 'react';
import ListPeminjamanDialog from './ListPeminjamanDialog';
import { useListPinjam } from '../context/ListPinjamContext';
import NotificationPopover from './NotificationPopover';
import { useLocation } from 'react-router-dom';

interface HeaderProps {
  onAssetAdded?: () => void;
}

const Header = ({ onAssetAdded }: HeaderProps) => {
  const { listPinjam } = useListPinjam();
  const [isListDialogOpen, setIsListDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchValue, setSearchValue] = useState('');
  const [userRole, setUserRole] = useState<string>('');
  const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);
  const location = useLocation();

  const open = Boolean(anchorEl);
  const isPeminjamanPage = location.pathname.includes('/dashboard/peminjaman');

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    sessionStorage.clear();
    window.location.href = '/login';
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchValue(value);
    window.dispatchEvent(new CustomEvent('searchChange', { detail: value }));
  };

  useEffect(() => {
    setSearchValue('');
    window.dispatchEvent(new CustomEvent('searchChange', { detail: '' }));
    const role = sessionStorage.getItem('userRole') || '';
    setUserRole(role);
  }, []);

  const handleOpenList = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setIsListDialogOpen(true);
  };

  const handleOpenNotifications = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 3 }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        width: '100%',
        position: 'relative',
      }}>
        {/* Fixed position for Tambah Aset button */}
        <Box sx={{ position: 'absolute', left: 0, zIndex: 1 }}>
          {(userRole === 'admin' || userRole === 'master') && isPeminjamanPage && (
            <Button
              variant="contained"
              onClick={() => setIsAddAssetModalOpen(true)}
              sx={{
                bgcolor: '#4355B9',
                color: 'white',
                borderRadius: '50px',
                px: 3,
                py: 1,
                fontSize: '16px',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                '&:hover': {
                  bgcolor: '#3a489e'
                }
              }}
            >
              Tambah Aset
            </Button>
          )}
        </Box>

        {/* Updated Search Bar with left offset */}
        <Box sx={{
          position: 'absolute',
          left: '45%', // Ubah dari 50% ke 45% untuk geser ke kiri
          transform: 'translateX(-50%)',
          width: '380px', // Sedikit lebih kecil
          bgcolor: 'white',
          borderRadius: 10,
          px: 3,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          '&:focus-within': {
            boxShadow: '0 0 0 2px #4E71FF'
          }
        }}>
          <SearchIcon sx={{ color: '#222', mr: 2 }} />
          <InputBase
            placeholder="Telusuri aset..."
            value={searchValue}
            onChange={handleSearchChange}
            sx={{
              fontSize: 16,
              width: '100%',
              '& input::placeholder': {
                color: '#666',
                opacity: 1
              }
            }}
          />
        </Box>

        {/* Right side content with fixed position */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          position: 'absolute',
          right: 0
        }}>
          <IconButton
            onClick={handleOpenList}
            sx={{ bgcolor: 'white', '&:hover': { bgcolor: '#f5f5f5' } }}
          >
            <Badge badgeContent={listPinjam.length} color="error">
              <ListAltIcon sx={{ fontSize: 24, color: '#666' }} />
            </Badge>
          </IconButton>
          <IconButton 
            onClick={handleOpenNotifications}
            sx={{ bgcolor: 'white', '&:hover': { bgcolor: '#f5f5f5' } }}
          >
            <Badge badgeContent={2} color="error">
              <NotificationsIcon sx={{ fontSize: 24, color: '#666' }} />
            </Badge>
          </IconButton>

          <Box
            onClick={handleClick}
            sx={{
              bgcolor: 'white',
              borderRadius: 10,
              px: 2,
              py: 1,
              display: 'flex',
              alignItems: 'center',
              minWidth: 200,
              cursor: 'pointer',
              '&:hover': { bgcolor: '#f5f5f5' }
            }}
          >
            <Avatar src="https://i.pravatar.cc/100" sx={{ width: 40, height: 40, mr: 2 }} />
            <Box>
              <Typography fontWeight="bold" fontSize={16}>nama pengguna</Typography>
              <Typography fontSize={14} color="#666">aktor</Typography>
            </Box>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            onClick={handleClose}
            PaperProps={{
              elevation: 0,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                mt: 1.5,
                width: 200,
                '& .MuiMenuItem-root': {
                  fontSize: 14,
                  py: 1.5
                },
                '&:before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  right: 14,
                  width: 10,
                  height: 10,
                  bgcolor: 'background.paper',
                  transform: 'translateY(-50%) rotate(45deg)',
                  zIndex: 0,
                },
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={handleClose}>
              <ListItemIcon>
                <PersonOutlineIcon fontSize="small" />
              </ListItemIcon>
              Profil
            </MenuItem>
            <MenuItem onClick={handleClose}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              Pengaturan
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" color="error" />
              </ListItemIcon>
              Keluar
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      <ListPeminjamanDialog
        open={isListDialogOpen}
        onClose={() => {
          setIsListDialogOpen(false);
          setAnchorEl(null);
        }}
        anchorEl={anchorEl}
      />

      <AddAssetModal 
        open={isAddAssetModalOpen}
        onClose={() => setIsAddAssetModalOpen(false)}
        onSuccess={() => {
          setIsAddAssetModalOpen(false);
          onAssetAdded?.();
        }}
      />

      <NotificationPopover
        open={Boolean(notificationAnchorEl)}
        anchorEl={notificationAnchorEl}
        onClose={() => setNotificationAnchorEl(null)}
      />
    </Box>
  );
};

export default Header;