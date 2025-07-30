# Complete Render Deployment Guide for Banking System

## 🚀 Step-by-Step Deployment Process

### **Step 1: Prepare Your Repository**

1. **Commit all changes to Git:**
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Ensure your project structure looks like this:**
   ```
   banking-system/
   ├── backend/
   │   ├── server.js
   │   ├── package.json
   │   ├── .env.production
   │   └── ... (other backend files)
   ├── frontend/
   │   ├── package.json
   │   ├── .env.production
   │   └── ... (other frontend files)
   ├── database/
   │   ├── Dockerfile
   │   ├── schema.sql
   │   └── seed.sql
   ├── render.yaml
   └── README.md
   ```

### **Step 2: Create Render Account**

1. Go to [render.com](https://render.com)
2. Sign up with your GitHub account
3. Authorize Render to access your repositories

### **Step 3: Deploy Using Blueprint (Recommended)**

1. **In Render Dashboard:**
   - Click "New +"
   - Select "Blueprint"
   - Connect your GitHub repository
   - Select the repository containing your banking system
   - Render will automatically detect the `render.yaml` file

2. **Review the Blueprint:**
   - Database: `banking-mysql` (MySQL service)
   - Backend: `banking-backend` (Node.js web service)
   - Frontend: `banking-frontend` (Static site)

3. **Click "Apply Blueprint"**

### **Step 4: Alternative Manual Deployment**

If Blueprint doesn't work, deploy each service manually:

#### **4a. Deploy Database First**

1. **Create MySQL Database:**
   - Click "New +" → "PostgreSQL" (Note: Render's free tier doesn't support MySQL)
   - **Alternative: Use PostgreSQL instead**
   - Name: `banking-database`
   - Plan: Free
   - Region: Oregon (US West)

2. **Get Database Connection Details:**
   - Internal Database URL: `postgresql://username:password@hostname:port/database`
   - External Database URL: For external connections

#### **4b. Deploy Backend API**

1. **Create Web Service:**
   - Click "New +" → "Web Service"
   - Connect GitHub repository
   - Name: `banking-backend`
   - Environment: Node
   - Region: Oregon (US West)
   - Branch: main
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`

2. **Add Environment Variables:**
   ```
   NODE_ENV=production
   PORT=10000
   DB_HOST=<your-database-internal-host>
   DB_PORT=5432
   DB_USER=<your-database-user>
   DB_PASSWORD=<your-database-password>
   DB_NAME=<your-database-name>
   JWT_SECRET=banking_system_super_secure_jwt_key_2024_production_render
   JWT_EXPIRES_IN=24h
   BCRYPT_SALT_ROUNDS=12
   CORS_ORIGIN=https://banking-frontend.onrender.com
   ```

3. **Deploy Backend**

#### **4c. Deploy Frontend**

1. **Create Static Site:**
   - Click "New +" → "Static Site"
   - Connect GitHub repository
   - Name: `banking-frontend`
   - Branch: main
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `build`

2. **Add Environment Variables:**
   ```
   REACT_APP_API_URL=https://banking-backend.onrender.com/api
   ```

3. **Deploy Frontend**

### **Step 5: Database Setup (Important!)**

Since Render's free tier doesn't support MySQL, you have two options:

#### **Option A: Use PostgreSQL (Recommended for Free Tier)**

1. **Update your backend to support PostgreSQL:**
   - Install pg: `npm install pg`
   - Update database configuration
   - Convert MySQL queries to PostgreSQL

#### **Option B: Use External MySQL (Paid)**

1. **Use PlanetScale (Free MySQL):**
   - Sign up at [planetscale.com](https://planetscale.com)
   - Create database
   - Import your schema
   - Use connection string in Render

2. **Use Railway MySQL:**
   - Sign up at [railway.app](https://railway.app)
   - Create MySQL database
   - Use connection string in Render

### **Step 6: Update Environment Variables**

After deployment, update the environment variables with actual URLs:

1. **Backend Environment Variables:**
   ```
   CORS_ORIGIN=https://your-actual-frontend-url.onrender.com
   ```

2. **Frontend Environment Variables:**
   ```
   REACT_APP_API_URL=https://your-actual-backend-url.onrender.com/api
   ```

### **Step 7: Test Your Deployment**

1. **Check Backend:**
   - Visit: `https://your-backend-url.onrender.com`
   - Should show: "Banking System API is running!"

2. **Check Frontend:**
   - Visit: `https://your-frontend-url.onrender.com`
   - Should load the banking system login page

3. **Test Full Flow:**
   - Register a new user
   - Login
   - Make a deposit
   - Check balance
   - View transaction history

### **Step 8: Troubleshooting**

#### **Common Issues:**

1. **Database Connection Errors:**
   - Check database URL format
   - Ensure database is running
   - Verify credentials

2. **CORS Errors:**
   - Update CORS_ORIGIN in backend
   - Redeploy backend service

3. **Build Failures:**
   - Check build logs in Render dashboard
   - Ensure all dependencies are in package.json
   - Check Node.js version compatibility

4. **Environment Variables:**
   - Ensure all required env vars are set
   - No spaces around = in env vars
   - Restart services after updating env vars

### **Step 9: Custom Domains (Optional)**

1. **Add Custom Domain:**
   - Go to service settings
   - Add custom domain
   - Update DNS records
   - Enable HTTPS

### **Step 10: Monitoring**

1. **Check Logs:**
   - Use Render dashboard to view logs
   - Monitor for errors
   - Set up log alerts

2. **Performance:**
   - Monitor response times
   - Check database performance
   - Optimize queries if needed

## 🎯 Quick Deployment Checklist

- [ ] Code committed to GitHub
- [ ] render.yaml file created
- [ ] Environment files updated
- [ ] Database schema ready
- [ ] Render account created
- [ ] Blueprint deployed
- [ ] Environment variables set
- [ ] Services running
- [ ] Database connected
- [ ] Frontend loading
- [ ] API endpoints working
- [ ] Full user flow tested

## 💰 Cost Breakdown (Render Free Tier)

- **Static Site (Frontend):** Free
- **Web Service (Backend):** Free (750 hours/month)
- **PostgreSQL Database:** Free (1GB storage)
- **Total:** $0/month

**Note:** Free tier services sleep after 15 minutes of inactivity and take ~30 seconds to wake up.

## 🚀 Production Upgrade

For production use, consider upgrading to paid plans:
- **Web Service:** $7/month (always on)
- **Database:** $7/month (more storage/performance)
- **Total:** ~$14/month