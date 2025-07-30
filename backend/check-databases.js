const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDatabases() {
    console.log('🔍 Checking MySQL Databases...\n');
    
    try {
        // Connect to MySQL server (without specifying a database)
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        });
        
        console.log('✅ Connected to MySQL Server\n');
        
        // Get all databases
        console.log('📋 Available Databases:');
        console.log('------------------------');
        const [databases] = await connection.execute('SHOW DATABASES');
        
        databases.forEach((db, index) => {
            const dbName = Object.values(db)[0];
            if (!['information_schema', 'mysql', 'performance_schema', 'sys'].includes(dbName)) {
                console.log(`${index + 1}. ${dbName} ⭐ (User Database)`);
            } else {
                console.log(`${index + 1}. ${dbName} (System Database)`);
            }
        });
        
        console.log('\n🎯 Current .env Configuration:');
        console.log(`DB_NAME = "${process.env.DB_NAME}"\n`);
        
        // Check if our configured database exists
        const dbExists = databases.some(db => Object.values(db)[0] === process.env.DB_NAME);
        
        if (dbExists) {
            console.log(`✅ Database "${process.env.DB_NAME}" EXISTS in MySQL`);
            
            // Show tables in the database
            await connection.changeUser({ database: process.env.DB_NAME });
            const [tables] = await connection.execute('SHOW TABLES');
            
            if (tables.length > 0) {
                console.log(`\n📊 Tables in "${process.env.DB_NAME}":`);
                tables.forEach((table, index) => {
                    console.log(`   ${index + 1}. ${Object.values(table)[0]}`);
                });
            } else {
                console.log(`\n⚠️  Database "${process.env.DB_NAME}" exists but has no tables`);
                console.log('💡 You need to run schema.sql to create tables');
            }
        } else {
            console.log(`❌ Database "${process.env.DB_NAME}" does NOT exist`);
            console.log('\n💡 Options:');
            console.log('   1. Create the database using schema.sql');
            console.log('   2. Or update .env to use an existing database name');
        }
        
        await connection.end();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('\n💡 Check your MySQL password in .env file');
        }
    }
}

checkDatabases();