import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "25", 10)
    const search = searchParams.get("search") || ""
    const offset = (page - 1) * limit

    let countQuery = "SELECT COUNT(*) FROM companies"
    let selectQuery = "SELECT * FROM companies"
    const params: any[] = []

    if (search) {
      countQuery += " WHERE name ILIKE $1 OR company_name ILIKE $1 OR invoice_prefix ILIKE $1"
      selectQuery += " WHERE name ILIKE $1 OR company_name ILIKE $1 OR invoice_prefix ILIKE $1"
      params.push(`%${search}%`)
    }

    selectQuery += ` ORDER BY id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
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
  try {
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

    // Uniqueness checks
    const nameCheck = await query("SELECT id FROM companies WHERE name = $1", [name])
    if (nameCheck.rows.length > 0) {
      return NextResponse.json({ error: "Company Name must be unique." }, { status: 400 })
    }

    const prefixCheck = await query("SELECT id FROM companies WHERE invoice_prefix = $1", [invoice_prefix])
    if (prefixCheck.rows.length > 0) {
      return NextResponse.json({ error: "Invoice Prefix must be unique." }, { status: 400 })
    }

    const result = await query(`
      INSERT INTO companies (
        name, company_name, invoice_prefix, currency, address, city, state, postal_code, country,
        gst_applicable, gst_number, gst_percentage, pan_number, phone, mobile, signature_image
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
      ) RETURNING *
    `, [
      name, company_name, invoice_prefix, currency, address, city, state, postal_code, country,
      gst_applicable || 'no', gst_applicable === 'yes' ? gst_number : null,
      gst_applicable === 'yes' ? parseFloat(gst_percentage) || 0 : 0,
      pan_number, phone, mobile, signature_image
    ])

    return NextResponse.json({ success: true, company: result.rows[0] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
