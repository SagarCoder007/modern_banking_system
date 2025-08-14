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
        console.log('📄 Schema file size:', schemaSQL.length, 'characters');
        
        // Split SQL into individual statements and execute one by one
        const statements = schemaSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.match(/^\s*$/));
        
        console.log('📊 Found', statements.length, 'SQL statements to execute');
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.trim()) {
                try {
                    console.log(`🔄 Executing statement ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);
                    await pool.query(statement);
                    console.log(`✅ Statement ${i + 1} executed successfully`);
                } catch (error) {
                    console.log(`⚠️  Statement ${i + 1} failed:`, error.message);
                    // Continue with other statements
                }
            }
        }
        
        console.log('✅ Database schema creation completed');

        // Execute seed data if file exists
        if (fs.existsSync(seedPath)) {
            const seedSQL = fs.readFileSync(seedPath, 'utf8');
            console.log('🌱 Inserting seed data...');
            
            // Split seed SQL into statements
            const seedStatements = seedSQL
                .split(';')
                .map(stmt => stmt.trim())
                .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.match(/^\s*$/));
            
            console.log('📊 Found', seedStatements.length, 'seed statements to execute');
            
            for (let i = 0; i < seedStatements.length; i++) {
                const statement = seedStatements[i];
                if (statement.trim()) {
                    try {
                        console.log(`🌱 Executing seed ${i + 1}/${seedStatements.length}`);
                        await pool.query(statement);
                        console.log(`✅ Seed ${i + 1} executed successfully`);
                    } catch (error) {
                        console.log(`⚠️  Seed ${i + 1} failed:`, error.message);
                        // Continue with other statements
                    }
                }
            }
            
            console.log('✅ Seed data insertion completed');
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