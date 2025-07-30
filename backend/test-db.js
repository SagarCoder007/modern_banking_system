const mysql = require('mysql2/promise');
require('dotenv').config();

async function testDatabase() {
    console.log('🔍 Testing Database Connection...\n');
    
    // Display configuration (without password)
    console.log('📋 Database Configuration:');
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log(`Port: ${process.env.DB_PORT}`);
    console.log(`User: ${process.env.DB_USER}`);
    console.log(`Database: ${process.env.DB_NAME}`);
    console.log(`Password: ${'*'.repeat(process.env.DB_PASSWORD?.length || 0)}\n`);
    
    try {
        // Test connection without database first
        console.log('🔌 Testing MySQL Server Connection...');
        const connectionConfig = {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        };
        
        const connection = await mysql.createConnection(connectionConfig);
        console.log('✅ MySQL Server Connection: SUCCESS\n');
        
        // Check if database exists
        console.log('🗄️  Checking if database exists...');
        const [databases] = await connection.execute('SHOW DATABASES');
        const dbExists = databases.some(db => db.Database === process.env.DB_NAME);
        
        if (dbExists) {
            console.log(`✅ Database '${process.env.DB_NAME}' exists\n`);
            
            // Connect to the specific database
            await connection.changeUser({ database: process.env.DB_NAME });
            console.log('📊 Checking database tables...');
            
            const [tables] = await connection.execute('SHOW TABLES');
            if (tables.length > 0) {
                console.log('✅ Tables found:');
                tables.forEach(table => {
                    console.log(`   - ${Object.values(table)[0]}`);
                });
            } else {
                console.log('⚠️  No tables found. You need to run the schema.sql file.');
            }
        } else {
            console.log(`❌ Database '${process.env.DB_NAME}' does not exist`);
            console.log('💡 You need to create the database using schema.sql');
        }
        
        await connection.end();
        console.log('\n🎉 Database test completed successfully!');
        
    } catch (error) {
        console.error('❌ Database Connection Error:');
        console.error(`Error Code: ${error.code}`);
        console.error(`Error Message: ${error.message}`);
        
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('\n💡 Possible solutions:');
            console.log('   - Check your DB_PASSWORD in .env file');
            console.log('   - Verify your MySQL username and password');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Possible solutions:');
            console.log('   - Make sure MySQL server is running');
            console.log('   - Check if the port 3306 is correct');
        }
    }
}

testDatabase();