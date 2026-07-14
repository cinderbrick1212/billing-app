import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const result = await query("SELECT * FROM companies WHERE id = $1", [id])
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }
    return NextResponse.json({ company: result.rows[0] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data = await req.json()
    const {
      name,
      company_name,
      invoice_prefix,
      currency,
      address,
      city,
      state,
      postal_code,
      country,
      gst_applicable,
      gst_number,
      gst_percentage,
      pan_number,
      phone,
      mobile,
      signature_image,
    } = data

    // Validation
    if (!name || !invoice_prefix || !currency || !company_name) {
      return NextResponse.json({ error: "Name, Invoice Prefix, Currency and Company Name are mandatory." }, { status: 400 })
    }

    // Uniqueness checks (excluding current ID)
    const nameCheck = await query("SELECT id FROM companies WHERE name = $1 AND id != $2", [name, id])
    if (nameCheck.rows.length > 0) {
      return NextResponse.json({ error: "Company Name must be unique." }, { status: 400 })
    }

    const prefixCheck = await query("SELECT id FROM companies WHERE invoice_prefix = $1 AND id != $2", [invoice_prefix, id])
    if (prefixCheck.rows.length > 0) {
      return NextResponse.json({ error: "Invoice Prefix must be unique." }, { status: 400 })
    }

    const result = await query(`
      UPDATE companies SET
        name = $1, company_name = $2, invoice_prefix = $3, currency = $4, address = $5,
        city = $6, state = $7, postal_code = $8, country = $9, gst_applicable = $10,
        gst_number = $11, gst_percentage = $12, pan_number = $13, phone = $14,
        mobile = $15, signature_image = COALESCE($16, signature_image)
      WHERE id = $17 RETURNING *
    `, [
      name, company_name, invoice_prefix, currency, address, city, state, postal_code, country,
      gst_applicable || 'no', gst_applicable === 'yes' ? gst_number : null,
      gst_applicable === 'yes' ? parseFloat(gst_percentage) || 0 : 0,
      pan_number, phone, mobile, signature_image, id
    ])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, company: result.rows[0] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const result = await query("DELETE FROM companies WHERE id = $1 RETURNING *", [id])
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }
    return NextResponse.json({ success: true, company: result.rows[0] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
