import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  IconButton,
  InputAdornment,
  Tabs,
  Tab,
  Container,
  CircularProgress,
  Fade,
  Paper
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  AccountBalance,
  Person,
  BusinessCenter
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [tab, setTab] = useState(0); // 0 for Customer, 1 for Banker
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectTo = user.role === 'customer' ? '/customer/dashboard' : '/banker/dashboard';
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
    setError('');
    setFormData({ username: '', password: '' });
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    console.log('🔄 Frontend: Form submitted - preventing default');
    
    // Prevent form submission (React synthetic events)
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      // Note: stopImmediatePropagation is not available in React synthetic events
    }
    
    // Use the same login logic
    return await performLogin();
  };

  const fillDemoCredentials = () => {
    if (tab === 0) {
      // Customer demo credentials
      setFormData({
        username: 'customer1',
        password: 'password123'
      });
    } else {
      // Banker demo credentials
      setFormData({
        username: 'banker1',
        password: 'password123'
      });
    }
    setError('');
  };

  // Alternative login handler that bypasses form submission
  const handleLoginClick = async (e) => {
    console.log('🖱️  Frontend: Direct login button clicked');
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Perform login without form submission
    await performLogin();
  };

  // Extracted login logic without form event dependency
  const performLogin = async () => {
    console.log('🔄 Frontend: Performing login...');
    console.log('🔄 Frontend: Current URL before login attempt:', window.location.href);
    
    // Additional validation
    if (!formData.username || !formData.password) {
      console.log('❌ Frontend: Validation failed - empty fields');
      setError('Please fill in all fields');
      setLoading(false);
      return false;
    }

    if (formData.username.trim().length < 3) {
      console.log('❌ Frontend: Validation failed - username too short');
      setError('Username must be at least 3 characters');
      setLoading(false);
      return false;
    }

    if (formData.password.length < 6) {
      console.log('❌ Frontend: Validation failed - password too short');
      setError('Password must be at least 6 characters');
      setLoading(false);
      return false;
    }

    console.log('📤 Frontend: Making login request with:', { 
      username: formData.username.trim(), 
      passwordLength: formData.password.length 
    });

    setLoading(true);
    setError('');

    try {
      const result = await login({
        username: formData.username.trim(),
        password: formData.password
      });
      console.log('📥 Frontend: Login response:', result);
      console.log('📍 Frontend: Current URL after login response:', window.location.href);
      
      if (result.success && result.user) {
        console.log('✅ Frontend: Login successful, redirecting user:', result.user.username);
        // Successful login - redirect based on role
        const redirectTo = result.user.role === 'customer' 
          ? '/customer/dashboard' 
          : '/banker/dashboard';
        
        console.log('🔄 Frontend: Navigating to:', redirectTo);
        // Small delay to ensure state is updated
        setTimeout(() => {
          navigate(redirectTo, { replace: true });
        }, 100);
      } else {
        console.log('❌ Frontend: Login failed with message:', result.message);
        console.log('❌ Frontend: Staying on login page, setting error message');
        setError(result.message || 'Invalid username or password');
        setLoading(false);
        
        // Explicitly prevent any navigation
        console.log('🛑 Frontend: Preventing any page refresh or navigation');
        return false;
      }
    } catch (error) {
      console.error('❌ Frontend: Login error:', error);
      console.log('❌ Frontend: Handling login error, staying on page');
      setError('Connection error. Please check your internet and try again.');
      setLoading(false);
      
      // Explicitly prevent any navigation
      console.log('🛑 Frontend: Preventing any page refresh or navigation due to error');
      return false;
    } finally {
      console.log('🏁 Frontend: Login attempt completed');
      console.log('📍 Frontend: Final URL:', window.location.href);
    }
    
    return true;
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 50%, #64b5f6 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2
      }}
    >
      <Container maxWidth="sm">
        <Fade in={true} timeout={1000}>
          <Paper
            elevation={24}
            sx={{
              borderRadius: 4,
              overflow: 'hidden',
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)'
            }}
          >
            {/* Header */}
            <Box
              sx={{
                background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                color: 'white',
                padding: 4,
                textAlign: 'center'
              }}
            >
              <AccountBalance sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Banking System
              </Typography>
              <Typography variant="subtitle1" opacity={0.9}>
                Secure Access Portal
              </Typography>
            </Box>

            <CardContent sx={{ padding: 4 }}>
              {/* Role Selection Tabs */}
              <Tabs
                value={tab}
                onChange={handleTabChange}
                centered
                sx={{ mb: 3 }}
                TabIndicatorProps={{
                  style: { height: 3, borderRadius: 3 }
                }}
              >
                <Tab
                  icon={<Person />}
                  label="Customer Login"
                  iconPosition="start"
                  sx={{ 
                    minHeight: 48,
                    fontWeight: 500,
                    '&.Mui-selected': { color: 'primary.main' }
                  }}
                />
                <Tab
                  icon={<BusinessCenter />}
                  label="Banker Login"
                  iconPosition="start"
                  sx={{ 
                    minHeight: 48,
                    fontWeight: 500,
                    '&.Mui-selected': { color: 'primary.main' }
                  }}
                />
              </Tabs>

              {/* Login Form - Using div instead of form to prevent any submission */}
              <div>
                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}

                <TextField
                  fullWidth
                  label="Username or Email"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  margin="normal"
                  variant="outlined"
                  required
                  autoComplete="username"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person color="action" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      console.log('⌨️  Frontend: Enter key pressed');
                      e.preventDefault();
                      handleLoginClick(e);
                    }
                  }}
                  margin="normal"
                  variant="outlined"
                  required
                  autoComplete="current-password"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  type="button"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  onClick={handleLoginClick}
                  sx={{
                    mt: 3,
                    mb: 2,
                    height: 48,
                    background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
                    }
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    `Login as ${tab === 0 ? 'Customer' : 'Banker'}`
                  )}
                </Button>

                {/* Demo Credentials Button */}
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={fillDemoCredentials}
                  sx={{ mb: 2 }}
                >
                  Use Demo Credentials
                </Button>

                {/* Test Credentials Info */}
                <Box
                  sx={{
                    mt: 3,
                    p: 2,
                    backgroundColor: 'grey.50',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'grey.200'
                  }}
                >
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Test Credentials:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {tab === 0 ? (
                      <>
                        <strong>Customer:</strong> customer1 / password123<br />
                        <strong>Features:</strong> View balance, deposit, withdraw, transaction history
                      </>
                    ) : (
                      <>
                        <strong>Banker:</strong> banker1 / password123<br />
                        <strong>Features:</strong> View all accounts, customer management, transaction oversight
                      </>
                    )}
                  </Typography>
                </Box>
              </div>
            </CardContent>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default LoginPage; 