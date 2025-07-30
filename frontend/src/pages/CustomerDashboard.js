import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Grid,
  Card,
  CardContent,
  Alert,
  Snackbar,
  Fab,
  Chip,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  Logout,
  AccountBalance,
  TrendingUp,
  TrendingDown,
  Refresh,
  Add,
  Remove,
  Assessment,
  Receipt
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { apiService, utils } from '../services/api';
import { bankingStyles } from '../styles/theme';
import TransactionModal from '../components/TransactionModal';
import TransactionTable from '../components/TransactionTable';

const CustomerDashboard = () => {
  const { user, logout } = useAuth();
  
  // State management
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('deposit');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [summary, setSummary] = useState(null);

  // Load dashboard data
  const loadDashboardData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      
      const [balanceResult, transactionsResult, summaryResult] = await Promise.all([
        apiService.customer.getBalance(),
        apiService.customer.getTransactions({ limit: 100 }),
        apiService.customer.getAccountSummary(30)
      ]);

      if (balanceResult.success) {
        setBalance(balanceResult.data.balance);
      }

      if (transactionsResult.success) {
        setTransactions(transactionsResult.data.transactions || []);
      }

      if (summaryResult.success) {
        setSummary(summaryResult.data);
      }

    } catch (error) {
      showSnackbar('Error loading dashboard data', 'error');
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const handleRefresh = () => {
    loadDashboardData(true);
  };

  const openTransactionModal = (type) => {
    setModalType(type);
    setModalOpen(true);
  };

  const closeTransactionModal = () => {
    setModalOpen(false);
  };

  const handleTransaction = async (amount, description) => {
    try {
      const isDeposit = modalType === 'deposit';
      const result = isDeposit 
        ? await apiService.customer.deposit(amount, description)
        : await apiService.customer.withdraw(amount, description);

      if (result.success) {
        showSnackbar(
          `${isDeposit ? 'Deposit' : 'Withdrawal'} of ${utils.formatCurrency(amount)} successful!`,
          'success'
        );
        
        // Refresh dashboard data
        await loadDashboardData();
        return { success: true };
      } else {
        return { success: false, message: result.message };
      }
    } catch (error) {
      return { success: false, message: utils.handleApiError(error) };
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box>
        <AppBar position="static">
          <Toolbar>
            <AccountBalance sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Banking System - Customer Portal
            </Typography>
          </Toolbar>
        </AppBar>
        <LinearProgress />
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <Typography variant="h6">Loading your dashboard...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', backgroundColor: 'grey.50' }}>
      {/* Header */}
      <AppBar position="static">
        <Toolbar>
          <AccountBalance sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Banking System - Customer Portal
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            Welcome, {user?.first_name} {user?.last_name}
          </Typography>
          <IconButton color="inherit" onClick={handleRefresh} disabled={refreshing}>
            <Refresh />
          </IconButton>
          <IconButton color="inherit" onClick={handleLogout}>
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      {refreshing && <LinearProgress />}

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          
          {/* Balance Card */}
          <Grid item xs={12} md={6}>
            <Card elevation={8} sx={{ borderRadius: 4 }}>
              <CardContent sx={bankingStyles.balanceCard}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="h6" fontWeight="bold">
                    Account Balance
                  </Typography>
                  <AccountBalance fontSize="large" />
                </Box>
                <Typography variant="h3" fontWeight="bold" mb={1}>
                  {utils.formatCurrency(balance)}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Available Balance
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12} md={6}>
            <Card elevation={3} sx={{ borderRadius: 4, height: '100%' }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Quick Actions
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      startIcon={<TrendingUp />}
                      onClick={() => openTransactionModal('deposit')}
                      sx={bankingStyles.depositButton}
                    >
                      Deposit
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      startIcon={<TrendingDown />}
                      onClick={() => openTransactionModal('withdraw')}
                      sx={bankingStyles.withdrawButton}
                    >
                      Withdraw
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Account Summary */}
          {summary && (
            <Grid item xs={12}>
              <Card elevation={3} sx={{ borderRadius: 4 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom display="flex" alignItems="center" gap={1}>
                    <Assessment />
                    30-Day Account Summary
                  </Typography>
                  <Grid container spacing={3} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={4}>
                      <Box sx={bankingStyles.statsCard}>
                        <Typography variant="h4" color="success.main" fontWeight="bold">
                          {summary.total_deposits || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Deposits
                        </Typography>
                        <Typography variant="h6" color="success.main">
                          {utils.formatCurrency(summary.total_deposit_amount || 0)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Box sx={bankingStyles.statsCard}>
                        <Typography variant="h4" color="error.main" fontWeight="bold">
                          {summary.total_withdrawals || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Withdrawals
                        </Typography>
                        <Typography variant="h6" color="error.main">
                          {utils.formatCurrency(summary.total_withdrawal_amount || 0)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Box sx={bankingStyles.statsCard}>
                        <Typography variant="h4" color="primary.main" fontWeight="bold">
                          {summary.total_transactions || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Transactions
                        </Typography>
                        <Typography variant="h6" color="primary.main">
                          This Month
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Transaction History */}
          <Grid item xs={12}>
            <TransactionTable 
              transactions={transactions} 
              loading={false}
            />
          </Grid>
        </Grid>
      </Container>

      {/* Floating Action Buttons */}
      <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
        <Fab
          color="success"
          sx={{ mr: 1, ...bankingStyles.depositButton }}
          onClick={() => openTransactionModal('deposit')}
        >
          <Add />
        </Fab>
        <Fab
          color="error"
          sx={bankingStyles.withdrawButton}
          onClick={() => openTransactionModal('withdraw')}
        >
          <Remove />
        </Fab>
      </Box>

      {/* Transaction Modal */}
      <TransactionModal
        open={modalOpen}
        onClose={closeTransactionModal}
        type={modalType}
        currentBalance={balance}
        onTransactionComplete={handleTransaction}
      />

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CustomerDashboard; 