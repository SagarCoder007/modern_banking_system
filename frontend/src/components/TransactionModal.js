import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  Chip
} from '@mui/material';
import {
  AttachMoney,
  TrendingUp,
  TrendingDown,
  AccountBalance
} from '@mui/icons-material';
import { utils } from '../services/api';
import { bankingStyles } from '../styles/theme';

const TransactionModal = ({ 
  open, 
  onClose, 
  type, // 'deposit' or 'withdraw'
  currentBalance, 
  onTransactionComplete 
}) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isDeposit = type === 'deposit';
  const title = isDeposit ? 'Deposit Money' : 'Withdraw Money';
  const icon = isDeposit ? <TrendingUp /> : <TrendingDown />;
  const buttonColor = isDeposit ? 'success' : 'error';

  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError('');
    }
  };

  const validateTransaction = () => {
    const numAmount = parseFloat(amount);
    
    if (!amount || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return false;
    }

    if (numAmount > 1000000) {
      setError('Amount cannot exceed $1,000,000');
      return false;
    }

    if (!isDeposit && numAmount > currentBalance) {
      setError('Insufficient Funds! Cannot withdraw more than your current balance.');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateTransaction()) return;

    setLoading(true);
    setError('');

    try {
      const result = await onTransactionComplete(parseFloat(amount), description || `${type} transaction`);
      
      if (result.success) {
        handleClose();
      } else {
        setError(result.message || `${type} failed`);
      }
    } catch (error) {
      setError(utils.handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setDescription('');
    setError('');
    onClose();
  };

  const projectedBalance = () => {
    const numAmount = parseFloat(amount) || 0;
    if (isDeposit) {
      return currentBalance + numAmount;
    } else {
      return Math.max(0, currentBalance - numAmount);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle 
        sx={{ 
          background: isDeposit ? 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)' : 'linear-gradient(45deg, #f44336 30%, #ef5350 90%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        {icon}
        {title}
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Current Balance Display */}
        <Box 
          sx={{ 
            ...bankingStyles.balanceCard,
            mb: 3,
            textAlign: 'center'
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={1}>
            <AccountBalance />
            <Typography variant="h6">Current Balance</Typography>
          </Box>
          <Typography variant="h4" fontWeight="bold">
            {utils.formatCurrency(currentBalance)}
          </Typography>
        </Box>

        {/* Amount Input */}
        <TextField
          fullWidth
          label="Amount"
          value={amount}
          onChange={handleAmountChange}
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          InputProps={{
            startAdornment: <InputAdornment position="start">$</InputAdornment>,
          }}
          sx={{ mb: 2 }}
          helperText={`Enter amount to ${type}`}
        />

        {/* Description Input */}
        <TextField
          fullWidth
          label="Description (Optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={`${isDeposit ? 'Deposit' : 'Withdrawal'} description`}
          sx={{ mb: 2 }}
          multiline
          rows={2}
        />

        {/* Balance Projection */}
        {amount && parseFloat(amount) > 0 && (
          <Box 
            sx={{ 
              p: 2, 
              backgroundColor: 'grey.50', 
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'grey.200'
            }}
          >
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Transaction Preview:
            </Typography>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2">
                {isDeposit ? 'After Deposit:' : 'After Withdrawal:'}
              </Typography>
              <Chip 
                label={utils.formatCurrency(projectedBalance())}
                color={projectedBalance() >= 0 ? 'success' : 'error'}
                variant="outlined"
              />
            </Box>
            
            {!isDeposit && parseFloat(amount) > currentBalance && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                ⚠️ Insufficient Funds! You cannot withdraw more than your balance.
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button 
          onClick={handleClose} 
          variant="outlined"
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color={buttonColor}
          disabled={loading || !amount || parseFloat(amount) <= 0}
          startIcon={loading ? <CircularProgress size={20} /> : icon}
          sx={isDeposit ? bankingStyles.depositButton : bankingStyles.withdrawButton}
        >
          {loading ? 'Processing...' : `${isDeposit ? 'Deposit' : 'Withdraw'} ${amount ? utils.formatCurrency(parseFloat(amount)) : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TransactionModal; 