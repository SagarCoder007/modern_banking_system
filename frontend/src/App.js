import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import { theme } from './styles/theme';
import ProtectedRoute from './components/ProtectedRoute';

// Pages (we'll create these next)
import LoginPage from './pages/LoginPage';
import CustomerDashboard from './pages/CustomerDashboard';
import BankerDashboard from './pages/BankerDashboard';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              
              {/* Protected Customer Routes */}
              <Route 
                path="/customer/dashboard" 
                element={
                  <ProtectedRoute requiredRole="customer">
                    <CustomerDashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Protected Banker Routes */}
              <Route 
                path="/banker/dashboard" 
                element={
                  <ProtectedRoute requiredRole="banker">
                    <BankerDashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
