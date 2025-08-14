const express = require('express');
const router = express.Router();
const { initializeDatabase } = require('../scripts/init-db');

// Manual database initialization endpoint (for debugging)
router.post('/init-database', async (req, res) => {
    try {
        console.log('🔧 Manual database initialization triggered...');
        await initializeDatabase();
        
        res.json({
            success: true,
            message: 'Database initialized successfully'
        });
    } catch (error) {
        console.error('❌ Manual database initialization failed:', error);
        
        res.status(500).json({
            success: false,
            message: 'Database initialization failed',
            error: error.message,
            stack: error.stack
        });
    }
});

// Insert seed data manually
router.post('/insert-seed', async (req, res) => {
    try {
        const { Pool } = require('pg');
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        });

        // Insert demo users with proper bcrypt hashes
        const insertUsers = `
            INSERT INTO users (username, email, password, role, first_name, last_name, phone) VALUES
            ('banker1', 'banker@bank.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewgO8QujOZ7jJAKC', 'banker', 'John', 'Banker', '1234567890'),
            ('customer1', 'alice@email.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewgO8QujOZ7jJAKC', 'customer', 'Alice', 'Johnson', '1234567891'),
            ('customer2', 'bob@email.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewgO8QujOZ7jJAKC', 'customer', 'Bob', 'Smith', '1234567892'),
            ('customer3', 'carol@email.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewgO8QujOZ7jJAKC', 'customer', 'Carol', 'Davis', '1234567893')
            ON CONFLICT (username) DO NOTHING
        `;

        await pool.query(insertUsers);

        // Insert demo accounts
        const insertAccounts = `
            INSERT INTO accounts (user_id, account_number, balance, account_type) VALUES
            (2, 'ACC001000001', 5000.00, 'savings'),
            (3, 'ACC001000002', 3500.50, 'checking'),
            (4, 'ACC001000003', 10000.75, 'savings')
            ON CONFLICT (account_number) DO NOTHING
        `;

        await pool.query(insertAccounts);

        await pool.end();

        res.json({
            success: true,
            message: 'Demo data inserted successfully',
            credentials: {
                banker: { username: 'banker1', password: 'password123' },
                customer: { username: 'customer1', password: 'password123' }
            }
        });
    } catch (error) {
        console.error('❌ Failed to insert seed data:', error);
        
        res.status(500).json({
            success: false,
            message: 'Failed to insert seed data',
            error: error.message
        });
    }
});

// Check if tables exist
router.get('/check-tables', async (req, res) => {
    try {
        const { Pool } = require('pg');
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        });

        const result = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);

        await pool.end();

        res.json({
            success: true,
            tables: result.rows,
            message: `Found ${result.rows.length} tables`
        });
    } catch (error) {
        console.error('❌ Failed to check tables:', error);
        
        res.status(500).json({
            success: false,
            message: 'Failed to check tables',
            error: error.message
        });
    }
});

module.exports = router;
