-- Create test database with critical PII data
DROP DATABASE IF EXISTS test_pii_data;
CREATE DATABASE test_pii_data;
USE test_pii_data;

-- Customers table with Indian PII
CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100),
    email VARCHAR(100),
    mobile VARCHAR(15),
    aadhaar VARCHAR(20),
    pan_card VARCHAR(10),
    date_of_birth DATE,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employees table
CREATE TABLE employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_name VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(15),
    aadhaar_number VARCHAR(20),
    pan_number VARCHAR(10),
    passport_number VARCHAR(20),
    bank_account VARCHAR(20),
    ifsc_code VARCHAR(11),
    salary DECIMAL(10,2),
    department VARCHAR(50)
);

-- Financial transactions
CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT,
    credit_card VARCHAR(20),
    upi_id VARCHAR(50),
    transaction_amount DECIMAL(10,2),
    transaction_date DATETIME,
    description TEXT
);

-- Insert critical customer data
INSERT INTO customers (full_name, email, mobile, aadhaar, pan_card, date_of_birth, address) VALUES
('Rajesh Kumar Sharma', 'rajesh.sharma@gmail.com', '9876543210', '2345 6789 0123', 'ABCDE1234F', '1985-06-15', '123 MG Road, Bangalore, Karnataka 560001'),
('Priya Patel', 'priya.patel@yahoo.com', '8765432109', '3456 7890 1234', 'BCDEA2345G', '1990-03-22', '456 Park Street, Mumbai, Maharashtra 400001'),
('Amit Singh', 'amit.singh@hotmail.com', '7654321098', '4567 8901 2345', 'CDEFB3456H', '1988-11-30', '789 Nehru Place, Delhi 110019'),
('Sneha Reddy', 'sneha.reddy@outlook.com', '9123456789', '5678 9012 3456', 'DEFGC4567I', '1992-08-18', '321 Banjara Hills, Hyderabad, Telangana 500034'),
('Vikram Malhotra', 'vikram.m@gmail.com', '8234567890', '6789 0123 4567', 'EFGHD5678J', '1987-12-05', '654 Connaught Place, New Delhi 110001');

-- Insert employee data
INSERT INTO employees (employee_name, email, phone, aadhaar_number, pan_number, passport_number, bank_account, ifsc_code, salary, department) VALUES
('Ananya Iyer', 'ananya.iyer@company.com', '9988776655', '7890 1234 5678', 'FGHIE6789K', 'A1234567', '12345678901234', 'HDFC0001234', 85000.00, 'Engineering'),
('Karthik Nair', 'karthik.nair@company.com', '8877665544', '8901 2345 6789', 'GHIJF7890L', 'B2345678', '23456789012345', 'ICIC0002345', 92000.00, 'Finance'),
('Deepika Joshi', 'deepika.j@company.com', '7766554433', '9012 3456 7890', 'HIJKG8901M', 'C3456789', '34567890123456', 'SBIN0003456', 78000.00, 'HR'),
('Rahul Verma', 'rahul.verma@company.com', '6655443322', '2123 4567 8901', 'IJKLH9012N', 'D4567890', '45678901234567', 'AXIS0004567', 105000.00, 'Sales'),
('Meera Kapoor', 'meera.kapoor@company.com', '9876501234', '3234 5678 9012', 'JKLMI0123O', 'E5678901', '56789012345678', 'KKBK0005678', 95000.00, 'Marketing');

-- Insert transaction data
INSERT INTO transactions (customer_id, credit_card, upi_id, transaction_amount, transaction_date, description) VALUES
(1, '4532 1234 5678 9010', 'rajesh@oksbi', 15000.00, '2024-01-15 10:30:00', 'Online shopping payment'),
(2, '5425 2345 6789 0123', 'priya@paytm', 8500.00, '2024-01-16 14:20:00', 'Hotel booking'),
(3, '3782 3456 7890 1234', 'amit@ybl', 25000.00, '2024-01-17 09:15:00', 'Electronics purchase'),
(4, '6011 4567 8901 2345', 'sneha@okaxis', 12000.00, '2024-01-18 16:45:00', 'Flight tickets'),
(5, '4916 5678 9012 3456', 'vikram@okicici', 35000.00, '2024-01-19 11:00:00', 'Furniture purchase');

-- Voter records table
CREATE TABLE voter_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    voter_name VARCHAR(100),
    voter_id VARCHAR(10),
    mobile VARCHAR(15),
    constituency VARCHAR(100)
);

INSERT INTO voter_records (voter_name, voter_id, mobile, constituency) VALUES
('Suresh Gupta', 'ABC1234567', '9871234567', 'South Delhi'),
('Lakshmi Menon', 'DEF2345678', '8761234567', 'Bangalore Central'),
('Arjun Desai', 'GHI3456789', '7651234567', 'Mumbai North');

-- Medical records (highly sensitive)
CREATE TABLE medical_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_name VARCHAR(100),
    aadhaar VARCHAR(20),
    mobile VARCHAR(15),
    diagnosis TEXT,
    prescription TEXT,
    doctor_name VARCHAR(100)
);

INSERT INTO medical_records (patient_name, aadhaar, mobile, diagnosis, prescription, doctor_name) VALUES
('Ramesh Choudhary', '4345 6789 0123', '9123456780', 'Type 2 Diabetes, Hypertension', 'Metformin 500mg, Amlodipine 5mg', 'Dr. Anjali Mehta'),
('Kavita Sharma', '5456 7890 1234', '8123456781', 'Asthma, Allergic Rhinitis', 'Salbutamol Inhaler, Cetirizine 10mg', 'Dr. Rajiv Kumar'),
('Sanjay Rao', '6567 8901 2345', '7123456782', 'Chronic Back Pain', 'Ibuprofen 400mg, Physiotherapy', 'Dr. Priya Singh');

SELECT 'Database setup complete!' AS status;
