const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Database initialization script for PostgreSQL on Render
async function initializeDatabase() {
    console.log('🔄 Starting database initialization...');
    console.log('📍 Current working directory:', process.cwd());
    console.log('📍 Script directory:', __dirname);
    console.log('🔗 DATABASE_URL exists:', !!process.env.DATABASE_URL);

    try {
        // Connect to PostgreSQL using DATABASE_URL
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        });
        
        // Test connection
        console.log('🔌 Testing database connection...');
        const client = await pool.connect();
        console.log('✅ Database connection successful');
        client.release();

        // Read PostgreSQL schema file
        const schemaPath = path.join(__dirname, '../../database/postgresql-schema.sql');
        const seedPath = path.join(__dirname, '../../database/postgresql-seed.sql');
        
        console.log('📁 Schema path:', schemaPath);
        console.log('📁 Seed path:', seedPath);
        console.log('📋 Schema file exists:', fs.existsSync(schemaPath));
        console.log('🌱 Seed file exists:', fs.existsSync(seedPath));

        if (!fs.existsSync(schemaPath)) {
            console.log('⚠️  PostgreSQL schema file not found at:', schemaPath);
            console.log('📂 Available files in database directory:');
            try {
                const dbDir = path.join(__dirname, '../../database');
                const files = fs.readdirSync(dbDir);
                files.forEach(file => console.log('  -', file));
            } catch (err) {
                console.log('❌ Cannot read database directory');
            }
            return;
        }

        const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

        // Execute schema
        console.log('📋 Creating database schema...');
        console.log('📄 Schema file size:', schemaSQL.length, 'characters');
        
        // Better SQL parsing for PostgreSQL functions
        const statements = [];
        let currentStatement = '';
        let insideFunction = false;
        let dollarTagCount = 0;
        
        const lines = schemaSQL.split('\n');
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            // Skip comments and empty lines
            if (trimmedLine.startsWith('--') || trimmedLine === '') {
                continue;
            }
            
            // Skip PostgreSQL metacommands
            if (trimmedLine.startsWith('\\')) {
                continue;
            }
            
            currentStatement += line + '\n';
            
            // Track dollar-quoted functions
            if (trimmedLine.includes('$$')) {
                dollarTagCount++;
                if (dollarTagCount % 2 === 1) {
                    insideFunction = true;
                } else {
                    insideFunction = false;
                }
            }
            
            // End of statement (semicolon and not inside function)
            if (trimmedLine.endsWith(';') && !insideFunction) {
                const cleanStatement = currentStatement.trim();
                if (cleanStatement && !cleanStatement.startsWith('--')) {
                    statements.push(cleanStatement);
                }
                currentStatement = '';
            }
        }
        
        // Add any remaining statement
        if (currentStatement.trim()) {
            statements.push(currentStatement.trim());
        }
        
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
            
            // Better parsing for seed statements (similar to schema parsing)
            const seedStatements = [];
            let currentSeedStatement = '';
            
            const seedLines = seedSQL.split('\n');
            
            for (const line of seedLines) {
                const trimmedLine = line.trim();
                
                // Skip comments and empty lines
                if (trimmedLine.startsWith('--') || trimmedLine === '') {
                    continue;
                }
                
                currentSeedStatement += line + '\n';
                
                // End of statement (semicolon)
                if (trimmedLine.endsWith(';')) {
                    const cleanStatement = currentSeedStatement.trim();
                    if (cleanStatement && !cleanStatement.startsWith('--')) {
                        seedStatements.push(cleanStatement);
                    }
                    currentSeedStatement = '';
                }
            }
            
            // Add any remaining statement
            if (currentSeedStatement.trim()) {
                seedStatements.push(currentSeedStatement.trim());
            }
            
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