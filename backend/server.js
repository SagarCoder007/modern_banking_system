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

// Function to insert demo data
async function insertDemoData() {
  const { Pool } = require('pg');
  const bcrypt = require('bcryptjs');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    // Generate hash for password123
    const passwordHash = await bcrypt.hash('password123', 12);
    console.log('🔐 Generated password hash for demo users');
    
    // Insert demo users with fresh hash
    await pool.query(`
      INSERT INTO users (username, email, password, role, first_name, last_name, phone) VALUES
      ('banker1', 'banker@bank.com', $1, 'banker', 'John', 'Banker', '1234567890'),
      ('customer1', 'alice@email.com', $1, 'customer', 'Alice', 'Johnson', '1234567891'),
      ('customer2', 'bob@email.com', $1, 'customer', 'Bob', 'Smith', '1234567892'),
      ('customer3', 'carol@email.com', $1, 'customer', 'Carol', 'Davis', '1234567893')
      ON CONFLICT (username) DO NOTHING
    `, [passwordHash]);
    console.log('✅ Demo users inserted with fresh password hash');

    // Insert demo accounts
    await pool.query(`
      INSERT INTO accounts (user_id, account_number, balance, account_type) VALUES
      (2, 'ACC001000001', 5000.00, 'savings'),
      (3, 'ACC001000002', 3500.50, 'checking'),
      (4, 'ACC001000003', 10000.75, 'savings')
      ON CONFLICT (account_number) DO NOTHING
    `);
    console.log('✅ Demo accounts inserted');

  } catch (error) {
    console.error('⚠️  Demo data insertion failed:', error.message);
    // Don't throw - continue even if demo data fails
  } finally {
    await pool.end();
  }
}

// Initialize database schema for PostgreSQL in production
if (isPostgreSQL && process.env.NODE_ENV === 'production') {
  console.log('🔄 Initializing PostgreSQL database for production...');
  const { initializeDatabase } = require('./scripts/init-db');
  
  // Initialize database before starting server
  initializeDatabase()
    .then(() => {
      console.log('✅ Database initialization completed successfully');
      
      // Insert demo data after schema creation
      console.log('🌱 Inserting demo users and accounts...');
      return insertDemoData();
    })
    .then(() => {
      console.log('✅ Demo data insertion completed successfully');
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
app.use('/api/admin', require('./routes/adminRoutes'));

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