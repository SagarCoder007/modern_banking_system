const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Banking System API is running!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      customer: '/api/customer',
      banker: '/api/banker'
    }
  });
});

// Test database connection
const { testConnection } = require('./config/database');

// Test routes one by one
try {
  console.log('Testing auth routes...');
  app.use('/api/auth', require('./routes/authRoutes'));
  console.log('✅ Auth routes loaded');
} catch (error) {
  console.error('❌ Auth routes error:', error.message);
}

try {
  console.log('Testing customer routes...');
  app.use('/api/customer', require('./routes/customerRoutes'));
  console.log('✅ Customer routes loaded');
} catch (error) {
  console.error('❌ Customer routes error:', error.message);
}

try {
  console.log('Testing banker routes...');
  app.use('/api/banker', require('./routes/bankerRoutes'));
  console.log('✅ Banker routes loaded');
} catch (error) {
  console.error('❌ Banker routes error:', error.message);
}

try {
  console.log('Testing transaction routes...');
  app.use('/api/transactions', require('./routes/transactionRoutes'));
  console.log('✅ Transaction routes loaded');
} catch (error) {
  console.error('❌ Transaction routes error:', error.message);
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.stack
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Banking System API running on port ${PORT}`);
  console.log(`📍 Server URL: http://localhost:${PORT}`);
  testConnection();
});