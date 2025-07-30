import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import BankerDashboard from '../pages/BankerDashboard';
import { AuthProvider } from '../context/AuthContext';
import { theme } from '../styles/theme';
import * as apiService from '../services/api';

// Mock the API service
jest.mock('../services/api');

// Mock user data
const mockBankerUser = {
  id: 1,
  username: 'banker1',
  email: 'banker@bank.com',
  role: 'banker',
  first_name: 'John',
  last_name: 'Banker'
};

const mockDashboardData = {
  summary: {
    total_customers: 3,
    total_accounts: 3,
    total_balance: 18500.75,
    active_accounts: 3
  },
  transaction_stats: {
    today_transactions: 5,
    total_transactions: 10
  },
  recent_transactions: [
    {
      id: 1,
      type: 'deposit',
      amount: 1000,
      created_at: '2024-01-15T10:00:00Z',
      reference_number: 'TXN001000001',
      user: { first_name: 'Alice', last_name: 'Johnson' }
    }
  ]
};

const mockAccounts = [
  {
    id: 1,
    account_number: 'ACC001000001',
    balance: 5000,
    account_type: 'savings',
    status: 'active',
    user: {
      id: 2,
      first_name: 'Alice',
      last_name: 'Johnson',
      username: 'customer1'
    }
  }
];

// Test wrapper component
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);

describe('BankerDashboard', () => {
  beforeEach(() => {
    // Mock API responses
    apiService.apiService.banker.getDashboard.mockResolvedValue({
      success: true,
      data: mockDashboardData
    });
    
    apiService.apiService.banker.getAllAccounts.mockResolvedValue({
      success: true,
      data: { accounts: mockAccounts }
    });
    
    apiService.apiService.banker.getAllCustomers.mockResolvedValue({
      success: true,
      data: { customers: [] }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders banker dashboard header', async () => {
    render(
      <TestWrapper>
        <BankerDashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Banking System - Banker Portal')).toBeInTheDocument();
    });
  });

  test('displays dashboard statistics', async () => {
    render(
      <TestWrapper>
        <BankerDashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument(); // Total customers
      expect(screen.getByText('Total Customers')).toBeInTheDocument();
    });
  });

  test('switches between tabs', async () => {
    render(
      <TestWrapper>
        <BankerDashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      const accountsTab = screen.getByText('Accounts');
      fireEvent.click(accountsTab);
      expect(screen.getByText('Customer Accounts')).toBeInTheDocument();
    });
  });

  test('displays account information in accounts tab', async () => {
    render(
      <TestWrapper>
        <BankerDashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      const accountsTab = screen.getByText('Accounts');
      fireEvent.click(accountsTab);
    });

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('ACC001000001')).toBeInTheDocument();
    });
  });

  test('handles search functionality', async () => {
    render(
      <TestWrapper>
        <BankerDashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      const accountsTab = screen.getByText('Accounts');
      fireEvent.click(accountsTab);
    });

    const searchInput = screen.getByPlaceholderText('Search accounts...');
    fireEvent.change(searchInput, { target: { value: 'Alice' } });

    expect(searchInput.value).toBe('Alice');
  });

  test('handles API errors gracefully', async () => {
    // Mock API error
    apiService.apiService.banker.getDashboard.mockRejectedValue(
      new Error('API Error')
    );

    render(
      <TestWrapper>
        <BankerDashboard />
      </TestWrapper>
    );

    // Should not crash and should show loading state
    expect(screen.getByText('Loading banker dashboard...')).toBeInTheDocument();
  });
});