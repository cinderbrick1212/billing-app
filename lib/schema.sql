-- Database Schema for Billing App

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'Staff', -- 'Administrator' or 'Staff'
    status VARCHAR(50) NOT NULL DEFAULT 'Active', -- 'Active' or 'Inactive'
    initials VARCHAR(10) NOT NULL
);

-- Companies Table
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    invoice_prefix VARCHAR(255) UNIQUE NOT NULL,
    currency VARCHAR(50) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    gst_applicable VARCHAR(10) NOT NULL DEFAULT 'no', -- 'yes' or 'no'
    gst_number VARCHAR(100),
    gst_percentage NUMERIC DEFAULT 0,
    pan_number VARCHAR(100),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    signature_image TEXT -- Base64 encoded or image url
);

-- Clients Table
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    pan_number VARCHAR(100),
    gst_number VARCHAR(100),
    same_state VARCHAR(10) NOT NULL DEFAULT 'no', -- 'yes' or 'no'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(255) UNIQUE NOT NULL,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    client_id INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    gst_amount NUMERIC NOT NULL DEFAULT 0,
    net_payable NUMERIC NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending', -- 'Paid', 'Pending', 'Overdue'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Invoice Line Items Table
CREATE TABLE IF NOT EXISTS invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    particulars TEXT NOT NULL,
    hsn_sac VARCHAR(100),
    price NUMERIC NOT NULL DEFAULT 0,
    qty INT NOT NULL DEFAULT 1
);

-- Renewals Table
CREATE TABLE IF NOT EXISTS renewals (
    id SERIAL PRIMARY KEY,
    renewal_type VARCHAR(50) NOT NULL, -- 'Domain', 'Hosting', 'AMC', 'Other'
    service VARCHAR(255) NOT NULL,
    renewal_date VARCHAR(50) NOT NULL, -- e.g., '15-May'
    amount NUMERIC NOT NULL DEFAULT 0,
    remarks TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Upcoming', -- 'Due soon', 'Upcoming'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
