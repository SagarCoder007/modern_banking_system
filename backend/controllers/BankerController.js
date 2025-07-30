const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');

class BankerController {
    // Get all customer accounts (banker dashboard)
    static async getAllAccounts(req, res) {
        try {
            const user = req.user; // From auth middleware
            
            // Ensure user is a banker
            if (!user.isBanker()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Banker role required.'
                });
            }
            
            const { page = 1, limit = 50, status, account_type } = req.query;
            const offset = (parseInt(page) - 1) * parseInt(limit);
            
            // Get all customer accounts with user information
            let accounts = await Account.getAllAccounts();
            
            // Apply filters if provided
            if (status) {
                accounts = accounts.filter(account => account.status === status);
            }
            
            if (account_type) {
                accounts = accounts.filter(account => account.account_type === account_type);
            }
            
            // Apply pagination
            const paginatedAccounts = accounts.slice(offset, offset + parseInt(limit));
            
            res.status(200).json({
                success: true,
                message: 'Customer accounts retrieved successfully',
                data: {
                    accounts: paginatedAccounts,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: accounts.length,
                        total_pages: Math.ceil(accounts.length / parseInt(limit))
                    },
                    filters: {
                        status: status || 'all',
                        account_type: account_type || 'all'
                    }
                }
            });
            
        } catch (error) {
            console.error('Get all accounts error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while retrieving accounts'
            });
        }
    }
    
    // Get specific customer's transaction history
    static async getCustomerTransactions(req, res) {
        try {
            const user = req.user; // From auth middleware
            const { customerId } = req.params;
            const { page = 1, limit = 50, type, days = 30 } = req.query;
            
            // Ensure user is a banker
            if (!user.isBanker()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Banker role required.'
                });
            }
            
            // Validation
            if (!customerId || isNaN(customerId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid customer ID is required'
                });
            }
            
            const offset = (parseInt(page) - 1) * parseInt(limit);
            
            // Get customer information
            const customer = await User.findById(parseInt(customerId));
            if (!customer) {
                return res.status(404).json({
                    success: false,
                    message: 'Customer not found'
                });
            }
            
            if (!customer.isCustomer()) {
                return res.status(400).json({
                    success: false,
                    message: 'Specified user is not a customer'
                });
            }
            
            // Get customer's account
            const account = await Account.findByUserId(customer.id);
            if (!account) {
                return res.status(404).json({
                    success: false,
                    message: 'Customer account not found'
                });
            }
            
            // Get transactions based on filters
            let transactions;
            
            if (type && ['deposit', 'withdrawal'].includes(type)) {
                // Get transactions by type for this customer
                const allTypeTransactions = await Transaction.findByType(type, 1000, 0);
                transactions = allTypeTransactions
                    .filter(t => t.account_id === account.id)
                    .slice(offset, offset + parseInt(limit));
            } else if (days && parseInt(days) > 0) {
                // Get transactions within date range
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - parseInt(days));
                const endDate = new Date();
                
                transactions = await Transaction.findByDateRange(
                    startDate.toISOString(),
                    endDate.toISOString(),
                    account.id,
                    parseInt(limit)
                );
            } else {
                // Get all transactions for the account
                transactions = await Transaction.findByAccountId(account.id, parseInt(limit), offset);
            }
            
            // Get transaction statistics
            const stats = await Transaction.getStatistics(account.id, parseInt(days));
            
            res.status(200).json({
                success: true,
                message: 'Customer transactions retrieved successfully',
                data: {
                    customer: {
                        id: customer.id,
                        username: customer.username,
                        first_name: customer.first_name,
                        last_name: customer.last_name,
                        email: customer.email,
                        phone: customer.phone
                    },
                    account: {
                        account_number: account.account_number,
                        balance: account.balance,
                        formatted_balance: account.getFormattedBalance(),
                        account_type: account.account_type,
                        status: account.status
                    },
                    transactions,
                    statistics: {
                        period_days: parseInt(days),
                        ...stats
                    },
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: transactions.length
                    },
                    filters: {
                        type: type || 'all',
                        days: parseInt(days)
                    }
                }
            });
            
        } catch (error) {
            console.error('Get customer transactions error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while retrieving customer transactions'
            });
        }
    }
    
    // Get banking system overview/dashboard
    static async getDashboardOverview(req, res) {
        try {
            const user = req.user; // From auth middleware
            
            // Ensure user is a banker
            if (!user.isBanker()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Banker role required.'
                });
            }
            
            const { days = 30 } = req.query;
            
            // Get overall statistics
            const allCustomers = await User.getAllCustomers();
            const allAccounts = await Account.getAllAccounts();
            const recentTransactions = await Transaction.getAllTransactions(20, 0);
            const overallStats = await Transaction.getStatistics(null, parseInt(days));
            
            // Calculate additional metrics
            const totalBalance = allAccounts.reduce((sum, account) => sum + parseFloat(account.balance), 0);
            const activeAccounts = allAccounts.filter(account => account.status === 'active').length;
            const todayTransactions = recentTransactions.filter(transaction => {
                const today = new Date();
                const transactionDate = new Date(transaction.created_at);
                return transactionDate.toDateString() === today.toDateString();
            });
            
            res.status(200).json({
                success: true,
                message: 'Dashboard overview retrieved successfully',
                data: {
                    summary: {
                        total_customers: allCustomers.length,
                        total_accounts: allAccounts.length,
                        active_accounts: activeAccounts,
                        total_balance: totalBalance,
                        formatted_total_balance: `$${totalBalance.toFixed(2)}`
                    },
                    transaction_stats: {
                        period_days: parseInt(days),
                        today_transactions: todayTransactions.length,
                        ...overallStats
                    },
                    recent_transactions: recentTransactions.slice(0, 10),
                    account_types: {
                        savings: allAccounts.filter(acc => acc.account_type === 'savings').length,
                        checking: allAccounts.filter(acc => acc.account_type === 'checking').length
                    },
                    account_statuses: {
                        active: allAccounts.filter(acc => acc.status === 'active').length,
                        inactive: allAccounts.filter(acc => acc.status === 'inactive').length,
                        suspended: allAccounts.filter(acc => acc.status === 'suspended').length
                    }
                }
            });
            
        } catch (error) {
            console.error('Get dashboard overview error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while retrieving dashboard overview'
            });
        }
    }
    
    // Get all customers (for banker management)
    static async getAllCustomers(req, res) {
        try {
            const user = req.user; // From auth middleware
            
            // Ensure user is a banker
            if (!user.isBanker()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Banker role required.'
                });
            }
            
            const { page = 1, limit = 50 } = req.query;
            const offset = (parseInt(page) - 1) * parseInt(limit);
            
            // Get all customers with their account information
            const allCustomers = await User.getAllCustomers();
            
            // Apply pagination
            const paginatedCustomers = allCustomers.slice(offset, offset + parseInt(limit));
            
            res.status(200).json({
                success: true,
                message: 'Customers retrieved successfully',
                data: {
                    customers: paginatedCustomers,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: allCustomers.length,
                        total_pages: Math.ceil(allCustomers.length / parseInt(limit))
                    }
                }
            });
            
        } catch (error) {
            console.error('Get all customers error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while retrieving customers'
            });
        }
    }
    
    // Search customers and accounts
    static async searchCustomers(req, res) {
        try {
            const user = req.user; // From auth middleware
            const { query, type = 'all' } = req.query;
            
            // Ensure user is a banker
            if (!user.isBanker()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Banker role required.'
                });
            }
            
            if (!query || query.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    message: 'Search query must be at least 2 characters long'
                });
            }
            
            const searchTerm = query.trim().toLowerCase();
            
            // Get all customers with accounts
            const allCustomers = await User.getAllCustomers();
            
            // Filter based on search criteria
            let filteredResults = allCustomers.filter(customer => {
                const matchesName = `${customer.first_name} ${customer.last_name}`.toLowerCase().includes(searchTerm);
                const matchesUsername = customer.username.toLowerCase().includes(searchTerm);
                const matchesEmail = customer.email.toLowerCase().includes(searchTerm);
                const matchesAccount = customer.account && customer.account.account_number.toLowerCase().includes(searchTerm);
                
                if (type === 'name') return matchesName;
                if (type === 'username') return matchesUsername;
                if (type === 'email') return matchesEmail;
                if (type === 'account') return matchesAccount;
                
                return matchesName || matchesUsername || matchesEmail || matchesAccount;
            });
            
            res.status(200).json({
                success: true,
                message: `Found ${filteredResults.length} results for "${query}"`,
                data: {
                    results: filteredResults,
                    search_params: {
                        query: query,
                        type: type,
                        results_count: filteredResults.length
                    }
                }
            });
            
        } catch (error) {
            console.error('Search customers error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while searching customers'
            });
        }
    }
    
    // Update account status (activate/deactivate/suspend)
    static async updateAccountStatus(req, res) {
        try {
            const user = req.user; // From auth middleware
            const { accountId } = req.params;
            const { status, reason } = req.body;
            
            // Ensure user is a banker
            if (!user.isBanker()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Banker role required.'
                });
            }
            
            // Validation
            if (!accountId || isNaN(accountId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid account ID is required'
                });
            }
            
            const validStatuses = ['active', 'inactive', 'suspended'];
            if (!status || !validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid status is required (active, inactive, suspended)'
                });
            }
            
            // Find account
            const account = await Account.findById(parseInt(accountId));
            if (!account) {
                return res.status(404).json({
                    success: false,
                    message: 'Account not found'
                });
            }
            
            // Update account status
            const updatedAccount = await account.updateStatus(status);
            
            res.status(200).json({
                success: true,
                message: `Account status updated to ${status}`,
                data: {
                    account: {
                        id: updatedAccount.id,
                        account_number: updatedAccount.account_number,
                        previous_status: account.status,
                        new_status: updatedAccount.status,
                        updated_by: user.username,
                        reason: reason || 'No reason provided'
                    }
                }
            });
            
        } catch (error) {
            console.error('Update account status error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while updating account status'
            });
        }
    }
}

module.exports = BankerController;