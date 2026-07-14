import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    const result = await query(
      "SELECT * FROM users WHERE email = $1 AND password = $2 AND status = 'Active'",
      [email, password]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Invalid credentials or inactive account" }, { status: 401 })
    }

    const user = result.rows[0]
    // Omit password in response
    const { password: _, ...userWithoutPassword } = user
    return NextResponse.json({ user: userWithoutPassword })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { email, currentPassword, newPassword } = await req.json()

    const result = await query(
      "SELECT * FROM users WHERE email = $1 AND password = $2",
      [email, currentPassword]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Incorrect current password" }, { status: 400 })
    }

    await query(
      "UPDATE users SET password = $1 WHERE email = $2",
      [newPassword, email]
    )

    return NextResponse.json({ success: true, message: "Password updated successfully" })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
