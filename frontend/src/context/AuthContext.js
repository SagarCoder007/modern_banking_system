import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService, utils } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (utils.isAuthenticated()) {
          const response = await apiService.auth.verify();
          if (response.success) {
            setUser(response.data.user);
            setIsAuthenticated(true);
          } else {
            utils.removeToken();
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        utils.removeToken();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      console.log('🔐 AuthContext: Starting login process');
      setLoading(true);
      const response = await apiService.auth.login(credentials);
      console.log('🔐 AuthContext: API response received:', response);
      
      if (response.success && response.data.user) {
        console.log('✅ AuthContext: Login successful, setting user state');
        // Set user data and authentication state
        setUser(response.data.user);
        setIsAuthenticated(true);
        
        console.log('✅ AuthContext: Returning success response');
        return { 
          success: true, 
          user: response.data.user,
          role: response.data.user.role 
        };
      } else {
        console.log('❌ AuthContext: Login failed, returning error response');
        return { 
          success: false, 
          message: response.message || 'Login failed' 
        };
      }
    } catch (error) {
      console.error('❌ AuthContext: Login error caught:', error);
      return { 
        success: false, 
        message: utils.handleApiError(error) 
      };
    } finally {
      console.log('🏁 AuthContext: Login process completed, setting loading to false');
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiService.auth.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      utils.removeToken();
    }
  };

  const updateUser = (userData) => {
    setUser(prev => ({ ...prev, ...userData }));
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    updateUser,
    isCustomer: user?.role === 'customer',
    isBanker: user?.role === 'banker'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 