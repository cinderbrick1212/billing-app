"use client"
import Link from "next/link"
import * as React from "react"
import { Building2, FileText, Plus, ReceiptIndianRupee, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useStore } from "@/lib/store-context"

export function DashboardHome() {
  const { dashboardData, fetchDashboard, currentUser } = useStore()

  React.useEffect(() => {
    fetchDashboard()
  }, [])

  if (!dashboardData) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const { metrics, chart, recentInvoices, renewals } = dashboardData

  return (
    <main className="mx-auto flex max-w-[1500px] flex-col gap-8 p-4 md:p-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">Good morning, {currentUser?.name?.split(" ")[0]}</h1>
          <p className="mt-2 text-base text-muted-foreground">Here&apos;s what&apos;s happening with your billing today.</p>
        </div>
        <Button nativeButton={false} render={<Link href="/invoices/new" />} size="lg">
          <Plus data-icon="inline-start" />Create invoice
        </Button>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [
            "Total revenue",
            `₹${metrics.totalRevenue.toLocaleString("en-IN")}`,
            "All invoices",
            ReceiptIndianRupee
          ],
          [
            "Outstanding",
            `₹${metrics.outstanding.toLocaleString("en-IN")}`,
            `${metrics.outstandingCount} pending invoices`,
            FileText
          ],
          [
            "Active clients",
            metrics.activeClients.toString(),
            "Registered clients",
            Users
          ],
          [
            "GST collected",
            `₹${metrics.gstCollected.toLocaleString("en-IN")}`,
            "Calculated GST",
            Building2
          ]
        ].map(([label, value, tag, Icon]: any) => (
          <Card key={label} className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription className="text-sm font-medium">{label}</CardDescription>
              <Icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardTitle className="text-2xl font-bold">{value}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">{tag}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.5fr_.8fr]">
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>Revenue overview</CardTitle>
            <CardDescription>Invoice value over the last 12 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-64 items-end gap-3 border-b border-l px-4 pt-8 pb-2">
              {chart.months.map((m: string, i: number) => {
                const height = chart.heights[i]
                const val = chart.values[i]
                return (
                  <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-2 group">
                    <div
                      className="w-full rounded-t-sm bg-primary/80 transition-all group-hover:bg-primary relative"
                      style={{ height: `${height}%` }}
                      title={`${m}: ₹${val.toLocaleString("en-IN")}`}
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground border px-2 py-0.5 rounded text-[10px] whitespace-nowrap shadow-sm pointer-events-none transition-all">
                        ₹{val.toLocaleString("en-IN")}
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">{m}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>Upcoming renewals</CardTitle>
            <CardDescription>Scheduled hosting, domains & AMC</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-2">
            {renewals.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">No upcoming renewals found.</div>
            ) : (
              renewals.map((r: any) => (
                <Link
                  href="/renewals"
                  key={r.id}
                  className="rounded-lg border p-4 hover:bg-muted/40 transition-colors flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{r.service}</p>
                    <p className="text-xs text-muted-foreground">{r.type} · Due {r.due}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold">{r.amount}</span>
                    <span className="block text-[10px] text-muted-foreground font-medium mt-0.5">{r.status}</span>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent invoices</CardTitle>
            <CardDescription>Latest activity across all companies</CardDescription>
          </div>
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/invoices" />}>
            View all
          </Button>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Invoice ID</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6 text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-sm text-muted-foreground">
                    No recent invoices.
                  </TableCell>
                </TableRow>
              ) : (
                recentInvoices.map((i: any) => (
                  <TableRow key={i.id} className="hover:bg-muted/10">
                    <TableCell className="pl-6 font-semibold">
                      <Link href={`/invoices/${i.slug}`} className="hover:text-primary transition-colors">
                        {i.id}
                      </Link>
                    </TableCell>
                    <TableCell>{i.client}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{i.date}</TableCell>
                    <TableCell>
                      <Badge
                        className="rounded-full"
                        variant={i.status === "Overdue" ? "destructive" : i.status === "Paid" ? "default" : "secondary"}
                      >
                        {i.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-6 text-right font-semibold">{i.amount}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  )
}
