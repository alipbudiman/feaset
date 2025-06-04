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
    const checkAuth = () => {
      const token = sessionStorage.getItem('token');
      if (token) {
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, logout }}>
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
    </AuthContext.Provider>
  );
};

export default App;