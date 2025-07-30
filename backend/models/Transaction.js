const { pool } = require('../config/database');

class Transaction {
    constructor(transactionData) {
        this.id = transactionData.id;
        this.account_id = transactionData.account_id;
        this.type = transactionData.type;
        this.amount = parseFloat(transactionData.amount);
        this.balance_before = parseFloat(transactionData.balance_before);
        this.balance_after = parseFloat(transactionData.balance_after);
        this.description = transactionData.description;
        this.reference_number = transactionData.reference_number;
        this.created_at = transactionData.created_at;
    }

    // Create a new transaction
    static async create(transactionData, connection = null) {
        try {
            const { 
                account_id, 
                type, 
                amount, 
                balance_before, 
                balance_after, 
                description = '' 
            } = transactionData;
            
            const db = connection || pool;
            
            // Generate reference number
            const reference_number = await Transaction.generateReferenceNumber(account_id, db);
            
            const [result] = await db.execute(
                `INSERT INTO transactions 
                 (account_id, type, amount, balance_before, balance_after, description, reference_number) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [account_id, type, amount, balance_before, balance_after, description, reference_number]
            );
            
            return await Transaction.findById(result.insertId, db);
        } catch (error) {
            throw error;
        }
    }

    // Generate unique reference number
    static async generateReferenceNumber(account_id, connection = null) {
        try {
            const db = connection || pool;
            
            // Format: TXN + account_id (3 digits) + timestamp + random
            const accountPart = account_id.toString().padStart(3, '0');
            const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
            const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            
            const referenceNumber = `TXN${accountPart}${timestamp}${random}`;
            
            // Check if this reference number already exists (very unlikely but safe)
            const [existing] = await db.execute(
                'SELECT id FROM transactions WHERE reference_number = ?',
                [referenceNumber]
            );
            
            if (existing.length > 0) {
                // If by chance it exists, add more randomness
                const extraRandom = Math.floor(Math.random() * 100).toString().padStart(2, '0');
                return `${referenceNumber}${extraRandom}`;
            }
            
            return referenceNumber;
        } catch (error) {
            throw error;
        }
    }

    // Find transaction by ID
    static async findById(id, connection = null) {
        try {
            const db = connection || pool;
            
            const [rows] = await db.execute(
                'SELECT * FROM transactions WHERE id = ?',
                [id]
            );
            
            return rows.length > 0 ? new Transaction(rows[0]) : null;
        } catch (error) {
            throw error;
        }
    }

    // Find transaction by reference number
    static async findByReferenceNumber(reference_number) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM transactions WHERE reference_number = ?',
                [reference_number]
            );
            
            return rows.length > 0 ? new Transaction(rows[0]) : null;
        } catch (error) {
            throw error;
        }
    }

    // Get transactions by account ID
    static async findByAccountId(account_id, limit = 50, offset = 0) {
        try {
            // Convert to integers to ensure they're numbers
            const limitNum = parseInt(limit) || 50;
            const offsetNum = parseInt(offset) || 0;
            
            const [rows] = await pool.execute(
                `SELECT * FROM transactions 
                 WHERE account_id = ? 
                 ORDER BY created_at DESC 
                 LIMIT ${limitNum} OFFSET ${offsetNum}`,
                [account_id]
            );
            
            return rows.map(row => new Transaction(row));
        } catch (error) {
            throw error;
        }
    }

    // Get transactions by user ID (through account)
    static async findByUserId(user_id, limit = 50, offset = 0) {
        try {
            const limitNum = parseInt(limit) || 50;
            const offsetNum = parseInt(offset) || 0;
            
            const [rows] = await pool.execute(
                `SELECT t.*, a.account_number, a.account_type 
                 FROM transactions t 
                 JOIN accounts a ON t.account_id = a.id 
                 WHERE a.user_id = ? 
                 ORDER BY t.created_at DESC 
                 LIMIT ${limitNum} OFFSET ${offsetNum}`,
                [user_id]
            );
            
            return rows.map(row => ({
                ...new Transaction(row),
                account: {
                    account_number: row.account_number,
                    account_type: row.account_type
                }
            }));
        } catch (error) {
            throw error;
        }
    }

    // Get all transactions (for banker dashboard)
    static async getAllTransactions(limit = 100, offset = 0) {
        try {
            const limitNum = parseInt(limit) || 100;
            const offsetNum = parseInt(offset) || 0;
            
            const [rows] = await pool.execute(
                `SELECT t.*, a.account_number, a.account_type, 
                        u.username, u.first_name, u.last_name 
                 FROM transactions t 
                 JOIN accounts a ON t.account_id = a.id 
                 JOIN users u ON a.user_id = u.id 
                 ORDER BY t.created_at DESC 
                 LIMIT ${limitNum} OFFSET ${offsetNum}`,
                []
            );
            
            return rows.map(row => ({
                ...new Transaction(row),
                account: {
                    account_number: row.account_number,
                    account_type: row.account_type
                },
                user: {
                    username: row.username,
                    first_name: row.first_name,
                    last_name: row.last_name
                }
            }));
        } catch (error) {
            throw error;
        }
    }

    // Get transactions by type
    static async findByType(type, limit = 50, offset = 0) {
        try {
            const limitNum = parseInt(limit) || 50;
            const offsetNum = parseInt(offset) || 0;
            
            const [rows] = await pool.execute(
                `SELECT t.*, a.account_number, u.username, u.first_name, u.last_name 
                 FROM transactions t 
                 JOIN accounts a ON t.account_id = a.id 
                 JOIN users u ON a.user_id = u.id 
                 WHERE t.type = ? 
                 ORDER BY t.created_at DESC 
                 LIMIT ${limitNum} OFFSET ${offsetNum}`,
                [type]
            );
            
            return rows.map(row => ({
                ...new Transaction(row),
                account: {
                    account_number: row.account_number
                },
                user: {
                    username: row.username,
                    first_name: row.first_name,
                    last_name: row.last_name
                }
            }));
        } catch (error) {
            throw error;
        }
    }

    // Get transactions within date range
    static async findByDateRange(startDate, endDate, account_id = null, limit = 100) {
        try {
            const limitNum = parseInt(limit) || 100;
            
            let query = `
                SELECT t.*, a.account_number, a.account_type, 
                       u.username, u.first_name, u.last_name 
                FROM transactions t 
                JOIN accounts a ON t.account_id = a.id 
                JOIN users u ON a.user_id = u.id 
                WHERE t.created_at BETWEEN ? AND ?
            `;
            
            let params = [startDate, endDate];
            
            if (account_id) {
                query += ' AND t.account_id = ?';
                params.push(account_id);
            }
            
            query += ` ORDER BY t.created_at DESC LIMIT ${limitNum}`;
            
            const [rows] = await pool.execute(query, params);
            
            return rows.map(row => ({
                ...new Transaction(row),
                account: {
                    account_number: row.account_number,
                    account_type: row.account_type
                },
                user: {
                    username: row.username,
                    first_name: row.first_name,
                    last_name: row.last_name
                }
            }));
        } catch (error) {
            throw error;
        }
    }

    // Get transaction statistics
    static async getStatistics(account_id = null, days = 30) {
        try {
            let query = `
                SELECT 
                    COUNT(*) as total_transactions,
                    COUNT(CASE WHEN type = 'deposit' THEN 1 END) as total_deposits,
                    COUNT(CASE WHEN type = 'withdrawal' THEN 1 END) as total_withdrawals,
                    SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END) as total_deposit_amount,
                    SUM(CASE WHEN type = 'withdrawal' THEN amount ELSE 0 END) as total_withdrawal_amount,
                    AVG(amount) as average_transaction_amount,
                    MAX(amount) as largest_transaction,
                    MIN(amount) as smallest_transaction
                FROM transactions t
            `;
            
            let params = [];
            
            if (account_id) {
                query += ' WHERE t.account_id = ? AND t.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)';
                params = [account_id, days];
            } else {
                query += ' WHERE t.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)';
                params = [days];
            }
            
            const [rows] = await pool.execute(query, params);
            
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Update transaction description
    async updateDescription(newDescription) {
        try {
            await pool.execute(
                'UPDATE transactions SET description = ? WHERE id = ?',
                [newDescription, this.id]
            );
            
            this.description = newDescription;
            return this;
        } catch (error) {
            throw error;
        }
    }

    // Check if transaction is deposit
    isDeposit() {
        return this.type === 'deposit';
    }

    // Check if transaction is withdrawal
    isWithdrawal() {
        return this.type === 'withdrawal';
    }

    // Format amount for display
    getFormattedAmount() {
        const sign = this.isDeposit() ? '+' : '-';
        return `${sign}$${this.amount.toFixed(2)}`;
    }

    // Get transaction with account details
    async getWithAccountDetails() {
        try {
            const [rows] = await pool.execute(
                `SELECT t.*, a.account_number, a.account_type, a.balance,
                        u.username, u.first_name, u.last_name, u.email 
                 FROM transactions t 
                 JOIN accounts a ON t.account_id = a.id 
                 JOIN users u ON a.user_id = u.id 
                 WHERE t.id = ?`,
                [this.id]
            );
            
            if (rows.length === 0) {
                throw new Error('Transaction not found');
            }
            
            const row = rows[0];
            return {
                ...this,
                account: {
                    account_number: row.account_number,
                    account_type: row.account_type,
                    current_balance: row.balance
                },
                user: {
                    username: row.username,
                    first_name: row.first_name,
                    last_name: row.last_name,
                    email: row.email
                }
            };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Transaction;