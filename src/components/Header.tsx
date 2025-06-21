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
import ClearIcon from '@mui/icons-material/Clear';
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
import UserDetailsModal from './UserDetailsModal';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';

interface HeaderProps {
  onAssetAdded?: () => void;
}

const Header = ({ onAssetAdded }: HeaderProps) => {
  const { listPinjam } = useListPinjam();
  const { userRole, userData, logout } = useAuth();
  const [isListDialogOpen, setIsListDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchValue, setSearchValue] = useState('');
  const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);
  const [isUserDetailsModalOpen, setIsUserDetailsModalOpen] = useState(false);
  const location = useLocation();

  const open = Boolean(anchorEl);
  const isPeminjamanPage = location.pathname.includes('/dashboard/peminjaman');
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    logout();
  };
  const handleUserClick = () => {
    setIsUserDetailsModalOpen(true);
  };

  const handleProfileMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation(); // Prevent triggering user details modal
    setAnchorEl(event.currentTarget);
  };
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchValue(value);
    window.dispatchEvent(new CustomEvent('searchChange', { detail: value }));
  };

  const handleClearSearch = () => {
    setSearchValue('');
    window.dispatchEvent(new CustomEvent('searchChange', { detail: '' }));
  };
  useEffect(() => {
    setSearchValue('');
    window.dispatchEvent(new CustomEvent('searchChange', { detail: '' }));
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
        }}>          <SearchIcon sx={{ color: '#222', mr: 2 }} />          <InputBase
            placeholder="Cari by nama, ID, stok, #kategori, lokasi, atau status..."
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
          {searchValue && (
            <IconButton
              onClick={handleClearSearch}
              sx={{
                color: '#666',
                p: 0.5,
                ml: 1,
                '&:hover': {
                  color: '#222',
                  bgcolor: 'rgba(0,0,0,0.04)'
                }
              }}
            >
              <ClearIcon fontSize="small" />
            </IconButton>
          )}
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
          </IconButton>          <Box
            sx={{
              bgcolor: 'white',
              borderRadius: 10,
              px: 2,
              py: 1,
              display: 'flex',
              alignItems: 'center',
              minWidth: 200,
              border: '2px solid transparent',
              transition: 'all 0.2s ease-in-out',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              '&:hover': { 
                bgcolor: '#f8f9ff',
                borderColor: '#4355B9',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(67, 85, 185, 0.2)'
              }
            }}
          >            <Box 
              onClick={handleUserClick}
              sx={{
                display: 'flex',
                alignItems: 'center',
                flex: 1,
                cursor: 'pointer'
              }}
            >
              <Avatar 
                src={userData ? `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.full_name || userData.username)}&background=4355B9&color=fff&size=40` : "https://i.pravatar.cc/100"}
                sx={{ width: 40, height: 40, mr: 2 }} 
              />
              <Box>
                <Typography 
                  fontWeight="bold" 
                  fontSize={16}
                  sx={{
                    color: '#1a1a1a',
                    textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    fontWeight: 600
                  }}
                >
                  {userData?.full_name || userData?.username || 'nama pengguna'}
                </Typography>
                <Typography 
                  fontSize={14} 
                  sx={{
                    color: '#4355B9',
                    fontWeight: 500,
                    textTransform: 'capitalize'
                  }}
                >
                  {userData?.role || userRole || 'aktor'}
                </Typography>
              </Box>
            </Box>
            <IconButton 
              onClick={handleProfileMenuClick}
              size="small"
              sx={{
                ml: 1,
                color: '#666',
                '&:hover': {
                  bgcolor: 'rgba(67, 85, 185, 0.1)',
                  color: '#4355B9'
                }
              }}
            >
              <SettingsIcon fontSize="small" />
            </IconButton>
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
      />      <NotificationPopover
        open={Boolean(notificationAnchorEl)}
        anchorEl={notificationAnchorEl}
        onClose={() => setNotificationAnchorEl(null)}
      />

      <UserDetailsModal
        open={isUserDetailsModalOpen}
        onClose={() => setIsUserDetailsModalOpen(false)}
        userData={userData}
      />
    </Box>
  );
};

export default Header;