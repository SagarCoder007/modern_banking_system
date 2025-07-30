const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Database initialization script for PostgreSQL on Render
async function initializeDatabase() {
    console.log('🔄 Starting database initialization...');

    try {
        // Connect to PostgreSQL using DATABASE_URL
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        });

        // Read PostgreSQL schema file
        const schemaPath = path.join(__dirname, '../../database/postgresql-schema.sql');
        const seedPath = path.join(__dirname, '../../database/postgresql-seed.sql');

        if (!fs.existsSync(schemaPath)) {
            console.log('⚠️  PostgreSQL schema file not found, skipping database initialization');
            return;
        }

        const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

        // Execute schema
        console.log('📋 Creating database schema...');
        await pool.query(schemaSQL);
        console.log('✅ Database schema created successfully');

        // Execute seed data if file exists
        if (fs.existsSync(seedPath)) {
            const seedSQL = fs.readFileSync(seedPath, 'utf8');
            console.log('🌱 Inserting seed data...');
            await pool.query(seedSQL);
            console.log('✅ Seed data inserted successfully');
        } else {
            console.log('⚠️  Seed file not found, skipping seed data insertion');
        }

        // Close connection
        await pool.end();
        console.log('🎉 Database initialization completed successfully!');

    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);

        // If tables already exist, that's okay
        if (error.message.includes('already exists')) {
            console.log('ℹ️  Database tables already exist, skipping initialization');
            return;
        }

        throw error;
    }
}

// Run initialization if this script is called directly
if (require.main === module) {
    initializeDatabase()
        .then(() => {
            console.log('Database initialization script completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Database initialization script failed:', error);
            process.exit(1);
        });
}

module.exports = { initializeDatabase };