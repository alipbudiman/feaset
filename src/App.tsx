import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login/Login';
import ResetPassword from './pages/Login/ResetPassword';
import ResetSuccess from './pages/Login/ResetSuccess';
import { useEffect, useState, createContext, useContext } from 'react';
import Dashboard from './pages/Dashboard/Dashboard';
import { ListPinjamProvider } from './context/ListPinjamContext';

// Buat context untuk autentikasi
export const AuthContext = createContext<{
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
  logout: () => void;
}>({
  isAuthenticated: false,
  setIsAuthenticated: () => {},
  logout: () => {}
});

// Hook untuk menggunakan auth context
export const useAuth = () => useContext(AuthContext);

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  const logout = () => {
    // Hapus semua data sesi
    sessionStorage.clear();
    // Update state autentikasi
    setIsAuthenticated(false);
  };
  useEffect(() => {
    console.log('App useEffect running...');
    const checkAuth = () => {
      const token = sessionStorage.getItem('token');
      console.log('Token check:', token);
      if (token) {
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  console.log('App render - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated);

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }
  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, logout }}>
      <div>
        {/* Debug info */}
        <div style={{ position: 'fixed', top: 0, left: 0, background: 'red', color: 'white', padding: '5px', zIndex: 9999 }}>
          Debug: Auth={isAuthenticated.toString()} Loading={isLoading.toString()}
        </div>
        
        <ListPinjamProvider>
          <BrowserRouter>
            <Toaster position="top-right" />
            <Routes>
              {/* Root route - redirect berdasarkan auth status */}
              <Route 
                path="/" 
                element={
                  <Navigate to={isAuthenticated ? "/dashboard/peminjaman" : "/login"} replace />
                } 
              />

              {/* Login route - redirect ke dashboard/peminjaman jika sudah auth */}
              <Route 
                path="/login" 
                element={
                  isAuthenticated ? 
                    <Navigate to="/dashboard/peminjaman" replace /> : 
                    <Login setIsAuthenticated={setIsAuthenticated} />
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
              />

              {/* Public routes */}
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/reset-success" element={<ResetSuccess />} />
            </Routes>
          </BrowserRouter>
        </ListPinjamProvider>
      </div>
    </AuthContext.Provider>
  );
};

export default App;