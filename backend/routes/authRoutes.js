const express = require('express');
const router = express.Router();

const AuthController = require('../controllers/AuthController');
const { authenticateToken } = require('../middleware/auth');
const { validateLogin, sanitizeInput, createRateLimit } = require('../middleware/validation');

// Rate limiting for auth routes
const authRateLimit = createRateLimit(15 * 60 * 1000, 5); // 5 requests per 15 minutes
const loginRateLimit = createRateLimit(15 * 60 * 1000, 5); // 5 login attempts per 15 minutes

// POST /api/auth/login - Customer/Banker login
router.post('/login', 
    loginRateLimit,
    sanitizeInput,
    validateLogin,
    AuthController.login
);

// POST /api/auth/logout - Logout (delete token)
router.post('/logout',
    authenticateToken,
    AuthController.logout
);

// GET /api/auth/verify - Verify token
router.get('/verify',
    authenticateToken,
    AuthController.verify
);

// POST /api/auth/refresh - Refresh token (extend expiration)
router.post('/refresh',
    authenticateToken,
    AuthController.refresh
);

// POST /api/auth/change-password - Change password
router.post('/change-password',
    authRateLimit,
    authenticateToken,
    sanitizeInput,
    AuthController.changePassword
);

// GET /api/auth/profile - Get user profile
router.get('/profile',
    authenticateToken,
    AuthController.getProfile
);

// PUT /api/auth/profile - Update user profile
router.put('/profile',
    authenticateToken,
    sanitizeInput,
    AuthController.updateProfile
);

module.exports = router;