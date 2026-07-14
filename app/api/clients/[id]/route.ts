import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const result = await query("SELECT * FROM clients WHERE id = $1", [id])
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }
    return NextResponse.json({ client: result.rows[0] })
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
      email,
      phone,
      address,
      city,
      state,
      postal_code,
      country,
      pan_number,
      gst_number,
      same_state,
    } = data

    if (!name) {
      return NextResponse.json({ error: "Client Name is mandatory." }, { status: 400 })
    }

    const result = await query(`
      UPDATE clients SET
        name = $1, company_name = $2, email = $3, phone = $4, address = $5,
        city = $6, state = $7, postal_code = $8, country = $9, pan_number = $10,
        gst_number = $11, same_state = $12
      WHERE id = $13 RETURNING *
    `, [
      name, company_name, email, phone, address, city, state, postal_code, country,
      pan_number, gst_number, same_state || 'no', id
    ])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, client: result.rows[0] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const result = await query("DELETE FROM clients WHERE id = $1 RETURNING *", [id])
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }
    return NextResponse.json({ success: true, client: result.rows[0] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
