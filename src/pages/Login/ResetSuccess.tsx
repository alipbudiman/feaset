import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const ResetSuccess = () => {
  const navigate = useNavigate();
  
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
      >        <Box
          component="img"
          src="/assets/Rectangle/Rectangle 6.png"
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
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
              duration: 0.5
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
                mb: 2,
                mt: 15
              }}
            >
              SELAMAT DATANG
            </Typography>

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2
              }}
            >
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                  delay: 0.2
                }}
              >
                <Button
                  onClick={() => navigate('/')}
                  sx={{
                    width: '282px',
                    height: '36px',
                    background: '#1984FF',
                    color: '#000000',
                    borderRadius: '10px',
                    textTransform: 'none',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    '&:hover': {
                      background: '#1565C0'
                    }
                  }}
                >
                  Kembali untuk Masuk
                </Button>
              </motion.div>
            </Box>
          </motion.div>
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
      >        <Box
          component="img"
          src="/assets/Rectangle/Rectangle 8.png"
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
          </Typography>          <Box
            component="img"
            src="/assets/form login dan forgot dan animasi/solar_library-bold.png"
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

export default ResetSuccess; 