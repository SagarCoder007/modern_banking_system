const User = require('../models/User');
const AccessToken = require('../models/AccessToken');

class AuthController {
    // Customer/Banker login
    static async login(req, res) {
        try {
            const { username, password } = req.body;
            
            // Validation
            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Username and password are required'
                });
            }
            
                    // Find user by username or email
        console.log('🔍 AuthController: Attempting login for username:', username);
        const user = await User.findByCredentials(username);
        if (!user) {
            console.log('❌ AuthController: User not found for username:', username);
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }
        
        console.log('👤 AuthController: User found, verifying password...');
        // Verify password
        const isValidPassword = await user.verifyPassword(password);
        if (!isValidPassword) {
            console.log('❌ AuthController: Password verification failed for user:', username);
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }
        
        console.log('✅ AuthController: Login successful for user:', username);
            
            // Generate 36-character access token
            const tokenExpiresIn = parseInt(process.env.TOKEN_EXPIRES_IN) / 3600 || 24; // Convert seconds to hours
            const accessToken = await AccessToken.create(user.id, tokenExpiresIn);
            
            // Get user account info if customer
            let accountInfo = null;
            if (user.isCustomer()) {
                const Account = require('../models/Account');
                const account = await Account.findByUserId(user.id);
                if (account) {
                    accountInfo = {
                        account_number: account.account_number,
                        balance: account.balance,
                        account_type: account.account_type,
                        status: account.status
                    };
                }
            }
            
            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: {
                    user: user.toSafeObject(),
                    account: accountInfo,
                    token: accessToken.toTokenResponse()
                }
            });
            
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during login'
            });
        }
    }
    
    // Logout (delete token)
    static async logout(req, res) {
        try {
            const token = req.token; // From auth middleware
            
            if (token) {
                await token.delete();
            }
            
            res.status(200).json({
                success: true,
                message: 'Logout successful'
            });
            
        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during logout'
            });
        }
    }
    
    // Verify token
    static async verify(req, res) {
        try {
            const user = req.user; // From auth middleware
            const token = req.token; // From auth middleware
            
            // Get additional user info based on role
            let additionalInfo = {};
            
            if (user.role === 'customer') {
                const Account = require('../models/Account');
                const account = await Account.findByUserId(user.id);
                if (account) {
                    additionalInfo.account = {
                        account_number: account.account_number,
                        balance: account.balance,
                        account_type: account.account_type,
                        status: account.status
                    };
                }
            }
            
            res.status(200).json({
                success: true,
                message: 'Token is valid',
                data: {
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        phone: user.phone
                    },
                    token: {
                        expires_at: token.expires_at,
                        expires_in_minutes: token.getTimeUntilExpiration()
                    },
                    ...additionalInfo
                }
            });
            
        } catch (error) {
            console.error('Token verification error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during token verification'
            });
        }
    }
    
    // Refresh token (extend expiration)
    static async refresh(req, res) {
        try {
            const token = req.token; // From auth middleware
            
            // Refresh token for another 24 hours
            const refreshedToken = await token.refresh(24);
            
            res.status(200).json({
                success: true,
                message: 'Token refreshed successfully',
                data: {
                    token: refreshedToken.toTokenResponse()
                }
            });
            
        } catch (error) {
            console.error('Token refresh error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during token refresh'
            });
        }
    }
    
    // Change password
    static async changePassword(req, res) {
        try {
            const { currentPassword, newPassword, confirmPassword } = req.body;
            const user = req.user; // From auth middleware
            
            // Validation
            if (!currentPassword || !newPassword || !confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'All password fields are required'
                });
            }
            
            if (newPassword !== confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'New password and confirmation do not match'
                });
            }
            
            if (newPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'New password must be at least 6 characters long'
                });
            }
            
            // Get full user object with password
            const fullUser = await User.findById(user.id);
            
            // Verify current password
            const isValidPassword = await fullUser.verifyPassword(currentPassword);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: 'Current password is incorrect'
                });
            }
            
            // Change password
            await fullUser.changePassword(newPassword);
            
            // Logout from all devices (invalidate all tokens)
            await AccessToken.deleteAllUserTokens(user.id);
            
            res.status(200).json({
                success: true,
                message: 'Password changed successfully. Please login again.'
            });
            
        } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during password change'
            });
        }
    }
    
    // Get user profile
    static async getProfile(req, res) {
        try {
            const user = req.user; // From auth middleware
            
            // Get additional info based on role
            let profileData = {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                first_name: user.first_name,
                last_name: user.last_name,
                phone: user.phone,
                created_at: user.created_at
            };
            
            if (user.role === 'customer') {
                const Account = require('../models/Account');
                const account = await Account.findByUserId(user.id);
                if (account) {
                    profileData.account = {
                        account_number: account.account_number,
                        balance: account.balance,
                        account_type: account.account_type,
                        status: account.status,
                        created_at: account.created_at
                    };
                }
            }
            
            res.status(200).json({
                success: true,
                message: 'Profile retrieved successfully',
                data: profileData
            });
            
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while retrieving profile'
            });
        }
    }
    
    // Update profile
    static async updateProfile(req, res) {
        try {
            const { first_name, last_name, phone, email } = req.body;
            const user = req.user; // From auth middleware
            
            // Validation
            const updateData = {};
            
            if (first_name) updateData.first_name = first_name.trim();
            if (last_name) updateData.last_name = last_name.trim();
            if (phone) updateData.phone = phone.trim();
            if (email) {
                // Check if email is already taken by another user
                const existingUser = await User.findByEmail(email);
                if (existingUser && existingUser.id !== user.id) {
                    return res.status(400).json({
                        success: false,
                        message: 'Email is already taken by another user'
                    });
                }
                updateData.email = email.trim();
            }
            
            if (Object.keys(updateData).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No valid fields to update'
                });
            }
            
            // Update user
            const fullUser = await User.findById(user.id);
            const updatedUser = await fullUser.update(updateData);
            
            res.status(200).json({
                success: true,
                message: 'Profile updated successfully',
                data: updatedUser.toSafeObject()
            });
            
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while updating profile'
            });
        }
    }
}

module.exports = AuthController;