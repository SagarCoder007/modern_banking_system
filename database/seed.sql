-- Banking System Seed Data
USE bank;

-- Insert Sample Users (passwords are hashed for 'password123')
INSERT INTO users (username, email, password, role, first_name, last_name, phone) VALUES
('banker1', 'banker@bank.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'banker', 'John', 'Banker', '1234567890'),
('customer1', 'alice@email.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'customer', 'Alice', 'Johnson', '1234567891'),
('customer2', 'bob@email.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'customer', 'Bob', 'Smith', '1234567892'),
('customer3', 'carol@email.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'customer', 'Carol', 'Davis', '1234567893');

-- Insert Sample Accounts (only for customers)
INSERT INTO accounts (user_id, account_number, balance, account_type) VALUES
(2, 'ACC001000001', 5000.00, 'savings'),    -- Alice's account
(3, 'ACC001000002', 3500.50, 'checking'),   -- Bob's account  
(4, 'ACC001000003', 10000.75, 'savings');   -- Carol's account

-- Insert Sample Transactions
INSERT INTO transactions (account_id, type, amount, balance_before, balance_after, description, reference_number) VALUES
-- Alice's transactions
(1, 'deposit', 1000.00, 4000.00, 5000.00, 'Initial deposit', 'TXN001000001'),
(1, 'withdrawal', 200.00, 5200.00, 5000.00, 'ATM withdrawal', 'TXN001000002'),

-- Bob's transactions  
(2, 'deposit', 3500.50, 0.00, 3500.50, 'Opening deposit', 'TXN001000003'),
(2, 'deposit', 500.00, 3000.50, 3500.50, 'Salary deposit', 'TXN001000004'),

-- Carol's transactions
(3, 'deposit', 10000.75, 0.00, 10000.75, 'Initial deposit', 'TXN001000005'),
(3, 'withdrawal', 1000.00, 11000.75, 10000.75, 'Cash withdrawal', 'TXN001000006');

-- Note: Default login credentials for testing:
-- Banker: username=banker1, password=password123
-- Customer1: username=customer1, password=password123  
-- Customer2: username=customer2, password=password123
-- Customer3: username=customer3, password=password123 