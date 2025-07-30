const { pool } = require('../config/database');

class Account {
    constructor(accountData) {
        this.id = accountData.id;
        this.user_id = accountData.user_id;
        this.account_number = accountData.account_number;
        this.balance = parseFloat(accountData.balance) || 0.00;
        this.account_type = accountData.account_type;
        this.status = accountData.status || 'active';
        this.created_at = accountData.created_at;
        this.updated_at = accountData.updated_at;
    }

    // Create a new account
    static async create(accountData) {
        try {
            const { user_id, account_type = 'savings', initial_balance = 0.00 } = accountData;
            
            // Generate account number
            const account_number = await Account.generateAccountNumber(user_id);
            
            const [result] = await pool.execute(
                `INSERT INTO accounts (user_id, account_number, balance, account_type, status) 
                 VALUES (?, ?, ?, ?, 'active')`,
                [user_id, account_number, initial_balance, account_type]
            );
            
            return await Account.findById(result.insertId);
        } catch (error) {
            throw error;
        }
    }

    // Generate unique account number
    static async generateAccountNumber(user_id) {
        try {
            // Format: ACC + user_id (3 digits) + sequence (6 digits)
            const [countResult] = await pool.execute(
                'SELECT COUNT(*) as count FROM accounts WHERE user_id = ?',
                [user_id]
            );
            
            const sequence = (countResult[0].count + 1).toString().padStart(6, '0');
            const userPart = user_id.toString().padStart(3, '0');
            
            return `ACC${userPart}${sequence}`;
        } catch (error) {
            throw error;
        }
    }

    // Find account by ID
    static async findById(id) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM accounts WHERE id = ?',
                [id]
            );
            
            return rows.length > 0 ? new Account(rows[0]) : null;
        } catch (error) {
            throw error;
        }
    }

    // Find account by account number
    static async findByAccountNumber(account_number) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM accounts WHERE account_number = ?',
                [account_number]
            );
            
            return rows.length > 0 ? new Account(rows[0]) : null;
        } catch (error) {
            throw error;
        }
    }

    // Find account by user ID
    static async findByUserId(user_id) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM accounts WHERE user_id = ?',
                [user_id]
            );
            
            return rows.length > 0 ? new Account(rows[0]) : null;
        } catch (error) {
            throw error;
        }
    }

    // Get all accounts (for banker dashboard)
    static async getAllAccounts() {
        try {
            const [rows] = await pool.execute(
                `SELECT a.*, u.username, u.first_name, u.last_name, u.email, u.phone 
                 FROM accounts a 
                 JOIN users u ON a.user_id = u.id 
                 WHERE u.role = 'customer' 
                 ORDER BY a.created_at DESC`
            );
            
            return rows.map(row => ({
                ...new Account(row),
                user: {
                    username: row.username,
                    first_name: row.first_name,
                    last_name: row.last_name,
                    email: row.email,
                    phone: row.phone
                }
            }));
        } catch (error) {
            throw error;
        }
    }

    // Update balance (used internally by transaction methods)
    async updateBalance(newBalance, connection = null) {
        try {
            const db = connection || pool;
            
            await db.execute(
                'UPDATE accounts SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [newBalance, this.id]
            );
            
            this.balance = parseFloat(newBalance);
            return this;
        } catch (error) {
            throw error;
        }
    }

    // Deposit money
    async deposit(amount, description = 'Deposit') {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();
            
            const depositAmount = parseFloat(amount);
            if (depositAmount <= 0) {
                throw new Error('Deposit amount must be positive');
            }
            
            const balanceBefore = this.balance;
            const balanceAfter = balanceBefore + depositAmount;
            
            // Update account balance
            await this.updateBalance(balanceAfter, connection);
            
            // Create transaction record
            const Transaction = require('./Transaction');
            const transaction = await Transaction.create({
                account_id: this.id,
                type: 'deposit',
                amount: depositAmount,
                balance_before: balanceBefore,
                balance_after: balanceAfter,
                description: description
            }, connection);
            
            await connection.commit();
            
            return {
                account: this,
                transaction: transaction
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Withdraw money
    async withdraw(amount, description = 'Withdrawal') {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();
            
            const withdrawAmount = parseFloat(amount);
            if (withdrawAmount <= 0) {
                throw new Error('Withdrawal amount must be positive');
            }
            
            const balanceBefore = this.balance;
            const balanceAfter = balanceBefore - withdrawAmount;
            
            // Check for insufficient funds
            if (balanceAfter < 0) {
                throw new Error('Insufficient funds');
            }
            
            // Update account balance
            await this.updateBalance(balanceAfter, connection);
            
            // Create transaction record
            const Transaction = require('./Transaction');
            const transaction = await Transaction.create({
                account_id: this.id,
                type: 'withdrawal',
                amount: withdrawAmount,
                balance_before: balanceBefore,
                balance_after: balanceAfter,
                description: description
            }, connection);
            
            await connection.commit();
            
            return {
                account: this,
                transaction: transaction
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Get current balance
    async getCurrentBalance() {
        try {
            const [rows] = await pool.execute(
                'SELECT balance FROM accounts WHERE id = ?',
                [this.id]
            );
            
            if (rows.length > 0) {
                this.balance = parseFloat(rows[0].balance);
                return this.balance;
            }
            
            throw new Error('Account not found');
        } catch (error) {
            throw error;
        }
    }

    // Update account status
    async updateStatus(status) {
        try {
            const validStatuses = ['active', 'inactive', 'suspended'];
            if (!validStatuses.includes(status)) {
                throw new Error('Invalid account status');
            }
            
            await pool.execute(
                'UPDATE accounts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [status, this.id]
            );
            
            this.status = status;
            return this;
        } catch (error) {
            throw error;
        }
    }

    // Check if account is active
    isActive() {
        return this.status === 'active';
    }

    // Get account summary
    async getSummary() {
        try {
            const Transaction = require('./Transaction');
            const transactions = await Transaction.findByAccountId(this.id, 5, 0); // Last 5 transactions
            
            const [summaryResult] = await pool.execute(
                `SELECT 
                    COUNT(CASE WHEN type = 'deposit' THEN 1 END) as total_deposits,
                    COUNT(CASE WHEN type = 'withdrawal' THEN 1 END) as total_withdrawals,
                    SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END) as total_deposit_amount,
                    SUM(CASE WHEN type = 'withdrawal' THEN amount ELSE 0 END) as total_withdrawal_amount,
                    COUNT(*) as total_transactions
                 FROM transactions 
                 WHERE account_id = ?`,
                [this.id]
            );
            
            return {
                account: this,
                summary: summaryResult[0],
                recent_transactions: transactions
            };
        } catch (error) {
            throw error;
        }
    }

    // Delete account (soft delete by setting status to inactive)
    async delete() {
        try {
            await this.updateStatus('inactive');
            return true;
        } catch (error) {
            throw error;
        }
    }

    // Format balance for display
    getFormattedBalance() {
        const balance = parseFloat(this.balance) || 0;
        return `$${balance.toFixed(2)}`;
    }
}

module.exports = Account;