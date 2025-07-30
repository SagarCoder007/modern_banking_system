# 🚀 Banking System Deployment Guide

## Step 20: Deploy to Free Platforms

This guide will help you deploy your banking system to free hosting platforms.

---

## 📋 Pre-Deployment Checklist

- [ ] All tests passing (`node test-complete-system.js`)
- [ ] Environment variables configured
- [ ] Database schema and seed data ready
- [ ] Frontend build working (`npm run build`)
- [ ] Backend server running locally
- [ ] GitHub repository created and updated

---

## 🗄️ Database Deployment

### Option 1: PlanetScale (Recommended)
1. Sign up at [planetscale.com](https://planetscale.com)
2. Create a new database
3. Connect and run your schema.sql
4. Run seed.sql for sample data
5. Get connection string for backend

### Option 2: Railway Database
1. Sign up at [railway.app](https://railway.app)
2. Create MySQL database service
3. Use provided connection details
4. Import your schema and seed data

### Option 3: ClearDB (Heroku Add-on)
1. Create Heroku account
2. Add ClearDB MySQL add-on
3. Import database schema
4. Configure connection string

---

## 🔧 Backend Deployment

### Option 1: Railway (Recommended)
1. Connect GitHub repository to Railway
2. Select backend folder as root
3. Set environment variables:
   ```
   NODE_ENV=production
   DB_HOST=your-db-host
   DB_USER=your-db-user
   DB_PASSWORD=your-db-password
   DB_NAME=banking_system
   JWT_SECRET=your-jwt-secret
   CORS_ORIGIN=https://your-frontend-url.com
   ```
4. Deploy automatically

### Option 2: Render
1. Connect GitHub repository
2. Create new Web Service
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Configure environment variables
6. Deploy

### Option 3: Heroku
1. Install Heroku CLI
2. Create new app: `heroku create your-banking-backend`
3. Set environment variables: `heroku config:set NODE_ENV=production`
4. Deploy: `git push heroku main`

---

## 🎨 Frontend Deployment

### Option 1: Vercel (Recommended)
1. Connect GitHub repository to Vercel
2. Select frontend folder as root
3. Set build command: `npm run build`
4. Set environment variables:
   ```
   REACT_APP_API_URL=https://your-backend-url.com/api
   REACT_APP_ENVIRONMENT=production
   ```
5. Deploy automatically

### Option 2: Netlify
1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `build`
4. Configure environment variables
5. Deploy

### Option 3: GitHub Pages
1. Install gh-pages: `npm install --save-dev gh-pages`
2. Add to package.json:
   ```json
   "homepage": "https://yourusername.github.io/banking-system",
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d build"
   }
   ```
3. Deploy: `npm run deploy`

---

## 🔐 Environment Variables Setup

### Backend Variables
```bash
# Required for all platforms
NODE_ENV=production
PORT=5000

# Database (replace with your values)
DB_HOST=your-database-host
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=banking_system

# Security (generate secure values)
JWT_SECRET=your-super-secure-jwt-secret-min-32-characters
BCRYPT_SALT_ROUNDS=12

# CORS (replace with your frontend URL)
CORS_ORIGIN=https://your-frontend-domain.com
```

### Frontend Variables
```bash
# API URL (replace with your backend URL)
REACT_APP_API_URL=https://your-backend-domain.com/api

# App Configuration
REACT_APP_ENVIRONMENT=production
REACT_APP_NAME=Banking System
```

---

## 🧪 Post-Deployment Testing

### 1. Test Backend API
```bash
# Health check
curl https://your-backend-url.com

# Test login
curl -X POST https://your-backend-url.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"customer1","password":"password123"}'
```

### 2. Test Frontend
1. Visit your frontend URL
2. Test customer login (customer1/password123)
3. Test banker login (banker1/password123)
4. Verify all features work

### 3. Run Complete System Test
```bash
# Update API_BASE in test file to your deployed backend
node test-complete-system.js
```

---

## 📝 Deployment Scripts

### Backend Build Script
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "build": "echo 'No build step required for Node.js'",
    "test": "node test-complete-system.js"
  }
}
```

### Frontend Build Script
```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "deploy": "npm run build && echo 'Build complete'"
  }
}
```

---

## 🔧 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Update CORS_ORIGIN in backend environment
   - Ensure frontend URL matches exactly

2. **Database Connection**
   - Verify database credentials
   - Check if database allows external connections
   - Ensure schema is imported

3. **Environment Variables**
   - Double-check all required variables are set
   - Restart services after changing variables

4. **Build Failures**
   - Check Node.js version compatibility
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and reinstall

---

## 📋 Final Checklist

- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] Database connected and populated
- [ ] Environment variables configured
- [ ] CORS properly set up
- [ ] All features tested on live deployment
- [ ] GitHub repository updated with deployment URLs
- [ ] README.md updated with live demo links

---

## 🎯 Submission Ready!

Once all items are checked, your banking system is ready for submission:

1. **GitHub Repository**: Clean code with proper documentation
2. **Live Backend**: API endpoints working
3. **Live Frontend**: Full user interface functional
4. **Test Credentials**: 
   - Customer: customer1/password123
   - Banker: banker1/password123

**Example Submission:**
- GitHub: https://github.com/yourusername/banking-system
- Live Demo: https://your-banking-app.vercel.app
- Backend API: https://your-banking-backend.railway.app