"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Eye, EyeOff, Save, Upload, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select2 } from "@/components/ui/select2"
import { useStore } from "@/lib/store-context"
import type { Resource } from "@/lib/demo-data"

export function RecordForm({ type, editing = false, id }: { type: Exclude<Resource, "invoices">; editing?: boolean; id?: string }) {
  const router = useRouter()
  const store = useStore()
  const [loading, setLoading] = useState(editing)

  // Form Field States
  const [formData, setFormData] = useState<any>({})
  const [showPassword, setShowPassword] = useState(false)
  const [sigPreview, setSigPreview] = useState<string | null>(null)

  // Load record if editing
  useEffect(() => {
    async function loadRecord() {
      if (editing && id) {
        let record = null
        if (type === "companies") record = await store.getCompany(id)
        else if (type === "clients") record = await store.getClient(id)
        else if (type === "users") record = await store.getUser(id)
        else if (type === "renewals") record = await store.getRenewal(id)

        if (record) {
          setFormData(record)
          if (record.signature_image) {
            setSigPreview(record.signature_image)
          }
        } else {
          toast.error("Failed to load record details")
          router.push(`/${type}`)
        }
        setLoading(false)
      }
    }
    loadRecord()
  }, [editing, id, type])

  // Handle Text/Number Input changes
  const handleChange = (field: string, val: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: val }))
  }

  // Handle Base64 file conversions
  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2 MB")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      setSigPreview(base64)
      handleChange("signature_image", base64)
    }
    reader.readAsDataURL(file)
  }

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate unique fields or format checks
    if (type === "companies") {
      if (!formData.name || !formData.company_name || !formData.invoice_prefix || !formData.currency) {
        toast.error("Please fill all mandatory fields.")
        return
      }
      if (formData.gst_applicable === "yes" && (!formData.gst_number || !formData.gst_percentage)) {
        toast.error("GST number and GST percentage are mandatory if GST is applicable.")
        return
      }
    }

    if (type === "clients") {
      if (!formData.name) {
        toast.error("Client Name is mandatory.")
        return
      }
    }

    if (type === "users") {
      if (!formData.name || !formData.email || !formData.initials) {
        toast.error("Name, Email, and Initials are mandatory.")
        return
      }
      if (!editing && !formData.password) {
        toast.error("Password is required for new user.")
        return
      }
    }

    if (type === "renewals") {
      if (!formData.renewal_type || !formData.service || !formData.renewal_date || !formData.amount) {
        toast.error("Renewal Type, Service Name, Renewal Date, and Amount are mandatory.")
        return
      }
      // Validate renewal date format (like "15-May")
      const dateRegex = /^\d{1,2}-[A-Za-z]{3}$/
      if (!dateRegex.test(formData.renewal_date)) {
        toast.error("Renewal Date must be in the format '15-May' (no year).")
        return
      }
    }

    let success = false
    if (editing && id) {
      if (type === "companies") success = await store.updateCompany(id, formData)
      else if (type === "clients") success = await store.updateClient(id, formData)
      else if (type === "users") success = await store.updateUser(id, formData)
      else if (type === "renewals") success = await store.updateRenewal(id, formData)
    } else {
      if (type === "companies") success = await store.createCompany(formData)
      else if (type === "clients") success = await store.createClient(formData)
      else if (type === "users") success = await store.createUser(formData)
      else if (type === "renewals") success = await store.createRenewal(formData)
    }

    if (success) {
      router.push(`/${type}`)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const titleText = `${editing ? "Edit" : "New"} ${type.slice(0, -1)}`

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 p-4 md:p-8 animate-in fade-in duration-200">
      <header className="flex flex-col gap-2">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors w-fit mb-2"
        >
          <ArrowLeft className="size-3" /> Back
        </button>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{type} / {editing ? "Edit" : "New"}</p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{titleText}</h1>
        <p className="text-sm text-muted-foreground">Fill in the fields below. Required fields are marked *</p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">
              {type === "companies" && "Company Identity"}
              {type === "clients" && "Client Information"}
              {type === "users" && "User Credentials"}
              {type === "renewals" && "Renewal Schedule"}
            </CardTitle>
            <CardDescription>
              {type === "companies" && "Statutory company registration information and billing sequences."}
              {type === "clients" && "Contact coordinates, address details and tax states."}
              {type === "users" && "Access controls, credentials, and initials."}
              {type === "renewals" && "Define recurring domain, hosting or AMC renewal fees."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <FieldGroup className="grid gap-5 md:grid-cols-2">
              
              {/* COMPANIES FORM */}
              {type === "companies" && (
                <>
                  <Field>
                    <FieldLabel>Company Name (Internal) *</FieldLabel>
                    <Input
                      placeholder="e.g. Swastik Web Technology"
                      value={formData.name || ""}
                      onChange={(e) => handleChange("name", e.target.value)}
                      required
                    />
                    <FieldDescription>Must be unique. Used inside dropdown selectors.</FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel>Legal Billing Name *</FieldLabel>
                    <Input
                      placeholder="e.g. Swastik Web Technology Pvt. Ltd."
                      value={formData.company_name || ""}
                      onChange={(e) => handleChange("company_name", e.target.value)}
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Invoice Prefix *</FieldLabel>
                    <Input
                      placeholder="e.g. SWT/26-27/"
                      value={formData.invoice_prefix || ""}
                      onChange={(e) => handleChange("invoice_prefix", e.target.value)}
                      required
                    />
                    <FieldDescription>Must be unique. Generated invoices will use [Prefix] + [Running Number].</FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel>Currency *</FieldLabel>
                    <div className="w-full">
                      <Select2
                        options={[
                          { value: "INR", label: "Indian Rupee (₹)" },
                          { value: "USD", label: "US Dollar ($)" },
                          { value: "EUR", label: "Euro (€)" },
                          { value: "GBP", label: "British Pound (£)" },
                        ]}
                        value={formData.currency || "INR"}
                        onChange={(val) => handleChange("currency", val)}
                      />
                    </div>
                  </Field>

                  <Field>
                    <FieldLabel>GST Applicable *</FieldLabel>
                    <div className="w-full">
                      <Select2
                        options={[
                          { value: "no", label: "No (Non-GST Billing)" },
                          { value: "yes", label: "Yes (GST Billing)" },
                        ]}
                        value={formData.gst_applicable || "no"}
                        onChange={(val) => handleChange("gst_applicable", val)}
                      />
                    </div>
                  </Field>

                  {formData.gst_applicable === "yes" && (
                    <>
                      <Field>
                        <FieldLabel>GSTIN Number *</FieldLabel>
                        <Input
                          placeholder="e.g. 27AAXFS1234K1Z7"
                          value={formData.gst_number || ""}
                          onChange={(e) => handleChange("gst_number", e.target.value)}
                          required
                        />
                      </Field>

                      <Field>
                        <FieldLabel>GST Percentage *</FieldLabel>
                        <div className="w-full">
                          <Select2
                            options={[
                              { value: "5", label: "5 %" },
                              { value: "12", label: "12 %" },
                              { value: "18", label: "18 %" },
                              { value: "28", label: "28 %" },
                            ]}
                            value={formData.gst_percentage ? String(formData.gst_percentage) : "18"}
                            onChange={(val) => handleChange("gst_percentage", val)}
                          />
                        </div>
                      </Field>
                    </>
                  )}

                  <Field>
                    <FieldLabel>PAN Number</FieldLabel>
                    <Input
                      placeholder="e.g. AAXFS1234K"
                      value={formData.pan_number || ""}
                      onChange={(e) => handleChange("pan_number", e.target.value)}
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Phone Number</FieldLabel>
                    <Input
                      placeholder="e.g. 020-123456"
                      value={formData.phone || ""}
                      onChange={(e) => handleChange("phone", e.target.value)}
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Mobile Number</FieldLabel>
                    <Input
                      placeholder="e.g. 9876543210"
                      value={formData.mobile || ""}
                      onChange={(e) => handleChange("mobile", e.target.value)}
                    />
                  </Field>

                  <Field className="md:col-span-2">
                    <FieldLabel>Address</FieldLabel>
                    <Textarea
                      placeholder="Enter company billing address"
                      value={formData.address || ""}
                      onChange={(e) => handleChange("address", e.target.value)}
                    />
                  </Field>

                  <Field>
                    <FieldLabel>City</FieldLabel>
                    <Input
                      placeholder="e.g. Pune"
                      value={formData.city || ""}
                      onChange={(e) => handleChange("city", e.target.value)}
                    />
                  </Field>

                  <Field>
                    <FieldLabel>State</FieldLabel>
                    <Input
                      placeholder="e.g. Maharashtra"
                      value={formData.state || ""}
                      onChange={(e) => handleChange("state", e.target.value)}
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Postal Code</FieldLabel>
                    <Input
                      placeholder="e.g. 411057"
                      value={formData.postal_code || ""}
                      onChange={(e) => handleChange("postal_code", e.target.value)}
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Country</FieldLabel>
                    <Input
                      placeholder="e.g. India"
                      value={formData.country || ""}
                      onChange={(e) => handleChange("country", e.target.value)}
                    />
                  </Field>

                  <Field className="md:col-span-2">
                    <FieldLabel>Authorized Signature Image</FieldLabel>
                    <div className="flex items-center gap-4 border p-4 rounded-lg bg-muted/20">
                      <div className="relative flex items-center justify-center border border-dashed rounded-lg bg-card size-28 overflow-hidden">
                        {sigPreview ? (
                          <img src={sigPreview} alt="Signature Preview" className="object-contain size-full p-2" />
                        ) : (
                          <span className="text-[10px] text-muted-foreground text-center">No image</span>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 px-3 py-1.5 border rounded-md cursor-pointer hover:bg-muted text-xs font-semibold">
                          <Upload className="size-3.5" /> Upload File
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleSignatureUpload}
                            className="hidden"
                          />
                        </label>
                        <p className="text-[10px] text-muted-foreground">PNG or JPG, under 2 MB.</p>
                      </div>
                    </div>
                  </Field>
                </>
              )}

              {/* CLIENTS FORM */}
              {type === "clients" && (
                <>
                  <Field>
                    <FieldLabel>Client Name *</FieldLabel>
                    <Input
                      placeholder="e.g. Aurum Retail Pvt. Ltd."
                      value={formData.name || ""}
                      onChange={(e) => handleChange("name", e.target.value)}
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Company/Business Name</FieldLabel>
                    <Input
                      placeholder="e.g. Aurum Retail"
                      value={formData.company_name || ""}
                      onChange={(e) => handleChange("company_name", e.target.value)}
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Email Address</FieldLabel>
                    <Input
                      type="email"
                      placeholder="e.g. accounts@aurum.in"
                      value={formData.email || ""}
                      onChange={(e) => handleChange("email", e.target.value)}
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Phone Number</FieldLabel>
                    <Input
                      placeholder="e.g. 9898989898"
                      value={formData.phone || ""}
                      onChange={(e) => handleChange("phone", e.target.value)}
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Same State as Company? (Delhi/Local CGST/SGST) *</FieldLabel>
                    <div className="w-full">
                      <Select2
                        options={[
                          { value: "yes", label: "Yes (Considered Delhi/Same State - SGST + CGST)" },
                          { value: "no", label: "No (Interstate - IGST)" },
                        ]}
                        value={formData.same_state || "no"}
                        onChange={(val) => handleChange("same_state", val)}
                      />
                    </div>
                  </Field>

                  <Field>
                    <FieldLabel>GSTIN Number</FieldLabel>
                    <Input
                      placeholder="e.g. 27AAECA1234G1ZP"
                      value={formData.gst_number || ""}
                      onChange={(e) => handleChange("gst_number", e.target.value)}
                    />
                  </Field>

                  <Field>
                    <FieldLabel>PAN Number</FieldLabel>
                    <Input
                      placeholder="e.g. AAECA1234G"
                      value={formData.pan_number || ""}
                      onChange={(e) => handleChange("pan_number", e.target.value)}
                    />
                  </Field>

                  <Field className="md:col-span-2">
                    <FieldLabel>Billing Address</FieldLabel>
                    <Textarea
                      placeholder="Enter client billing address"
                      value={formData.address || ""}
                      onChange={(e) => handleChange("address", e.target.value)}
                    />
                  </Field>

                  <Field>
                    <FieldLabel>City</FieldLabel>
                    <Input
                      placeholder="e.g. Navi Mumbai"
                      value={formData.city || ""}
                      onChange={(e) => handleChange("city", e.target.value)}
                    />
                  </Field>

                  <Field>
                    <FieldLabel>State</FieldLabel>
                    <Input
                      placeholder="e.g. Maharashtra"
                      value={formData.state || ""}
                      onChange={(e) => handleChange("state", e.target.value)}
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Postal Code</FieldLabel>
                    <Input
                      placeholder="e.g. 400706"
                      value={formData.postal_code || ""}
                      onChange={(e) => handleChange("postal_code", e.target.value)}
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Country</FieldLabel>
                    <Input
                      placeholder="e.g. India"
                      value={formData.country || ""}
                      onChange={(e) => handleChange("country", e.target.value)}
                    />
                  </Field>
                </>
              )}

              {/* USERS FORM */}
              {type === "users" && (
                <>
                  <Field>
                    <FieldLabel>Full Name *</FieldLabel>
                    <Input
                      placeholder="e.g. Aarav Khanna"
                      value={formData.name || ""}
                      onChange={(e) => handleChange("name", e.target.value)}
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Email Address *</FieldLabel>
                    <Input
                      type="email"
                      placeholder="e.g. aarav@ledgerly.in"
                      value={formData.email || ""}
                      onChange={(e) => handleChange("email", e.target.value)}
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel>User Initials *</FieldLabel>
                    <Input
                      placeholder="e.g. AK"
                      maxLength={3}
                      value={formData.initials || ""}
                      onChange={(e) => handleChange("initials", e.target.value)}
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Role *</FieldLabel>
                    <div className="w-full">
                      <Select2
                        options={[
                          { value: "Staff", label: "Staff User" },
                          { value: "Administrator", label: "Administrator" },
                        ]}
                        value={formData.role || "Staff"}
                        onChange={(val) => handleChange("role", val)}
                      />
                    </div>
                  </Field>

                  <Field>
                    <FieldLabel>Status *</FieldLabel>
                    <div className="w-full">
                      <Select2
                        options={[
                          { value: "Active", label: "Active" },
                          { value: "Inactive", label: "Inactive" },
                        ]}
                        value={formData.status || "Active"}
                        onChange={(val) => handleChange("status", val)}
                      />
                    </div>
                  </Field>

                  <Field>
                    <FieldLabel>Password {editing ? "(leave blank to keep unchanged)" : "*"}</FieldLabel>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder={editing ? "••••••••" : "Password string"}
                        value={formData.password || ""}
                        onChange={(e) => handleChange("password", e.target.value)}
                        required={!editing}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="absolute right-1 top-1"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </Button>
                    </div>
                  </Field>
                </>
              )}

              {/* RENEWALS FORM */}
              {type === "renewals" && (
                <>
                  <Field>
                    <FieldLabel>Renewal Type *</FieldLabel>
                    <div className="w-full">
                      <Select2
                        options={[
                          { value: "Domain", label: "Domain" },
                          { value: "Hosting", label: "Hosting" },
                          { value: "AMC", label: "AMC" },
                          { value: "Other", label: "Other" },
                        ]}
                        value={formData.renewal_type || "Domain"}
                        onChange={(val) => handleChange("renewal_type", val)}
                      />
                    </div>
                  </Field>

                  <Field>
                    <FieldLabel>Service/Domain Name *</FieldLabel>
                    <Input
                      placeholder="e.g. google.com or Cloud hosting"
                      value={formData.service || ""}
                      onChange={(e) => handleChange("service", e.target.value)}
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Renewal Date *</FieldLabel>
                    <Input
                      placeholder="e.g. 15-May (no year)"
                      value={formData.renewal_date || ""}
                      onChange={(e) => handleChange("renewal_date", e.target.value)}
                      required
                    />
                    <FieldDescription>Format must be DD-Month (e.g. 15-May or 02-Aug).</FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel>Renewal Amount (₹) *</FieldLabel>
                    <Input
                      type="number"
                      placeholder="e.g. 1500"
                      value={formData.amount || ""}
                      onChange={(e) => handleChange("amount", e.target.value)}
                      required
                    />
                  </Field>

                  <Field className="md:col-span-2">
                    <FieldLabel>Remarks</FieldLabel>
                    <Textarea
                      placeholder="Add any extra notes or instructions"
                      value={formData.remarks || ""}
                      onChange={(e) => handleChange("remarks", e.target.value)}
                    />
                  </Field>
                </>
              )}

            </FieldGroup>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit">
            <Save data-icon="inline-start" />
            {editing ? "Save changes" : `Create new`}
          </Button>
        </div>
      </form>
    </main>
  )
}
