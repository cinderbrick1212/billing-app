import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "25", 10)
    const search = searchParams.get("search") || ""
    const offset = (page - 1) * limit

    let countQuery = "SELECT COUNT(*) FROM users"
    let selectQuery = "SELECT * FROM users"
    const params: any[] = []

    if (search) {
      countQuery += " WHERE name ILIKE $1 OR email ILIKE $1 OR role ILIKE $1"
      selectQuery += " WHERE name ILIKE $1 OR email ILIKE $1 OR role ILIKE $1"
      params.push(`%${search}%`)
    }

    selectQuery += ` ORDER BY id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    const selectParams = [...params, limit, offset]

    const totalResult = await query(countQuery, params)
    const total = parseInt(totalResult.rows[0].count, 10)

    const result = await query(selectQuery, selectParams)

    // Omit passwords in listing
    const users = result.rows.map(u => {
      const { password: _, ...userWithoutPassword } = u
      return userWithoutPassword
    })

    return NextResponse.json({
      data: users,
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
    const { name, email, password, role, status, initials } = data

    if (!name || !email || !password || !initials) {
      return NextResponse.json({ error: "Name, Email, Password and Initials are mandatory." }, { status: 400 })
    }

    // Email unique check
    const checkEmail = await query("SELECT id FROM users WHERE email = $1", [email])
    if (checkEmail.rows.length > 0) {
      return NextResponse.json({ error: "Email address is already registered." }, { status: 400 })
    }

    const result = await query(`
      INSERT INTO users (name, email, password, role, status, initials)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `, [name, email, password, role || "Staff", status || "Active", initials.toUpperCase()])

    const { password: _, ...userWithoutPassword } = result.rows[0]

    return NextResponse.json({ success: true, user: userWithoutPassword })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
