import { rawQuery } from "./db"

const SCHEMA = `
-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'Staff',
    status VARCHAR(50) NOT NULL DEFAULT 'Active',
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
    gst_applicable VARCHAR(10) NOT NULL DEFAULT 'no',
    gst_number VARCHAR(100),
    gst_percentage NUMERIC DEFAULT 0,
    pan_number VARCHAR(100),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    signature_image TEXT
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
    same_state VARCHAR(10) NOT NULL DEFAULT 'no',
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
    status VARCHAR(50) NOT NULL DEFAULT 'Pending',
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
    renewal_type VARCHAR(50) NOT NULL,
    service VARCHAR(255) NOT NULL,
    renewal_date VARCHAR(50) NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    remarks TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Upcoming',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`

export async function seedDatabase() {
  console.log("Starting DB seeding...")
  try {
    // 1. Create tables
    await rawQuery(SCHEMA)
    console.log("Tables created/checked successfully.")

    // 2. Check if users table is empty
    const userCheck = await rawQuery("SELECT COUNT(*) FROM users")
    if (parseInt(userCheck.rows[0].count, 10) === 0) {
      console.log("Seeding default users...")
      await rawQuery(`
        INSERT INTO users (email, password, name, role, status, initials) VALUES
        ('aarav@ledgerly.in', 'ledgerly123', 'Aarav Khanna', 'Administrator', 'Active', 'AK'),
        ('meera@ledgerly.in', 'ledgerly123', 'Meera Shah', 'Staff', 'Active', 'MS'),
        ('rohan@ledgerly.in', 'ledgerly123', 'Rohan Desai', 'Staff', 'Inactive', 'RD')
      `)
    }

    // 3. Check if companies are empty
    const companyCheck = await rawQuery("SELECT COUNT(*) FROM companies")
    if (parseInt(companyCheck.rows[0].count, 10) === 0) {
      console.log("Seeding default companies...")
      await rawQuery(`
        INSERT INTO companies (name, company_name, invoice_prefix, currency, address, city, state, postal_code, country, gst_applicable, gst_number, gst_percentage, pan_number, phone, mobile) VALUES
        ('Swastik Web Technology', 'Swastik Web Technology Pvt. Ltd.', 'SWT/26-27/', 'INR', '404, Pinnacle Corporate, Hinjawadi', 'Pune', 'Maharashtra', '411057', 'India', 'yes', '27AAXFS1234K1Z7', 18, 'AAXFS1234K', '020-123456', '9876543210'),
        ('Northstar Digital Labs', 'Northstar Digital Labs Ltd.', 'NDL/26-27/', 'INR', 'B-2, Tech Hub, Koramangala', 'Bengaluru', 'Karnataka', '560034', 'India', 'yes', '29AAFCN7821B1ZM', 18, 'AAFCN7821B', '080-234567', '9876543211'),
        ('Pixel Grove Studio', 'Pixel Grove Studio', 'PGS/26-27/', 'INR', '78, Creative Alley, Bandra West', 'Mumbai', 'Maharashtra', '400050', 'India', 'no', NULL, 0, 'AAFCP1234K', NULL, '9876543212')
      `)
    }

    // 4. Check if clients are empty
    const clientCheck = await rawQuery("SELECT COUNT(*) FROM clients")
    if (parseInt(clientCheck.rows[0].count, 10) === 0) {
      console.log("Seeding default clients...")
      await rawQuery(`
        INSERT INTO clients (name, company_name, email, phone, address, city, state, postal_code, country, pan_number, gst_number, same_state) VALUES
        ('Aurum Retail Pvt. Ltd.', 'Aurum Retail', 'accounts@aurum.in', '9898989898', 'Seawoods Grand Central', 'Navi Mumbai', 'Maharashtra', '400706', 'India', 'AAECA1234G', '27AAECA1234G1ZP', 'yes'),
        ('Northstar Studios', 'Northstar Studios', 'finance@northstar.in', '9898989897', 'Goregaon East', 'Mumbai', 'Maharashtra', '400063', 'India', 'AABCN8421E', '27AABCN8421E1Z8', 'yes'),
        ('Kite & Key Advisory', 'Kite & Key Advisory', 'hello@kitekey.co', '9898989896', 'Indiranagar', 'Bengaluru', 'Karnataka', '560038', 'India', 'AAJFK7123C', '29AAJFK7123C1Z2', 'no'),
        ('Bluebird Hospitality', 'Bluebird Hospitality', 'billing@bluebird.in', '9898989895', 'Panaji', 'Panaji', 'Goa', '403001', 'India', 'AADCB5521F', '30AADCB5521F1Z4', 'no')
      `)
    }

    // 5. Check if invoices are empty
    const invoiceCheck = await rawQuery("SELECT COUNT(*) FROM invoices")
    if (parseInt(invoiceCheck.rows[0].count, 10) === 0) {
      console.log("Seeding default invoices...")
      
      const swtCompany = await rawQuery("SELECT id FROM companies WHERE name = 'Swastik Web Technology'")
      const ndlCompany = await rawQuery("SELECT id FROM companies WHERE name = 'Northstar Digital Labs'")
      const aurumClient = await rawQuery("SELECT id FROM clients WHERE name = 'Aurum Retail Pvt. Ltd.'")
      const northstarClient = await rawQuery("SELECT id FROM clients WHERE name = 'Northstar Studios'")
      const kiteClient = await rawQuery("SELECT id FROM clients WHERE name = 'Kite & Key Advisory'")
      const bluebirdClient = await rawQuery("SELECT id FROM clients WHERE name = 'Bluebird Hospitality'")

      if (swtCompany.rows.length && ndlCompany.rows.length) {
        const swtId = swtCompany.rows[0].id
        const ndlId = ndlCompany.rows[0].id

        const clientMap = {
          aurum: aurumClient.rows[0]?.id,
          northstar: northstarClient.rows[0]?.id,
          kite: kiteClient.rows[0]?.id,
          bluebird: bluebirdClient.rows[0]?.id,
        }

        // Invoice 104
        const inv104 = await rawQuery(`
          INSERT INTO invoices (invoice_number, invoice_date, due_date, company_id, client_id, total_amount, gst_amount, net_payable, status)
          VALUES ('SWT/26-27/104', '2026-07-12', '2026-07-27', $1, $2, 72000, 12960, 84960, 'Paid') RETURNING id
        `, [swtId, clientMap.northstar])
        await rawQuery(`INSERT INTO invoice_items (invoice_id, particulars, hsn_sac, price, qty) VALUES ($1, 'Website development retainer', '998314', 72000, 1)`, [inv104.rows[0].id])

        // Invoice 103
        const inv103 = await rawQuery(`
          INSERT INTO invoices (invoice_number, invoice_date, due_date, company_id, client_id, total_amount, gst_amount, net_payable, status)
          VALUES ('SWT/26-27/103', '2026-07-11', '2026-07-26', $1, $2, 36000, 6480, 42480, 'Pending') RETURNING id
        `, [swtId, clientMap.aurum])
        await rawQuery(`INSERT INTO invoice_items (invoice_id, particulars, hsn_sac, price, qty) VALUES ($1, 'UI/UX Design services', '998314', 36000, 1)`, [inv103.rows[0].id])

        // Invoice 102
        const inv102 = await rawQuery(`
          INSERT INTO invoices (invoice_number, invoice_date, due_date, company_id, client_id, total_amount, gst_amount, net_payable, status)
          VALUES ('NDL/26-27/102', '2026-07-09', '2026-07-24', $1, $2, 15500, 2790, 18290, 'Paid') RETURNING id
        `, [ndlId, clientMap.kite])
        await rawQuery(`INSERT INTO invoice_items (invoice_id, particulars, hsn_sac, price, qty) VALUES ($1, 'Cloud server maintenance', '998314', 15500, 1)`, [inv102.rows[0].id])

        // Invoice 101
        const inv101 = await rawQuery(`
          INSERT INTO invoices (invoice_number, invoice_date, due_date, company_id, client_id, total_amount, gst_amount, net_payable, status)
          VALUES ('SWT/26-27/101', '2026-07-08', '2026-07-23', $1, $2, 57500, 10350, 67850, 'Overdue') RETURNING id
        `, [swtId, clientMap.bluebird])
        await rawQuery(`INSERT INTO invoice_items (invoice_id, particulars, hsn_sac, price, qty) VALUES ($1, 'Backend development retainer', '998314', 57500, 1)`, [inv101.rows[0].id])
      }
    }

    // 6. Check if renewals are empty
    const renewalCheck = await rawQuery("SELECT COUNT(*) FROM renewals")
    if (parseInt(renewalCheck.rows[0].count, 10) === 0) {
      console.log("Seeding default renewals...")
      await rawQuery(`
        INSERT INTO renewals (renewal_type, service, renewal_date, amount, remarks, status) VALUES
        ('Domain', 'northstar.in', '18-Jul', 1499, 'Domain renewal for main client site', 'Due soon'),
        ('Hosting', 'Cloud hosting plan', '24-Jul', 18000, 'AWS standard hosting setup', 'Upcoming'),
        ('AMC', 'Annual maintenance', '02-Aug', 42000, 'General maintenance SLA', 'Upcoming')
      `)
    }

    console.log("DB seeding completed successfully.")
  } catch (err) {
    console.error("Failed to seed database:", err)
  }
}
