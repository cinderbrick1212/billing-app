"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Download, Eye, FileDown, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { useStore } from "@/lib/store-context"
import { Select2, Select2Option } from "@/components/ui/select2"
import { Checkbox } from "@/components/ui/checkbox"
import JSZip from "jszip"
import { jsPDF } from "jspdf"
import type { Resource } from "@/lib/demo-data"



const configs = {
  companies: { title: "Companies", copy: "Manage billing identities, tax details and invoice sequences.", singular: "company", columns: ["Company", "GST status", "City", "Invoice prefix"] },
  clients: { title: "Clients", copy: "Keep customer details and tax registrations organized.", singular: "client", columns: ["Client", "Email", "State", "GSTIN"] },
  invoices: { title: "Invoices", copy: "Track billing, collections and tax documents in one place.", singular: "invoice", columns: ["Invoice", "Client", "Date", "Status", "Amount"] },
  users: { title: "Users", copy: "Control workspace access and staff permissions.", singular: "user", columns: ["User", "Email", "Role", "Status"] },
  renewals: { title: "Renewals", copy: "Never miss upcoming domains, hosting and maintenance renewals.", singular: "renewal", columns: ["Service", "Due date", "Status", "Amount"] },
} as const

function Status({ value }: { value: string }) {
  const danger = value === "Overdue" || value === "Inactive" || value === "Non-GST";
  const solid = value === "Paid" || value === "Active" || value === "GST Registered" || value === "yes" || value === "yes (Delhi)";
  return <Badge variant={danger ? "destructive" : solid ? "default" : "secondary"}>{value}</Badge>
}

export function ResourcePage({ type }: { type: Resource }) {
  const store = useStore()
  const config = configs[type]

  // Filter and pagination state
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)

  // Client page filters
  const [selectedClientId, setSelectedClientId] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  // Renewal filters
  const [renewalType, setRenewalType] = useState("all")
  const [timeframe, setTimeframe] = useState("") // "1", "2", "3" (months)

  // Invoice checkboxes selection
  const [selectedIds, setSelectedIds] = useState<string[]>([])


  useEffect(() => {
    setSelectedIds([])
  }, [page, query, type])

  useEffect(() => {
    if (type === "companies") {
      store.fetchCompanies(page, query)
    } else if (type === "clients") {
      store.fetchClients(page, query, selectedClientId === "all" ? "" : selectedClientId, startDate, endDate)
    } else if (type === "invoices") {
      store.fetchInvoices(page, query)
    } else if (type === "users") {
      store.fetchUsers(page, query)
    } else if (type === "renewals") {
      store.fetchRenewals(page, query, renewalType, timeframe)
    }
  }, [type, page, query, selectedClientId, startDate, endDate, renewalType, timeframe])


  // Get current active items and counts
  const items = useMemo(() => {
    if (type === "companies") return store.companies
    if (type === "clients") return store.clients
    if (type === "invoices") return store.invoices
    if (type === "users") return store.usersList
    return store.renewals
  }, [type, store.companies, store.clients, store.invoices, store.usersList, store.renewals])

  const totalItems = useMemo(() => {
    if (type === "companies") return store.totalCompanies
    if (type === "clients") return store.totalClients
    if (type === "invoices") return store.totalInvoices
    if (type === "users") return store.totalUsers
    return store.totalRenewals
  }, [type, store.totalCompanies, store.totalClients, store.totalInvoices, store.totalUsers, store.totalRenewals])

  const limit = 25
  const totalPages = Math.max(1, Math.ceil(totalItems / limit))

  // Generate pagination buttons - show at most 10 pages at one time as requested
  const paginationRange = useMemo(() => {
    const totalVisible = 10
    if (totalPages <= totalVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    let start = Math.max(1, page - Math.floor(totalVisible / 2))
    let end = start + totalVisible - 1
    if (end > totalPages) {
      end = totalPages
      start = end - totalVisible + 1
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }, [totalPages, page])

  // Showing range text
  const startItem = totalItems === 0 ? 0 : (page - 1) * limit + 1
  const endItem = Math.min(totalItems, page * limit)
  const showingText = `Showing ${startItem} to ${endItem} of ${totalItems}`

  // Handlers
  const handleDelete = async (id: string) => {
    let success = false
    if (type === "companies") success = await store.deleteCompany(id)
    else if (type === "clients") success = await store.deleteClient(id)
    else if (type === "invoices") success = await store.deleteInvoice(id)
    else if (type === "users") success = await store.deleteUser(id)
    else if (type === "renewals") success = await store.deleteRenewal(id)
  }

  // Export handlers
  const handleExportCSV = () => {
    const listToExport = selectedIds.length > 0 
      ? items.filter(inv => selectedIds.includes(String(inv.id)))
      : items

    if (listToExport.length === 0) {
      toast.error("No invoices found to export.")
      return
    }

    const headers = ["Invoice Number", "Client Name", "Date", "Status", "Amount"]
    const rows = listToExport.map(inv => [
      inv.invoice_number,
      inv.client_name,
      new Date(inv.invoice_date).toLocaleDateString("en-IN"),
      inv.status,
      parseFloat(inv.net_payable)
    ])

    const csvContent = [headers, ...rows]
      .map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    const dateStr = new Date().toISOString().split("T")[0]
    link.setAttribute("href", url)
    link.setAttribute("download", `invoices_export_${dateStr}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("CSV report downloaded successfully!")
  }

  const handleExportZIP = async () => {
    const listToExport = selectedIds.length > 0 
      ? items.filter(inv => selectedIds.includes(String(inv.id)))
      : items

    if (listToExport.length === 0) {
      toast.error("No invoices found to export.")
      return
    }

    toast.loading("Generating ZIP archive...", { id: "zip-export" })
    const zip = new JSZip()

    try {
      for (const invHeader of listToExport) {
        const inv = await store.getInvoice(String(invHeader.id))
        if (!inv) continue

        const dateStr = new Date(inv.invoice_date).toLocaleDateString("en-IN")
        const dueStr = new Date(inv.due_date).toLocaleDateString("en-IN")
        
        // Initialize jsPDF document
        const doc = new jsPDF()

        // Draw header
        doc.setFont("helvetica", "bold")
        doc.setFontSize(20)
        doc.setTextColor(15, 23, 42) // Slate-900
        doc.text(inv.company_legal_name || inv.company_name, 20, 20)

        // Draw contact info
        doc.setFont("helvetica", "normal")
        doc.setFontSize(9)
        doc.setTextColor(100, 116, 139) // Slate-500
        doc.text(inv.company_address || "", 20, 27)
        doc.text(`${inv.company_city || ""}, ${inv.company_state || ""} - ${inv.company_postal_code || ""}`, 20, 33)
        if (inv.company_gst_applicable === "yes") {
          doc.text(`GSTIN: ${inv.company_gst_number}`, 20, 39)
        }

        // Draw Invoice Title & Meta info on the right
        doc.setFont("helvetica", "bold")
        doc.setFontSize(14)
        doc.setTextColor(15, 23, 42)
        doc.text("INVOICE", 145, 20)
        doc.setFontSize(10)
        doc.text(inv.invoice_number, 145, 27)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(9)
        doc.setTextColor(100, 116, 139)
        doc.text(`Date of Issue: ${dateStr}`, 145, 33)
        doc.text(`Due Date: ${dueStr}`, 145, 39)
        doc.text(`Status: ${inv.status}`, 145, 45)

        // Divider
        doc.setDrawColor(226, 232, 240) // Slate-200
        doc.line(20, 52, 190, 52)

        // Billed To
        doc.setFont("helvetica", "bold")
        doc.setFontSize(10)
        doc.setTextColor(15, 23, 42)
        doc.text("Billed To:", 20, 62)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(9)
        doc.setTextColor(100, 116, 139)
        doc.text(inv.client_legal_name || inv.client_name, 20, 68)
        doc.text(inv.client_address || "", 20, 74)
        if (inv.client_gst_number) {
          doc.text(`GSTIN: ${inv.client_gst_number}`, 20, 80)
        }

        // Table Headers
        doc.setFillColor(248, 250, 252) // Slate-50
        doc.rect(20, 92, 170, 8, "F")
        doc.setFont("helvetica", "bold")
        doc.setTextColor(15, 23, 42)
        doc.text("Particulars / Service Description", 22, 97)
        doc.text("HSN", 110, 97)
        doc.text("Qty", 130, 97)
        doc.text("Price", 148, 97)
        doc.text("Amount", 172, 97)

        // Line Items
        let y = 106
        doc.setFont("helvetica", "normal")
        doc.setTextColor(71, 85, 105) // Slate-600
        const currencySym = inv.currency === "USD" ? "$" : inv.currency === "EUR" ? "E" : "Rs."
        
        ;(inv.items || []).forEach((item: any, idx: number) => {
          doc.text(`${idx + 1}. ${item.particulars}`, 22, y)
          doc.text(item.hsn_sac || "N/A", 110, y)
          doc.text(String(item.qty), 130, y)
          doc.text(`${currencySym} ${parseFloat(item.price).toLocaleString("en-IN")}`, 148, y)
          doc.text(`${currencySym} ${(item.qty * parseFloat(item.price)).toLocaleString("en-IN")}`, 172, y)
          y += 8
        })

        // Summary box
        y += 4
        doc.setDrawColor(241, 245, 249)
        doc.line(20, y, 190, y)
        y += 8
        
        doc.setFont("helvetica", "bold")
        doc.setTextColor(71, 85, 105)
        doc.text("Subtotal:", 130, y)
        doc.text(`${currencySym} ${parseFloat(inv.total_amount).toLocaleString("en-IN")}`, 172, y)

        if (inv.company_gst_applicable === "yes") {
          y += 6
          const isLocal = inv.client_same_state === "yes"
          const gstPercent = parseFloat(inv.company_gst_percentage) || 0
          if (isLocal) {
            doc.text(`CGST @ ${(gstPercent/2)}%:`, 130, y)
            doc.text(`${currencySym} ${(parseFloat(inv.gst_amount)/2).toLocaleString("en-IN")}`, 172, y)
            y += 6
            doc.text(`SGST @ ${(gstPercent/2)}%:`, 130, y)
            doc.text(`${currencySym} ${(parseFloat(inv.gst_amount)/2).toLocaleString("en-IN")}`, 172, y)
          } else {
            doc.text(`IGST @ ${gstPercent}%:`, 130, y)
            doc.text(`${currencySym} ${parseFloat(inv.gst_amount).toLocaleString("en-IN")}`, 172, y)
          }
        }

        y += 8
        doc.setFontSize(11)
        doc.setTextColor(15, 23, 42)
        doc.text("Net Payable:", 130, y)
        doc.text(`${currencySym} ${parseFloat(inv.net_payable).toLocaleString("en-IN")}`, 172, y)

        // Draw signature image if present
        if (inv.company_signature && inv.company_signature.startsWith("data:image")) {
          try {
            doc.addImage(inv.company_signature, "PNG", 145, y + 8, 35, 12)
            y += 18
            doc.setFontSize(8)
            doc.setTextColor(100, 116, 139)
            doc.text("Authorized Signatory", 145, y + 5)
          } catch (e) {
            console.error("Failed to add image to PDF:", e)
          }
        }

        const pdfBlob = doc.output("blob")
        const safeName = inv.invoice_number.replace(/[\/\\?%*:|"< >]/g, "_")
        zip.file(`${safeName}.pdf`, pdfBlob)
      }

      const zipBlob = await zip.generateAsync({ type: "blob" })
      const url = URL.createObjectURL(zipBlob)
      const link = document.createElement("a")
      const dateStr = new Date().toISOString().split("T")[0]
      link.setAttribute("href", url)
      link.setAttribute("download", `invoices_export_${dateStr}.zip`)


      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.dismiss("zip-export")
      toast.success("ZIP archive downloaded successfully!")
    } catch (err) {
      console.error(err)
      toast.dismiss("zip-export")
      toast.error("Failed to generate ZIP archive.")
    }
  }

  const handleDownloadSinglePDF = async (id: string) => {
    toast.loading("Generating PDF...", { id: "single-pdf" })
    try {
      const inv = await store.getInvoice(id)
      if (!inv) {
        toast.error("Invoice not found", { id: "single-pdf" })
        return
      }

      const dateStr = new Date(inv.invoice_date).toLocaleDateString("en-IN")
      const dueStr = new Date(inv.due_date).toLocaleDateString("en-IN")

      const doc = new jsPDF()

      // Draw header
      doc.setFont("helvetica", "bold")
      doc.setFontSize(20)
      doc.setTextColor(15, 23, 42) // Slate-900
      doc.text(inv.company_legal_name || inv.company_name, 20, 20)

      // Draw contact info
      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      doc.setTextColor(100, 116, 139) // Slate-500
      doc.text(inv.company_address || "", 20, 27)
      doc.text(`${inv.company_city || ""}, ${inv.company_state || ""} - ${inv.company_postal_code || ""}`, 20, 33)
      if (inv.company_gst_applicable === "yes") {
        doc.text(`GSTIN: ${inv.company_gst_number}`, 20, 39)
      }

      // Draw Invoice Title & Meta info on the right
      doc.setFont("helvetica", "bold")
      doc.setFontSize(14)
      doc.setTextColor(15, 23, 42)
      doc.text("INVOICE", 145, 20)
      doc.setFontSize(10)
      doc.text(inv.invoice_number, 145, 27)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      doc.setTextColor(100, 116, 139)
      doc.text(`Date of Issue: ${dateStr}`, 145, 33)
      doc.text(`Due Date: ${dueStr}`, 145, 39)
      doc.text(`Status: ${inv.status}`, 145, 45)

      // Divider
      doc.setDrawColor(226, 232, 240) // Slate-200
      doc.line(20, 52, 190, 52)

      // Billed To
      doc.setFont("helvetica", "bold")
      doc.setFontSize(10)
      doc.setTextColor(15, 23, 42)
      doc.text("Billed To:", 20, 62)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      doc.setTextColor(100, 116, 139)
      doc.text(inv.client_legal_name || inv.client_name, 20, 68)
      doc.text(inv.client_address || "", 20, 74)
      if (inv.client_gst_number) {
        doc.text(`GSTIN: ${inv.client_gst_number}`, 20, 80)
      }

      // Table Headers
      doc.setFillColor(248, 250, 252) // Slate-50
      doc.rect(20, 92, 170, 8, "F")
      doc.setFont("helvetica", "bold")
      doc.setTextColor(15, 23, 42)
      doc.text("Particulars / Service Description", 22, 97)
      doc.text("HSN", 110, 97)
      doc.text("Qty", 130, 97)
      doc.text("Price", 148, 97)
      doc.text("Amount", 172, 97)

      // Line Items
      let y = 106
      doc.setFont("helvetica", "normal")
      doc.setTextColor(71, 85, 105) // Slate-600
      const currencySym = inv.currency === "USD" ? "$" : inv.currency === "EUR" ? "E" : "Rs."

      ;(inv.items || []).forEach((item: any, idx: number) => {
        doc.text(`${idx + 1}. ${item.particulars}`, 22, y)
        doc.text(item.hsn_sac || "N/A", 110, y)
        doc.text(String(item.qty), 130, y)
        doc.text(`${currencySym} ${parseFloat(item.price).toLocaleString("en-IN")}`, 148, y)
        doc.text(`${currencySym} ${(item.qty * parseFloat(item.price)).toLocaleString("en-IN")}`, 172, y)
        y += 8
      })

      // Summary box
      y += 4
      doc.setDrawColor(241, 245, 249)
      doc.line(20, y, 190, y)
      y += 8

      doc.setFont("helvetica", "bold")
      doc.setTextColor(71, 85, 105)
      doc.text("Subtotal:", 130, y)
      doc.text(`${currencySym} ${parseFloat(inv.total_amount).toLocaleString("en-IN")}`, 172, y)

      if (inv.company_gst_applicable === "yes") {
        y += 6
        const isLocal = inv.client_same_state === "yes"
        const gstPercent = parseFloat(inv.company_gst_percentage) || 0
        if (isLocal) {
          doc.text(`CGST @ ${(gstPercent / 2)}%:`, 130, y)
          doc.text(`${currencySym} ${(parseFloat(inv.gst_amount) / 2).toLocaleString("en-IN")}`, 172, y)
          y += 6
          doc.text(`SGST @ ${(gstPercent / 2)}%:`, 130, y)
          doc.text(`${currencySym} ${(parseFloat(inv.gst_amount) / 2).toLocaleString("en-IN")}`, 172, y)
        } else {
          doc.text(`IGST @ ${gstPercent}%:`, 130, y)
          doc.text(`${currencySym} ${parseFloat(inv.gst_amount).toLocaleString("en-IN")}`, 172, y)
        }
      }

      y += 8
      doc.setFontSize(11)
      doc.setTextColor(15, 23, 42)
      doc.text("Net Payable:", 130, y)
      doc.text(`${currencySym} ${parseFloat(inv.net_payable).toLocaleString("en-IN")}`, 172, y)

      // Draw signature image if present
      if (inv.company_signature && inv.company_signature.startsWith("data:image")) {
        try {
          doc.addImage(inv.company_signature, "PNG", 145, y + 8, 35, 12)
          y += 18
          doc.setFontSize(8)
          doc.setTextColor(100, 116, 139)
          doc.text("Authorized Signatory", 145, y + 5)
        } catch (e) {
          console.error("Failed to add image to PDF:", e)
        }
      }

      const safeName = inv.invoice_number.replace(/[\/\\?%*:|"< >]/g, "_")
      doc.save(`${safeName}.pdf`)
      toast.success("PDF invoice downloaded successfully!", { id: "single-pdf" })
    } catch (err: any) {
      console.error(err)
      toast.error("Failed to generate PDF", { id: "single-pdf" })
    }
  }

  // Pre-load Select2 Options for Client Dropdown
  const clientDropdownOptions = useMemo(() => {
    const opts: Select2Option[] = [{ value: "all", label: "All Clients" }]
    // We can pull names from clients
    store.clients.forEach(c => {
      if (!opts.find(o => o.value === String(c.id))) {
        opts.push({ value: String(c.id), label: c.name })
      }
    })
    return opts
  }, [store.clients])

  const renewalTypeOptions: Select2Option[] = [
    { value: "all", label: "All Types" },
    { value: "Domain", label: "Domain" },
    { value: "Hosting", label: "Hosting" },
    { value: "AMC", label: "AMC" },
    { value: "Other", label: "Other" },
  ]

  const timeframeOptions: Select2Option[] = [
    { value: "", label: "Any timeframe" },
    { value: "1", label: "Due in 1 Month" },
    { value: "2", label: "Due in 2 Months" },
    { value: "3", label: "Due in 3 Months" },
  ]

  return (
    <main className="mx-auto flex max-w-[1500px] flex-col gap-8 p-4 md:p-8 animate-in fade-in duration-200">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Workspace / {config.title}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">{config.title}</h1>
          <p className="mt-2 text-base text-muted-foreground">{config.copy}</p>
        </div>
        <Button nativeButton={false} render={<Link href={`/${type}/new`} />} size="lg">
          <Plus data-icon="inline-start" />Add {config.singular}
        </Button>
      </header>

      <div className="flex justify-between items-center bg-card border px-4 py-3 rounded-lg text-sm text-muted-foreground shadow-sm">
        <span>{showingText}</span>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
            Previous
          </Button>
          {paginationRange.map(n => (
            <Button key={n} variant={page === n ? "default" : "ghost"} size="sm" onClick={() => setPage(n)}>
              {n}
            </Button>
          ))}
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
            Next
          </Button>
        </div>
      </div>

      <Card className="border shadow-sm">
        <CardContent className="flex flex-col gap-5 pt-6">
          {/* Custom filters depending on table type */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search matching entries..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-10"
              />
            </div>

            {/* Clients Listing filters: Client dropdown, Date range */}
            {type === "clients" && (
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <div className="w-48">
                  <Select2
                    options={clientDropdownOptions}
                    value={selectedClientId}
                    onChange={setSelectedClientId}
                    placeholder="Filter by Client"
                  />
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-36 h-10 text-xs" />
                  <span>to</span>
                  <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-36 h-10 text-xs" />
                </div>
              </div>
            )}

            {/* Renewals listing filters: type, timeframe */}
            {type === "renewals" && (
              <div className="flex items-center gap-3">
                <div className="w-40">
                  <Select2
                    options={renewalTypeOptions}
                    value={renewalType}
                    onChange={setRenewalType}
                    placeholder="Renewal type"
                  />
                </div>
                <div className="w-44">
                  <Select2
                    options={timeframeOptions}
                    value={timeframe}
                    onChange={setTimeframe}
                    placeholder="Timeframe filter"
                  />
                </div>
              </div>
            )}

            {type === "invoices" && (
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="outline" className="h-10" />}>
                  <Download data-icon="inline-start" />Export report {selectedIds.length > 0 && `(${selectedIds.length})`}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={handleExportCSV}>
                      Export Selected as CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportZIP}>
                      Export Selected PDFs ZIP
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>


          <div className="overflow-x-auto rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  {type === "invoices" && (
                    <TableHead className="w-12 pl-6">
                      <Checkbox
                        checked={items.length > 0 && selectedIds.length === items.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedIds(items.map(item => String(item.id)))
                          } else {
                            setSelectedIds([])
                          }
                        }}
                      />
                    </TableHead>
                  )}
                  {config.columns.map(c => <TableHead key={c}>{c}</TableHead>)}
                  <TableHead className="text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={config.columns.length + 1} className="text-center py-8 text-muted-foreground">
                      No matching records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((row: any) => {
                    const rowId = row.id
                    const displaySlug = type === "invoices" ? (row.invoice_number.split("/").pop() || String(rowId)) : String(rowId)
                    return (
                      <TableRow key={rowId} className="hover:bg-muted/5 transition-colors">
                        {type === "invoices" && (
                          <TableCell className="pl-6">
                            <Checkbox
                              checked={selectedIds.includes(String(rowId))}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedIds(prev => [...prev, String(rowId)])
                                } else {
                                  setSelectedIds(prev => prev.filter(id => id !== String(rowId)))
                                }
                              }}
                            />
                          </TableCell>
                        )}
                        {type === "companies" && (

                          <>
                            <TableCell className="font-semibold text-foreground">{row.name}</TableCell>
                            <TableCell><Status value={row.gst_applicable === "yes" ? "GST Registered" : "Non-GST"} /></TableCell>
                            <TableCell>{row.city || "—"}</TableCell>
                            <TableCell className="font-mono text-xs">{row.invoice_prefix}</TableCell>
                          </>
                        )}
                        {type === "clients" && (
                          <>
                            <TableCell className="font-semibold text-foreground">
                              {row.name}
                              {row.company_name && <span className="block text-xs font-normal text-muted-foreground mt-0.5">{row.company_name}</span>}
                            </TableCell>
                            <TableCell>{row.email || "—"}</TableCell>
                            <TableCell>{row.state || "—"}</TableCell>
                            <TableCell className="font-mono text-xs">{row.gst_number || "—"}</TableCell>
                          </>
                        )}
                        {type === "invoices" && (
                          <>
                            <TableCell className="font-semibold text-foreground">{row.invoice_number}</TableCell>
                            <TableCell>{row.client_name}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {new Date(row.invoice_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                            </TableCell>
                            <TableCell><Status value={row.status} /></TableCell>
                            <TableCell className="font-semibold text-foreground">
                              {row.currency === "INR" ? "₹" : row.currency + " "}
                              {parseFloat(row.net_payable).toLocaleString("en-IN")}
                            </TableCell>
                          </>
                        )}
                        {type === "users" && (
                          <>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="size-8">
                                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{row.initials}</AvatarFallback>
                                </Avatar>
                                <span className="font-semibold text-foreground">{row.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>{row.email}</TableCell>
                            <TableCell>{row.role}</TableCell>
                            <TableCell><Status value={row.status} /></TableCell>
                          </>
                        )}
                        {type === "renewals" && (
                          <>
                            <TableCell className="font-semibold text-foreground">
                              {row.service}
                              <p className="text-xs font-normal text-muted-foreground mt-0.5">{row.renewal_type}</p>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{row.renewal_date}</TableCell>
                            <TableCell><Status value={row.status} /></TableCell>
                            <TableCell className="font-semibold text-foreground">₹{parseFloat(row.amount).toLocaleString("en-IN")}</TableCell>
                          </>
                        )}

                        <TableCell className="text-right pr-6">
                          <DropdownMenu>
                            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${row.name || row.id}`} />}>
                              <MoreHorizontal className="size-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuGroup>
                                {type === "invoices" && (
                                  <>
                                    <DropdownMenuItem nativeButton={false} render={<Link href={`/invoices/${displaySlug}`} />}>
                                      <Eye className="size-4 mr-2" />View invoice
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDownloadSinglePDF(String(rowId))}>
                                      <FileDown className="size-4 mr-2" />Download PDF
                                    </DropdownMenuItem>
                                  </>
                                )}
                                <DropdownMenuItem nativeButton={false} render={<Link href={`/${type}/${rowId}/edit`} />}>
                                  <Pencil className="size-4 mr-2" />Edit details
                                </DropdownMenuItem>
                                <AlertDialog>
                                  <AlertDialogTrigger render={<DropdownMenuItem variant="destructive" onSelect={e => e.preventDefault()} render={<button className="w-full flex items-center" />} />}>
                                    <Trash2 className="size-4 mr-2" />Delete entry
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently remove this {config.singular} record from the system.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" onClick={() => handleDelete(String(rowId))}>
                                        Confirm delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuGroup>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col items-center justify-between gap-3 border-t pt-4 sm:flex-row text-sm text-muted-foreground">
            <span>{showingText}</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                Previous
              </Button>
              {paginationRange.map(n => (
                <Button key={n} variant={page === n ? "default" : "ghost"} size="sm" onClick={() => setPage(n)}>
                  {n}
                </Button>
              ))}
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
