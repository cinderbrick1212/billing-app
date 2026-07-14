import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    // 1. Total revenue (sum of net_payable of all invoices)
    const revenueRes = await query("SELECT SUM(net_payable) as total FROM invoices")
    const totalRevenue = parseFloat(revenueRes.rows[0].total || "0")

    // 2. Outstanding (sum of net_payable of Pending and Overdue invoices)
    const outstandingRes = await query("SELECT SUM(net_payable) as total FROM invoices WHERE status IN ('Pending', 'Overdue')")
    const outstanding = parseFloat(outstandingRes.rows[0].total || "0")
    
    // Count of outstanding invoices
    const outstandingCountRes = await query("SELECT COUNT(*) FROM invoices WHERE status IN ('Pending', 'Overdue')")
    const outstandingCount = parseInt(outstandingCountRes.rows[0].count || "0", 10)

    // 3. Active clients
    const clientsRes = await query("SELECT COUNT(*) as count FROM clients")
    const activeClients = parseInt(clientsRes.rows[0].count || "0", 10)

    // 4. GST collected (sum of gst_amount)
    const gstRes = await query("SELECT SUM(gst_amount) as total FROM invoices")
    const gstCollected = parseFloat(gstRes.rows[0].total || "0")

    // 5. Monthly Revenue Chart (last 12 months)
    const monthlyRes = await query(`
      SELECT 
        TO_CHAR(invoice_date, 'Mon') as month_name,
        DATE_TRUNC('month', invoice_date) as month_val,
        SUM(net_payable) as total
      FROM invoices
      WHERE invoice_date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY month_name, month_val
      ORDER BY month_val ASC
    `)

    // We'll prepare an array of 12 months with default 0s if they don't exist
    const months = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"]
    // Simple bar height helper mapping (max height = 100)
    const barData = months.map(m => {
      const match = monthlyRes.rows.find(r => r.month_name === m)
      return match ? parseFloat(match.total) : 0
    })

    // To prevent divide by 0 or very small scale, let's normalize heights to percentage (max height = 100%)
    const maxVal = Math.max(...barData, 10000)
    const normalizedHeights = barData.map(val => Math.round((val / maxVal) * 85) + 15) // minimum 15% height for visual style

    // 6. Recent Invoices
    const recentInvoicesRes = await query(`
      SELECT i.id, i.invoice_number, cl.name as client, i.invoice_date as date, i.net_payable as amount, i.status, c.currency as currency
      FROM invoices i
      JOIN clients cl ON i.client_id = cl.id
      JOIN companies c ON i.company_id = c.id
      ORDER BY i.id DESC LIMIT 5
    `)

    const recentInvoices = recentInvoicesRes.rows.map(inv => {
      const dateObj = new Date(inv.date)
      const formattedDate = dateObj.toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })
      return {
        id: inv.invoice_number,
        slug: inv.invoice_number.split("/").pop() || String(inv.id),
        client: inv.client,
        date: formattedDate,
        amount: `${inv.currency === 'INR' ? '₹' : inv.currency + ' '}${parseFloat(inv.amount).toLocaleString("en-IN")}`,
        status: inv.status
      }
    })

    // 7. Upcoming renewals
    const renewalsRes = await query("SELECT * FROM renewals ORDER BY id DESC LIMIT 5")
    
    // We can enrich renewals with days left
    const formatRenewals = renewalsRes.rows.map(r => {
      // renewal_date is "15-May" or similar.
      return {
        id: r.id,
        service: r.service,
        type: r.renewal_type,
        due: r.renewal_date,
        amount: `₹${parseFloat(r.amount).toLocaleString("en-IN")}`,
        status: r.status
      }
    })

    return NextResponse.json({
      metrics: {
        totalRevenue,
        outstanding,
        outstandingCount,
        activeClients,
        gstCollected
      },
      chart: {
        months,
        heights: normalizedHeights,
        values: barData
      },
      recentInvoices,
      renewals: formatRenewals
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
