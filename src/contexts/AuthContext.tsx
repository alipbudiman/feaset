import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../utils/apiService';

interface AuthContextType {
  isAuthenticated: boolean;
  userRole: string | null;
  login: (token: string, role: string) => void;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();

  const checkAuth = async () => {
    const token = sessionStorage.getItem('token');
    const savedRole = sessionStorage.getItem('userRole');

    if (!token) {
      return false;
    }    try {
      const response = await apiService.get('/user/get_account');

      if (response.ok) {
        const userData = await response.json();
        setIsAuthenticated(true);
        setUserRole(userData.role || savedRole || 'user');
        return true;
      } else {
        // Token tidak valid, hapus dari session
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('userRole');
        setIsAuthenticated(false);
        setUserRole(null);
        return false;
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      return false;
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = (token: string, role: string) => {
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('userRole', role);
    setIsAuthenticated(true);
    setUserRole(role);
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userRole');
    setIsAuthenticated(false);
    setUserRole(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userRole, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 