import { Box, List, ListItem } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from '@emotion/styled';

interface MenuItem {
  label: string;
  icon: string;
  roles: string[];
  path: string;
}

const menuItems: MenuItem[] = [
  {
    label: 'Peminjaman Aset',
    icon: '/assets/form peminjaman_pengembalian_buat akun_terima aset_persetujuan/peminjaman.png',
    roles: ['user', 'admin', 'master'],
    path: '/dashboard/peminjaman'
  },
  {
    label: 'Pengembalian Aset',
    icon: '/assets/form peminjaman_pengembalian_buat akun_terima aset_persetujuan/pengembalian.png',
    roles: ['user', 'admin', 'master'],
    path: '/dashboard/pengembalian'  },
  {
    label: 'Manajemen User',
    icon: '/assets/form peminjaman_pengembalian_buat akun_terima aset_persetujuan/buatakun.png',
    roles: ['admin', 'master'],
    path: '/dashboard/buat-akun'
  },
  {
    label: 'Terima Aset',
    icon: '/assets/form peminjaman_pengembalian_buat akun_terima aset_persetujuan/terima.png',
    roles: ['admin', 'master'],
    path: '/dashboard/terima-aset'
  },
  {
    label: 'Persetujuan Aset',
    icon: '/assets/form peminjaman_pengembalian_buat akun_terima aset_persetujuan/persetujuan.png',
    roles: ['master'],
    path: '/dashboard/persetujuan'
  }
];

const AnimatedListItem = styled(ListItem)<{ isactive: string }>`
  transition: all 300ms ease-out;
  background-color: ${props => props.isactive === 'true' ? 'rgba(255, 255, 255, 0.2)' : 'transparent'};
  border-radius: 15px;
  margin-bottom: 8px;
  padding: 12px 16px;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.15);
    transform: translateX(5px);
  }
`;

const MenuText = styled.span`
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 16px;
  color: white;
  margin-left: 12px;
`;

interface SidebarProps {
  userRole?: string;
}

const Sidebar = ({ userRole }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeItem, setActiveItem] = useState(location.pathname);

  useEffect(() => {
    setActiveItem(location.pathname);
  }, [location.pathname]);

  const handleMenuClick = (path: string) => {
    setActiveItem(path);
    navigate(path);
  };

  const filteredMenu = menuItems.filter(item => {
    if (!userRole) return false;
    return item.roles.includes(userRole);
  });

  return (
    <Box
      sx={{
        width: { xs: '100%', md: 280 },
        height: '100vh',
        background: '#4E71FF',
        position: 'fixed',
        top: 0,
        left: 0,
        borderTopRightRadius: { xs: 0, md: '30px' },
        borderBottomRightRadius: { xs: 0, md: '30px' },
        boxShadow: '4px 0 10px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1200,
        overflowY: 'auto',
        '&::-webkit-scrollbar': {
          width: '4px'
        },
        '&::-webkit-scrollbar-track': {
          background: 'rgba(255,255,255,0.1)'
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(255,255,255,0.3)',
          borderRadius: '2px'
        }
      }}
    >
      <Box sx={{
        width: '80%',
        height: 60,
        margin: '20px auto',
        borderRadius: '20px',
        bgcolor: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        flexShrink: 0
      }}>
        <img 
          src="/assets/logo/logo.png" 
          alt="Logo" 
          style={{ 
            height: '40px',
            width: 'auto'
          }} 
        />
      </Box>
      
      <List sx={{ 
        px: 2,
        mt: 2,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        mb: 2
      }}>
        {filteredMenu.map((item, idx) => (
          <AnimatedListItem
            key={idx}
            isactive={(activeItem === item.path).toString()}
            onClick={() => handleMenuClick(item.path)}
            sx={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <img 
              src={item.icon} 
              alt={item.label}
              style={{ 
                width: '24px',
                height: '24px',
                filter: 'brightness(0) invert(1)'
              }}
            />
            <MenuText>{item.label}</MenuText>
          </AnimatedListItem>
        ))}
      </List>
    </Box>
  );
};

export default Sidebar;