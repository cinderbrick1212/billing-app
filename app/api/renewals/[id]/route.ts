import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const result = await query("SELECT * FROM renewals WHERE id = $1", [id])
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Renewal not found" }, { status: 404 })
    }
    return NextResponse.json({ renewal: result.rows[0] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data = await req.json()
    const { renewal_type, service, renewal_date, amount, remarks, status } = data

    if (!renewal_type || !service || !renewal_date || !amount) {
      return NextResponse.json({ error: "Renewal Type, Service, Renewal Date, and Amount are mandatory." }, { status: 400 })
    }

    const result = await query(`
      UPDATE renewals SET
        renewal_type = $1, service = $2, renewal_date = $3, amount = $4, remarks = $5, status = $6
      WHERE id = $7 RETURNING *
    `, [renewal_type, service, renewal_date, parseFloat(amount), remarks, status || "Upcoming", id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Renewal not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, renewal: result.rows[0] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const result = await query("DELETE FROM renewals WHERE id = $1 RETURNING *", [id])
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Renewal not found" }, { status: 404 })
    }
    return NextResponse.json({ success: true, renewal: result.rows[0] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
