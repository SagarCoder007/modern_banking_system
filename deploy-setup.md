# Banking System Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Variables Setup
Create production environment files:

**Backend (.env.production):**
```
NODE_ENV=production
PORT=5000
DB_HOST=your_production_db_host
DB_PORT=3306
DB_USER=your_production_db_user
DB_PASSWORD=your_production_db_password
DB_NAME=bank
JWT_SECRET=your_super_secure_jwt_secret_for_production
JWT_EXPIRES_IN=24h
BCRYPT_SALT_ROUNDS=12
CORS_ORIGIN=https://your-frontend-domain.vercel.app
```

**Frontend (.env.production):**
```
REACT_APP_API_URL=https://your-backend-domain.railway.app/api
```

### 2. Package.json Updates

**Backend package.json - Add these scripts:**
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "build": "echo 'No build step required'",
    "postinstall": "echo 'Backend dependencies installed'"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

**Frontend package.json - Ensure these scripts exist:**
```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  }
}
```

### 3. Database Migration Script
Create a database setup script for production.