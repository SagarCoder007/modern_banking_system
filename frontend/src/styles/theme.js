import { createTheme } from '@mui/material/styles';

// Banking System Theme
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',      // Professional blue
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#fff',
    },
    secondary: {
      main: '#388e3c',      // Banking green
      light: '#66bb6a',
      dark: '#2e7d32',
      contrastText: '#fff',
    },
    error: {
      main: '#d32f2f',
      light: '#ef5350',
      dark: '#c62828',
    },
    warning: {
      main: '#ed6c02',
      light: '#ff9800',
      dark: '#e65100',
    },
    info: {
      main: '#0288d1',
      light: '#03a9f4',
      dark: '#01579b',
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1.1rem',
      fontWeight: 500,
      lineHeight: 1.6,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          fontSize: '0.9rem',
          fontWeight: 500,
        },
        contained: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          '&:hover': {
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

// Custom styles for banking components
export const bankingStyles = {
  balanceCard: {
    background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
    color: 'white',
    padding: '24px',
    borderRadius: '16px',
    boxShadow: '0 8px 24px rgba(25, 118, 210, 0.3)',
  },
  transactionCard: {
    borderLeft: '4px solid',
    borderLeftColor: 'primary.main',
    '&:hover': {
      transform: 'translateY(-2px)',
      transition: 'transform 0.2s ease-in-out',
    },
  },
  depositButton: {
    background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
    color: 'white',
    '&:hover': {
      background: 'linear-gradient(45deg, #388e3c 30%, #4caf50 90%)',
    },
  },
  withdrawButton: {
    background: 'linear-gradient(45deg, #f44336 30%, #ef5350 90%)',
    color: 'white',
    '&:hover': {
      background: 'linear-gradient(45deg, #d32f2f 30%, #f44336 90%)',
    },
  },
  statsCard: {
    textAlign: 'center',
    padding: '20px',
    background: 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)',
    border: '1px solid rgba(0,0,0,0.05)',
  },
}; 