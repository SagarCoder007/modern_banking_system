# 🏦 Banking System

<img width="1896" height="902" alt="Image" src="https://github.com/user-attachments/assets/9cf37268-12bc-436e-802c-5a88c656720e" />
<img width="1898" height="911" alt="Image" src="https://github.com/user-attachments/assets/7da18292-3888-476f-90ef-28fa4181ca11" />
<img width="1918" height="910" alt="Image" src="https://github.com/user-attachments/assets/887d3e0f-0c5b-4f4c-bb48-0a1b55ae117c" />
<img width="1918" height="910" alt="Image" src="https://github.com/user-attachments/assets/a82e8cab-de7c-4a8e-b29a-c5379521e2a5" />
<img width="1895" height="895" alt="Image" src="https://github.com/user-attachments/assets/9fad1351-dc0f-4ca2-9e0d-d7d5d664bae7" />
<img width="1918" height="906" alt="Image" src="https://github.com/user-attachments/assets/208f0482-d711-4bca-bfc5-88df257bf9af" />
<img width="1918" height="913" alt="Image" src="https://github.com/user-attachments/assets/be921d7c-bc41-4e78-8ee3-6a038e959865" />
A full-stack banking system built with **Node.js** (Backend), **React.js** (Frontend), and **MySQL** (Database) following the **MVC (Model-View-Controller)** architecture.

## 📋 Features

### 👤 Customer Features
- **Secure Login** with 36-character alphanumeric access tokens
- **Transaction History** - View all deposits and withdrawals
- **Deposit Money** - Add funds to account with real-time balance updates
- **Withdraw Money** - Withdraw funds with insufficient balance protection
- **Account Balance** - Real-time balance display

### 🏛️ Banker Features
- **Banker Dashboard** - View all customer accounts
- **Customer Management** - Access any customer's transaction history
- **Account Overview** - Monitor all banking activities

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js, MySQL2
- **Frontend**: React.js, Material-UI, Axios
- **Database**: MySQL
- **Authentication**: JWT + 36-character access tokens
- **Architecture**: MVC (Model-View-Controller)

## 📁 Project Structure

```
banking_system/
├── backend/                 # Node.js API Server
│   ├── config/             # Database configuration
│   ├── controllers/        # Route controllers (MVC)
│   ├── models/             # Data models (MVC)
│   ├── routes/             # API routes
│   ├── middleware/         # Authentication & validation
│   ├── server.js           # Main server file
│   └── package.json        # Backend dependencies
├── frontend/               # React.js Application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API calls
│   │   └── utils/          # Helper functions
│   └── package.json        # Frontend dependencies
├── database/               # Database files
│   ├── schema.sql          # Database schema
│   └── seed.sql            # Sample data
└── README.md               # Project documentation
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### 1. Database Setup
```sql
-- Run these commands in MySQL
source database/schema.sql
source database/seed.sql
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials
npm install
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```

## 🔧 Environment Variables

Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=Bank

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=24h

# Token Configuration
ACCESS_TOKEN_LENGTH=36
```

## 🧪 Test Credentials

### Banker Login
- **Username**: `banker1`
- **Password**: `password123`

### Customer Logins
- **Customer 1**: `customer1` / `password123`
- **Customer 2**: `customer2` / `password123`
- **Customer 3**: `customer3` / `password123`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify token

### Customer Operations
- `GET /api/customer/transactions` - Get transaction history
- `POST /api/customer/deposit` - Deposit money
- `POST /api/customer/withdraw` - Withdraw money
- `GET /api/customer/balance` - Get account balance

### Banker Operations
- `GET /api/banker/accounts` - Get all customer accounts
- `GET /api/banker/customer/:id/transactions` - Get customer transactions

## 🏗️ Development Status

- ✅ **Phase 1**: Project Setup & Structure - **COMPLETE**
- ✅ **Phase 2**: Database Design - **COMPLETE**
- ✅ **Phase 3**: Backend API Development - **COMPLETE**
- ✅ **Phase 4**: Frontend Development - **COMPLETE**
- ✅ **Phase 5**: Integration & Testing - **COMPLETE**
- ✅ **Phase 6**: Deployment - **READY**

## 🧪 Testing

### Run Complete System Test
```bash
# Test all components (database, backend, frontend integration)
node test-complete-system.js
```

### Run Individual Tests
```bash
# Test backend components
cd backend && node test-all-routes.js

# Test banker dashboard specifically
cd backend && node test-banker-dashboard.js

# Test API integration
node test-integration.js
```

## 🚀 Deployment

See [deploy.md](deploy.md) for detailed deployment instructions.

### Quick Deploy Commands
```bash
# Backend (Railway/Render/Heroku)
npm install
npm start

# Frontend (Vercel/Netlify)
npm run build
```

### Live Demo
- **Frontend**: [Your deployed frontend URL]
- **Backend API**: [Your deployed backend URL]
- **GitHub**: [Your repository URL]

## 🎯 Assignment Requirements ✅

All assignment requirements have been implemented:

- ✅ **Database**: MySQL with Users and Accounts tables
- ✅ **Customer Login**: Username/email + password with 36-char tokens
- ✅ **Transactions Page**: Display history with deposit/withdraw buttons
- ✅ **Balance Display**: Shows available balance in popups
- ✅ **Insufficient Funds**: Proper error handling for withdrawals
- ✅ **Banker Login**: Separate login for bankers
- ✅ **Accounts Page**: Bankers can view all customer accounts
- ✅ **Transaction History**: Bankers can click users to view transactions
- ✅ **MVC Architecture**: Clean separation of concerns
- ✅ **Node.js + React.js**: Full-stack implementation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

---

🔧 **Next Steps**: Set up your MySQL database and configure the environment variables to start development! 
