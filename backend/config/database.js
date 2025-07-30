const mysql = require('mysql2/promise');
const { Pool } = require('pg');
require('dotenv').config();

// Determine database type based on environment
const isPostgreSQL = process.env.NODE_ENV === 'production' || process.env.DB_TYPE === 'postgresql';

let pool;

if (isPostgreSQL) {
  // PostgreSQL configuration for production (Render)
  pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
} else {
  // MySQL configuration for local development
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bank',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };
  pool = mysql.createPool(dbConfig);
}

// Unified query interface
const query = async (text, params = []) => {
  if (isPostgreSQL) {
    const client = await pool.connect();
    try {
      const result = await client.query(text, params);
      return [result.rows];
    } finally {
      client.release();
    }
  } else {
    return await pool.execute(text, params);
  }
};

// Test database connection
const testConnection = async () => {
  try {
    if (isPostgreSQL) {
      const client = await pool.connect();
      console.log('✅ PostgreSQL Database connected successfully');
      client.release();
    } else {
      const connection = await pool.getConnection();
      console.log('✅ MySQL Database connected successfully');
      connection.release();
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
};

module.exports = {
  pool,
  query,
  testConnection,
  isPostgreSQL
}; 