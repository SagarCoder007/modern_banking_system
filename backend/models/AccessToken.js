const { pool } = require('../config/database');
const crypto = require('crypto');
const User = require('./User');

class AccessToken {
    constructor(tokenData) {
        this.id = tokenData.id;
        this.user_id = tokenData.user_id;
        this.token = tokenData.token;
        this.expires_at = tokenData.expires_at;
        this.created_at = tokenData.created_at;
    }

    // Generate 36-character alphanumeric token
    static generateToken() {
        // Generate a 36-character alphanumeric string
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        
        for (let i = 0; i < 36; i++) {
            token += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        return token;
    }

    // Create a new access token
    static async create(user_id, expiresInHours = 24) {
        try {
            // Generate unique 36-character token
            let token;
            let isUnique = false;
            
            while (!isUnique) {
                token = AccessToken.generateToken();
                const existing = await AccessToken.findByToken(token);
                isUnique = !existing;
            }
            
            // Calculate expiration time
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + expiresInHours);
            
            // Clean up old tokens for this user
            await AccessToken.deleteExpiredTokens(user_id);
            
            // Insert new token
            const [result] = await pool.execute(
                'INSERT INTO accesstokens (user_id, token, expires_at) VALUES (?, ?, ?)',
                [user_id, token, expiresAt]
            );
            
            return await AccessToken.findById(result.insertId);
        } catch (error) {
            throw error;
        }
    }

    // Find token by ID
    static async findById(id) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM accesstokens WHERE id = ?',
                [id]
            );
            
            return rows.length > 0 ? new AccessToken(rows[0]) : null;
        } catch (error) {
            throw error;
        }
    }

    // Find token by token string
    static async findByToken(token) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM accesstokens WHERE token = ?',
                [token]
            );
            
            return rows.length > 0 ? new AccessToken(rows[0]) : null;
        } catch (error) {
            throw error;
        }
    }

    // Find valid token by token string
    static async findValidToken(token) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM accesstokens WHERE token = ? AND expires_at > NOW()',
                [token]
            );
            
            return rows.length > 0 ? new AccessToken(rows[0]) : null;
        } catch (error) {
            throw error;
        }
    }

    // Find tokens by user ID
    static async findByUserId(user_id) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM accesstokens WHERE user_id = ? ORDER BY created_at DESC',
                [user_id]
            );
            
            return rows.map(row => new AccessToken(row));
        } catch (error) {
            throw error;
        }
    }

    // Find valid tokens by user ID
    static async findValidTokensByUserId(user_id) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM accesstokens WHERE user_id = ? AND expires_at > NOW() ORDER BY created_at DESC',
                [user_id]
            );
            
            return rows.map(row => new AccessToken(row));
        } catch (error) {
            throw error;
        }
    }

    // Verify token and get user
    static async verifyTokenAndGetUser(token) {
        try {
            const [rows] = await pool.execute(
                `SELECT t.*, u.id as user_id, u.username, u.email, u.role, 
                        u.first_name, u.last_name, u.phone, u.created_at as user_created_at 
                 FROM accesstokens t 
                 JOIN users u ON t.user_id = u.id 
                 WHERE t.token = ? AND t.expires_at > NOW()`,
                [token]
            );
            
            if (rows.length === 0) {
                return null;
            }
            
            const row = rows[0];
            return {
                token: new AccessToken(row),
                user: new User({
                    id: row.user_id,
                    username: row.username,
                    email: row.email,
                    role: row.role,
                    first_name: row.first_name,
                    last_name: row.last_name,
                    phone: row.phone,
                    created_at: row.user_created_at
                })
            };
        } catch (error) {
            throw error;
        }
    }

    // Refresh token (extend expiration)
    async refresh(expiresInHours = 24) {
        try {
            const newExpiresAt = new Date();
            newExpiresAt.setHours(newExpiresAt.getHours() + expiresInHours);
            
            await pool.execute(
                'UPDATE accesstokens SET expires_at = ? WHERE id = ?',
                [newExpiresAt, this.id]
            );
            
            this.expires_at = newExpiresAt;
            return this;
        } catch (error) {
            throw error;
        }
    }

    // Delete token (logout)
    async delete() {
        try {
            await pool.execute(
                'DELETE FROM accesstokens WHERE id = ?',
                [this.id]
            );
            
            return true;
        } catch (error) {
            throw error;
        }
    }

    // Delete all tokens for user (logout from all devices)
    static async deleteAllUserTokens(user_id) {
        try {
            await pool.execute(
                'DELETE FROM accesstokens WHERE user_id = ?',
                [user_id]
            );
            
            return true;
        } catch (error) {
            throw error;
        }
    }

    // Delete expired tokens
    static async deleteExpiredTokens(user_id = null) {
        try {
            if (user_id) {
                await pool.execute(
                    'DELETE FROM accesstokens WHERE user_id = ? AND expires_at <= NOW()',
                    [user_id]
                );
            } else {
                await pool.execute(
                    'DELETE FROM accesstokens WHERE expires_at <= NOW()'
                );
            }
            
            return true;
        } catch (error) {
            throw error;
        }
    }

    // Check if token is expired
    isExpired() {
        return new Date() > new Date(this.expires_at);
    }

    // Check if token is valid (not expired)
    isValid() {
        return !this.isExpired();
    }

    // Get time until expiration in minutes
    getTimeUntilExpiration() {
        const now = new Date();
        const expires = new Date(this.expires_at);
        const diffMs = expires - now;
        
        return Math.max(0, Math.floor(diffMs / (1000 * 60))); // Return minutes
    }

    // Get token info for response
    toTokenResponse() {
        return {
            token: this.token,
            expires_at: this.expires_at,
            expires_in_minutes: this.getTimeUntilExpiration()
        };
    }

    // Clean up expired tokens (static method for scheduled cleanup)
    static async cleanupExpiredTokens() {
        try {
            const [result] = await pool.execute(
                'DELETE FROM accesstokens WHERE expires_at <= NOW()'
            );
            
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }

    // Get token statistics
    static async getTokenStatistics() {
        try {
            const [rows] = await pool.execute(
                `SELECT 
                    COUNT(*) as total_tokens,
                    COUNT(CASE WHEN expires_at > NOW() THEN 1 END) as active_tokens,
                    COUNT(CASE WHEN expires_at <= NOW() THEN 1 END) as expired_tokens,
                    COUNT(DISTINCT user_id) as unique_users_with_tokens
                 FROM accesstokens`
            );
            
            return rows[0];
        } catch (error) {
            throw error;
        }
    }
}

module.exports = AccessToken;