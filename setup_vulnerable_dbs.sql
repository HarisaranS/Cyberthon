-- ============================================================================
-- VULNERABLE TEST DATABASES FOR DATASENTINEL
-- Contains real Indian PII patterns for testing network scanner
-- ============================================================================

-- ============================================================================
-- DATABASE 1: HR_SYSTEM (MySQL/PostgreSQL)
-- ============================================================================
CREATE DATABASE IF NOT EXISTS hr_system;
USE hr_system;

CREATE TABLE employees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(100),
    aadhaar_number VARCHAR(12),
    pan_card VARCHAR(10),
    mobile_number VARCHAR(10),
    email VARCHAR(100),
    date_of_birth DATE,
    passport_number VARCHAR(20),
    driving_license VARCHAR(20),
    bank_account VARCHAR(20),
    ifsc_code VARCHAR(11),
    salary DECIMAL(10,2),
    department VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO employees (full_name, aadhaar_number, pan_card, mobile_number, email, date_of_birth, passport_number, driving_license, bank_account, ifsc_code, salary, department) VALUES
('Rajesh Kumar Singh', '234567890123', 'ABCDE1234F', '9876543210', 'rajesh.singh@company.com', '1985-06-15', 'A1234567', 'MH02 2020 1234567', '12345678901234', 'HDFC0001234', 850000.00, 'Engineering'),
('Priya Sharma', '345678901234', 'BCDEF2345G', '9876543211', 'priya.sharma@company.com', '1990-03-22', 'B2345678', 'DL07 2019 2345678', '23456789012345', 'ICIC0002345', 650000.00, 'Marketing'),
('Amit Patel', '456789012345', 'CDEFG3456H', '9876543212', 'amit.patel@company.com', '1988-11-30', 'C3456789', 'GJ01 2021 3456789', '34567890123456', 'SBIN0003456', 750000.00, 'Finance'),
('Sneha Reddy', '567890123456', 'DEFGH4567I', '9876543213', 'sneha.reddy@company.com', '1992-08-18', 'D4567890', 'TN09 2020 4567890', '45678901234567', 'HDFC0004567', 550000.00, 'HR'),
('Vikram Malhotra', '678901234567', 'EFGHI5678J', '9876543214', 'vikram.m@company.com', '1987-01-25', 'E5678901', 'PB03 2018 5678901', '56789012345678', 'ICIC0005678', 920000.00, 'Engineering'),
('Ananya Iyer', '789012345678', 'FGHIJ6789K', '9876543215', 'ananya.iyer@company.com', '1991-12-10', 'F6789012', 'KA05 2019 6789012', '67890123456789', 'SBIN0006789', 680000.00, 'Product'),
('Rahul Verma', '890123456789', 'GHIJK7890L', '9876543216', 'rahul.verma@company.com', '1989-04-05', 'G7890123', 'UP14 2020 7890123', '78901234567890', 'HDFC0007890', 580000.00, 'Sales'),
('Kavya Nair', '901234567890', 'HIJKL8901M', '9876543217', 'kavya.nair@company.com', '1993-09-28', 'H8901234', 'KL07 2021 8901234', '89012345678901', 'ICIC0008901', 620000.00, 'Design'),
('Arjun Desai', '912345678901', 'IJKLM9012N', '9876543218', 'arjun.desai@company.com', '1986-07-14', 'I9012345', 'MH01 2017 9012345', '90123456789012', 'SBIN0009012', 890000.00, 'Engineering'),
('Meera Kapoor', '923456789012', 'JKLMN0123O', '9876543219', 'meera.kapoor@company.com', '1994-02-20', 'J0123456', 'DL08 2022 0123456', '01234567890123', 'HDFC0000123', 540000.00, 'Support');

-- ============================================================================
-- DATABASE 2: CUSTOMER_DB (MySQL/PostgreSQL)
-- ============================================================================
CREATE DATABASE IF NOT EXISTS customer_db;
USE customer_db;

CREATE TABLE customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_name VARCHAR(100),
    aadhaar VARCHAR(12),
    pan VARCHAR(10),
    phone VARCHAR(10),
    email VARCHAR(100),
    credit_card VARCHAR(16),
    cvv VARCHAR(3),
    expiry_date VARCHAR(7),
    voter_id VARCHAR(10),
    gstin VARCHAR(15),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO customers (customer_name, aadhaar, pan, phone, email, credit_card, cvv, expiry_date, voter_id, gstin, address) VALUES
('Suresh Raman', '234512345678', 'ABCPK1234L', '9123456789', 'suresh.r@gmail.com', '4532123456789012', '123', '12/2025', 'ABC1234567', '27AAPFU0939F1ZV', '123 MG Road, Bangalore'),
('Lakshmi Menon', '345623456789', 'BCDPL2345M', '9123456790', 'lakshmi.m@yahoo.com', '5412345678901234', '234', '06/2026', 'BCD2345678', '29AABCU9603R1ZX', '456 Anna Salai, Chennai'),
('Karthik Krishnan', '456734567890', 'CDEPM3456N', '9123456791', 'karthik.k@hotmail.com', '6011123456789012', '345', '09/2024', 'CDE3456789', '24AACFV3524M1ZY', '789 Park Street, Kolkata'),
('Divya Pillai', '567845678901', 'DEFPN4567O', '9123456792', 'divya.p@outlook.com', '3782123456789012', '456', '03/2027', 'DEF4567890', '07AADCB2230M1ZZ', '321 Connaught Place, Delhi'),
('Manoj Gupta', '678956789012', 'EFGPO5678P', '9123456793', 'manoj.g@rediffmail.com', '4532234567890123', '567', '11/2025', 'EFG5678901', '27AAGFG7834R1ZA', '654 FC Road, Pune');

-- ============================================================================
-- DATABASE 3: MEDICAL_RECORDS (MySQL/PostgreSQL)
-- ============================================================================
CREATE DATABASE IF NOT EXISTS medical_records;
USE medical_records;

CREATE TABLE patients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_name VARCHAR(100),
    aadhaar_no VARCHAR(12),
    mobile VARCHAR(10),
    email VARCHAR(100),
    blood_group VARCHAR(5),
    diagnosis TEXT,
    prescription TEXT,
    insurance_number VARCHAR(20),
    emergency_contact VARCHAR(10),
    medical_history TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO patients (patient_name, aadhaar_no, mobile, email, blood_group, diagnosis, prescription, insurance_number, emergency_contact, medical_history) VALUES
('Ramesh Choudhary', '234598765432', '9988776655', 'ramesh.c@email.com', 'O+', 'Type 2 Diabetes', 'Metformin 500mg twice daily', 'INS123456789', '9988776656', 'Hypertension, High cholesterol'),
('Sunita Joshi', '345609876543', '9988776657', 'sunita.j@email.com', 'A+', 'Hypertension', 'Amlodipine 5mg once daily', 'INS234567890', '9988776658', 'Diabetes family history'),
('Anil Bhatt', '456710987654', '9988776659', 'anil.b@email.com', 'B+', 'Asthma', 'Salbutamol inhaler as needed', 'INS345678901', '9988776660', 'Allergic rhinitis'),
('Pooja Saxena', '567821098765', '9988776661', 'pooja.s@email.com', 'AB+', 'Migraine', 'Sumatriptan 50mg when needed', 'INS456789012', '9988776662', 'Chronic headaches'),
('Deepak Agarwal', '678932109876', '9988776663', 'deepak.a@email.com', 'O-', 'Arthritis', 'Ibuprofen 400mg three times daily', 'INS567890123', '9988776664', 'Joint pain for 5 years');

-- ============================================================================
-- DATABASE 4: FINANCIAL_DATA (MySQL/PostgreSQL)
-- ============================================================================
CREATE DATABASE IF NOT EXISTS financial_data;
USE financial_data;

CREATE TABLE transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    account_holder VARCHAR(100),
    account_number VARCHAR(20),
    ifsc_code VARCHAR(11),
    pan_number VARCHAR(10),
    aadhaar_linked VARCHAR(12),
    transaction_amount DECIMAL(12,2),
    upi_id VARCHAR(50),
    credit_card_last4 VARCHAR(4),
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO transactions (account_holder, account_number, ifsc_code, pan_number, aadhaar_linked, transaction_amount, upi_id, credit_card_last4) VALUES
('Sanjay Mehta', '12340001234567', 'HDFC0001234', 'AABCS1234D', '234567891234', 125000.00, 'sanjay@oksbi', '9012'),
('Neha Agarwal', '23450002345678', 'ICIC0002345', 'BBCDT2345E', '345678902345', 85000.00, 'neha@paytm', '0123'),
('Rohit Khanna', '34560003456789', 'SBIN0003456', 'CCDEU3456F', '456789013456', 250000.00, 'rohit@gpay', '1234'),
('Anjali Bose', '45670004567890', 'HDFC0004567', 'DDEFV4567G', '567890124567', 45000.00, 'anjali@phonepe', '2345'),
('Varun Sinha', '56780005678901', 'ICIC0005678', 'EEFGW5678H', '678901235678', 180000.00, 'varun@amazonpay', '3456');

-- ============================================================================
-- DATABASE 5: VOTER_REGISTRY (MySQL/PostgreSQL)
-- ============================================================================
CREATE DATABASE IF NOT EXISTS voter_registry;
USE voter_registry;

CREATE TABLE voters (
    id INT PRIMARY KEY AUTO_INCREMENT,
    voter_name VARCHAR(100),
    voter_id VARCHAR(10),
    aadhaar_number VARCHAR(12),
    mobile_number VARCHAR(10),
    email VARCHAR(100),
    address TEXT,
    constituency VARCHAR(100),
    polling_booth VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO voters (voter_name, voter_id, aadhaar_number, mobile_number, email, address, constituency, polling_booth) VALUES
('Harish Rao', 'TLG1234567', '234567123456', '9876512345', 'harish.rao@email.com', 'House 123, Jubilee Hills, Hyderabad', 'Hyderabad Central', 'Booth 45, Jubilee Hills School'),
('Madhavi Reddy', 'TLG2345678', '345678234567', '9876512346', 'madhavi.r@email.com', 'Flat 456, Banjara Hills, Hyderabad', 'Hyderabad South', 'Booth 67, Banjara Hills College'),
('Venkat Swamy', 'TLG3456789', '456789345678', '9876512347', 'venkat.s@email.com', 'Plot 789, Kukatpally, Hyderabad', 'Hyderabad West', 'Booth 89, Kukatpally Community Hall'),
('Shalini Devi', 'TLG4567890', '567890456789', '9876512348', 'shalini.d@email.com', 'Villa 321, Gachibowli, Hyderabad', 'Hyderabad Tech City', 'Booth 12, Gachibowli School'),
('Prakash Naidu', 'TLG5678901', '678901567890', '9876512349', 'prakash.n@email.com', 'Apartment 654, Madhapur, Hyderabad', 'Hyderabad North', 'Booth 34, Madhapur College');

-- Grant permissions (for testing)
-- GRANT ALL PRIVILEGES ON hr_system.* TO 'root'@'%';
-- GRANT ALL PRIVILEGES ON customer_db.* TO 'root'@'%';
-- GRANT ALL PRIVILEGES ON medical_records.* TO 'root'@'%';
-- GRANT ALL PRIVILEGES ON financial_data.* TO 'root'@'%';
-- GRANT ALL PRIVILEGES ON voter_registry.* TO 'root'@'%';
-- FLUSH PRIVILEGES;
