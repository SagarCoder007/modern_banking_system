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
