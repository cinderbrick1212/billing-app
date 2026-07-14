import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "25", 10)
    const search = searchParams.get("search") || ""
    const clientId = searchParams.get("clientId") || ""
    const startDate = searchParams.get("startDate") || ""
    const endDate = searchParams.get("endDate") || ""
    const offset = (page - 1) * limit

    let whereClauses: string[] = []
    const params: any[] = []

    if (search) {
      params.push(`%${search}%`)
      whereClauses.push(`(name ILIKE $${params.length} OR company_name ILIKE $${params.length} OR email ILIKE $${params.length} OR city ILIKE $${params.length} OR state ILIKE $${params.length})`)
    }

    if (clientId) {
      params.push(clientId)
      whereClauses.push(`id = $${params.length}`)
    }

    if (startDate) {
      params.push(startDate)
      whereClauses.push(`created_at >= $${params.length}::timestamp`)
    }

    if (endDate) {
      params.push(`${endDate} 23:59:59`)
      whereClauses.push(`created_at <= $${params.length}::timestamp`)
    }

    const whereString = whereClauses.length > 0 ? " WHERE " + whereClauses.join(" AND ") : ""

    const countQuery = `SELECT COUNT(*) FROM clients${whereString}`
    const totalResult = await query(countQuery, params)
    const total = parseInt(totalResult.rows[0].count, 10)

    params.push(limit)
    params.push(offset)
    const selectQuery = `SELECT * FROM clients${whereString} ORDER BY id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`
    const result = await query(selectQuery, params)

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
      INSERT INTO clients (
        name, company_name, email, phone, address, city, state, postal_code, country,
        pan_number, gst_number, same_state
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      ) RETURNING *
    `, [
      name, company_name, email, phone, address, city, state, postal_code, country,
      pan_number, gst_number, same_state || 'no'
    ])

    return NextResponse.json({ success: true, client: result.rows[0] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
