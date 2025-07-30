const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test database connection
const { testConnection } = require('./config/database');

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Banking System API is running!',
    version: '1.0.0',
    status: 'Phase 3 Complete - Backend MVC Architecture Ready!'
  });
});

// Simple auth routes
app.post('/api/auth/login', async (req, res) => {
  const AuthController = require('./controllers/AuthController');
  await AuthController.login(req, res);
});

app.get('/api/auth/verify', async (req, res) => {
  const { authenticateToken } = require('./middleware/auth');
  authenticateToken(req, res, async () => {
    const AuthController = require('./controllers/AuthController');
    await AuthController.verify(req, res);
  });
});

// Simple customer routes
app.get('/api/customer/balance', async (req, res) => {
  const { authenticateToken, requireRole } = require('./middleware/auth');
  authenticateToken(req, res, () => {
    requireRole('customer')(req, res, async () => {
      const CustomerController = require('./controllers/CustomerController');
      await CustomerController.getBalance(req, res);
    });
  });
});

app.post('/api/customer/deposit', async (req, res) => {
  const { authenticateToken, requireRole } = require('./middleware/auth');
  authenticateToken(req, res, () => {
    requireRole('customer')(req, res, async () => {
      const CustomerController = require('./controllers/CustomerController');
      await CustomerController.deposit(req, res);
    });
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.use('*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Banking System API running on port ${PORT}`);
  console.log(`📍 Server URL: http://localhost:${PORT}`);
  console.log('✅ Phase 3 Backend Development Complete!');
  testConnection();
});