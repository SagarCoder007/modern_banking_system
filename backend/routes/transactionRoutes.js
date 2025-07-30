const express = require('express');
const router = express.Router();

const TransactionController = require('../controllers/TransactionController');
const { authenticateToken, requireAnyRole } = require('../middleware/auth');
const { validateTransactionAmount, sanitizeInput, createRateLimit } = require('../middleware/validation');

// Rate limiting for transaction routes
const transactionRateLimit = createRateLimit(60 * 1000, 20); // 20 requests per minute

// All transaction routes require authentication
router.use(authenticateToken);
router.use(requireAnyRole(['customer', 'banker']));
router.use(transactionRateLimit);

// GET /api/transactions/statistics - Get transaction statistics (before parameterized route)
router.get('/statistics',
    sanitizeInput,
    TransactionController.getTransactionStatistics
);

// GET /api/transactions/search - Search transactions (before parameterized route)
router.get('/search',
    sanitizeInput,
    TransactionController.searchTransactions
);

// GET /api/transactions - Get transaction history (role-based access)
router.get('/',
    sanitizeInput,
    TransactionController.getTransactionHistory
);

// POST /api/transactions/deposit - Perform deposit (customers only)
router.post('/deposit',
    sanitizeInput,
    validateTransactionAmount,
    TransactionController.performDeposit
);

// POST /api/transactions/withdraw - Perform withdrawal (customers only)
router.post('/withdraw',
    sanitizeInput,
    validateTransactionAmount,
    TransactionController.performWithdrawal
);

// GET /api/transactions/:transactionId - Get transaction details by ID or reference (parameterized routes last)
router.get('/:transactionId',
    sanitizeInput,
    TransactionController.getTransactionDetails
);

module.exports = router;