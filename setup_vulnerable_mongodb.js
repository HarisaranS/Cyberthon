// ============================================================================
// VULNERABLE MONGODB DATABASE FOR DATASENTINEL
// Contains real Indian PII patterns for testing network scanner
// ============================================================================

// Switch to vulnerable database
use vulnerable_app_db;

// ============================================================================
// COLLECTION 1: user_profiles
// ============================================================================
db.user_profiles.insertMany([
  {
    username: "rajesh_kumar",
    full_name: "Rajesh Kumar",
    aadhaar: "234567890123",
    pan: "ABCDE1234F",
    mobile: "9876543210",
    email: "rajesh.kumar@example.com",
    dob: "1985-06-15",
    passport: "A1234567",
    driving_license: "MH02 2020 1234567",
    address: "123 MG Road, Mumbai, Maharashtra",
    created_at: new Date()
  },
  {
    username: "priya_sharma",
    full_name: "Priya Sharma",
    aadhaar: "345678901234",
    pan: "BCDEF2345G",
    mobile: "9876543211",
    email: "priya.sharma@example.com",
    dob: "1990-03-22",
    passport: "B2345678",
    driving_license: "DL07 2019 2345678",
    address: "456 Connaught Place, New Delhi",
    created_at: new Date()
  },
  {
    username: "amit_patel",
    full_name: "Amit Patel",
    aadhaar: "456789012345",
    pan: "CDEFG3456H",
    mobile: "9876543212",
    email: "amit.patel@example.com",
    dob: "1988-11-30",
    passport: "C3456789",
    driving_license: "GJ01 2021 3456789",
    address: "789 CG Road, Ahmedabad, Gujarat",
    created_at: new Date()
  }
]);

// ============================================================================
// COLLECTION 2: payment_methods
// ============================================================================
db.payment_methods.insertMany([
  {
    user_id: "rajesh_kumar",
    card_number: "4532123456789012",
    cvv: "123",
    expiry: "12/2025",
    card_holder: "RAJESH KUMAR",
    bank_account: "12345678901234",
    ifsc: "HDFC0001234",
    upi_id: "rajesh@oksbi",
    created_at: new Date()
  },
  {
    user_id: "priya_sharma",
    card_number: "5412345678901234",
    cvv: "234",
    expiry: "06/2026",
    card_holder: "PRIYA SHARMA",
    bank_account: "23456789012345",
    ifsc: "ICIC0002345",
    upi_id: "priya@paytm",
    created_at: new Date()
  },
  {
    user_id: "amit_patel",
    card_number: "6011123456789012",
    cvv: "345",
    expiry: "09/2024",
    card_holder: "AMIT PATEL",
    bank_account: "34567890123456",
    ifsc: "SBIN0003456",
    upi_id: "amit@gpay",
    created_at: new Date()
  }
]);

// ============================================================================
// COLLECTION 3: kyc_documents
// ============================================================================
db.kyc_documents.insertMany([
  {
    user_id: "rajesh_kumar",
    aadhaar_number: "234567890123",
    pan_number: "ABCDE1234F",
    voter_id: "ABC1234567",
    passport_number: "A1234567",
    gstin: "27AAPFU0939F1ZV",
    verification_status: "approved",
    verified_at: new Date(),
    documents: {
      aadhaar_front: "/uploads/aadhaar_front_raj.jpg",
      aadhaar_back: "/uploads/aadhaar_back_raj.jpg",
      pan_card: "/uploads/pan_raj.jpg"
    }
  },
  {
    user_id: "priya_sharma",
    aadhaar_number: "345678901234",
    pan_number: "BCDEF2345G",
    voter_id: "BCD2345678",
    passport_number: "B2345678",
    gstin: "07AABCU9603R1ZX",
    verification_status: "pending",
    verified_at: null,
    documents: {
      aadhaar_front: "/uploads/aadhaar_front_priya.jpg",
      aadhaar_back: "/uploads/aadhaar_back_priya.jpg",
      pan_card: "/uploads/pan_priya.jpg"
    }
  }
]);

// ============================================================================
// COLLECTION 4: medical_records
// ============================================================================
db.medical_records.insertMany([
  {
    patient_name: "Rajesh Kumar",
    aadhaar: "234567890123",
    mobile: "9876543210",
    email: "rajesh.kumar@example.com",
    blood_group: "O+",
    diagnosis: "Type 2 Diabetes",
    prescription: "Metformin 500mg twice daily",
    insurance_number: "INS123456789",
    emergency_contact: "9876543220",
    medical_history: ["Hypertension", "High cholesterol"],
    last_visit: new Date(),
    doctor: "Dr. Sharma"
  },
  {
    patient_name: "Priya Sharma",
    aadhaar: "345678901234",
    mobile: "9876543211",
    email: "priya.sharma@example.com",
    blood_group: "A+",
    diagnosis: "Hypertension",
    prescription: "Amlodipine 5mg once daily",
    insurance_number: "INS234567890",
    emergency_contact: "9876543221",
    medical_history: ["Diabetes family history"],
    last_visit: new Date(),
    doctor: "Dr. Patel"
  }
]);

// ============================================================================
// COLLECTION 5: employee_data
// ============================================================================
db.employee_data.insertMany([
  {
    emp_id: "EMP001",
    full_name: "Vikram Malhotra",
    aadhaar: "678901234567",
    pan: "EFGHI5678J",
    mobile: "9876543214",
    email: "vikram.m@company.com",
    dob: "1987-01-25",
    salary: 920000,
    bank_account: "56789012345678",
    ifsc: "ICIC0005678",
    department: "Engineering",
    joining_date: "2020-01-15",
    emergency_contact: {
      name: "Sunita Malhotra",
      relation: "Wife",
      phone: "9876543224"
    }
  },
  {
    emp_id: "EMP002",
    full_name: "Ananya Iyer",
    aadhaar: "789012345678",
    pan: "FGHIJ6789K",
    mobile: "9876543215",
    email: "ananya.iyer@company.com",
    dob: "1991-12-10",
    salary: 680000,
    bank_account: "67890123456789",
    ifsc: "SBIN0006789",
    department: "Product",
    joining_date: "2021-03-20",
    emergency_contact: {
      name: "Ramesh Iyer",
      relation: "Father",
      phone: "9876543225"
    }
  }
]);

// Create indexes
db.user_profiles.createIndex({ aadhaar: 1 });
db.user_profiles.createIndex({ pan: 1 });
db.user_profiles.createIndex({ mobile: 1 });
db.payment_methods.createIndex({ user_id: 1 });
db.kyc_documents.createIndex({ user_id: 1 });
db.medical_records.createIndex({ aadhaar: 1 });
db.employee_data.createIndex({ emp_id: 1 });

print("✅ Vulnerable MongoDB database created successfully!");
print("Database: vulnerable_app_db");
print("Collections: user_profiles, payment_methods, kyc_documents, medical_records, employee_data");
