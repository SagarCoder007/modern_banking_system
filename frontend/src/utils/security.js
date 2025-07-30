// Security utilities for the banking system

// Input validation and sanitization
export const validateInput = {
  // Validate email format
  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validate username (alphanumeric, 3-20 chars)
  username: (username) => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  },

  // Validate password strength
  password: (password) => {
    return {
      isValid: password.length >= 6,
      hasMinLength: password.length >= 6,
      hasMaxLength: password.length <= 128,
      hasLetter: /[a-zA-Z]/.test(password),
      hasNumber: /\d/.test(password),
      score: calculatePasswordScore(password)
    };
  },

  // Validate transaction amount
  amount: (amount) => {
    const numAmount = parseFloat(amount);
    return {
      isValid: !isNaN(numAmount) && numAmount > 0 && numAmount <= 50000,
      isNumber: !isNaN(numAmount),
      isPositive: numAmount > 0,
      withinLimit: numAmount <= 50000,
      meetsMinimum: numAmount >= 1
    };
  },

  // Sanitize string input
  sanitizeString: (input) => {
    if (typeof input !== 'string') return '';
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .substring(0, 1000); // Limit length
  }
};

// Calculate password strength score
const calculatePasswordScore = (password) => {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  return Math.min(score, 5);
};

// Token security utilities
export const tokenSecurity = {
  // Validate token format (36 characters alphanumeric)
  isValidFormat: (token) => {
    if (!token || typeof token !== 'string') return false;
    return token.length === 36 && /^[a-zA-Z0-9]+$/.test(token);
  },

  // Check if token is expired (client-side estimation)
  isLikelyExpired: (tokenTimestamp) => {
    if (!tokenTimestamp) return true;
    const now = Date.now();
    const tokenAge = now - tokenTimestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    return tokenAge > maxAge;
  },

  // Store token securely
  storeSecurely: (token) => {
    try {
      const tokenData = {
        token,
        timestamp: Date.now(),
        expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      };
      localStorage.setItem('banking_token', token);
      localStorage.setItem('banking_token_meta', JSON.stringify(tokenData));
      return true;
    } catch (error) {
      console.error('Failed to store token securely:', error);
      return false;
    }
  },

  // Retrieve token with validation
  retrieveSecurely: () => {
    try {
      const token = localStorage.getItem('banking_token');
      const meta = localStorage.getItem('banking_token_meta');
      
      if (!token || !meta) return null;
      
      const tokenData = JSON.parse(meta);
      
      // Check if token is expired
      if (Date.now() > tokenData.expires) {
        localStorage.removeItem('banking_token');
        localStorage.removeItem('banking_token_meta');
        return null;
      }
      
      return token;
    } catch (error) {
      console.error('Failed to retrieve token securely:', error);
      return null;
    }
  }
};

// Session security
export const sessionSecurity = {
  // Track session activity
  updateActivity: () => {
    localStorage.setItem('last_activity', Date.now().toString());
  },

  // Check for session timeout (30 minutes of inactivity)
  isSessionExpired: () => {
    const lastActivity = localStorage.getItem('last_activity');
    if (!lastActivity) return true;
    
    const now = Date.now();
    const inactiveTime = now - parseInt(lastActivity);
    const maxInactiveTime = 30 * 60 * 1000; // 30 minutes
    
    return inactiveTime > maxInactiveTime;
  },

  // Clear all session data
  clearSession: () => {
    localStorage.removeItem('banking_token');
    localStorage.removeItem('banking_token_meta');
    localStorage.removeItem('last_activity');
    sessionStorage.clear();
  }
};

// XSS Protection utilities
export const xssProtection = {
  // Escape HTML to prevent XSS
  escapeHtml: (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  // Sanitize user input for display
  sanitizeForDisplay: (input) => {
    if (typeof input !== 'string') return '';
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }
};

// Rate limiting (client-side)
export const rateLimiting = {
  // Track API calls
  trackCall: (endpoint) => {
    const key = `rate_limit_${endpoint}`;
    const now = Date.now();
    const calls = JSON.parse(localStorage.getItem(key) || '[]');
    
    // Remove calls older than 1 minute
    const recentCalls = calls.filter(timestamp => now - timestamp < 60000);
    recentCalls.push(now);
    
    localStorage.setItem(key, JSON.stringify(recentCalls));
    return recentCalls.length;
  },

  // Check if rate limited
  isRateLimited: (endpoint, maxCalls = 10) => {
    const key = `rate_limit_${endpoint}`;
    const now = Date.now();
    const calls = JSON.parse(localStorage.getItem(key) || '[]');
    const recentCalls = calls.filter(timestamp => now - timestamp < 60000);
    
    return recentCalls.length >= maxCalls;
  }
};

// Security headers and CSRF protection
export const securityHeaders = {
  // Get CSRF token from meta tag or API
  getCsrfToken: () => {
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    return metaTag ? metaTag.getAttribute('content') : null;
  },

  // Add security headers to requests
  getSecurityHeaders: () => {
    const headers = {
      'X-Requested-With': 'XMLHttpRequest',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache'
    };

    const csrfToken = securityHeaders.getCsrfToken();
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    return headers;
  }
};

// Audit logging (client-side)
export const auditLog = {
  // Log security events
  logSecurityEvent: (event, details = {}) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      details,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Store in session storage (temporary)
    const logs = JSON.parse(sessionStorage.getItem('security_logs') || '[]');
    logs.push(logEntry);
    
    // Keep only last 50 entries
    if (logs.length > 50) {
      logs.splice(0, logs.length - 50);
    }
    
    sessionStorage.setItem('security_logs', JSON.stringify(logs));
    
    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Security Event:', logEntry);
    }
  },

  // Get security logs
  getSecurityLogs: () => {
    return JSON.parse(sessionStorage.getItem('security_logs') || '[]');
  }
};

export default {
  validateInput,
  tokenSecurity,
  sessionSecurity,
  xssProtection,
  rateLimiting,
  securityHeaders,
  auditLog
};