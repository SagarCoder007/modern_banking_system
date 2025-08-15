import axios from 'axios';

// Security utilities (optional import to prevent errors)
let securityHeaders = { getSecurityHeaders: () => ({}) };
try {
  const securityUtils = require('../utils/security');
  securityHeaders = securityUtils.securityHeaders || securityHeaders;
} catch (error) {
  console.log('Security utilities not available, using defaults');
}

// API Base Configuration - supports unified deployment
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api');

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    ...securityHeaders.getSecurityHeaders()
  },
  timeout: 10000, // 10 second timeout
});

// Token management utilities
const getToken = () => localStorage.getItem('banking_token');
const setToken = (token) => localStorage.setItem('banking_token', token);
const removeToken = () => localStorage.removeItem('banking_token');

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Enhanced error handling
    if (error.response?.status === 401) {
      // Token expired or invalid
      removeToken();
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      // Forbidden - insufficient permissions
      console.error('Access denied:', error.response.data.message);
    } else if (error.response?.status === 429) {
      // Rate limited
      console.error('Rate limited:', error.response.data.message);
    } else if (error.response?.status >= 500) {
      // Server error
      console.error('Server error:', error.response.data.message);
    }
    return Promise.reject(error);
  }
);

// API Services
export const apiService = {
  // Authentication APIs
  auth: {
    login: async (credentials) => {
      console.log('🌐 API: Making login request to:', `${API_BASE_URL}/auth/login`);
      console.log('📤 API: Request payload:', { 
        username: credentials.username, 
        passwordLength: credentials.password?.length 
      });
      
      const response = await api.post('/auth/login', credentials);
      console.log('📥 API: Response status:', response.status);
      console.log('📥 API: Response data:', response.data);
      
      if (response.data.success && response.data.data.token) {
        console.log('🔐 API: Setting token in localStorage');
        setToken(response.data.data.token.token);
      }
      return response.data;
    },
    
    logout: async () => {
      try {
        await api.post('/auth/logout');
      } finally {
        removeToken();
      }
    },
    
    verify: async () => {
      const response = await api.get('/auth/verify');
      return response.data;
    },
    
    getProfile: async () => {
      const response = await api.get('/auth/profile');
      return response.data;
    },
    
    updateProfile: async (profileData) => {
      const response = await api.put('/auth/profile', profileData);
      return response.data;
    },
    
    changePassword: async (passwordData) => {
      const response = await api.post('/auth/change-password', passwordData);
      return response.data;
    }
  },

  // Customer APIs
  customer: {
    getTransactions: async (params = {}) => {
      const response = await api.get('/customer/transactions', { params });
      return response.data;
    },
    
    deposit: async (amount, description) => {
      const response = await api.post('/customer/deposit', { amount, description });
      return response.data;
    },
    
    withdraw: async (amount, description) => {
      const response = await api.post('/customer/withdraw', { amount, description });
      return response.data;
    },
    
    getBalance: async () => {
      const response = await api.get('/customer/balance');
      return response.data;
    },
    
    getAccountSummary: async (days = 30) => {
      const response = await api.get('/customer/account-summary', { params: { days } });
      return response.data;
    },
    
    getTransactionByReference: async (referenceNumber) => {
      const response = await api.get(`/customer/transaction/${referenceNumber}`);
      return response.data;
    }
  },

  // Banker APIs
  banker: {
    getDashboard: async () => {
      const response = await api.get('/banker/dashboard');
      return response.data;
    },
    
    getAllAccounts: async (params = {}) => {
      const response = await api.get('/banker/accounts', { params });
      return response.data;
    },
    
    getAllCustomers: async (params = {}) => {
      const response = await api.get('/banker/customers', { params });
      return response.data;
    },
    
    getCustomerTransactions: async (customerId, params = {}) => {
      const response = await api.get(`/banker/customer/${customerId}/transactions`, { params });
      return response.data;
    },
    
    searchCustomers: async (query, type = 'all') => {
      const response = await api.get('/banker/search/customers', { 
        params: { query, type } 
      });
      return response.data;
    },
    
    updateAccountStatus: async (accountId, status, reason) => {
      const response = await api.put(`/banker/account/${accountId}/status`, { status, reason });
      return response.data;
    }
  }
};

// Utility functions
export const utils = {
  isAuthenticated: () => !!getToken(),
  getToken,
  setToken,
  removeToken,
  
  formatCurrency: (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  },
  
  formatDate: (date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  },
  
  handleApiError: (error) => {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    return 'An unexpected error occurred. Please try again.';
  }
};

export default api; 