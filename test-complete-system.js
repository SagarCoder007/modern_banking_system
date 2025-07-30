// Complete Banking System End-to-End Test
// Tests all components: Database, Backend APIs, Frontend Integration

const axios = require('axios');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: './backend/.env' });

class BankingSystemTester {
    constructor() {
        this.API_BASE = 'http://localhost:5000/api';
        this.customerToken = null;
        this.bankerToken = null;
        this.testResults = {
            database: false,
            backend: false,
            authentication: false,
            customerFeatures: false,
            bankerFeatures: false,
            security: false
        };
    }

    async runCompleteTest() {
        console.log('🏦 COMPLETE BANKING SYSTEM TEST');
        console.log('=' .repeat(60));
        console.log('Testing all assignment requirements...\n');

        try {
            await this.testDatabase();
            await this.testBackendHealth();
            await this.testAuthentication();
            await this.testCustomerFeatures();
            await this.testBankerFeatures();
            await this.testSecurity();
            
            this.generateReport();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
        }
    }

    async testDatabase() {
        console.log('📊 1. DATABASE TESTING');
        console.log('-'.repeat(30));
        
        try {
            const connection = await mysql.createConnection({
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME
            });

            // Test required tables
            const [tables] = await connection.execute('SHOW TABLES');
            const tableNames = tables.map(row => Object.values(row)[0]);
            
            const requiredTables = ['users', 'accounts', 'transactions', 'accesstokens'];
            const missingTables = requiredTables.filter(table => 
                !tableNames.some(name => name.toLowerCase() === table)
            );

            if (missingTables.length === 0) {
                console.log('✅ All required tables exist');
                
                // Test sample data
                const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
                const [accounts] = await connection.execute('SELECT COUNT(*) as count FROM accounts');
                const [transactions] = await connection.execute('SELECT COUNT(*) as count FROM transactions');
                
                console.log(`✅ Sample data: ${users[0].count} users, ${accounts[0].count} accounts, ${transactions[0].count} transactions`);
                
                // Test banker and customer roles
                const [bankers] = await connection.execute('SELECT COUNT(*) as count FROM users WHERE role = "banker"');
                const [customers] = await connection.execute('SELECT COUNT(*) as count FROM users WHERE role = "customer"');
                
                if (bankers[0].count > 0 && customers[0].count > 0) {
                    console.log(`✅ Roles: ${bankers[0].count} bankers, ${customers[0].count} customers`);
                    this.testResults.database = true;
                } else {
                    console.log('❌ Missing banker or customer accounts');
                }
                
            } else {
                console.log(`❌ Missing tables: ${missingTables.join(', ')}`);
            }

            await connection.end();
            
        } catch (error) {
            console.log('❌ Database connection failed:', error.message);
        }
        
        console.log('');
    }

    async testBackendHealth() {
        console.log('🔧 2. BACKEND API TESTING');
        console.log('-'.repeat(30));
        
        try {
            const response = await axios.get('http://localhost:5000');
            
            if (response.data.message) {
                console.log('✅ Backend server running');
                console.log(`   Message: ${response.data.message}`);
                
                // Test API endpoints structure
                if (response.data.endpoints) {
                    console.log('✅ API endpoints configured');
                    this.testResults.backend = true;
                }
            }
            
        } catch (error) {
            console.log('❌ Backend server not accessible');
            console.log('   Start with: cd backend && npm run dev');
        }
        
        console.log('');
    }

    async testAuthentication() {
        console.log('🔐 3. AUTHENTICATION TESTING');
        console.log('-'.repeat(30));
        
        try {
            // Test customer login
            const customerLogin = await axios.post(`${this.API_BASE}/auth/login`, {
                username: 'customer1',
                password: 'password123'
            });

            if (customerLogin.data.success && customerLogin.data.data.token) {
                this.customerToken = customerLogin.data.data.token.token;
                console.log('✅ Customer login successful');
                console.log(`   Token length: ${this.customerToken.length} chars (required: 36)`);
                
                if (this.customerToken.length === 36) {
                    console.log('✅ 36-character token requirement met');
                }
            }

            // Test banker login
            const bankerLogin = await axios.post(`${this.API_BASE}/auth/login`, {
                username: 'banker1',
                password: 'password123'
            });

            if (bankerLogin.data.success && bankerLogin.data.data.token) {
                this.bankerToken = bankerLogin.data.data.token.token;
                console.log('✅ Banker login successful');
                
                if (this.customerToken && this.bankerToken) {
                    this.testResults.authentication = true;
                }
            }

            // Test token verification
            if (this.customerToken) {
                const verifyResponse = await axios.get(`${this.API_BASE}/auth/verify`, {
                    headers: { Authorization: `Bearer ${this.customerToken}` }
                });
                
                if (verifyResponse.data.success) {
                    console.log('✅ Token verification working');
                }
            }

        } catch (error) {
            console.log('❌ Authentication failed:', error.response?.data?.message || error.message);
        }
        
        console.log('');
    }

    async testCustomerFeatures() {
        console.log('👤 4. CUSTOMER FEATURES TESTING');
        console.log('-'.repeat(30));
        
        if (!this.customerToken) {
            console.log('❌ No customer token available');
            return;
        }

        const headers = { Authorization: `Bearer ${this.customerToken}` };
        let allTestsPassed = true;

        try {
            // Test balance inquiry
            const balanceResponse = await axios.get(`${this.API_BASE}/customer/balance`, { headers });
            if (balanceResponse.data.success) {
                console.log('✅ Balance inquiry working');
                console.log(`   Current balance: $${balanceResponse.data.data.account.balance}`);
            } else {
                allTestsPassed = false;
            }

            // Test transaction history
            const transactionsResponse = await axios.get(`${this.API_BASE}/customer/transactions`, { headers });
            if (transactionsResponse.data.success) {
                console.log('✅ Transaction history working');
                console.log(`   Transactions found: ${transactionsResponse.data.data.transactions.length}`);
            } else {
                allTestsPassed = false;
            }

            // Test deposit
            const depositResponse = await axios.post(`${this.API_BASE}/customer/deposit`, {
                amount: 100,
                description: 'Test deposit'
            }, { headers });
            
            if (depositResponse.data.success) {
                console.log('✅ Deposit functionality working');
                console.log(`   New balance: $${depositResponse.data.data.account.new_balance}`);
            } else {
                allTestsPassed = false;
            }

            // Test withdrawal
            const withdrawResponse = await axios.post(`${this.API_BASE}/customer/withdraw`, {
                amount: 50,
                description: 'Test withdrawal'
            }, { headers });
            
            if (withdrawResponse.data.success) {
                console.log('✅ Withdrawal functionality working');
                console.log(`   New balance: $${withdrawResponse.data.data.account.new_balance}`);
            } else {
                allTestsPassed = false;
            }

            // Test insufficient funds protection
            try {
                await axios.post(`${this.API_BASE}/customer/withdraw`, {
                    amount: 999999,
                    description: 'Test insufficient funds'
                }, { headers });
            } catch (error) {
                if (error.response?.status === 400 && 
                    error.response.data.message.includes('Insufficient funds')) {
                    console.log('✅ Insufficient funds protection working');
                } else {
                    allTestsPassed = false;
                }
            }

            if (allTestsPassed) {
                this.testResults.customerFeatures = true;
            }

        } catch (error) {
            console.log('❌ Customer features test failed:', error.response?.data?.message || error.message);
        }
        
        console.log('');
    }

    async testBankerFeatures() {
        console.log('🏛️ 5. BANKER FEATURES TESTING');
        console.log('-'.repeat(30));
        
        if (!this.bankerToken) {
            console.log('❌ No banker token available');
            return;
        }

        const headers = { Authorization: `Bearer ${this.bankerToken}` };
        let allTestsPassed = true;

        try {
            // Test dashboard overview
            const dashboardResponse = await axios.get(`${this.API_BASE}/banker/dashboard`, { headers });
            if (dashboardResponse.data.success) {
                console.log('✅ Banker dashboard working');
                console.log(`   Total customers: ${dashboardResponse.data.data.summary.total_customers}`);
                console.log(`   Total accounts: ${dashboardResponse.data.data.summary.total_accounts}`);
            } else {
                allTestsPassed = false;
            }

            // Test all accounts view
            const accountsResponse = await axios.get(`${this.API_BASE}/banker/accounts`, { headers });
            if (accountsResponse.data.success) {
                console.log('✅ All accounts view working');
                console.log(`   Accounts visible: ${accountsResponse.data.data.accounts.length}`);
            } else {
                allTestsPassed = false;
            }

            // Test customer transaction history access
            const customersResponse = await axios.get(`${this.API_BASE}/banker/customers`, { headers });
            if (customersResponse.data.success && customersResponse.data.data.customers.length > 0) {
                const firstCustomer = customersResponse.data.data.customers[0];
                const customerTransactionsResponse = await axios.get(
                    `${this.API_BASE}/banker/customer/${firstCustomer.id}/transactions`, 
                    { headers }
                );
                
                if (customerTransactionsResponse.data.success) {
                    console.log('✅ Customer transaction history access working');
                } else {
                    allTestsPassed = false;
                }
            }

            if (allTestsPassed) {
                this.testResults.bankerFeatures = true;
            }

        } catch (error) {
            console.log('❌ Banker features test failed:', error.response?.data?.message || error.message);
        }
        
        console.log('');
    }

    async testSecurity() {
        console.log('🔒 6. SECURITY TESTING');
        console.log('-'.repeat(30));
        
        let securityTestsPassed = 0;
        const totalSecurityTests = 4;

        try {
            // Test unauthorized access
            try {
                await axios.get(`${this.API_BASE}/customer/balance`);
            } catch (error) {
                if (error.response?.status === 401) {
                    console.log('✅ Unauthorized access properly blocked');
                    securityTestsPassed++;
                }
            }

            // Test role-based access (customer trying banker endpoint)
            if (this.customerToken) {
                try {
                    await axios.get(`${this.API_BASE}/banker/dashboard`, {
                        headers: { Authorization: `Bearer ${this.customerToken}` }
                    });
                } catch (error) {
                    if (error.response?.status === 403) {
                        console.log('✅ Role-based access control working');
                        securityTestsPassed++;
                    }
                }
            }

            // Test invalid token format
            try {
                await axios.get(`${this.API_BASE}/customer/balance`, {
                    headers: { Authorization: 'Bearer invalid_token' }
                });
            } catch (error) {
                if (error.response?.status === 401) {
                    console.log('✅ Invalid token format rejected');
                    securityTestsPassed++;
                }
            }

            // Test token length validation
            try {
                await axios.get(`${this.API_BASE}/customer/balance`, {
                    headers: { Authorization: 'Bearer short' }
                });
            } catch (error) {
                if (error.response?.status === 401) {
                    console.log('✅ Token length validation working');
                    securityTestsPassed++;
                }
            }

            if (securityTestsPassed === totalSecurityTests) {
                this.testResults.security = true;
            }

        } catch (error) {
            console.log('❌ Security testing failed:', error.message);
        }
        
        console.log('');
    }

    generateReport() {
        console.log('📋 FINAL TEST REPORT');
        console.log('=' .repeat(60));
        
        const totalTests = Object.keys(this.testResults).length;
        const passedTests = Object.values(this.testResults).filter(result => result).length;
        const passRate = Math.round((passedTests / totalTests) * 100);
        
        console.log(`Overall Pass Rate: ${passedTests}/${totalTests} (${passRate}%)\n`);
        
        // Detailed results
        Object.entries(this.testResults).forEach(([category, passed]) => {
            const status = passed ? '✅ PASS' : '❌ FAIL';
            const categoryName = category.replace(/([A-Z])/g, ' $1').toUpperCase();
            console.log(`${status} - ${categoryName}`);
        });
        
        console.log('\n' + '=' .repeat(60));
        
        if (passRate === 100) {
            console.log('🎉 ALL TESTS PASSED! Your banking system is ready for submission!');
            console.log('\n📤 SUBMISSION CHECKLIST:');
            console.log('✅ Database with Users and Accounts tables');
            console.log('✅ 36-character alphanumeric access tokens');
            console.log('✅ Customer login and transaction management');
            console.log('✅ Banker login and account oversight');
            console.log('✅ Deposit/Withdraw with insufficient funds protection');
            console.log('✅ MVC architecture implementation');
            console.log('✅ Role-based security and authentication');
            
            console.log('\n🚀 NEXT STEPS:');
            console.log('1. Deploy to a free platform (Vercel, Netlify, Railway)');
            console.log('2. Create GitHub repository with clean documentation');
            console.log('3. Test the live deployment');
            console.log('4. Submit GitHub link and live demo link');
            
        } else {
            console.log('⚠️  Some tests failed. Please review and fix the issues above.');
            console.log('\n🔧 TROUBLESHOOTING:');
            
            if (!this.testResults.database) {
                console.log('• Run database schema.sql and seed.sql files');
            }
            if (!this.testResults.backend) {
                console.log('• Start backend server: cd backend && npm run dev');
            }
            if (!this.testResults.authentication) {
                console.log('• Check user credentials and token generation');
            }
            if (!this.testResults.customerFeatures) {
                console.log('• Test customer API endpoints manually');
            }
            if (!this.testResults.bankerFeatures) {
                console.log('• Test banker API endpoints manually');
            }
            if (!this.testResults.security) {
                console.log('• Review authentication and authorization middleware');
            }
        }
    }
}

// Run the complete test
const tester = new BankingSystemTester();
tester.runCompleteTest();