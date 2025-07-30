const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Create a simple test server to debug the deposit issue
const app = express();
app.use(cors());
app.use(express.json());

// Import required modules
const { pool } = require('./config/database');
const User = require('./models/User');
const Account = require('./models/Account');
const { authenticateToken, requireRole } = require('./middleware/auth');

// Test route to debug deposit
app.post('/test-deposit', authenticateToken, requireRole('customer'), async (req, res) => {
    console.log('🔍 DEBUG: Deposit request received');
    console.log('User:', req.user);
    console.log('Body:', req.body);
    
    try {
        const { amount, description = 'Test deposit' } = req.body;
        
        console.log('Step 1: Validating amount...');
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
            console.log('❌ Invalid amount:', amount);
            return res.status(400).json({
                success: false,
                message: 'Valid deposit amount is required'
            });
        }
        
        const depositAmount = parseFloat(amount);
        console.log('✅ Amount validated:', depositAmount);
        
        console.log('Step 2: Finding customer account...');
        const account = await Account.findByUserId(req.user.id);
        if (!account) {
            console.log('❌ Account not found for user:', req.user.id);
            return res.status(404).json({
                success: false,
                message: 'Customer account not found'
            });
        }
        
        console.log('✅ Account found:', account.account_number, 'Balance:', account.balance);
        
        console.log('Step 3: Checking account status...');
        if (!account.isActive()) {
            console.log('❌ Account not active:', account.status);
            return res.status(400).json({
                success: false,
                message: 'Account is not active for transactions'
            });
        }
        
        console.log('✅ Account is active');
        
        console.log('Step 4: Performing deposit...');
        const result = await account.deposit(depositAmount, description);
        
        console.log('✅ Deposit successful!');
        console.log('Transaction ID:', result.transaction.id);
        console.log('Reference:', result.transaction.reference_number);
        console.log('New balance:', result.account.balance);
        
        res.status(200).json({
            success: true,
            message: 'Deposit successful',
            data: {
                transaction: result.transaction,
                account: {
                    account_number: result.account.account_number,
                    previous_balance: result.transaction.balance_before,
                    new_balance: result.account.balance,
                    account_type: result.account.account_type
                }
            }
        });
        
    } catch (error) {
        console.error('❌ DEPOSIT ERROR:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        res.status(500).json({
            success: false,
            message: 'Internal server error during deposit',
            debug: {
                error: error.message,
                code: error.code,
                errno: error.errno
            }
        });
    }
});

// Test database connection
app.get('/test-db', async (req, res) => {
    try {
        const [result] = await pool.execute('SELECT 1 as test');
        res.json({ success: true, message: 'Database connected', result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Test user lookup
app.get('/test-user/:username', async (req, res) => {
    try {
        const user = await User.findByUsername(req.params.username);
        if (user) {
            const account = await Account.findByUserId(user.id);
            res.json({ 
                success: true, 
                user: user.toSafeObject(), 
                account: account ? {
                    id: account.id,
                    account_number: account.account_number,
                    balance: account.balance,
                    status: account.status
                } : null
            });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = 5001; // Different port to avoid conflict
app.listen(PORT, () => {
    console.log(`🔍 Debug server running on port ${PORT}`);
    console.log('Test endpoints:');
    console.log(`- GET  http://localhost:${PORT}/test-db`);
    console.log(`- GET  http://localhost:${PORT}/test-user/customer1`);
    console.log(`- POST http://localhost:${PORT}/test-deposit (requires auth)`);
});