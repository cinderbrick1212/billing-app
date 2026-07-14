"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { Download, Plus, Printer, Save, Trash2, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select2 } from "@/components/ui/select2"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useStore } from "@/lib/store-context"
import { jsPDF } from "jspdf"


type Item = { particulars: string; hsn_sac: string; qty: number; price: number }

export function InvoiceBuilder({ editing = false, id }: { editing?: boolean; id?: string }) {
  const router = useRouter()
  const store = useStore()

  // Form Fields
  const [selectedCompanyId, setSelectedCompanyId] = useState("")
  const [selectedClientId, setSelectedClientId] = useState("")
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split("T")[0])
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().split("T")[0])
  const [items, setItems] = useState<Item[]>([{ particulars: "", hsn_sac: "998314", qty: 1, price: 0 }])
  const [status, setStatus] = useState("Pending")

  const [loading, setLoading] = useState(true)

  // Load companies and clients for dropdowns
  useEffect(() => {
    async function loadData() {
      await store.fetchCompanies()
      await store.fetchClients()
      
      if (editing && id) {
        const inv = await store.getInvoice(id)
        if (inv) {
          setSelectedCompanyId(String(inv.company_id))
          setSelectedClientId(String(inv.client_id))
          setInvoiceDate(inv.invoice_date.split("T")[0])
          setDueDate(inv.due_date.split("T")[0])
          setStatus(inv.status)
          setItems(inv.items || [])
        } else {
          toast.error("Failed to load invoice")
          router.push("/invoices")
        }
      }
      setLoading(false)
    }
    loadData()
  }, [editing, id])

  // Get active configurations
  const activeCompany = useMemo(() => {
    return store.companies.find(c => String(c.id) === selectedCompanyId)
  }, [store.companies, selectedCompanyId])

  const activeClient = useMemo(() => {
    return store.clients.find(c => String(c.id) === selectedClientId)
  }, [store.clients, selectedClientId])

  // Auto-set selected company and client defaults if empty and data loaded
  useEffect(() => {
    if (!editing && !selectedCompanyId && store.companies.length > 0) {
      setSelectedCompanyId(String(store.companies[0].id))
    }
    if (!editing && !selectedClientId && store.clients.length > 0) {
      setSelectedClientId(String(store.clients[0].id))
    }
  }, [store.companies, store.clients, editing])

  // Subtotal and tax calculations for real-time display
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.qty * (item.price || 0)), 0)
  }, [items])

  const taxDetails = useMemo(() => {
    if (!activeCompany || activeCompany.gst_applicable !== "yes") {
      return { type: "none", percentage: 0, amount: 0 }
    }
    const pct = parseFloat(activeCompany.gst_percentage) || 0
    const amt = subtotal * (pct / 100)
    
    // Check client same state status (yes = local CGST/SGST, no = interstate IGST)
    const localSplit = activeClient ? activeClient.same_state === "yes" : true
    
    return {
      type: localSplit ? "local" : "interstate",
      percentage: pct,
      amount: amt
    }
  }, [activeCompany, activeClient, subtotal])

  const totalPayable = subtotal + taxDetails.amount

  const patchItem = (index: number, key: keyof Item, value: any) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [key]: value } : item))
  }

  const handleSave = async () => {
    if (!selectedCompanyId || !selectedClientId) {
      toast.error("Please select a company and client.")
      return
    }
    
    // Validate particulars
    const invalidItem = items.some(i => !i.particulars.trim() || i.price < 0 || i.qty <= 0)
    if (invalidItem) {
      toast.error("Please complete all line item descriptions and valid pricing.")
      return
    }

    const payload = {
      company_id: parseInt(selectedCompanyId, 10),
      client_id: parseInt(selectedClientId, 10),
      invoice_date: invoiceDate,
      due_date: dueDate,
      status,
      items
    }

    if (editing && id) {
      const success = await store.updateInvoice(id, payload)
      if (success) {
        router.push(`/invoices/${id}`)
      }
    } else {
      const invoice = await store.createInvoice(payload)
      if (invoice) {
        router.push(`/invoices/${invoice.invoice_number.split("/").pop()}`)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  // Map options for Select2
  const companyOptions = store.companies.map(c => ({ value: String(c.id), label: c.name }))
  const clientOptions = store.clients.map(c => ({ value: String(c.id), label: c.name }))
  const statusOptions = [
    { value: "Pending", label: "Pending Payment" },
    { value: "Paid", label: "Paid" },
    { value: "Overdue", label: "Overdue" },
  ]

  const currencySymbol = activeCompany?.currency === "USD" ? "$" : activeCompany?.currency === "EUR" ? "€" : "₹"

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 p-4 md:p-8 animate-in fade-in duration-200">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <button onClick={() => router.back()} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors w-fit mb-2">
            <ArrowLeft className="size-3" /> Back to Invoices
          </button>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Invoices / {editing ? "Edit" : "New"}</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{editing ? "Edit invoice" : "Create invoice"}</h1>
          <p className="text-sm text-muted-foreground">GST-ready billing with automatic SGST/CGST or IGST taxes.</p>
        </div>
        {editing && <Badge variant="secondary">Editing · {id}</Badge>}
      </header>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Billing Parties & Dates</CardTitle>
          <CardDescription>Select companies, clients, and invoice schedules.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <Field>
              <FieldLabel>Company (Issuer) *</FieldLabel>
              <Select2
                options={companyOptions}
                value={selectedCompanyId}
                onChange={setSelectedCompanyId}
                placeholder="Select issuer company"
              />
            </Field>

            <Field>
              <FieldLabel>Client (Billed To) *</FieldLabel>
              <Select2
                options={clientOptions}
                value={selectedClientId}
                onChange={setSelectedClientId}
                placeholder="Select client"
              />
            </Field>

            <Field>
              <FieldLabel>Invoice Date *</FieldLabel>
              <Input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
            </Field>

            <Field>
              <FieldLabel>Due Date *</FieldLabel>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </Field>

            <Field>
              <FieldLabel>Invoice Status *</FieldLabel>
              <Select2
                options={statusOptions}
                value={status}
                onChange={setStatus}
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Line Items</CardTitle>
          <CardDescription>Add billable particular details and prices.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-64 pl-4">Particulars / Service Description</TableHead>
                  <TableHead className="w-36">HSN/SAC</TableHead>
                  <TableHead className="w-20">Qty</TableHead>
                  <TableHead className="w-32">Price ({currencySymbol})</TableHead>
                  <TableHead className="text-right pr-6 w-32">Amount ({currencySymbol})</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, i) => (
                  <TableRow key={i} className="hover:bg-muted/5 transition-colors">
                    <TableCell className="pl-4">
                      <Input
                        value={item.particulars}
                        onChange={e => patchItem(i, "particulars", e.target.value)}
                        placeholder="Description of services rendered"
                        className="h-9"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.hsn_sac}
                        onChange={e => patchItem(i, "hsn_sac", e.target.value)}
                        placeholder="e.g. 998314"
                        className="h-9"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={e => patchItem(i, "qty", parseInt(e.target.value, 10) || 1)}
                        className="h-9"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        value={item.price || ""}
                        onChange={e => patchItem(i, "price", parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="h-9"
                      />
                    </TableCell>
                    <TableCell className="text-right pr-6 font-semibold">
                      {currencySymbol}{(item.qty * (item.price || 0)).toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={items.length === 1}
                        onClick={() => setItems(items.filter((_, idx) => idx !== i))}
                        aria-label="Remove item"
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Button
            variant="outline"
            className="self-start h-9 text-xs"
            onClick={() => setItems([...items, { particulars: "", hsn_sac: "998314", qty: 1, price: 0 }])}
          >
            <Plus data-icon="inline-start" className="size-3.5" />Add item
          </Button>

          <div className="ml-auto flex w-full max-w-sm flex-col gap-3 rounded-xl bg-secondary p-5 text-sm border">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <strong className="text-foreground">{currencySymbol}{subtotal.toLocaleString("en-IN")}</strong>
            </div>

            {taxDetails.type === "local" && (
              <>
                <div className="flex justify-between text-muted-foreground">
                  <span>CGST @ {(taxDetails.percentage / 2)}%</span>
                  <span>{currencySymbol}{(taxDetails.amount / 2).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>SGST @ {(taxDetails.percentage / 2)}%</span>
                  <span>{currencySymbol}{(taxDetails.amount / 2).toLocaleString("en-IN")}</span>
                </div>
              </>
            )}

            {taxDetails.type === "interstate" && (
              <div className="flex justify-between text-muted-foreground">
                <span>IGST @ {taxDetails.percentage}%</span>
                <span>{currencySymbol}{taxDetails.amount.toLocaleString("en-IN")}</span>
              </div>
            )}

            <div className="flex justify-between border-t border-muted-foreground/20 pt-3 text-base text-foreground">
              <strong>Net payable</strong>
              <strong className="text-primary text-lg">{currencySymbol}{totalPayable.toLocaleString("en-IN")}</strong>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 mb-8">
        <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button onClick={handleSave}>
          <Save data-icon="inline-start" />
          {editing ? "Update invoice" : "Create & print"}
        </Button>
      </div>
    </main>
  )
}

export function InvoiceDetail({ id }: { id: string }) {
  const router = useRouter()
  const store = useStore()
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const handleDownloadPDF = () => {
    if (!invoice) return

    const dateStr = new Date(invoice.invoice_date).toLocaleDateString("en-IN")
    const dueStr = new Date(invoice.due_date).toLocaleDateString("en-IN")
    
    // Initialize jsPDF document
    const doc = new jsPDF()

    // Draw header
    doc.setFont("helvetica", "bold")
    doc.setFontSize(20)
    doc.setTextColor(15, 23, 42) // Slate-900
    doc.text(invoice.company_legal_name || invoice.company_name, 20, 20)

    // Draw contact info
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139) // Slate-500
    doc.text(invoice.company_address || "", 20, 27)
    doc.text(`${invoice.company_city || ""}, ${invoice.company_state || ""} - ${invoice.company_postal_code || ""}`, 20, 33)
    if (invoice.company_gst_applicable === "yes") {
      doc.text(`GSTIN: ${invoice.company_gst_number}`, 20, 39)
    }

    // Draw Invoice Title & Meta info on the right
    doc.setFont("helvetica", "bold")
    doc.setFontSize(14)
    doc.setTextColor(15, 23, 42)
    doc.text("INVOICE", 145, 20)
    doc.setFontSize(10)
    doc.text(invoice.invoice_number, 145, 27)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    doc.text(`Date of Issue: ${dateStr}`, 145, 33)
    doc.text(`Due Date: ${dueStr}`, 145, 39)
    doc.text(`Status: ${invoice.status}`, 145, 45)

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
    doc.text(invoice.client_legal_name || invoice.client_name, 20, 68)
    doc.text(invoice.client_address || "", 20, 74)
    if (invoice.client_gst_number) {
      doc.text(`GSTIN: ${invoice.client_gst_number}`, 20, 80)
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
    const currencySym = invoice.currency === "USD" ? "$" : invoice.currency === "EUR" ? "E" : "Rs."
    
    ;(invoice.items || []).forEach((item: any, idx: number) => {
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
    doc.text(`${currencySym} ${parseFloat(invoice.total_amount).toLocaleString("en-IN")}`, 172, y)

    if (invoice.company_gst_applicable === "yes") {
      y += 6
      const isLocal = invoice.client_same_state === "yes"
      const gstPercent = parseFloat(invoice.company_gst_percentage) || 0
      if (isLocal) {
        doc.text(`CGST @ ${(gstPercent/2)}%:`, 130, y)
        doc.text(`${currencySym} ${(parseFloat(invoice.gst_amount)/2).toLocaleString("en-IN")}`, 172, y)
        y += 6
        doc.text(`SGST @ ${(gstPercent/2)}%:`, 130, y)
        doc.text(`${currencySym} ${(parseFloat(invoice.gst_amount)/2).toLocaleString("en-IN")}`, 172, y)
      } else {
        doc.text(`IGST @ ${gstPercent}%:`, 130, y)
        doc.text(`${currencySym} ${parseFloat(invoice.gst_amount).toLocaleString("en-IN")}`, 172, y)
      }
    }

    y += 8
    doc.setFontSize(11)
    doc.setTextColor(15, 23, 42)
    doc.text("Net Payable:", 130, y)
    doc.text(`${currencySym} ${parseFloat(invoice.net_payable).toLocaleString("en-IN")}`, 172, y)

    // Draw signature image if present
    if (invoice.company_signature) {
      try {
        doc.addImage(invoice.company_signature, "PNG", 145, y + 8, 35, 12)
        y += 18
        doc.setFontSize(8)
        doc.setTextColor(100, 116, 139)
        doc.text("Authorized Signatory", 145, y + 5)
      } catch (e) {
        console.error("Failed to add image to PDF:", e)
      }
    }

    const safeName = invoice.invoice_number.replace(/[\/\\?%*:|"< >]/g, "_")
    doc.save(`${safeName}.pdf`)
  }

  useEffect(() => {
    async function loadInvoice() {
      const inv = await store.getInvoice(id)
      if (inv) {
        setInvoice(inv)
      } else {
        toast.error("Invoice not found")
        router.push("/invoices")
      }
      setLoading(false)
    }
    loadInvoice()
  }, [id])


  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const currencySymbol = invoice.currency === "USD" ? "$" : invoice.currency === "EUR" ? "€" : "₹"
  const formattedDate = new Date(invoice.invoice_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
  const formattedDue = new Date(invoice.due_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })

  const isLocalSplit = invoice.client_same_state === "yes"
  const gstPct = parseFloat(invoice.company_gst_percentage) || 0

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-4 md:p-8 animate-in fade-in duration-200">
      <header className="flex justify-between items-center gap-4 sm:flex-row flex-col print:hidden">
        <div>
          <button onClick={() => router.push("/invoices")} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mb-2">
            <ArrowLeft className="size-3" /> Back to Invoices
          </button>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Invoice #{invoice.invoice_number}</h1>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="flex-1 sm:flex-initial" onClick={() => window.print()}>
            <Printer data-icon="inline-start" className="size-4" />Print
          </Button>
          <Button className="flex-1 sm:flex-initial" onClick={handleDownloadPDF}>
            <Download data-icon="inline-start" className="size-4" />Download PDF
          </Button>
        </div>

      </header>

      {/* Printable Invoice Page A4 */}
      <Card className="border shadow-lg print:border-0 print:shadow-none bg-card text-foreground">
        <CardContent className="flex flex-col gap-8 p-6 md:p-12 print:p-0">
          
          {/* Header section */}
          <div className="flex flex-col justify-between gap-6 sm:flex-row border-b pb-6">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-bold text-primary">{invoice.company_legal_name}</h2>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {invoice.company_address}<br />
                {invoice.company_city}, {invoice.company_state} - {invoice.company_postal_code}, {invoice.company_country}
              </p>
              {invoice.company_phone && <p className="text-xs text-muted-foreground mt-1">Phone: {invoice.company_phone}</p>}
              {invoice.company_gst_applicable === "yes" && (
                <div className="text-xs text-muted-foreground mt-1">
                  <span className="font-semibold text-foreground">GSTIN:</span> {invoice.company_gst_number}
                </div>
              )}
              {invoice.company_pan && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">PAN:</span> {invoice.company_pan}
                </div>
              )}
            </div>

            <div className="sm:text-right flex flex-col items-start sm:items-end gap-1.5">
              <Badge
                className="rounded-full font-bold uppercase text-[10px]"
                variant={invoice.status === "Paid" ? "default" : invoice.status === "Overdue" ? "destructive" : "secondary"}
              >
                {invoice.status}
              </Badge>
              <h3 className="text-xl font-bold tracking-tight text-foreground mt-3">INVOICE</h3>
              <p className="text-sm font-semibold text-muted-foreground">{invoice.invoice_number}</p>
              <div className="text-xs text-muted-foreground mt-2">
                <p><span className="font-medium text-foreground">Date of Issue:</span> {formattedDate}</p>
                <p className="mt-1"><span className="font-medium text-foreground">Due Date:</span> {formattedDue}</p>
              </div>
            </div>
          </div>

          {/* Billed To Section */}
          <div className="grid gap-6 md:grid-cols-2 bg-muted/40 rounded-xl p-6 border">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Billed To</p>
              <h4 className="mt-2 font-bold text-base text-foreground">{invoice.client_legal_name || invoice.client_name}</h4>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {invoice.client_address || "No address specified"}<br />
                {invoice.client_city && `${invoice.client_city}, `}{invoice.client_state} {invoice.client_postal_code && `- ${invoice.client_postal_code}`}
              </p>
              {invoice.client_phone && <p className="text-xs text-muted-foreground mt-2">Phone: {invoice.client_phone}</p>}
              {invoice.client_email && <p className="text-xs text-muted-foreground">Email: {invoice.client_email}</p>}
            </div>
            <div className="flex flex-col md:items-end justify-end text-xs text-muted-foreground gap-1.5">
              {invoice.company_gst_applicable === "yes" && invoice.client_gst_number && (
                <p><span className="font-semibold text-foreground">Client GSTIN:</span> {invoice.client_gst_number}</p>
              )}
              <p><span className="font-semibold text-foreground">Billing State Type:</span> {invoice.client_same_state === "yes" ? "Delhi (Intra-State Split CGST/SGST)" : "Out of State (Inter-State IGST)"}</p>
            </div>
          </div>

          {/* Particulars Table */}
          <div className="overflow-x-auto rounded-lg border bg-card">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-12 pl-4">S.No</TableHead>
                  <TableHead>Particulars / Service Description</TableHead>
                  <TableHead className="w-24">HSN/SAC</TableHead>
                  <TableHead className="w-20 text-center">Qty</TableHead>
                  <TableHead className="w-28 text-right">Price</TableHead>
                  <TableHead className="w-32 text-right pr-4">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items && invoice.items.map((item: any, idx: number) => (
                  <TableRow key={item.id || idx} className="hover:bg-transparent">
                    <TableCell className="pl-4 text-muted-foreground font-mono text-xs">{idx + 1}</TableCell>
                    <TableCell className="font-medium text-foreground">{item.particulars}</TableCell>
                    <TableCell className="font-mono text-xs">{item.hsn_sac || "—"}</TableCell>
                    <TableCell className="text-center">{item.qty}</TableCell>
                    <TableCell className="text-right">{currencySymbol}{parseFloat(item.price).toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-right pr-4 font-semibold text-foreground">
                      {currencySymbol}{(item.qty * parseFloat(item.price)).toLocaleString("en-IN")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Summary section */}
          <div className="flex flex-col gap-6 sm:flex-row sm:justify-between items-start mt-4">
            <div className="text-xs text-muted-foreground max-w-sm">
              <h5 className="font-semibold text-foreground mb-1">Terms & Conditions</h5>
              <p className="leading-relaxed">
                Thank you for your business. Please remit payment on or before the due date. Lateness may incur fees.
              </p>
            </div>

            <div className="flex w-full max-w-xs flex-col gap-3 text-sm ml-auto">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-medium text-foreground">{currencySymbol}{parseFloat(invoice.total_amount).toLocaleString("en-IN")}</span>
              </div>

              {invoice.company_gst_applicable === "yes" && (
                <>
                  {isLocalSplit ? (
                    <>
                      <div className="flex justify-between text-muted-foreground">
                        <span>CGST @ {(gstPct / 2)}%</span>
                        <span>{currencySymbol}{(parseFloat(invoice.gst_amount) / 2).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>SGST @ {(gstPct / 2)}%</span>
                        <span>{currencySymbol}{(parseFloat(invoice.gst_amount) / 2).toLocaleString("en-IN")}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-muted-foreground">
                      <span>IGST @ {gstPct}%</span>
                      <span>{currencySymbol}{parseFloat(invoice.gst_amount).toLocaleString("en-IN")}</span>
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-between border-t pt-3 text-base text-foreground font-bold">
                <span>Net Payable</span>
                <span className="text-primary text-lg">{currencySymbol}{parseFloat(invoice.net_payable).toLocaleString("en-IN")}</span>
              </div>

              {/* Signature section */}
              {invoice.company_signature && (
                <div className="flex flex-col items-end gap-1.5 mt-6 border-t border-dashed pt-4">
                  <div className="h-16 w-36 relative">
                    <img src={invoice.company_signature} alt="Authorized Signature" className="object-contain size-full max-h-16" />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Authorized Signatory</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-between items-center print:hidden mb-8 gap-4">
        <Button variant="outline" nativeButton={false} render={<Link href={`/invoices/${id}/edit`} />}>
          Edit details
        </Button>
        <Button onClick={handleDownloadPDF} className="gap-2">
          <Download className="size-4" /> Download PDF
        </Button>
      </div>
    </main>
  )
}
