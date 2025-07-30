const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');

class TransactionController {
    // Get transaction history (for both customers and bankers)
    static async getTransactionHistory(req, res) {
        try {
            const user = req.user; // From auth middleware
            const { page = 1, limit = 50, type, days = 30, account_id } = req.query;
            const offset = (parseInt(page) - 1) * parseInt(limit);
            
            let transactions = [];
            let accountInfo = null;
            
            if (user.isCustomer()) {
                // Customer can only see their own transactions
                const account = await Account.findByUserId(user.id);
                if (!account) {
                    return res.status(404).json({
                        success: false,
                        message: 'Customer account not found'
                    });
                }
                
                accountInfo = {
                    account_number: account.account_number,
                    balance: account.balance,
                    account_type: account.account_type
                };
                
                transactions = await Transaction.findByAccountId(account.id, parseInt(limit), offset);
                
            } else if (user.isBanker()) {
                // Banker can see all transactions or specific account transactions
                if (account_id) {
                    // Specific account transactions
                    const account = await Account.findById(parseInt(account_id));
                    if (!account) {
                        return res.status(404).json({
                            success: false,
                            message: 'Account not found'
                        });
                    }
                    
                    accountInfo = {
                        account_number: account.account_number,
                        balance: account.balance,
                        account_type: account.account_type
                    };
                    
                    transactions = await Transaction.findByAccountId(account.id, parseInt(limit), offset);
                } else {
                    // All transactions
                    transactions = await Transaction.getAllTransactions(parseInt(limit), offset);
                }
            } else {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
            
            // Apply type filter if specified
            if (type && ['deposit', 'withdrawal'].includes(type)) {
                transactions = transactions.filter(t => t.type === type);
            }
            
            res.status(200).json({
                success: true,
                message: 'Transaction history retrieved successfully',
                data: {
                    transactions,
                    account: accountInfo,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: transactions.length
                    },
                    filters: {
                        type: type || 'all',
                        days: parseInt(days),
                        account_id: account_id || null
                    }
                }
            });
            
        } catch (error) {
            console.error('Get transaction history error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while retrieving transaction history'
            });
        }
    }
    
    // Get transaction details by ID or reference number
    static async getTransactionDetails(req, res) {
        try {
            const user = req.user; // From auth middleware
            const { transactionId } = req.params;
            
            let transaction;
            
            // Check if it's a reference number or ID
            if (transactionId.startsWith('TXN')) {
                transaction = await Transaction.findByReferenceNumber(transactionId);
            } else if (!isNaN(transactionId)) {
                transaction = await Transaction.findById(parseInt(transactionId));
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid transaction identifier'
                });
            }
            
            if (!transaction) {
                return res.status(404).json({
                    success: false,
                    message: 'Transaction not found'
                });
            }
            
            // Authorization check
            if (user.isCustomer()) {
                // Customer can only see their own transactions
                const account = await Account.findByUserId(user.id);
                if (!account || transaction.account_id !== account.id) {
                    return res.status(403).json({
                        success: false,
                        message: 'Access denied. Transaction does not belong to your account.'
                    });
                }
            }
            // Bankers can see all transactions (no additional check needed)
            
            // Get transaction with full details
            const transactionWithDetails = await transaction.getWithAccountDetails();
            
            res.status(200).json({
                success: true,
                message: 'Transaction details retrieved successfully',
                data: transactionWithDetails
            });
            
        } catch (error) {
            console.error('Get transaction details error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while retrieving transaction details'
            });
        }
    }
    
    // Perform deposit (customer only)
    static async performDeposit(req, res) {
        try {
            const user = req.user; // From auth middleware
            const { amount, description = 'Deposit via Banking System' } = req.body;
            
            // Only customers can perform deposits
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
            
            // Business rules validation
            if (depositAmount > 50000) {
                return res.status(400).json({
                    success: false,
                    message: 'Deposit amount exceeds maximum limit of $50,000'
                });
            }
            
            if (depositAmount < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Minimum deposit amount is $1.00'
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
                message: 'Deposit completed successfully',
                data: {
                    transaction: {
                        id: result.transaction.id,
                        reference_number: result.transaction.reference_number,
                        type: result.transaction.type,
                        amount: result.transaction.amount,
                        description: result.transaction.description,
                        created_at: result.transaction.created_at
                    },
                    account: {
                        account_number: result.account.account_number,
                        previous_balance: result.transaction.balance_before,
                        new_balance: result.account.balance,
                        formatted_new_balance: result.account.getFormattedBalance()
                    }
                }
            });
            
        } catch (error) {
            console.error('Perform deposit error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during deposit transaction'
            });
        }
    }
    
    // Perform withdrawal (customer only)
    static async performWithdrawal(req, res) {
        try {
            const user = req.user; // From auth middleware
            const { amount, description = 'Withdrawal via Banking System' } = req.body;
            
            // Only customers can perform withdrawals
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
            
            // Business rules validation
            if (withdrawAmount < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Minimum withdrawal amount is $1.00'
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
            
            // Get current balance and check for sufficient funds
            const currentBalance = await account.getCurrentBalance();
            
            if (withdrawAmount > currentBalance) {
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient funds',
                    data: {
                        requested_amount: withdrawAmount,
                        available_balance: currentBalance,
                        shortfall: withdrawAmount - currentBalance,
                        formatted_available_balance: `$${currentBalance.toFixed(2)}`
                    }
                });
            }
            
            // Perform withdrawal
            const result = await account.withdraw(withdrawAmount, description);
            
            res.status(200).json({
                success: true,
                message: 'Withdrawal completed successfully',
                data: {
                    transaction: {
                        id: result.transaction.id,
                        reference_number: result.transaction.reference_number,
                        type: result.transaction.type,
                        amount: result.transaction.amount,
                        description: result.transaction.description,
                        created_at: result.transaction.created_at
                    },
                    account: {
                        account_number: result.account.account_number,
                        previous_balance: result.transaction.balance_before,
                        new_balance: result.account.balance,
                        formatted_new_balance: result.account.getFormattedBalance()
                    }
                }
            });
            
        } catch (error) {
            console.error('Perform withdrawal error:', error);
            
            // Handle specific insufficient funds error
            if (error.message === 'Insufficient funds') {
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient funds for this withdrawal'
                });
            }
            
            res.status(500).json({
                success: false,
                message: 'Internal server error during withdrawal transaction'
            });
        }
    }
    
    // Get transaction statistics
    static async getTransactionStatistics(req, res) {
        try {
            const user = req.user; // From auth middleware
            const { days = 30, account_id } = req.query;
            
            let stats;
            let accountInfo = null;
            
            if (user.isCustomer()) {
                // Customer can only see their own account statistics
                const account = await Account.findByUserId(user.id);
                if (!account) {
                    return res.status(404).json({
                        success: false,
                        message: 'Customer account not found'
                    });
                }
                
                accountInfo = {
                    account_number: account.account_number,
                    balance: account.balance,
                    account_type: account.account_type
                };
                
                stats = await Transaction.getStatistics(account.id, parseInt(days));
                
            } else if (user.isBanker()) {
                // Banker can see statistics for specific account or overall
                if (account_id) {
                    const account = await Account.findById(parseInt(account_id));
                    if (!account) {
                        return res.status(404).json({
                            success: false,
                            message: 'Account not found'
                        });
                    }
                    
                    accountInfo = {
                        account_number: account.account_number,
                        balance: account.balance,
                        account_type: account.account_type
                    };
                    
                    stats = await Transaction.getStatistics(account.id, parseInt(days));
                } else {
                    // Overall system statistics
                    stats = await Transaction.getStatistics(null, parseInt(days));
                }
            } else {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
            
            res.status(200).json({
                success: true,
                message: 'Transaction statistics retrieved successfully',
                data: {
                    statistics: {
                        period_days: parseInt(days),
                        ...stats
                    },
                    account: accountInfo,
                    generated_at: new Date().toISOString()
                }
            });
            
        } catch (error) {
            console.error('Get transaction statistics error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while retrieving transaction statistics'
            });
        }
    }
    
    // Search transactions
    static async searchTransactions(req, res) {
        try {
            const user = req.user; // From auth middleware
            const { query, type, start_date, end_date, min_amount, max_amount } = req.query;
            
            // Basic validation
            if (!query || query.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    message: 'Search query must be at least 2 characters long'
                });
            }
            
            let transactions = [];
            
            if (user.isCustomer()) {
                // Customer can only search their own transactions
                const account = await Account.findByUserId(user.id);
                if (!account) {
                    return res.status(404).json({
                        success: false,
                        message: 'Customer account not found'
                    });
                }
                
                transactions = await Transaction.findByAccountId(account.id, 1000, 0);
                
            } else if (user.isBanker()) {
                // Banker can search all transactions
                transactions = await Transaction.getAllTransactions(1000, 0);
            } else {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
            
            // Apply filters
            const searchTerm = query.trim().toLowerCase();
            
            let filteredTransactions = transactions.filter(transaction => {
                // Search in description and reference number
                const matchesDescription = transaction.description && transaction.description.toLowerCase().includes(searchTerm);
                const matchesReference = transaction.reference_number.toLowerCase().includes(searchTerm);
                
                return matchesDescription || matchesReference;
            });
            
            // Apply additional filters
            if (type && ['deposit', 'withdrawal'].includes(type)) {
                filteredTransactions = filteredTransactions.filter(t => t.type === type);
            }
            
            if (min_amount && !isNaN(min_amount)) {
                filteredTransactions = filteredTransactions.filter(t => t.amount >= parseFloat(min_amount));
            }
            
            if (max_amount && !isNaN(max_amount)) {
                filteredTransactions = filteredTransactions.filter(t => t.amount <= parseFloat(max_amount));
            }
            
            if (start_date) {
                const startDate = new Date(start_date);
                filteredTransactions = filteredTransactions.filter(t => new Date(t.created_at) >= startDate);
            }
            
            if (end_date) {
                const endDate = new Date(end_date);
                filteredTransactions = filteredTransactions.filter(t => new Date(t.created_at) <= endDate);
            }
            
            res.status(200).json({
                success: true,
                message: `Found ${filteredTransactions.length} transactions matching your search`,
                data: {
                    transactions: filteredTransactions,
                    search_params: {
                        query,
                        type: type || 'all',
                        start_date: start_date || null,
                        end_date: end_date || null,
                        min_amount: min_amount || null,
                        max_amount: max_amount || null,
                        results_count: filteredTransactions.length
                    }
                }
            });
            
        } catch (error) {
            console.error('Search transactions error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while searching transactions'
            });
        }
    }
}

module.exports = TransactionController;