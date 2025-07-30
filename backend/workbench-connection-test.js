const mysql = require('mysql2/promise');
require('dotenv').config();

async function testWorkbenchConnection() {
    console.log('🔍 MySQL Workbench Connection Verification\n');
    console.log('=' .repeat(50));
    
    // Display current configuration
    console.log('📋 Current .env Configuration:');
    console.log(`   Host: ${process.env.DB_HOST}`);
    console.log(`   Port: ${process.env.DB_PORT}`);
    console.log(`   User: ${process.env.DB_USER}`);
    console.log(`   Password: ${'*'.repeat(process.env.DB_PASSWORD?.length || 0)}`);
    console.log(`   Database: ${process.env.DB_NAME}`);
    console.log('=' .repeat(50) + '\n');
    
    try {
        // Step 1: Test basic MySQL connection
        console.log('🔌 Step 1: Testing MySQL Server Connection...');
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        });
        console.log('✅ MySQL Server: Connected successfully\n');
        
        // Step 2: Check MySQL version
        console.log('🔧 Step 2: Checking MySQL Version...');
        const [versionResult] = await connection.execute('SELECT VERSION() as version');
        console.log(`✅ MySQL Version: ${versionResult[0].version}\n`);
        
        // Step 3: Check user privileges
        console.log('👤 Step 3: Checking User Privileges...');
        const [privilegesResult] = await connection.execute('SHOW GRANTS');
        console.log('✅ User Privileges:');
        privilegesResult.forEach((grant, index) => {
            console.log(`   ${index + 1}. ${Object.values(grant)[0]}`);
        });
        console.log('');
        
        // Step 4: List all databases
        console.log('🗄️  Step 4: Available Databases...');
        const [databases] = await connection.execute('SHOW DATABASES');
        console.log('✅ Available Databases:');
        
        let userDatabases = [];
        databases.forEach((db, index) => {
            const dbName = Object.values(db)[0];
            if (!['information_schema', 'mysql', 'performance_schema', 'sys'].includes(dbName)) {
                userDatabases.push(dbName);
                console.log(`   ${index + 1}. ${dbName} ⭐ (User Database)`);
            } else {
                console.log(`   ${index + 1}. ${dbName} (System Database)`);
            }
        });
        console.log('');
        
        // Step 5: Check configured database
        console.log('🎯 Step 5: Checking Configured Database...');
        const configuredDbExists = databases.some(db => Object.values(db)[0] === process.env.DB_NAME);
        
        if (configuredDbExists) {
            console.log(`✅ Database "${process.env.DB_NAME}" exists`);
            
            // Connect to the specific database and check tables
            await connection.changeUser({ database: process.env.DB_NAME });
            const [tables] = await connection.execute('SHOW TABLES');
            
            if (tables.length > 0) {
                console.log(`✅ Tables found in "${process.env.DB_NAME}":`);
                for (let table of tables) {
                    const tableName = Object.values(table)[0];
                    console.log(`   - ${tableName}`);
                    
                    // Check table structure
                    const [columns] = await connection.execute(`DESCRIBE ${tableName}`);
                    console.log(`     Columns: ${columns.map(col => col.Field).join(', ')}`);
                }
            } else {
                console.log(`⚠️  Database "${process.env.DB_NAME}" exists but has no tables`);
                console.log('   💡 Need to run schema.sql to create tables');
            }
        } else {
            console.log(`❌ Database "${process.env.DB_NAME}" does NOT exist`);
            if (userDatabases.length > 0) {
                console.log('   💡 Available user databases:', userDatabases.join(', '));
                console.log('   💡 You can either:');
                console.log('      1. Update .env to use an existing database');
                console.log('      2. Create the new database using schema.sql');
            } else {
                console.log('   💡 No user databases found. Create one using schema.sql');
            }
        }
        console.log('');
        
        // Step 6: Test connection pool
        console.log('🏊 Step 6: Testing Connection Pool...');
        const pool = mysql.createPool({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: configuredDbExists ? process.env.DB_NAME : undefined,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
        
        const poolConnection = await pool.getConnection();
        console.log('✅ Connection Pool: Working correctly');
        poolConnection.release();
        await pool.end();
        console.log('');
        
        // Step 7: Summary
        console.log('📊 Step 7: Connection Summary...');
        console.log('✅ MySQL Workbench Connection Status: FULLY FUNCTIONAL');
        console.log('✅ All basic connection parameters are correct');
        console.log('✅ User has proper privileges');
        console.log('✅ Connection pooling works');
        
        if (configuredDbExists) {
            console.log(`✅ Target database "${process.env.DB_NAME}" is accessible`);
        } else {
            console.log(`⚠️  Target database "${process.env.DB_NAME}" needs to be created`);
        }
        
        await connection.end();
        
    } catch (error) {
        console.error('❌ Connection Test Failed:');
        console.error(`   Error Code: ${error.code}`);
        console.error(`   Error Message: ${error.message}`);
        console.error(`   SQL State: ${error.sqlState || 'N/A'}`);
        
        console.log('\n🔧 Troubleshooting Guide:');
        
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('   ❌ Authentication Failed:');
            console.log('      - Check DB_PASSWORD in .env file');
            console.log('      - Verify username/password in MySQL Workbench');
            console.log('      - Make sure MySQL user has proper privileges');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('   ❌ Connection Refused:');
            console.log('      - Make sure MySQL server is running');
            console.log('      - Check if port 3306 is correct');
            console.log('      - Verify host address (127.0.0.1 vs localhost)');
        } else if (error.code === 'ETIMEDOUT') {
            console.log('   ❌ Connection Timeout:');
            console.log('      - Check network connectivity');
            console.log('      - Verify MySQL server is responding');
        } else {
            console.log('   ❌ Other Database Error:');
            console.log('      - Check MySQL server logs');
            console.log('      - Verify MySQL service is running');
        }
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('🎯 Test Complete!');
}

testWorkbenchConnection();