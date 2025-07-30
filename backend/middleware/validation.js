// Request validation middleware
const validateRequest = (schema) => {
    return (req, res, next) => {
        try {
            const { error, value } = schema.validate(req.body);
            
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: error.details.map(detail => ({
                        field: detail.path[0],
                        message: detail.message
                    }))
                });
            }
            
            req.validatedBody = value;
            next();
            
        } catch (error) {
            console.error('Validation middleware error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during validation'
            });
        }
    };
};

// Basic input sanitization
const sanitizeInput = (req, res, next) => {
    try {
        // Sanitize body
        if (req.body && typeof req.body === 'object') {
            for (const key in req.body) {
                if (typeof req.body[key] === 'string') {
                    req.body[key] = req.body[key].trim();
                }
            }
        }
        
        // Sanitize query parameters
        if (req.query && typeof req.query === 'object') {
            for (const key in req.query) {
                if (typeof req.query[key] === 'string') {
                    req.query[key] = req.query[key].trim();
                }
            }
        }
        
        next();
        
    } catch (error) {
        console.error('Sanitization middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during input sanitization'
        });
    }
};

// Rate limiting middleware (simple implementation)
const createRateLimit = (windowMs, maxRequests) => {
    const requests = new Map();
    
    return (req, res, next) => {
        try {
            const clientIP = req.ip || req.connection.remoteAddress;
            const now = Date.now();
            const windowStart = now - windowMs;
            
            // Clean old entries
            for (const [ip, timestamps] of requests.entries()) {
                const validTimestamps = timestamps.filter(timestamp => timestamp > windowStart);
                if (validTimestamps.length === 0) {
                    requests.delete(ip);
                } else {
                    requests.set(ip, validTimestamps);
                }
            }
            
            // Check current client
            const clientRequests = requests.get(clientIP) || [];
            const recentRequests = clientRequests.filter(timestamp => timestamp > windowStart);
            
            if (recentRequests.length >= maxRequests) {
                return res.status(429).json({
                    success: false,
                    message: 'Too many requests. Please try again later.',
                    retry_after: Math.ceil(windowMs / 1000)
                });
            }
            
            // Add current request
            recentRequests.push(now);
            requests.set(clientIP, recentRequests);
            
            next();
            
        } catch (error) {
            console.error('Rate limiting middleware error:', error);
            next(); // Don't block on rate limiting errors
        }
    };
};

// Login validation
const validateLogin = (req, res, next) => {
    try {
        const { username, password } = req.body;
        
        const errors = [];
        
        if (!username || username.trim().length === 0) {
            errors.push({ field: 'username', message: 'Username is required' });
        }
        
        if (!password || password.length === 0) {
            errors.push({ field: 'password', message: 'Password is required' });
        }
        
        if (username && username.trim().length < 3) {
            errors.push({ field: 'username', message: 'Username must be at least 3 characters' });
        }
        
        if (password && password.length < 6) {
            errors.push({ field: 'password', message: 'Password must be at least 6 characters' });
        }
        
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }
        
        next();
        
    } catch (error) {
        console.error('Login validation error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during validation'
        });
    }
};

// Transaction amount validation
const validateTransactionAmount = (req, res, next) => {
    try {
        const { amount } = req.body;
        
        const errors = [];
        
        if (!amount) {
            errors.push({ field: 'amount', message: 'Amount is required' });
        } else {
            const numAmount = parseFloat(amount);
            
            if (isNaN(numAmount)) {
                errors.push({ field: 'amount', message: 'Amount must be a valid number' });
            } else if (numAmount <= 0) {
                errors.push({ field: 'amount', message: 'Amount must be greater than 0' });
            } else if (numAmount < 1) {
                errors.push({ field: 'amount', message: 'Minimum amount is $1.00' });
            } else if (numAmount > 50000) {
                errors.push({ field: 'amount', message: 'Maximum amount is $50,000.00' });
            }
        }
        
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }
        
        next();
        
    } catch (error) {
        console.error('Transaction validation error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during validation'
        });
    }
};

module.exports = {
    validateRequest,
    sanitizeInput,
    createRateLimit,
    validateLogin,
    validateTransactionAmount
};