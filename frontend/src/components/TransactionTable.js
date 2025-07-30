import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Typography,
  Box,
  TextField,
  InputAdornment,
  TablePagination,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Search,
  Receipt,
  FilterList
} from '@mui/icons-material';
import { utils } from '../services/api';
import { bankingStyles } from '../styles/theme';

const TransactionTable = ({ transactions, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filter transactions based on search term
  const filteredTransactions = transactions.filter(transaction =>
    transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginate filtered transactions
  const paginatedTransactions = filteredTransactions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getTransactionIcon = (type) => {
    return type === 'deposit' ? (
      <TrendingUp color="success" />
    ) : (
      <TrendingDown color="error" />
    );
  };

  const getTransactionChip = (type, amount) => {
    const isDeposit = type === 'deposit';
    return (
      <Chip
        icon={getTransactionIcon(type)}
        label={`${isDeposit ? '+' : '-'}${utils.formatCurrency(Math.abs(amount))}`}
        color={isDeposit ? 'success' : 'error'}
        variant="outlined"
        size="small"
        sx={{
          fontWeight: 'bold',
          fontSize: '0.875rem'
        }}
      />
    );
  };

  const formatTransactionType = (type) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Paper elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>
      {/* Search Header */}
      <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'grey.200' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" fontWeight="bold" display="flex" alignItems="center" gap={1}>
            <Receipt />
            Transaction History
          </Typography>
          <Chip 
            label={`${filteredTransactions.length} transactions`} 
            color="primary" 
            variant="outlined" 
          />
        </Box>
        
        <TextField
          fullWidth
          placeholder="Search transactions by description, reference, or type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          size="small"
        />
      </Box>

      {/* Transactions Table */}
      {filteredTransactions.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {searchTerm ? 'No transactions found' : 'No transactions yet'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm 
              ? 'Try adjusting your search criteria' 
              : 'Start by making a deposit or withdrawal'}
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.50' }}>
                  <TableCell><strong>Date & Time</strong></TableCell>
                  <TableCell><strong>Type</strong></TableCell>
                  <TableCell><strong>Amount</strong></TableCell>
                  <TableCell><strong>Balance After</strong></TableCell>
                  <TableCell><strong>Description</strong></TableCell>
                  <TableCell><strong>Reference</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedTransactions.map((transaction, index) => (
                  <TableRow 
                    key={transaction.id} 
                    hover
                    sx={{
                      '&:hover': {
                        backgroundColor: 'grey.50',
                        ...bankingStyles.transactionCard
                      }
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {utils.formatDate(transaction.created_at)}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        label={formatTransactionType(transaction.type)}
                        color={transaction.type === 'deposit' ? 'success' : 'error'}
                        variant="filled"
                        size="small"
                        icon={getTransactionIcon(transaction.type)}
                      />
                    </TableCell>
                    
                    <TableCell>
                      {getTransactionChip(transaction.type, transaction.amount)}
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {utils.formatCurrency(transaction.balance_after)}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200 }}>
                        {transaction.description || 'No description'}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Tooltip title="Transaction Reference Number">
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontFamily: 'monospace',
                            fontSize: '0.75rem',
                            color: 'text.secondary'
                          }}
                        >
                          {transaction.reference_number}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <TablePagination
            component="div"
            count={filteredTransactions.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            sx={{ 
              borderTop: '1px solid', 
              borderColor: 'grey.200',
              backgroundColor: 'grey.50'
            }}
          />
        </>
      )}
    </Paper>
  );
};

export default TransactionTable; 