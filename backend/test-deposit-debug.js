const { pool } = require('./config/database');
const User = require('./models/User');
const Account = require('./models/Account');

async function testDepositDebug() {
    console.log('🔍 Debugging Deposit Functionality...\n');
    
    try {
        // Step 1: Find customer1
        console.log('Step 1: Finding customer1...');
        const user = await User.findByUsername('customer1');
        if (!user) {
            console.log('❌ Customer1 not found');
            return;
        }
        console.log('✅ Customer found:', user.username, user.role);
        
        // Step 2: Find customer's account
        console.log('\nStep 2: Finding customer account...');
        const account = await Account.findByUserId(user.id);
        if (!account) {
            console.log('❌ Account not found');
            return;
        }
        console.log('✅ Account found:', account.account_number, 'Balance:', account.balance);
        
        // Step 3: Test deposit function
        console.log('\nStep 3: Testing deposit function...');
        const depositAmount = 100;
        const description = 'Test deposit';
        
        console.log(`Attempting to deposit $${depositAmount}...`);
        
        try {
            const result = await account.deposit(depositAmount, description);
            console.log('✅ Deposit successful!');
            console.log('Transaction:', result.transaction);
            console.log('New balance:', result.account.balance);
        } catch (depositError) {
            console.log('❌ Deposit failed:', depositError.message);
            console.log('Stack:', depositError.stack);
        }
        
        // Step 4: Test CustomerController directly
        console.log('\nStep 4: Testing CustomerController...');
        const CustomerController = require('./controllers/CustomerController');
        
        // Mock request and response objects
        const mockReq = {
            user: user,
            body: {
                amount: 50,
                description: 'Controller test deposit'
            }
        };
        
        const mockRes = {
            status: (code) => ({
                json: (data) => {
                    console.log(`Response ${code}:`, data);
                    return mockRes;
                }
            }),
            json: (data) => {
                console.log('Response:', data);
                return mockRes;
            }
        };
        
        try {
            await CustomerController.deposit(mockReq, mockRes);
        } catch (controllerError) {
            console.log('❌ Controller error:', controllerError.message);
            console.log('Stack:', controllerError.stack);
        }
        
    } catch (error) {
        console.error('❌ Overall error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        process.exit(0);
    }
}

testDepositDebug();