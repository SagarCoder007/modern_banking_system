const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
}

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
const { testConnection, isPostgreSQL } = require('./config/database');
testConnection();

// Initialize database schema for PostgreSQL in production
if (isPostgreSQL && process.env.NODE_ENV === 'production') {
  console.log('🔄 Initializing PostgreSQL database for production...');
  const { initializeDatabase } = require('./scripts/init-db');
  
  // Initialize database before starting server
  initializeDatabase()
    .then(() => {
      console.log('✅ Database initialization completed successfully');
    })
    .catch(error => {
      console.error('❌ Database initialization failed:', error.message);
      console.log('🔄 Server will continue - tables might already exist');
    });
}

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

// Serve React app for any non-API routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
  });
} else {
  // 404 handler for development
  app.use('*', (req, res) => {
    res.status(404).json({ message: 'API endpoint not found' });
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Banking System API running on port ${PORT}`);
  console.log(`📍 Server URL: http://localhost:${PORT}`);
}); 