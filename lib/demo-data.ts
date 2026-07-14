export const companies = [
  { id: "swt", name: "Swastik Web Technology", gstin: "27AAXFS1234K1Z7", city: "Pune", prefix: "SWT", status: "GST Registered" },
  { id: "northstar", name: "Northstar Digital Labs", gstin: "29AAFCN7821B1ZM", city: "Bengaluru", prefix: "NDL", status: "GST Registered" },
  { id: "pixel", name: "Pixel Grove Studio", gstin: "—", city: "Mumbai", prefix: "PGS", status: "Non-GST" },
]

export const clients = [
  { id: "aurum", name: "Aurum Retail Pvt. Ltd.", email: "accounts@aurum.in", state: "Maharashtra", gstin: "27AAECA1234G1ZP", status: "Active" },
  { id: "northstar", name: "Northstar Studios", email: "finance@northstar.in", state: "Maharashtra", gstin: "27AABCN8421E1Z8", status: "Active" },
  { id: "kite", name: "Kite & Key Advisory", email: "hello@kitekey.co", state: "Karnataka", gstin: "29AAJFK7123C1Z2", status: "Active" },
  { id: "bluebird", name: "Bluebird Hospitality", email: "billing@bluebird.in", state: "Goa", gstin: "30AADCB5521F1Z4", status: "Inactive" },
]

export const invoices = [
  { id: "SWT/26-27/104", slug: "104", company: "Swastik Web Technology", client: "Northstar Studios", date: "12 Jul 2026", due: "27 Jul 2026", amount: "₹84,960", status: "Paid" },
  { id: "SWT/26-27/103", slug: "103", company: "Swastik Web Technology", client: "Aurum Retail Pvt. Ltd.", date: "11 Jul 2026", due: "26 Jul 2026", amount: "₹42,480", status: "Pending" },
  { id: "NDL/26-27/102", slug: "102", company: "Northstar Digital Labs", client: "Kite & Key Advisory", date: "09 Jul 2026", due: "24 Jul 2026", amount: "₹18,290", status: "Paid" },
  { id: "SWT/26-27/101", slug: "101", company: "Swastik Web Technology", client: "Bluebird Hospitality", date: "08 Jul 2026", due: "23 Jul 2026", amount: "₹67,850", status: "Overdue" },
]

export const users = [
  { id: "aarav", name: "Aarav Khanna", email: "aarav@ledgerly.in", role: "Administrator", status: "Active", initials: "AK" },
  { id: "meera", name: "Meera Shah", email: "meera@ledgerly.in", role: "Accountant", status: "Active", initials: "MS" },
  { id: "rohan", name: "Rohan Desai", email: "rohan@ledgerly.in", role: "Staff", status: "Inactive", initials: "RD" },
]

export const renewals = [
  { id: "domain", service: "northstar.in", type: "Domain", client: "Northstar Studios", due: "18 Jul 2026", amount: "₹1,499", status: "Due soon" },
  { id: "hosting", service: "Cloud hosting plan", type: "Hosting", client: "Aurum Retail Pvt. Ltd.", due: "24 Jul 2026", amount: "₹18,000", status: "Upcoming" },
  { id: "amc", service: "Annual maintenance", type: "AMC", client: "Kite & Key Advisory", due: "02 Aug 2026", amount: "₹42,000", status: "Upcoming" },
]

export type Resource = "companies" | "clients" | "invoices" | "users" | "renewals"
