"use client"

import { useState } from "react"
import {
  Bell,
  Building2,
  ChevronDown,
  CircleHelp,
  CreditCard,
  FileText,
  Gauge,
  KeyRound,
  LogOut,
  Menu,
  Plus,
  ReceiptIndianRupee,
  Search,
  Settings,
  Users,
  X,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "Overview", icon: Gauge },
  { label: "Companies", icon: Building2 },
  { label: "Clients", icon: Users },
  { label: "Invoices", icon: FileText, count: 12 },
  { label: "Users", icon: Users },
  { label: "Renewals", icon: CreditCard, count: 4 },
]

const invoices = [
  { id: "SWT/26-27/104", client: "Northstar Studios", date: "12 Jul 2026", amount: "₹84,960", status: "Paid" },
  { id: "SWT/26-27/103", client: "Aurum Retail Pvt. Ltd.", date: "11 Jul 2026", amount: "₹42,480", status: "Pending" },
  { id: "SWT/26-27/102", client: "Kite & Key Advisory", date: "09 Jul 2026", amount: "₹18,290", status: "Paid" },
  { id: "SWT/26-27/101", client: "Bluebird Hospitality", date: "08 Jul 2026", amount: "₹67,850", status: "Overdue" },
]

const renewals = [
  { service: "northstar.in", type: "Domain", date: "18 Jul", days: "5 days" },
  { service: "Cloud hosting plan", type: "Hosting", date: "24 Jul", days: "11 days" },
  { service: "Annual maintenance", type: "AMC", date: "02 Aug", days: "20 days" },
]

const revenue = [44, 58, 49, 70, 62, 78, 67, 86, 74, 92, 81, 96]
const months = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"]

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {open && <button aria-label="Close navigation overlay" className="fixed inset-0 bg-foreground/20 lg:hidden" onClick={onClose} />}
      <aside className={cn("fixed inset-y-0 left-0 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-200 lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex h-20 items-center justify-between px-6">
          <a href="#" className="flex items-center gap-3" aria-label="Ledgerly dashboard">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ReceiptIndianRupee className="size-5" aria-hidden="true" />
            </span>
            <span className="text-lg font-semibold tracking-tight">Ledgerly</span>
          </a>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose} aria-label="Close navigation">
            <X />
          </Button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Main navigation">
          <p className="px-3 pb-2 text-xs font-medium uppercase tracking-widest text-sidebar-foreground/50">Workspace</p>
          {navItems.map((item, index) => (
            <a key={item.label} href="#" onClick={onClose} className={cn("flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors", index === 0 ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}>
              <item.icon className="size-4" aria-hidden="true" />
              <span>{item.label}</span>
              {item.count && <span className="ml-auto rounded-full bg-sidebar-primary px-2 py-0.5 text-xs text-sidebar-primary-foreground">{item.count}</span>}
            </a>
          ))}
        </nav>

        <div className="flex flex-col gap-2 p-3">
          <div className="rounded-xl bg-sidebar-accent p-4">
            <div className="flex items-center justify-between text-xs font-medium">
              <span>July invoice target</span><span>72%</span>
            </div>
            <Progress value={72} className="mt-3" />
            <p className="mt-3 text-xs leading-relaxed text-sidebar-foreground/55">₹5.4L collected of ₹7.5L target</p>
          </div>
          <a href="#" className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"><CircleHelp className="size-4" />Help & support</a>
          <a href="#" className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"><Settings className="size-4" />Settings</a>
        </div>
      </aside>
    </>
  )
}

function Header({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="flex h-20 items-center justify-between border-b bg-background px-4 md:px-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu} aria-label="Open navigation"><Menu /></Button>
        <div className="hidden items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm text-muted-foreground sm:flex sm:w-64">
          <Search className="size-4" aria-hidden="true" /><span>Search invoices, clients...</span><kbd className="ml-auto text-xs">⌘K</kbd>
        </div>
      </div>
      <div className="flex items-center gap-2">

        <Separator orientation="vertical" className="mx-1 h-7" />
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" className="h-11 px-2" />}>
            <Avatar><AvatarFallback>AK</AvatarFallback></Avatar>
            <span className="hidden text-left sm:block"><span className="block text-sm font-medium">Aarav Khanna</span><span className="block text-xs text-muted-foreground">Administrator</span></span>
            <ChevronDown />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuGroup>
              <DropdownMenuLabel>My account</DropdownMenuLabel>
              <DropdownMenuItem><KeyRound />Change password</DropdownMenuItem>
              <DropdownMenuItem><Settings />Settings</DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup><DropdownMenuItem variant="destructive"><LogOut />Log out</DropdownMenuItem></DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === "Paid") return <Badge>Paid</Badge>
  if (status === "Overdue") return <Badge variant="destructive">Overdue</Badge>
  return <Badge variant="secondary">Pending</Badge>
}

export function BillingDashboard() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [range, setRange] = useState("12 months")

  return (
    <div className="min-h-screen bg-background">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="lg:pl-64">
        <Header onMenu={() => setMenuOpen(true)} />
        <main className="mx-auto flex max-w-[1500px] flex-col gap-6 p-4 md:p-8">
          <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="flex flex-col gap-1">
              <p className="text-sm text-muted-foreground">Monday, 13 July</p>
              <h1 className="text-balance text-3xl font-semibold tracking-tight">Good morning, Aarav</h1>
              <p className="text-pretty text-sm leading-relaxed text-muted-foreground">Here&apos;s what&apos;s happening with your billing today.</p>
            </div>
            <Button><Plus data-icon="inline-start" />Create invoice</Button>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Billing overview">
            {[
              ["Total revenue", "₹18,42,680", "+12.4%", "this financial year", ReceiptIndianRupee],
              ["Outstanding", "₹2,14,620", "12 invoices", "awaiting payment", FileText],
              ["Active clients", "148", "+8 this month", "across 3 companies", Users],
              ["GST collected", "₹2,81,120", "Q1 FY 26–27", "SGST, CGST & IGST", Building2],
            ].map(([label, value, tag, helper, Icon]) => (
              <Card key={String(label)}>
                <CardHeader>
                  <CardDescription>{String(label)}</CardDescription>
                  <CardAction><span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-secondary-foreground"><Icon className="size-4" /></span></CardAction>
                  <CardTitle className="pt-3 text-2xl font-semibold tracking-tight">{String(value)}</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-2"><Badge variant="secondary">{String(tag)}</Badge><span className="text-xs text-muted-foreground">{String(helper)}</span></CardContent>
              </Card>
            ))}
          </section>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
            <Card>
              <CardHeader>
                <CardTitle>Revenue overview</CardTitle>
                <CardDescription>Invoice value across the last 12 months</CardDescription>
                <CardAction><div className="flex rounded-lg bg-secondary p-1">{["6 months", "12 months"].map((item) => <button key={item} onClick={() => setRange(item)} className={cn("rounded-md px-3 py-1.5 text-xs font-medium transition-colors", range === item ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>{item}</button>)}</div></CardAction>
              </CardHeader>
              <CardContent>
                <div className="flex h-64 items-end gap-2 border-b border-l px-3 pt-8 md:gap-4" aria-label={`Revenue chart for ${range}`}>
                  {revenue.slice(range === "6 months" ? 6 : 0).map((height, index) => {
                    const offset = range === "6 months" ? 6 : 0
                    return <div key={months[index + offset]} className="flex h-full flex-1 flex-col justify-end gap-2"><div className="w-full rounded-t-sm bg-primary/85 transition-all hover:bg-primary" style={{ height: `${height}%` }} title={`${months[index + offset]} revenue`} /><span className="text-center text-[10px] text-muted-foreground md:text-xs">{months[index + offset]}</span></div>
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Invoice health</CardTitle><CardDescription>Current collection status</CardDescription></CardHeader>
              <CardContent className="flex flex-col gap-6">
                <div className="flex items-center justify-center py-2"><div className="flex size-36 items-center justify-center rounded-full border-[14px] border-primary"><div className="text-center"><p className="text-3xl font-semibold">82%</p><p className="text-xs text-muted-foreground">collected</p></div></div></div>
                <div className="flex flex-col gap-3">
                  {[['Paid', '₹14.8L', 82], ['Pending', '₹1.6L', 11], ['Overdue', '₹58K', 7]].map(([label, value, percent]) => <div key={String(label)} className="flex items-center gap-3 text-sm"><span className={cn("size-2 rounded-full", label === 'Paid' ? 'bg-primary' : label === 'Pending' ? 'bg-muted-foreground' : 'bg-destructive')} /><span className="text-muted-foreground">{String(label)}</span><span className="ml-auto font-medium">{String(value)}</span><span className="w-8 text-right text-xs text-muted-foreground">{String(percent)}%</span></div>)}
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
            <Card>
              <CardHeader><CardTitle>Recent invoices</CardTitle><CardDescription>Latest activity across all companies</CardDescription><CardAction><Button variant="ghost" size="sm">View all</Button></CardAction></CardHeader>
              <CardContent className="px-0">
                <Table>
                  <TableHeader><TableRow><TableHead className="pl-4">Invoice</TableHead><TableHead>Client</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead className="pr-4 text-right">Amount</TableHead></TableRow></TableHeader>
                  <TableBody>{invoices.map((invoice) => <TableRow key={invoice.id}><TableCell className="pl-4 font-medium">{invoice.id}</TableCell><TableCell>{invoice.client}</TableCell><TableCell className="text-muted-foreground">{invoice.date}</TableCell><TableCell><StatusBadge status={invoice.status} /></TableCell><TableCell className="pr-4 text-right font-medium">{invoice.amount}</TableCell></TableRow>)}</TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Upcoming renewals</CardTitle><CardDescription>Due in the next 30 days</CardDescription><CardAction><Badge variant="secondary">3 due</Badge></CardAction></CardHeader>
              <CardContent className="flex flex-col gap-4">
                {renewals.map((renewal, index) => <div key={renewal.service} className="flex flex-col gap-4"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground"><CreditCard className="size-4" /></span><div className="min-w-0 flex-1"><p className="truncate font-medium">{renewal.service}</p><p className="text-xs text-muted-foreground">{renewal.type} · {renewal.date}</p></div><span className="text-xs font-medium text-muted-foreground">{renewal.days}</span></div>{index < renewals.length - 1 && <Separator />}</div>)}
              </CardContent>
            </Card>
          </section>
        </main>
      </div>
    </div>
  )
}
