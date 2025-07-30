// Test script to run after restarting the backend server
const axios = require('axios');

async function testAfterRestart() {
    console.log('🧪 Testing Banking System After Server Restart\n');
    console.log('=' .repeat(50));
    
    const API_BASE = 'http://localhost:5000/api';
    
    try {
        // Test 1: Health check
        console.log('1. Testing server health...');
        const healthResponse = await axios.get('http://localhost:5000');
        console.log('✅ Server is running:', healthResponse.data.message);
        
        // Test 2: Customer login
        console.log('\n2. Testing customer login...');
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            username: 'customer1',
            password: 'password123'
        });
        
        if (loginResponse.data.success) {
            const token = loginResponse.data.data.token.token;
            console.log('✅ Login successful');
            console.log(`   Token: ${token.substring(0, 10)}...`);
            
            // Test 3: Get balance
            console.log('\n3. Testing balance retrieval...');
            try {
                const balanceResponse = await axios.get(`${API_BASE}/customer/balance`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (balanceResponse.data.success) {
                    console.log('✅ Balance API working');
                    console.log(`   Current balance: $${balanceResponse.data.data.account.balance}`);
                } else {
                    console.log('❌ Balance API failed:', balanceResponse.data.message);
                }
            } catch (balanceError) {
                console.log('❌ Balance API error:', balanceError.response?.data?.message || balanceError.message);
            }
            
            // Test 4: Make a deposit
            console.log('\n4. Testing deposit functionality...');
            try {
                const depositResponse = await axios.post(`${API_BASE}/customer/deposit`, {
                    amount: 250,
                    description: 'Test deposit after restart'
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (depositResponse.data.success) {
                    console.log('✅ Deposit successful!');
                    console.log(`   Amount: $${depositResponse.data.data.transaction.amount}`);
                    console.log(`   New balance: $${depositResponse.data.data.account.new_balance}`);
                    console.log(`   Reference: ${depositResponse.data.data.transaction.reference_number}`);
                } else {
                    console.log('❌ Deposit failed:', depositResponse.data.message);
                }
            } catch (depositError) {
                console.log('❌ Deposit error:', depositError.response?.data?.message || depositError.message);
            }
            
            // Test 5: Make a withdrawal
            console.log('\n5. Testing withdrawal functionality...');
            try {
                const withdrawResponse = await axios.post(`${API_BASE}/customer/withdraw`, {
                    amount: 75,
                    description: 'Test withdrawal after restart'
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (withdrawResponse.data.success) {
                    console.log('✅ Withdrawal successful!');
                    console.log(`   Amount: $${withdrawResponse.data.data.transaction.amount}`);
                    console.log(`   New balance: $${withdrawResponse.data.data.account.new_balance}`);
                } else {
                    console.log('❌ Withdrawal failed:', withdrawResponse.data.message);
                }
            } catch (withdrawError) {
                console.log('❌ Withdrawal error:', withdrawError.response?.data?.message || withdrawError.message);
            }
            
        } else {
            console.log('❌ Login failed:', loginResponse.data.message);
        }
        
        console.log('\n' + '=' .repeat(50));
        console.log('🎉 TEST COMPLETE!');
        console.log('\nIf all tests passed, your banking system is working perfectly!');
        console.log('Now try the frontend at http://localhost:3000');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\n💡 Make sure the backend server is running on port 5000');
    }
}

testAfterRestart();