import { NextRequest, NextResponse } from "next/server"
import { query, getClient } from "@/lib/db"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    // Check if ID is serial integer or Invoice Number slug
    let invoiceRes
    if (!isNaN(parseInt(id, 10)) && !id.includes("/") && !id.includes("-")) {
      invoiceRes = await query(`
        SELECT i.*, c.name as company_name, c.company_name as company_legal_name, c.address as company_address, c.city as company_city, c.state as company_state, c.postal_code as company_postal_code, c.country as company_country, c.gst_applicable as company_gst_applicable, c.gst_number as company_gst_number, c.gst_percentage as company_gst_percentage, c.pan_number as company_pan, c.phone as company_phone, c.signature_image as company_signature, c.currency as currency,
               cl.name as client_name, cl.company_name as client_legal_name, cl.email as client_email, cl.phone as client_phone, cl.address as client_address, cl.city as client_city, cl.state as client_state, cl.postal_code as client_postal_code, cl.country as client_country, cl.gst_number as client_gst_number, cl.same_state as client_same_state
        FROM invoices i
        JOIN companies c ON i.company_id = c.id
        JOIN clients cl ON i.client_id = cl.id
        WHERE i.id = $1
      `, [id])
    } else {
      // Find by slug/number suffix or exact number
      invoiceRes = await query(`
        SELECT i.*, c.name as company_name, c.company_name as company_legal_name, c.address as company_address, c.city as company_city, c.state as company_state, c.postal_code as company_postal_code, c.country as company_country, c.gst_applicable as company_gst_applicable, c.gst_number as company_gst_number, c.gst_percentage as company_gst_percentage, c.pan_number as company_pan, c.phone as company_phone, c.signature_image as company_signature, c.currency as currency,
               cl.name as client_name, cl.company_name as client_legal_name, cl.email as client_email, cl.phone as client_phone, cl.address as client_address, cl.city as client_city, cl.state as client_state, cl.postal_code as client_postal_code, cl.country as client_country, cl.gst_number as client_gst_number, cl.same_state as client_same_state
        FROM invoices i
        JOIN companies c ON i.company_id = c.id
        JOIN clients cl ON i.client_id = cl.id
        WHERE i.invoice_number = $1 OR i.invoice_number LIKE $2
      `, [id, `%/${id}`])
    }

    if (invoiceRes.rows.length === 0) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    const invoice = invoiceRes.rows[0]

    // Fetch line items
    const itemsRes = await query("SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY id ASC", [invoice.id])
    invoice.items = itemsRes.rows

    return NextResponse.json({ invoice })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const pgClient = await getClient()
  try {
    const { id } = await params
    const data = await req.json()
    const {
      company_id,
      client_id,
      invoice_date,
      due_date,
      items,
      status
    } = data

    if (!company_id || !client_id || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Company, Client, and Line items are mandatory." }, { status: 400 })
    }

    // Fetch original invoice to verify existence
    const origInvoiceRes = await query("SELECT * FROM invoices WHERE id = $1", [id])
    if (origInvoiceRes.rows.length === 0) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }
    const origInvoice = origInvoiceRes.rows[0]

    // Fetch Company details
    const companyRes = await query("SELECT * FROM companies WHERE id = $1", [company_id])
    const company = companyRes.rows[0]

    // Calculate Taxes
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

    // Update Invoice details
    await pgClient.query(`
      UPDATE invoices SET
        invoice_date = $1, due_date = $2, company_id = $3, client_id = $4,
        total_amount = $5, gst_amount = $6, net_payable = $7, status = $8
      WHERE id = $9
    `, [
      invoice_date,
      due_date,
      company_id,
      client_id,
      subtotal,
      gstAmount,
      netPayable,
      status || "Pending",
      id
    ])

    // Delete existing line items
    await pgClient.query("DELETE FROM invoice_items WHERE invoice_id = $1", [id])

    // Insert new line items
    for (const item of items) {
      await pgClient.query(`
        INSERT INTO invoice_items (invoice_id, particulars, hsn_sac, price, qty)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        id,
        item.particulars,
        item.hsn_sac,
        parseFloat(item.price) || 0,
        parseInt(item.qty, 10) || 1
      ])
    }

    await pgClient.query("COMMIT")

    return NextResponse.json({ success: true, message: "Invoice updated successfully" })
  } catch (err: any) {
    await pgClient.query("ROLLBACK")
    return NextResponse.json({ error: err.message }, { status: 500 })
  } finally {
    pgClient.release()
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const result = await query("DELETE FROM invoices WHERE id = $1 RETURNING *", [id])
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }
    return NextResponse.json({ success: true, invoice: result.rows[0] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
