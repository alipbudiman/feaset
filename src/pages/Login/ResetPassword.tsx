import { useState } from 'react';
import { Box, Button, TextField, Typography, InputAdornment } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    username: '',
    phone: '',
    otp: '',
    password: '',
    confirm: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!form.username || !form.phone || !form.otp) {
        toast.error('Semua field wajib diisi!');
        return;
      }
      // Validasi OTP
      setStep(2);
    } else {
    if (!form.password || !form.confirm) {
      toast.error('Semua field wajib diisi!');
      return;
    }
    if (form.password !== form.confirm) {
      toast.error('Konfirmasi kata sandi tidak cocok!');
      return;
    }
    toast.success('Kata sandi berhasil diubah!');
    navigate('/reset-success');
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
      {/* Rectangle 6 - Form Side */}
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
          {/* Back Button */}
          <Box
            component="button"
            onClick={handleBack}
            sx={{
              position: 'absolute',
              top: 20,
              left: 20,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0
            }}
          >
            <Box
              component="img"
              src="/src/assets/form login dan forgot dan animasi/Subtract.png"
              sx={{ width: 24, height: 24 }}
            />
          </Box>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: step === 1 ? 50 : -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: step === 1 ? -50 : 50 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
                duration: 0.5
              }}
            >
              <motion.div
                animate={{
                  marginTop: step === 1 ? '2rem' : '1rem'
                }}
                transition={{
                  duration: 0.5,
                  ease: "easeInOut"
                }}
              >
                <Typography
                  variant="h4"
                  sx={{
                    fontFamily: 'Lalezar',
                    fontSize: '30px',
                    color: '#FFF',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    mb: 4,
                    mt: step === 2 ? 16 : 8
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
                  <motion.div
                    layout
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      width: '100%',
                      alignItems: 'center'
                    }}
                  >
                    {step === 1 && (
                      <>
                        <TextField
                          fullWidth
                          placeholder="nama pengguna"
                          name="username"
                          value={form.username}
                          onChange={handleChange}
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
                              '& fieldset': { border: 'none' }
                            }
                          }}
                        />

                        <TextField
                          fullWidth
                          placeholder="No Telpon / WhatsApp"
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Box 
                                  component="img" 
                                  src="/src/assets/form login dan forgot dan animasi/call.png"
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
                              '& fieldset': { border: 'none' }
                            }
                          }}
                        />

                        <TextField
                          fullWidth
                          placeholder="Masukkan Kode OTP"
                          name="otp"
                          value={form.otp}
                          onChange={handleChange}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <Box 
                                  component="img" 
                                  src="/src/assets/form login dan forgot dan animasi/send-fill.png"
                                  sx={{ 
                                    width: 20, 
                                    height: 20,
                                    cursor: 'pointer',
                                    '&:hover': { opacity: 0.8 }
                                  }}
                                  onClick={() => toast.success('OTP telah dikirim!')}
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
                              '& fieldset': { border: 'none' }
                            }
                          }}
                        />
                      </>
                    )}

                    {step === 2 && (
                      <motion.div
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ 
                          y: 0,
                          opacity: 1 
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 25,
                          duration: 0.5
                        }}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '16px',
                          marginTop: '-1rem'
                        }}
                      >
            <TextField
              fullWidth
                          type={showPassword ? "text" : "password"}
                          placeholder="kata sandi baru"
              name="password"
              value={form.password}
              onChange={handleChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                                <Box
                                  component="button"
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setShowPassword(!showPassword);
                                  }}
                                  sx={{
                                    background: 'none',
                                    border: 'none',
                                    padding: 0,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center'
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
                              '& fieldset': { border: 'none' }
                            }
              }}
            />
            <TextField
              fullWidth
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="konfirmasi kata sandi"
              name="confirm"
              value={form.confirm}
              onChange={handleChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                                <Box
                                  component="button"
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setShowConfirmPassword(!showConfirmPassword);
                                  }}
                                  sx={{
                                    background: 'none',
                                    border: 'none',
                                    padding: 0,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}
                                >
                                  <Box
                                    component="img"
                                    src={showConfirmPassword 
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
                              '& fieldset': { border: 'none' }
                            }
              }}
            />
                      </motion.div>
                    )}
                  </motion.div>

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
                      mt: 3,
                      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
                      '&:hover': {
                        background: '#1565C0'
                      }
              }}
            >
                    KIRIM
            </Button>
          </Box>
              </motion.div>
            </motion.div>
          </AnimatePresence>
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

export default ResetPassword; 