-- Banking System Database Schema
-- Database: Bank

-- Database is already created by Docker environment
USE bank;

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS accesstokens;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS users;

-- 1. Users Table - Stores banker and customer details
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('customer', 'banker') NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(15),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role)
);

-- 2. Accounts Table - Stores customer account information
CREATE TABLE accounts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    account_number VARCHAR(20) UNIQUE NOT NULL,
    balance DECIMAL(15,2) DEFAULT 0.00,
    account_type ENUM('savings', 'checking') DEFAULT 'savings',
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_account_number (account_number)
);

-- 3. Transactions Table - Logs all deposit and withdrawal transactions
CREATE TABLE transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    account_id INT NOT NULL,
    type ENUM('deposit', 'withdrawal') NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    balance_before DECIMAL(15,2) NOT NULL,
    balance_after DECIMAL(15,2) NOT NULL,
    description TEXT,
    reference_number VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    INDEX idx_account_id (account_id),
    INDEX idx_type (type),
    INDEX idx_reference_number (reference_number),
    INDEX idx_created_at (created_at)
);

-- 4. Access Tokens Table - Stores 36-character access tokens
CREATE TABLE accesstokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token VARCHAR(36) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
);

-- Create triggers for automatic account number generation
DELIMITER //
CREATE TRIGGER generate_account_number
    BEFORE INSERT ON accounts
    FOR EACH ROW
BEGIN
    IF NEW.account_number IS NULL OR NEW.account_number = '' THEN
        SET NEW.account_number = CONCAT('ACC', LPAD(NEW.user_id, 3, '0'), LPAD((SELECT COUNT(*) + 1 FROM accounts WHERE user_id = NEW.user_id), 6, '0'));
    END IF;
END//
DELIMITER ;

-- Create trigger for automatic reference number generation
DELIMITER //
CREATE TRIGGER generate_reference_number
    BEFORE INSERT ON transactions
    FOR EACH ROW
BEGIN
    IF NEW.reference_number IS NULL OR NEW.reference_number = '' THEN
        SET NEW.reference_number = CONCAT('TXN', LPAD(NEW.account_id, 3, '0'), LPAD((SELECT COUNT(*) + 1 FROM transactions WHERE account_id = NEW.account_id), 6, '0'));
    END IF;
END//
DELIMITER ;

-- Show tables
SHOW TABLES;

-- Display table structures
DESCRIBE users;
DESCRIBE accounts;
DESCRIBE transactions;
DESCRIBE accesstokens;