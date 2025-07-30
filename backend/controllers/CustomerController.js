const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');

class CustomerController {
    // Get customer transaction history
    static async getTransactions(req, res) {
        try {
            const user = req.user; // From auth middleware
            const { page = 1, limit = 50, type } = req.query;
            
            // Ensure user is a customer
            if (!user.isCustomer()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Customer role required.'
                });
            }
            
            const offset = (parseInt(page) - 1) * parseInt(limit);
            
            // Get customer's account
            const account = await Account.findByUserId(user.id);
            if (!account) {
                return res.status(404).json({
                    success: false,
                    message: 'Customer account not found'
                });
            }
            
            let transactions;
            
            if (type && ['deposit', 'withdrawal'].includes(type)) {
                // Get transactions by type
                const [allTransactionsByType] = await Transaction.findByType(type);
                transactions = allTransactionsByType.filter(t => t.account_id === account.id);
            } else {
                // Get all transactions for the account
                transactions = await Transaction.findByAccountId(account.id, parseInt(limit), offset);
            }
            
            res.status(200).json({
                success: true,
                message: 'Transactions retrieved successfully',
                data: {
                    transactions,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: transactions.length
                    },
                    account: {
                        account_number: account.account_number,
                        current_balance: account.balance,
                        account_type: account.account_type
                    }
                }
            });
            
        } catch (error) {
            console.error('Get transactions error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while retrieving transactions'
            });
        }
    }
    
    // Deposit money
    static async deposit(req, res) {
        try {
            const user = req.user; // From auth middleware
            const { amount, description = 'Deposit via Banking App' } = req.body;
            
            // Ensure user is a customer
            if (!user.isCustomer()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Customer role required.'
                });
            }
            
            // Validation
            if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid deposit amount is required'
                });
            }
            
            const depositAmount = parseFloat(amount);
            
            // Check for reasonable deposit limits (optional business rule)
            if (depositAmount > 50000) {
                return res.status(400).json({
                    success: false,
                    message: 'Deposit amount exceeds maximum limit of $50,000'
                });
            }
            
            // Get customer's account
            const account = await Account.findByUserId(user.id);
            if (!account) {
                return res.status(404).json({
                    success: false,
                    message: 'Customer account not found'
                });
            }
            
            // Check if account is active
            if (!account.isActive()) {
                return res.status(400).json({
                    success: false,
                    message: 'Account is not active for transactions'
                });
            }
            
            // Perform deposit
            const result = await account.deposit(depositAmount, description);
            
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
            console.error('Deposit error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during deposit'
            });
        }
    }
    
    // Withdraw money
    static async withdraw(req, res) {
        try {
            const user = req.user; // From auth middleware
            const { amount, description = 'Withdrawal via Banking App' } = req.body;
            
            // Ensure user is a customer
            if (!user.isCustomer()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Customer role required.'
                });
            }
            
            // Validation
            if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid withdrawal amount is required'
                });
            }
            
            const withdrawAmount = parseFloat(amount);
            
            // Get customer's account
            const account = await Account.findByUserId(user.id);
            if (!account) {
                return res.status(404).json({
                    success: false,
                    message: 'Customer account not found'
                });
            }
            
            // Check if account is active
            if (!account.isActive()) {
                return res.status(400).json({
                    success: false,
                    message: 'Account is not active for transactions'
                });
            }
            
            // Get current balance
            const currentBalance = await account.getCurrentBalance();
            
            // Check for insufficient funds
            if (withdrawAmount > currentBalance) {
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient funds',
                    data: {
                        requested_amount: withdrawAmount,
                        available_balance: currentBalance,
                        shortfall: withdrawAmount - currentBalance
                    }
                });
            }
            
            // Perform withdrawal
            const result = await account.withdraw(withdrawAmount, description);
            
            res.status(200).json({
                success: true,
                message: 'Withdrawal successful',
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
            console.error('Withdrawal error:', error);
            
            // Handle specific insufficient funds error
            if (error.message === 'Insufficient funds') {
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient funds'
                });
            }
            
            res.status(500).json({
                success: false,
                message: 'Internal server error during withdrawal'
            });
        }
    }
    
    // Get current account balance
    static async getBalance(req, res) {
        try {
            const user = req.user; // From auth middleware
            
            // Ensure user is a customer
            if (!user.isCustomer()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Customer role required.'
                });
            }
            
            // Get customer's account
            const account = await Account.findByUserId(user.id);
            if (!account) {
                return res.status(404).json({
                    success: false,
                    message: 'Customer account not found'
                });
            }
            
            // Get current balance and account summary
            const summary = await account.getSummary();
            
            console.log('Debug - Account balance:', account.balance);
            console.log('Debug - Summary data:', summary.summary);
            
            res.status(200).json({
                success: true,
                message: 'Account balance retrieved successfully',
                data: {
                    balance: parseFloat(account.balance) || 0,
                    account: {
                        account_number: account.account_number,
                        balance: parseFloat(account.balance) || 0,
                        formatted_balance: account.getFormattedBalance(),
                        account_type: account.account_type,
                        status: account.status
                    },
                    summary: {
                        total_transactions: parseInt(summary.summary.total_transactions) || 0,
                        total_deposits: parseInt(summary.summary.total_deposits) || 0,
                        total_withdrawals: parseInt(summary.summary.total_withdrawals) || 0,
                        total_deposit_amount: parseFloat(summary.summary.total_deposit_amount) || 0,
                        total_withdrawal_amount: parseFloat(summary.summary.total_withdrawal_amount) || 0
                    },
                    recent_transactions: summary.recent_transactions.slice(0, 5) // Last 5 transactions
                }
            });
            
        } catch (error) {
            console.error('Get balance error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while retrieving balance'
            });
        }
    }
    
    // Get account summary and statistics
    static async getAccountSummary(req, res) {
        try {
            const user = req.user; // From auth middleware
            const { days = 30 } = req.query;
            
            // Ensure user is a customer
            if (!user.isCustomer()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Customer role required.'
                });
            }
            
            // Get customer's account
            const account = await Account.findByUserId(user.id);
            if (!account) {
                return res.status(404).json({
                    success: false,
                    message: 'Customer account not found'
                });
            }
            
            // Get account summary
            const summary = await account.getSummary();
            
            // Get transaction statistics for the specified period
            const stats = await Transaction.getStatistics(account.id, parseInt(days));
            
            res.status(200).json({
                success: true,
                message: 'Account summary retrieved successfully',
                data: {
                    account: {
                        account_number: account.account_number,
                        balance: parseFloat(account.balance) || 0,
                        formatted_balance: account.getFormattedBalance(),
                        account_type: account.account_type,
                        status: account.status,
                        created_at: account.created_at
                    },
                    total_transactions: parseInt(stats.total_transactions) || 0,
                    total_deposits: parseInt(stats.total_deposits) || 0,
                    total_withdrawals: parseInt(stats.total_withdrawals) || 0,
                    total_deposit_amount: parseFloat(stats.total_deposit_amount) || 0,
                    total_withdrawal_amount: parseFloat(stats.total_withdrawal_amount) || 0,
                    period_days: parseInt(days),
                    recent_transactions: summary.recent_transactions
                }
            });
            
        } catch (error) {
            console.error('Get account summary error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while retrieving account summary'
            });
        }
    }
    
    // Get transaction by reference number
    static async getTransactionByReference(req, res) {
        try {
            const user = req.user; // From auth middleware
            const { reference_number } = req.params;
            
            // Ensure user is a customer
            if (!user.isCustomer()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Customer role required.'
                });
            }
            
            // Get customer's account
            const account = await Account.findByUserId(user.id);
            if (!account) {
                return res.status(404).json({
                    success: false,
                    message: 'Customer account not found'
                });
            }
            
            // Find transaction
            const transaction = await Transaction.findByReferenceNumber(reference_number);
            if (!transaction) {
                return res.status(404).json({
                    success: false,
                    message: 'Transaction not found'
                });
            }
            
            // Ensure transaction belongs to this customer's account
            if (transaction.account_id !== account.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Transaction does not belong to your account.'
                });
            }
            
            // Get transaction with account details
            const transactionWithDetails = await transaction.getWithAccountDetails();
            
            res.status(200).json({
                success: true,
                message: 'Transaction retrieved successfully',
                data: transactionWithDetails
            });
            
        } catch (error) {
            console.error('Get transaction by reference error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while retrieving transaction'
            });
        }
    }
}

module.exports = CustomerController;