import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const result = await query("SELECT id, name, email, role, status, initials FROM users WHERE id = $1", [id])
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    return NextResponse.json({ user: result.rows[0] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data = await req.json()
    const { name, email, password, role, status, initials } = data

    if (!name || !email || !initials) {
      return NextResponse.json({ error: "Name, Email and Initials are mandatory." }, { status: 400 })
    }

    // Email unique check
    const checkEmail = await query("SELECT id FROM users WHERE email = $1 AND id != $2", [email, id])
    if (checkEmail.rows.length > 0) {
      return NextResponse.json({ error: "Email address is already in use by another user." }, { status: 400 })
    }

    let result
    if (password) {
      result = await query(`
        UPDATE users SET
          name = $1, email = $2, password = $3, role = $4, status = $5, initials = $6
        WHERE id = $7 RETURNING id, name, email, role, status, initials
      `, [name, email, password, role || "Staff", status || "Active", initials.toUpperCase(), id])
    } else {
      result = await query(`
        UPDATE users SET
          name = $1, email = $2, role = $3, status = $4, initials = $5
        WHERE id = $6 RETURNING id, name, email, role, status, initials
      `, [name, email, role || "Staff", status || "Active", initials.toUpperCase(), id])
    }

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, user: result.rows[0] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const result = await query("DELETE FROM users WHERE id = $1 RETURNING id, name, email, role", [id])
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    return NextResponse.json({ success: true, user: result.rows[0] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
