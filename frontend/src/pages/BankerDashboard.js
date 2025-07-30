import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  AppBar,
  Toolbar,
  IconButton,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  LinearProgress,
  InputAdornment,
  Tabs,
  Tab,
  Avatar,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Logout,
  BusinessCenter,
  Dashboard,
  People,
  AccountBalance,
  TrendingUp,
  TrendingDown,
  Search,
  Visibility,
  MoreVert,
  PersonAdd,
  Block,
  CheckCircle,
  Assessment,
  Refresh
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { apiService, utils } from '../services/api';

const BankerDashboard = () => {
  const { user, logout } = useAuth();

  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerTransactions, setCustomerTransactions] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);

  // Load dashboard data
  const loadDashboardData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);

      const [dashboardResult, accountsResult, customersResult] = await Promise.all([
        apiService.banker.getDashboard(),
        apiService.banker.getAllAccounts(),
        apiService.banker.getAllCustomers()
      ]);

      if (dashboardResult.success) {
        setDashboardData(dashboardResult.data);
      }

      if (accountsResult.success) {
        setAccounts(accountsResult.data.accounts || []);
      }

      if (customersResult.success) {
        setCustomers(customersResult.data.customers || []);
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

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleViewCustomer = async (customer) => {
    try {
      setLoading(true);
      const result = await apiService.banker.getCustomerTransactions(customer.id);

      if (result.success) {
        setSelectedCustomer(result.data.customer);
        setCustomerTransactions(result.data.transactions || []);
        setDialogOpen(true);
      } else {
        showSnackbar('Error loading customer data', 'error');
      }
    } catch (error) {
      showSnackbar('Error loading customer data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountMenu = (event, account) => {
    setAnchorEl(event.currentTarget);
    setSelectedAccount(account);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedAccount(null);
  };

  const handleUpdateAccountStatus = async (status) => {
    try {
      const result = await apiService.banker.updateAccountStatus(
        selectedAccount.id,
        status,
        `Status changed to ${status} by banker`
      );

      if (result.success) {
        showSnackbar(`Account ${status} successfully`, 'success');
        loadDashboardData();
      } else {
        showSnackbar('Error updating account status', 'error');
      }
    } catch (error) {
      showSnackbar('Error updating account status', 'error');
    }
    handleCloseMenu();
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const filteredAccounts = accounts.filter(account =>
    account.user?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.user?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.account_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && !dashboardData) {
    return (
      <Box>
        <AppBar position="static" sx={{ background: 'linear-gradient(45deg, #2e7d32 30%, #388e3c 90%)' }}>
          <Toolbar>
            <BusinessCenter sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Banking System - Banker Portal
            </Typography>
          </Toolbar>
        </AppBar>
        <LinearProgress />
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <Typography variant="h6">Loading banker dashboard...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', backgroundColor: 'grey.50' }}>
      {/* Header */}
      <AppBar position="static" sx={{ background: 'linear-gradient(45deg, #2e7d32 30%, #388e3c 90%)' }}>
        <Toolbar>
          <BusinessCenter sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Banking System - Banker Portal
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

      {/* Navigation Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', backgroundColor: 'white' }}>
        <Container maxWidth="lg">
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab icon={<Dashboard />} label="Overview" iconPosition="start" />
            <Tab icon={<AccountBalance />} label="Accounts" iconPosition="start" />
            <Tab icon={<People />} label="Customers" iconPosition="start" />
          </Tabs>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Overview Tab */}
        {activeTab === 0 && dashboardData && (
          <Grid container spacing={3}>
            {/* Summary Cards */}
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <People sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    {dashboardData.summary?.total_customers || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Customers
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <AccountBalance sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
                  <Typography variant="h4" fontWeight="bold" color="secondary.main">
                    {dashboardData.summary?.total_accounts || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Accounts
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <TrendingUp sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {utils.formatCurrency(dashboardData.summary?.total_balance || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Balance
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Assessment sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                  <Typography variant="h4" fontWeight="bold" color="info.main">
                    {dashboardData.transaction_stats?.today_transactions || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Today's Transactions
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Recent Transactions */}
            <Grid item xs={12}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Recent Transactions
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Customer</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell>Date</TableCell>
                          <TableCell>Reference</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(dashboardData.recent_transactions || []).slice(0, 10).map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>
                              {transaction.user?.first_name} {transaction.user?.last_name}
                            </TableCell>
                            <TableCell>
                              <Chip
                                icon={transaction.type === 'deposit' ? <TrendingUp /> : <TrendingDown />}
                                label={transaction.type}
                                color={transaction.type === 'deposit' ? 'success' : 'error'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{utils.formatCurrency(transaction.amount)}</TableCell>
                            <TableCell>{utils.formatDate(transaction.created_at)}</TableCell>
                            <TableCell>{transaction.reference_number}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Accounts Tab */}
        {activeTab === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card elevation={3}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" fontWeight="bold">
                      Customer Accounts
                    </Typography>
                    <TextField
                      size="small"
                      placeholder="Search accounts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>

                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Customer</TableCell>
                          <TableCell>Account Number</TableCell>
                          <TableCell>Balance</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredAccounts.map((account) => (
                          <TableRow key={account.id}>
                            <TableCell>
                              <Box display="flex" alignItems="center">
                                <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                                  {account.user?.first_name?.[0]}{account.user?.last_name?.[0]}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" fontWeight="bold">
                                    {account.user?.first_name} {account.user?.last_name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {account.user?.username}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>{account.account_number}</TableCell>
                            <TableCell>{utils.formatCurrency(account.balance)}</TableCell>
                            <TableCell>
                              <Chip label={account.account_type} size="small" />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={account.status}
                                color={account.status === 'active' ? 'success' : 'error'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                size="small"
                                startIcon={<Visibility />}
                                onClick={() => handleViewCustomer(account.user)}
                              >
                                View
                              </Button>
                              <IconButton
                                size="small"
                                onClick={(e) => handleAccountMenu(e, account)}
                              >
                                <MoreVert />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Customers Tab */}
        {activeTab === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Customer Management
                  </Typography>
                  <Grid container spacing={2}>
                    {customers.map((customer) => (
                      <Grid item xs={12} sm={6} md={4} key={customer.id}>
                        <Card variant="outlined">
                          <CardContent>
                            <Box display="flex" alignItems="center" mb={2}>
                              <Avatar sx={{ mr: 2, bgcolor: 'secondary.main' }}>
                                {customer.first_name?.[0]}{customer.last_name?.[0]}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle1" fontWeight="bold">
                                  {customer.first_name} {customer.last_name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {customer.username}
                                </Typography>
                              </Box>
                            </Box>

                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {customer.email}
                            </Typography>

                            {customer.account && (
                              <Box mt={2}>
                                <Typography variant="body2">
                                  <strong>Account:</strong> {customer.account.account_number}
                                </Typography>
                                <Typography variant="body2">
                                  <strong>Balance:</strong> {utils.formatCurrency(customer.account.balance)}
                                </Typography>
                              </Box>
                            )}

                            <Button
                              fullWidth
                              variant="outlined"
                              size="small"
                              startIcon={<Visibility />}
                              onClick={() => handleViewCustomer(customer)}
                              sx={{ mt: 2 }}
                            >
                              View Transactions
                            </Button>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Container>

      {/* Customer Details Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Customer Transaction History
          {selectedCustomer && (
            <Typography variant="subtitle2" color="text.secondary">
              {selectedCustomer.first_name} {selectedCustomer.last_name} ({selectedCustomer.username})
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {selectedCustomer && (
            <Box>
              <Grid container spacing={2} mb={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Email:</strong> {selectedCustomer.email}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Phone:</strong> {selectedCustomer.phone || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Account:</strong> {selectedCustomer.account?.account_number}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Balance:</strong> {utils.formatCurrency(selectedCustomer.account?.balance || 0)}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ mb: 2 }} />

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Balance After</TableCell>
                      <TableCell>Reference</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {customerTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{utils.formatDate(transaction.created_at)}</TableCell>
                        <TableCell>
                          <Chip
                            icon={transaction.type === 'deposit' ? <TrendingUp /> : <TrendingDown />}
                            label={transaction.type}
                            color={transaction.type === 'deposit' ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{utils.formatCurrency(transaction.amount)}</TableCell>
                        <TableCell>{utils.formatCurrency(transaction.balance_after)}</TableCell>
                        <TableCell>{transaction.reference_number}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Account Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={() => handleUpdateAccountStatus('active')}>
          <ListItemIcon>
            <CheckCircle fontSize="small" color="success" />
          </ListItemIcon>
          <ListItemText>Activate Account</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleUpdateAccountStatus('suspended')}>
          <ListItemIcon>
            <Block fontSize="small" color="warning" />
          </ListItemIcon>
          <ListItemText>Suspend Account</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleUpdateAccountStatus('inactive')}>
          <ListItemIcon>
            <Block fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Deactivate Account</ListItemText>
        </MenuItem>
      </Menu>

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

export default BankerDashboard; 