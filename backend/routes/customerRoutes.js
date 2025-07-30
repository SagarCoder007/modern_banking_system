const express = require('express');
const router = express.Router();

const CustomerController = require('../controllers/CustomerController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateTransactionAmount, sanitizeInput, createRateLimit } = require('../middleware/validation');

// Rate limiting for transaction routes (more lenient for testing)
const transactionRateLimit = createRateLimit(60 * 1000, 50); // 50 transactions per minute

// All customer routes require authentication and customer role
router.use(authenticateToken);
router.use(requireRole('customer'));

// GET /api/customer/transactions - Get transaction history
router.get('/transactions',
    sanitizeInput,
    CustomerController.getTransactions
);

// POST /api/customer/deposit - Deposit money
router.post('/deposit',
    transactionRateLimit,
    sanitizeInput,
    validateTransactionAmount,
    CustomerController.deposit
);

// POST /api/customer/withdraw - Withdraw money
router.post('/withdraw',
    transactionRateLimit,
    sanitizeInput,
    validateTransactionAmount,
    CustomerController.withdraw
);

// GET /api/customer/balance - Get current account balance
router.get('/balance',
    CustomerController.getBalance
);

// GET /api/customer/summary - Get account summary and statistics
router.get('/summary',
    sanitizeInput,
    CustomerController.getAccountSummary
);

// GET /api/customer/account-summary - Get account summary and statistics (alias)
router.get('/account-summary',
    sanitizeInput,
    CustomerController.getAccountSummary
);

// GET /api/customer/transaction/:reference_number - Get transaction by reference number
router.get('/transaction/:reference_number',
    sanitizeInput,
    CustomerController.getTransactionByReference
);

module.exports = router;