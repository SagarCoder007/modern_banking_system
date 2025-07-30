const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

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

// Test database connection on startup
const { testConnection } = require('./config/database');
testConnection();

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/customer', require('./routes/customerRoutes'));
app.use('/api/banker', require('./routes/bankerRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));

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
}); 