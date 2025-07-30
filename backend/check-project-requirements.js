const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkProjectRequirements() {
    console.log('🎯 Checking Project Requirements vs Current Database\n');
    console.log('=' .repeat(60));
    
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        
        console.log('📋 PROJECT REQUIREMENTS vs CURRENT DATABASE:');
        console.log('=' .repeat(60));
        
        // Check Users table
        console.log('\n👤 1. USERS Table:');
        console.log('   Required by Assignment: Store bankers and customers');
        try {
            const [userColumns] = await connection.execute('DESCRIBE users');
            console.log('   ✅ Table EXISTS - Current structure:');
            userColumns.forEach(col => {
                console.log(`      - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? col.Key : ''}`);
            });
            
            // Check if we have sample data
            const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
            const [roleCheck] = await connection.execute('SELECT role, COUNT(*) as count FROM users GROUP BY role');
            console.log(`   📊 Current Data: ${userCount[0].count} users total`);
            roleCheck.forEach(role => {
                console.log(`      - ${role.role}: ${role.count} users`);
            });
            
        } catch (error) {
            console.log('   ❌ Table NOT FOUND - Need to create');
        }
        
        // Check Accounts table
        console.log('\n🏦 2. ACCOUNTS Table:');
        console.log('   Required by Assignment: Store customer accounts');
        try {
            const [accountColumns] = await connection.execute('DESCRIBE accounts');
            console.log('   ✅ Table EXISTS - Current structure:');
            accountColumns.forEach(col => {
                console.log(`      - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? col.Key : ''}`);
            });
            
            const [accountCount] = await connection.execute('SELECT COUNT(*) as count FROM accounts');
            console.log(`   📊 Current Data: ${accountCount[0].count} accounts`);
            
        } catch (error) {
            console.log('   ❌ Table NOT FOUND - Need to create');
        }
        
        // Check Transactions table
        console.log('\n💰 3. TRANSACTIONS Table:');
        console.log('   Required by Assignment: Log deposits and withdrawals');
        try {
            const [transactionColumns] = await connection.execute('DESCRIBE transactions');
            console.log('   ✅ Table EXISTS - Current structure:');
            transactionColumns.forEach(col => {
                console.log(`      - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? col.Key : ''}`);
            });
            
            const [transactionCount] = await connection.execute('SELECT COUNT(*) as count FROM transactions');
            const [typeCheck] = await connection.execute('SELECT type, COUNT(*) as count FROM transactions GROUP BY type');
            console.log(`   📊 Current Data: ${transactionCount[0].count} transactions total`);
            typeCheck.forEach(type => {
                console.log(`      - ${type.type}: ${type.count} transactions`);
            });
            
        } catch (error) {
            console.log('   ❌ Table NOT FOUND - Need to create');
        }
        
        // Check AccessTokens table (for 36-char tokens)
        console.log('\n🔑 4. ACCESS TOKENS Table:');
        console.log('   Required by Assignment: 36-character alphanumeric tokens');
        try {
            const [tokenColumns] = await connection.execute('DESCRIBE accesstokens');
            console.log('   ✅ Table EXISTS - Current structure:');
            tokenColumns.forEach(col => {
                console.log(`      - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? col.Key : ''}`);
            });
            
            // Check token length requirement
            const tokenColumn = tokenColumns.find(col => col.Field === 'token');
            if (tokenColumn && tokenColumn.Type.includes('36')) {
                console.log('   ✅ Token length: Configured for 36 characters');
            } else {
                console.log('   ⚠️  Token length: May need to verify 36-character requirement');
            }
            
        } catch (error) {
            console.log('   ❌ Table NOT FOUND - Need to create');
        }
        
        console.log('\n' + '=' .repeat(60));
        console.log('📊 ASSIGNMENT REQUIREMENTS CHECK:');
        console.log('=' .repeat(60));
        
        // Check specific assignment requirements
        console.log('\n🎯 Assignment Specific Checks:');
        
        // 1. Check for banker users
        try {
            const [bankers] = await connection.execute('SELECT * FROM users WHERE role = "banker"');
            if (bankers.length > 0) {
                console.log(`   ✅ Banker accounts: ${bankers.length} found`);
                bankers.forEach(banker => {
                    console.log(`      - ${banker.username} (${banker.first_name} ${banker.last_name})`);
                });
            } else {
                console.log('   ⚠️  Banker accounts: None found - Need to add test banker');
            }
        } catch (error) {
            console.log('   ❌ Cannot check banker accounts');
        }
        
        // 2. Check for customer users
        try {
            const [customers] = await connection.execute('SELECT * FROM users WHERE role = "customer"');
            if (customers.length > 0) {
                console.log(`   ✅ Customer accounts: ${customers.length} found`);
                customers.forEach(customer => {
                    console.log(`      - ${customer.username} (${customer.first_name} ${customer.last_name})`);
                });
            } else {
                console.log('   ⚠️  Customer accounts: None found - Need to add test customers');
            }
        } catch (error) {
            console.log('   ❌ Cannot check customer accounts');
        }
        
        // 3. Check account-user relationships
        try {
            const [accountUsers] = await connection.execute(`
                SELECT u.username, u.role, a.account_number, a.balance 
                FROM users u 
                LEFT JOIN accounts a ON u.id = a.user_id 
                WHERE u.role = 'customer'
            `);
            
            const customersWithAccounts = accountUsers.filter(item => item.account_number);
            const customersWithoutAccounts = accountUsers.filter(item => !item.account_number);
            
            console.log(`   ✅ Customers with accounts: ${customersWithAccounts.length}`);
            customersWithAccounts.forEach(customer => {
                console.log(`      - ${customer.username}: Account ${customer.account_number} (Balance: $${customer.balance})`);
            });
            
            if (customersWithoutAccounts.length > 0) {
                console.log(`   ⚠️  Customers without accounts: ${customersWithoutAccounts.length}`);
                customersWithoutAccounts.forEach(customer => {
                    console.log(`      - ${customer.username}: No account found`);
                });
            }
        } catch (error) {
            console.log('   ❌ Cannot check account relationships');
        }
        
        console.log('\n' + '=' .repeat(60));
        console.log('🎯 RECOMMENDATIONS:');
        console.log('=' .repeat(60));
        
        // Provide recommendations
        console.log('\n💡 Based on your current database state:');
        
        try {
            const [tableCheck] = await connection.execute('SHOW TABLES');
            const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
            const [bankerCount] = await connection.execute('SELECT COUNT(*) as count FROM users WHERE role = "banker"');
            const [customerCount] = await connection.execute('SELECT COUNT(*) as count FROM users WHERE role = "customer"');
            const [accountCount] = await connection.execute('SELECT COUNT(*) as count FROM accounts');
            const [transactionCount] = await connection.execute('SELECT COUNT(*) as count FROM transactions');
            
            if (tableCheck.length >= 4 && userCount[0].count > 0) {
                console.log('✅ Your database is READY for development!');
                console.log('✅ All required tables exist with sample data');
                console.log('✅ You can start building your backend API immediately');
                
                if (bankerCount[0].count === 0) {
                    console.log('⚠️  MINOR: Add a test banker account for testing');
                }
                if (customerCount[0].count < 2) {
                    console.log('⚠️  MINOR: Add more test customer accounts');
                }
            } else {
                console.log('❌ You need to populate your database first');
                console.log('💡 Run the seed.sql file to add test data');
            }
            
        } catch (error) {
            console.log('❌ Database needs initial setup with schema.sql and seed.sql');
        }
        
        await connection.end();
        
    } catch (error) {
        console.error('❌ Error checking requirements:', error.message);
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('🎯 Check Complete!');
}

checkProjectRequirements();