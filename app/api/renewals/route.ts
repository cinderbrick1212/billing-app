import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

function getNextRenewalDate(renewal_date: string): Date {
  const parts = renewal_date.split("-")
  if (parts.length !== 2) return new Date()
  const day = parseInt(parts[0], 10)
  const monthStr = parts[1]
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const monthIndex = months.findIndex(m => m.toLowerCase().startsWith(monthStr.toLowerCase()))
  
  if (monthIndex === -1) return new Date()

  const now = new Date()
  const currentYear = now.getFullYear()
  const rDate = new Date(currentYear, monthIndex, day)
  
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (rDate < today) {
    rDate.setFullYear(currentYear + 1)
  }
  return rDate
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "25", 10)
    const search = searchParams.get("search") || ""
    const type = searchParams.get("type") || ""
    const timeframe = searchParams.get("timeframe") || "" // "1", "2", "3" (months)
    const offset = (page - 1) * limit

    let selectQuery = "SELECT * FROM renewals"
    let whereClauses: string[] = []
    const params: any[] = []

    if (search) {
      params.push(`%${search}%`)
      whereClauses.push(`(service ILIKE $${params.length} OR remarks ILIKE $${params.length})`)
    }

    if (type && type !== "all") {
      params.push(type)
      whereClauses.push(`renewal_type = $${params.length}`)
    }

    if (whereClauses.length > 0) {
      selectQuery += " WHERE " + whereClauses.join(" AND ")
    }

    selectQuery += " ORDER BY id DESC"

    const result = await query(selectQuery, params)
    let rows = result.rows

    // Timeframe filter in JS
    if (timeframe) {
      const monthsLimit = parseInt(timeframe, 10)
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const maxDate = new Date(today)
      maxDate.setMonth(today.getMonth() + monthsLimit)

      rows = rows.filter(row => {
        const nextDate = getNextRenewalDate(row.renewal_date)
        return nextDate >= today && nextDate <= maxDate
      })
    }

    // Paginate in memory after timeframe filter
    const total = rows.length
    const paginatedRows = rows.slice(offset, offset + limit)

    return NextResponse.json({
      data: paginatedRows,
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
    const { renewal_type, service, renewal_date, amount, remarks } = data

    if (!renewal_type || !service || !renewal_date || !amount) {
      return NextResponse.json({ error: "Renewal Type, Service, Renewal Date, and Amount are mandatory." }, { status: 400 })
    }

    const result = await query(`
      INSERT INTO renewals (renewal_type, service, renewal_date, amount, remarks, status)
      VALUES ($1, $2, $3, $4, $5, 'Upcoming') RETURNING *
    `, [renewal_type, service, renewal_date, parseFloat(amount), remarks])

    return NextResponse.json({ success: true, renewal: result.rows[0] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
