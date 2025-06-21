import { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../utils/apiService';

interface UserData {
  username: string;
  full_name: string;
  address: string;
  phone_number: string;
  role: string;
  email?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  userRole: string | null;
  userData: UserData | null;
  login: (token: string, role: string) => void;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  fetchUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export { AuthContext };

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const navigate = useNavigate();

  const fetchUserData = useCallback(async () => {
    try {
      console.log('Fetching user data...');
      const response = await apiService.getUserAccount();
      console.log('User data response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('User data response:', data);
        
        // Handle the API response structure - direct user object
        if (data.username) {
          const normalizedUserData: UserData = {
            username: data.username,
            full_name: data.full_name,
            address: data.address || '',
            phone_number: data.phone_number || '',
            role: data.role,
            email: data.email
          };
          setUserData(normalizedUserData);
          console.log('User data set:', normalizedUserData);
        } else {
          console.log('Unexpected user data structure:', data);
        }
      } else {
        console.error('Failed to fetch user data:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    const token = sessionStorage.getItem('token');
    const savedRole = sessionStorage.getItem('userRole');

    if (!token) {
      return false;
    }

    try {
      console.log('🔍 AuthContext.checkAuth: About to call apiService.get with endpoint: /user/get_account');
      const response = await apiService.get('/user/get_account');

      if (response.ok) {
        const userData = await response.json();
        console.log('User data response during auth check:', userData);
        
        if (userData.username) {
          setIsAuthenticated(true);
          const userRole = userData.role || savedRole || 'user';
          setUserRole(userRole);
          console.log('Auth check successful, role:', userRole);
          
          // Update user data in context with correct structure
          const normalizedUserData: UserData = {
            username: userData.username,
            full_name: userData.full_name,
            address: userData.address || '',
            phone_number: userData.phone_number || '',
            role: userData.role,
            email: userData.email
          };
          setUserData(normalizedUserData);
          
          return true;
        } else {
          throw new Error('Invalid user data response');
        }
      } else {
        // Token tidak valid, hapus dari session
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('userRole');
        setIsAuthenticated(false);
        setUserRole(null);
        setUserData(null);
        return false;
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      
      // If network error or other issues, but we have a saved role,
      // we can temporarily allow the user to stay authenticated
      if (savedRole && token) {
        console.log('Using saved session data as fallback');
        setIsAuthenticated(true);
        setUserRole(savedRole);
        
        // Try to fetch user data in background
        fetchUserData().catch(err => {
          console.log('Background user data fetch failed:', err);
        });
        
        return true;
      }
      
      // If no fallback data, clear everything
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('userRole');
      setIsAuthenticated(false);
      setUserRole(null);
      setUserData(null);
      return false;
    }
  }, [fetchUserData]);

  useEffect(() => {
    const initAuth = async () => {
      const token = sessionStorage.getItem('token');
      const savedRole = sessionStorage.getItem('userRole');
      
      console.log('Initializing auth, token exists:', !!token, 'saved role:', savedRole);
      
      if (token) {
        // If we have a token, try to verify it by fetching user data
        const isValid = await checkAuth();
        if (isValid) {
          // If token is valid, also fetch complete user data
          await fetchUserData();
        }
      } else {
        console.log('No token found, user is not authenticated');
      }
    };
    initAuth();
  }, [checkAuth, fetchUserData]);

  const login = (token: string, role: string) => {
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('userRole', role);
    setIsAuthenticated(true);
    setUserRole(role);
    // Fetch user data after login
    fetchUserData();
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userRole');
    setIsAuthenticated(false);
    setUserRole(null);
    setUserData(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userRole, userData, login, logout, checkAuth, fetchUserData }}>
      {children}
    </AuthContext.Provider>
  );
};
