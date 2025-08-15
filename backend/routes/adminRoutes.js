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

// Insert seed data manually (both GET and POST for browser testing)
const insertSeedHandler = async (req, res) => {
    try {
        const { Pool } = require('pg');
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        });

        // Generate fresh hash for password123
        const bcrypt = require('bcryptjs');
        const passwordHash = await bcrypt.hash('password123', 12);
        console.log('🔐 Generated fresh password hash for password123');

        // FORCE UPDATE existing users with fresh password hash
        await pool.query(`
            UPDATE users SET password = $1 WHERE username = 'banker1'
        `, [passwordHash]);
        
        await pool.query(`
            UPDATE users SET password = $1 WHERE username = 'customer1'
        `, [passwordHash]);
        
        await pool.query(`
            UPDATE users SET password = $1 WHERE username = 'customer2'
        `, [passwordHash]);
        
        await pool.query(`
            UPDATE users SET password = $1 WHERE username = 'customer3'
        `, [passwordHash]);

        console.log('✅ FORCED password updates for all demo users');
        
        // Verify the password updates worked
        const verifyResult = await pool.query(`
            SELECT username, SUBSTRING(password, 1, 10) as password_preview, LENGTH(password) as password_length
            FROM users 
            WHERE username IN ('banker1', 'customer1', 'customer2', 'customer3')
            ORDER BY username
        `);
        
        console.log('🔍 Password verification after update:');
        verifyResult.rows.forEach(user => {
            console.log(`  ${user.username}: ${user.password_preview}... (length: ${user.password_length})`);
        });

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
};

// Allow both GET and POST for browser testing
router.get('/insert-seed', insertSeedHandler);
router.post('/insert-seed', insertSeedHandler);

// Browser-friendly version that forces JSON content type
router.get('/seed', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    await insertSeedHandler(req, res);
});

// Check what users exist in database
router.get('/check-users', async (req, res) => {
    try {
        const { Pool } = require('pg');
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        });

        const result = await pool.query(`
            SELECT id, username, email, role, created_at, 
                   LENGTH(password) as password_length,
                   SUBSTRING(password, 1, 10) as password_preview
            FROM users 
            ORDER BY id
        `);

        await pool.end();

        res.json({
            success: true,
            users: result.rows,
            message: `Found ${result.rows.length} users in database`,
            note: "password_preview shows first 10 characters of hash for verification"
        });
    } catch (error) {
        console.error('❌ Failed to check users:', error);
        
        res.status(500).json({
            success: false,
            message: 'Failed to check users',
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
