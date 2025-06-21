import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login/Login';
import ResetPassword from './pages/Login/ResetPassword';
import ResetSuccess from './pages/Login/ResetSuccess';
import { useEffect, useState } from 'react';
import Dashboard from './pages/Dashboard/Dashboard';
import { ListPinjamProvider } from './context/ListPinjamContext';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/useAuth';
import { apiService } from './utils/apiService';

const AppContent = () => {
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [healthStatus, setHealthStatus] = useState<string>('Checking API status...');

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Perform health check in the background
        console.log('🔍 Checking API health...');
        setHealthStatus('Checking API connection...');
        
        const healthResponse = await apiService.healthCheck();
        
        if (healthResponse.ok) {
          const healthData = await healthResponse.json();
          console.log('✅ API health check successful:', healthData);
          setHealthStatus('API connection successful ✅');
        } else {
          console.warn('⚠️ API health check failed:', healthResponse.status);
          setHealthStatus('API connection warning ⚠️');
        }
      } catch (error) {
        console.warn('⚠️ API health check error:', error);
        setHealthStatus('API connection failed ❌');
        // Don't block the app if health check fails
      }

      // Small delay to show the health status
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    };

    initializeApp();
  }, []);

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        gap: '20px'
      }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
          Metamedia Assets Management
        </div>
        <div style={{ fontSize: '16px', color: '#666' }}>
          {healthStatus}
        </div>
        <div style={{ 
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #3498db',
          borderRadius: '50%',
          width: '30px',
          height: '30px',
          animation: 'spin 1s linear infinite'
        }}>
        </div>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }
  return (
    <ListPinjamProvider>
      <Toaster position="top-right" />
        <Routes>
            {/* Root route - redirect berdasarkan auth status */}
            <Route 
              path="/" 
              element={
                <Navigate to={isAuthenticated ? "/dashboard/peminjaman" : "/login"} replace />
              } 
            />            {/* Login route - redirect ke dashboard/peminjaman jika sudah auth */}
            <Route 
              path="/login" 
              element={
                isAuthenticated ? 
                  <Navigate to="/dashboard/peminjaman" replace /> : 
                  <Login />
              } 
            />

            {/* Dashboard routes - protected by auth */}
            <Route
              path="/dashboard/*"
              element={
                isAuthenticated ? 
                  <Dashboard /> : 
                  <Navigate to="/login" replace />
              }
            />            {/* Public routes */}
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/reset-success" element={<ResetSuccess />} />
          </Routes>
      </ListPinjamProvider>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;