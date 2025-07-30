const express = require('express');
const router = express.Router();

const BankerController = require('../controllers/BankerController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { sanitizeInput, createRateLimit } = require('../middleware/validation');

// Rate limiting for banker routes (more lenient for testing)
const bankerRateLimit = createRateLimit(60 * 1000, 200); // 200 requests per minute

// All banker routes require authentication and banker role
router.use(authenticateToken);
router.use(requireRole('banker'));
router.use(bankerRateLimit);

// GET /api/banker/accounts - Get all customer accounts
router.get('/accounts',
    sanitizeInput,
    BankerController.getAllAccounts
);

// GET /api/banker/customers - Get all customers
router.get('/customers',
    sanitizeInput,
    BankerController.getAllCustomers
);

// GET /api/banker/customer/:customerId/transactions - Get customer transaction history
router.get('/customer/:customerId/transactions',
    sanitizeInput,
    BankerController.getCustomerTransactions
);

// GET /api/banker/dashboard - Get banking system overview/dashboard
router.get('/dashboard',
    sanitizeInput,
    BankerController.getDashboardOverview
);

// GET /api/banker/search/customers - Search customers and accounts
router.get('/search/customers',
    sanitizeInput,
    BankerController.searchCustomers
);

// PUT /api/banker/account/:accountId/status - Update account status
router.put('/account/:accountId/status',
    sanitizeInput,
    BankerController.updateAccountStatus
);

module.exports = router;