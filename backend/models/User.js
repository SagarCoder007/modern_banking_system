const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    constructor(userData) {
        this.id = userData.id;
        this.username = userData.username;
        this.email = userData.email;
        this.password = userData.password;
        this.role = userData.role;
        this.first_name = userData.first_name;
        this.last_name = userData.last_name;
        this.phone = userData.phone;
        this.created_at = userData.created_at;
        this.updated_at = userData.updated_at;
    }

    // Create a new user
    static async create(userData) {
        try {
            const { username, email, password, role, first_name, last_name, phone } = userData;
            
            // Hash password
            const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            
            const [result] = await pool.execute(
                `INSERT INTO users (username, email, password, role, first_name, last_name, phone) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [username, email, hashedPassword, role, first_name, last_name, phone]
            );
            
            return await User.findById(result.insertId);
        } catch (error) {
            throw error;
        }
    }

    // Find user by ID
    static async findById(id) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM users WHERE id = ?',
                [id]
            );
            
            return rows.length > 0 ? new User(rows[0]) : null;
        } catch (error) {
            throw error;
        }
    }

    // Find user by username
    static async findByUsername(username) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM users WHERE username = ?',
                [username]
            );
            
            return rows.length > 0 ? new User(rows[0]) : null;
        } catch (error) {
            throw error;
        }
    }

    // Find user by email
    static async findByEmail(email) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );
            
            return rows.length > 0 ? new User(rows[0]) : null;
        } catch (error) {
            throw error;
        }
    }

    // Find user by username or email (for login)
    static async findByCredentials(identifier) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM users WHERE username = ? OR email = ?',
                [identifier, identifier]
            );
            
            return rows.length > 0 ? new User(rows[0]) : null;
        } catch (error) {
            throw error;
        }
    }

    // Verify password
    async verifyPassword(password) {
        try {
            return await bcrypt.compare(password, this.password);
        } catch (error) {
            throw error;
        }
    }

    // Get all customers (for banker dashboard)
    static async getAllCustomers() {
        try {
            const [rows] = await pool.execute(
                `SELECT u.*, a.account_number, a.balance, a.account_type, a.status 
                 FROM users u 
                 LEFT JOIN accounts a ON u.id = a.user_id 
                 WHERE u.role = 'customer' 
                 ORDER BY u.created_at DESC`
            );
            
            return rows.map(row => ({
                ...new User(row),
                account: row.account_number ? {
                    account_number: row.account_number,
                    balance: row.balance,
                    account_type: row.account_type,
                    status: row.status
                } : null
            }));
        } catch (error) {
            throw error;
        }
    }

    // Get all bankers
    static async getAllBankers() {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM users WHERE role = "banker" ORDER BY created_at DESC'
            );
            
            return rows.map(row => new User(row));
        } catch (error) {
            throw error;
        }
    }

    // Update user information
    async update(updateData) {
        try {
            const fields = [];
            const values = [];
            
            // Build dynamic update query
            Object.keys(updateData).forEach(key => {
                if (updateData[key] !== undefined && key !== 'id') {
                    fields.push(`${key} = ?`);
                    values.push(updateData[key]);
                }
            });
            
            if (fields.length === 0) {
                throw new Error('No fields to update');
            }
            
            values.push(this.id);
            
            await pool.execute(
                `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                values
            );
            
            // Return updated user
            return await User.findById(this.id);
        } catch (error) {
            throw error;
        }
    }

    // Change password
    async changePassword(newPassword) {
        try {
            const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
            
            await pool.execute(
                'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [hashedPassword, this.id]
            );
            
            return true;
        } catch (error) {
            throw error;
        }
    }

    // Delete user
    async delete() {
        try {
            await pool.execute('DELETE FROM users WHERE id = ?', [this.id]);
            return true;
        } catch (error) {
            throw error;
        }
    }

    // Get user without sensitive information
    toSafeObject() {
        const { password, ...safeUser } = this;
        return safeUser;
    }

    // Check if user is banker
    isBanker() {
        return this.role === 'banker';
    }

    // Check if user is customer
    isCustomer() {
        return this.role === 'customer';
    }
}

module.exports = User;