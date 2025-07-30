const AccessToken = require('../models/AccessToken');

// Authentication middleware - verify 36-character access token
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        // Check if Authorization header exists
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'Access token is required'
            });
        }
        
        // Check if header starts with 'Bearer '
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Invalid authorization header format. Use: Bearer <token>'
            });
        }
        
        // Extract token
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        
        // Validate token format (should be 36 characters)
        if (!token || token.length !== 36) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token format. Token must be 36 characters.'
            });
        }
        
        // Verify token and get user
        const tokenData = await AccessToken.verifyTokenAndGetUser(token);
        
        if (!tokenData) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired access token'
            });
        }
        
        // Attach user and token to request object
        req.user = tokenData.user;
        req.token = tokenData.token;
        
        next();
        
    } catch (error) {
        console.error('Authentication middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during authentication'
        });
    }
};

// Role-based authorization middleware
const requireRole = (role) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }
            
            if (req.user.role !== role) {
                return res.status(403).json({
                    success: false,
                    message: `Access denied. ${role} role required.`
                });
            }
            
            next();
            
        } catch (error) {
            console.error('Authorization middleware error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during authorization'
            });
        }
    };
};

// Multiple roles authorization middleware
const requireAnyRole = (roles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }
            
            if (!roles.includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: `Access denied. One of these roles required: ${roles.join(', ')}`
                });
            }
            
            next();
            
        } catch (error) {
            console.error('Authorization middleware error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during authorization'
            });
        }
    };
};

// Optional authentication middleware (user info if token provided)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            
            if (token && token.length === 36) {
                const tokenData = await AccessToken.verifyTokenAndGetUser(token);
                
                if (tokenData) {
                    req.user = tokenData.user;
                    req.token = tokenData.token;
                }
            }
        }
        
        next();
        
    } catch (error) {
        // Don't return error for optional auth, just continue
        next();
    }
};

module.exports = {
    authenticateToken,
    requireRole,
    requireAnyRole,
    optionalAuth
};