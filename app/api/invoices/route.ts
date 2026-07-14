import { NextRequest, NextResponse } from "next/server"
import { query, getClient } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "25", 10)
    const search = searchParams.get("search") || ""
    const offset = (page - 1) * limit

    let countQuery = `
      SELECT COUNT(*) 
      FROM invoices i
      JOIN companies c ON i.company_id = c.id
      JOIN clients cl ON i.client_id = cl.id
    `
    let selectQuery = `
      SELECT i.*, c.name as company_name, cl.name as client_name, c.currency as currency
      FROM invoices i
      JOIN companies c ON i.company_id = c.id
      JOIN clients cl ON i.client_id = cl.id
    `
    const params: any[] = []

    if (search) {
      params.push(`%${search}%`)
      const searchClause = ` WHERE i.invoice_number ILIKE $1 OR c.name ILIKE $1 OR cl.name ILIKE $1 OR i.status ILIKE $1`
      countQuery += searchClause
      selectQuery += searchClause
    }

    selectQuery += ` ORDER BY i.id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    const selectParams = [...params, limit, offset]

    const totalResult = await query(countQuery, params)
    const total = parseInt(totalResult.rows[0].count, 10)

    const result = await query(selectQuery, selectParams)

    return NextResponse.json({
      data: result.rows,
      total,
      page,
      limit,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const pgClient = await getClient()
  try {
    const data = await req.json()
    const {
      company_id,
      client_id,
      invoice_date,
      due_date,
      items, // array of { particulars, hsn_sac, price, qty }
      status
    } = data

    if (!company_id || !client_id || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Company, Client, and Line Items are mandatory." }, { status: 400 })
    }

    // 1. Fetch Company details
    const companyRes = await query("SELECT * FROM companies WHERE id = $1", [company_id])
    if (companyRes.rows.length === 0) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }
    const company = companyRes.rows[0]

    // 2. Fetch Client details
    const clientRes = await query("SELECT * FROM clients WHERE id = $1", [client_id])
    if (clientRes.rows.length === 0) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }
    const client = clientRes.rows[0]

    // 3. Generate Sequence Invoice Number
    // Query invoices under the current company's prefix
    const prefix = company.invoice_prefix
    const matchingInvoices = await query(
      "SELECT invoice_number FROM invoices WHERE company_id = $1 AND invoice_number LIKE $2",
      [company_id, `${prefix}%`]
    )

    let maxSerial = 0
    matchingInvoices.rows.forEach(inv => {
      const invNum = inv.invoice_number
      // e.g., if invNum is "SWT/26-27/10" and prefix is "SWT/26-27/", suffix is "10"
      const suffix = invNum.substring(prefix.length)
      const serial = parseInt(suffix, 10)
      if (!isNaN(serial) && serial > maxSerial) {
        maxSerial = serial
      }
    })

    const nextSerial = maxSerial + 1
    // Pad to 2 digits at least (e.g. "01", "02" ... "10", "11"...)
    const paddedSerial = nextSerial < 10 ? `0${nextSerial}` : `${nextSerial}`
    const invoiceNumber = prefix + paddedSerial

    // 4. Calculate Taxes
    let subtotal = 0
    items.forEach((item: any) => {
      const price = parseFloat(item.price) || 0
      const qty = parseInt(item.qty, 10) || 1
      subtotal += price * qty
    })

    let gstPercentage = 0
    let gstAmount = 0
    
    if (company.gst_applicable === "yes") {
      gstPercentage = parseFloat(company.gst_percentage) || 0
      gstAmount = subtotal * (gstPercentage / 100)
    }

    const netPayable = subtotal + gstAmount

    // Begin PG Transaction
    await pgClient.query("BEGIN")

    // Insert Invoice
    const invoiceInsert = await pgClient.query(`
      INSERT INTO invoices (
        invoice_number, invoice_date, due_date, company_id, client_id,
        total_amount, gst_amount, net_payable, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      ) RETURNING *
    `, [
      invoiceNumber,
      invoice_date || new Date().toISOString().split("T")[0],
      due_date || new Date().toISOString().split("T")[0],
      company_id,
      client_id,
      subtotal,
      gstAmount,
      netPayable,
      status || "Pending"
    ])

    const newInvoice = invoiceInsert.rows[0]

    // Insert Items
    for (const item of items) {
      await pgClient.query(`
        INSERT INTO invoice_items (invoice_id, particulars, hsn_sac, price, qty)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        newInvoice.id,
        item.particulars,
        item.hsn_sac,
        parseFloat(item.price) || 0,
        parseInt(item.qty, 10) || 1
      ])
    }

    await pgClient.query("COMMIT")

    return NextResponse.json({ success: true, invoice: newInvoice })
  } catch (err: any) {
    await pgClient.query("ROLLBACK")
    return NextResponse.json({ error: err.message }, { status: 500 })
  } finally {
    pgClient.release()
  }
}
