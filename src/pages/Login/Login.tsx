import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  InputAdornment,
} from '@mui/material';
import { toast } from 'react-hot-toast';

interface LoginProps {
  setIsAuthenticated: (value: boolean) => void;
}

const Login = ({ setIsAuthenticated }: LoginProps) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formBody = new URLSearchParams();
      formBody.append('username', formData.username);
      formBody.append('password', formData.password);

      const response = await fetch('https://manpro-mansetdig.vercel.app/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formBody
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login gagal');
      }

      const data = await response.json();
      
      if (data && data.access_token) {
        // Simpan token tanpa enkripsi
        sessionStorage.setItem('token', data.access_token);
        
        // Get user data
        try {
          const userResponse = await fetch('https://manpro-mansetdig.vercel.app/user/get_account', {
            headers: {
              'Authorization': `Bearer ${data.access_token}`
            }
          });

          if (!userResponse.ok) {
            throw new Error('Gagal mengambil data user');
          }

          const userData = await userResponse.json();
          sessionStorage.setItem('userRole', userData.role || 'user');
          
          setIsAuthenticated(true);
          navigate('/dashboard');
          toast.success('Login berhasil!');
        } catch (userError) {
          console.error('Error fetching user data:', userError);
          // Tetap set role default dan lanjut ke dashboard
          sessionStorage.setItem('userRole', 'user');
          setIsAuthenticated(true);
          navigate('/dashboard');
        }
      } else {
        throw new Error('Token tidak ditemukan dalam response');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Terjadi kesalahan saat login.');
    }
  };

  return (
    <Box sx={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#6CA2DF',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Rectangle 6 - Login Form */}
      <Box
        sx={{
          width: 374,
          height: 488,
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-93%, -50%)',
          borderRadius: '40px',
          background: 'linear-gradient(217.64deg, #1984FF -5.84%, #5DC1FF 106.73%)',
          boxShadow: '-4px 4px 4px 0px #00000040',
          overflow: 'hidden'
        }}
      >
        <Box
          component="img"
          src="/src/assets/Rectangle/Rectangle 6.png"
          alt="Rectangle 6 Background"
          sx={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            objectFit: 'cover'
          }}
        />
        
        <Box sx={{ position: 'relative', zIndex: 1, p: 4 }}>
          <Typography
            variant="h4"
            sx={{
              fontFamily: 'Lalezar',
              fontSize: '30px',
              color: '#FFF',
              fontWeight: 'bold',
              textAlign: 'center',
              mb: 4,
              mt: 16
            }}
          >
            SELAMAT DATANG
          </Typography>

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2
            }}
          >
            <TextField
              fullWidth
              placeholder="nama pengguna"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Box 
                      component="img" 
                      src="/src/assets/form login dan forgot dan animasi/person-fill.png"
                      sx={{ width: 20, height: 20 }}
                    />
                  </InputAdornment>
                ),
              }}
              sx={{
                width: '282px',
                '& .MuiOutlinedInput-root': {
                  height: '36px',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: '10px',
                  '& fieldset': { border: 'none' },
                  '& input': {
                    fontSize: '14px',
                    padding: '8px 14px'
                  },
                  // Update autofill style
                  '& input:-webkit-autofill': {
                    '-webkit-box-shadow': '0 0 0 100px rgba(255, 255, 255, 0.9) inset',
                    '-webkit-text-fill-color': 'rgba(0, 0, 0, 0.87)',
                    'font-size': '14px'
                  },
                  '& input:-webkit-autofill:hover, & input:-webkit-autofill:focus': {
                    '-webkit-box-shadow': '0 0 0 100px rgba(255, 255, 255, 0.9) inset',
                  }
                }
              }}
            />

            <TextField
              fullWidth
              type={showPassword ? "text" : "password"}
              placeholder="kata sandi"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Box 
                      component="img" 
                      src="/src/assets/form login dan forgot dan animasi/key-fill.png"
                      sx={{ width: 20, height: 20 }}
                    />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Box
                      component="button"
                      type="button"
                      onClick={handleTogglePassword}
                      sx={{
                        border: 'none',
                        background: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        '&:focus': {
                          outline: 'none'
                        }
                      }}
                    >
                      <Box
                        component="img"
                        src={showPassword 
                          ? "/src/assets/form login dan forgot dan animasi/eye-fill.png"
                          : "/src/assets/form login dan forgot dan animasi/eye-slash-fill.png"}
                        sx={{ 
                          width: 20, 
                          height: 20,
                          opacity: 0.7,
                          '&:hover': {
                            opacity: 1
                          }
                        }}
                      />
                    </Box>
                  </InputAdornment>
                ),
              }}
              sx={{
                width: '282px',
                '& .MuiOutlinedInput-root': {
                  height: '36px',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: '10px',
                  '& fieldset': { border: 'none' },
                  '& input': {
                    fontSize: '14px',
                    padding: '8px 14px'
                  },
                  // Update autofill style
                  '& input:-webkit-autofill': {
                    '-webkit-box-shadow': '0 0 0 100px rgba(255, 255, 255, 0.9) inset',
                    '-webkit-text-fill-color': 'rgba(0, 0, 0, 0.87)',
                    'font-size': '14px'
                  },
                  '& input:-webkit-autofill:hover, & input:-webkit-autofill:focus': {
                    '-webkit-box-shadow': '0 0 0 100px rgba(255, 255, 255, 0.9) inset',
                  }
                }
              }}
            />

            <Button
              type="submit"
              sx={{
                width: '91px',
                height: '36px',
                background: '#1984FF',
                color: '#000000',
                borderRadius: '20px',
                textTransform: 'none',
                fontSize: '14px',
                fontWeight: 'bold',
                mt: 2,
                boxShadow: '0px 2px 4px rgba(119, 26, 26, 0.1)',
                '&:hover': {
                  background: '#1565C0'
                }
              }}
            >
              MASUK
            </Button>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', mt: 1 }}>
            <Button
              type="button"
              onClick={() => navigate('/reset-password')}
              sx={{
                color: '#000000',
                fontSize: 'bold',
                textTransform: 'none',
                background: 'none',
                border: 'none',
                padding: '4px 8px',
                '&:hover': {
                  textDecoration: 'underline',
                  background: 'none'
                }
              }}
            >
              Lupa kata sandi?
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Rectangle 8 - Logo Side */}
      <Box
        sx={{
          width: 374,
          height: 488,
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(3%, -50%)',
          borderRadius: '40px',
          background: 'linear-gradient(217.64deg, #1984FF -5.84%, #5DC1FF 106.73%)',
          boxShadow: '-4px 4px 4px 0px #00000040',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Box
          component="img"
          src="/src/assets/Rectangle/Rectangle 8.png"
          alt="Rectangle 8 Background"
          sx={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            objectFit: 'cover'
          }}
        />
        
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            mt: -20
          }}
        >
          <Typography
            variant="h3"
            sx={{
              fontFamily: 'Poppins',
              fontSize: '48px',
              color: '#FFFFFF',
              fontWeight: 800,
              textAlign: 'center',
              mb: 4,
              mt: 20,
            }}
          >
            ASETARY
          </Typography>
          <Box
            component="img"
            src="/src/assets/form login dan forgot dan animasi/solar_library-bold.png"
            alt="Library Icon"
            sx={{
              width: '140px',
              height: '140px',
              position: 'relative',
              zIndex: 1,
              mt: 4,
              filter: 'brightness(0) invert(1)',
              transform: 'translateX(-8px)'
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default Login;