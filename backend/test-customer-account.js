const { pool } = require('./config/database');

async function testCustomerAccount() {
    console.log('🔍 Testing Customer Account Data...\n');
    
    try {
        // Check if customer1 exists and has an account
        const [users] = await pool.execute(
            'SELECT id, username, first_name, last_name, role FROM users WHERE username = ?',
            ['customer1']
        );
        
        if (users.length === 0) {
            console.log('❌ Customer1 not found in database');
            return;
        }
        
        const customer = users[0];
        console.log('✅ Customer found:', customer);
        
        // Check if customer has an account
        const [accounts] = await pool.execute(
            'SELECT * FROM accounts WHERE user_id = ?',
            [customer.id]
        );
        
        if (accounts.length === 0) {
            console.log('❌ No account found for customer1');
            console.log('Creating account...');
            
            // Create account for customer1
            const accountNumber = `ACC${customer.id.toString().padStart(3, '0')}000001`;
            await pool.execute(
                'INSERT INTO accounts (user_id, account_number, balance, account_type, status) VALUES (?, ?, ?, ?, ?)',
                [customer.id, accountNumber, 5000.00, 'savings', 'active']
            );
            
            console.log('✅ Account created:', accountNumber);
        } else {
            console.log('✅ Account found:', accounts[0]);
        }
        
        // Test the Account model
        console.log('\n🧪 Testing Account Model...');
        const Account = require('./models/Account');
        const account = await Account.findByUserId(customer.id);
        
        if (account) {
            console.log('✅ Account model working');
            console.log('Account details:', {
                id: account.id,
                account_number: account.account_number,
                balance: account.balance,
                status: account.status
            });
        } else {
            console.log('❌ Account model not working');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        process.exit(0);
    }
}

testCustomerAccount();