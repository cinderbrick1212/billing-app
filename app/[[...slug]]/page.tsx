"use client"

import * as React from "react"
import { DashboardHome } from "@/components/dashboard-home"
import { LoginPage, ChangePassword } from "@/components/auth-pages"
import { InvoiceBuilder, InvoiceDetail } from "@/components/invoice-pages"
import { RecordForm } from "@/components/record-form"
import { ResourcePage } from "@/components/resource-pages"
import type { Resource } from "@/lib/demo-data"
import { useStore } from "@/lib/store-context"
import { useRouter } from "next/navigation"

export default function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const unwrappedParams = React.use(params)
  const slug = unwrappedParams.slug || []
  const [resource, id, action] = slug
  
  const { isAuthenticated, isLoading, currentUser } = useStore()
  const router = useRouter()

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated && resource !== "login") {
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, resource, router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (resource === "login") {
    return <LoginPage />
  }

  if (!isAuthenticated) {
    return null // Redirection is handled in useEffect
  }

  // Admin access validation for Users section
  if (resource === "users" && currentUser?.role !== "Administrator") {
    toast.error("Access denied. Admin only.")
    return <DashboardHome />
  }

  if (!resource) return <DashboardHome />
  if (resource === "change-password") return <ChangePassword />
  if (!["companies", "clients", "invoices", "users", "renewals"].includes(resource)) {
    return <DashboardHome />
  }

  if (!id) return <ResourcePage type={resource as Resource} />
  if (resource === "invoices" && id === "new") return <InvoiceBuilder />
  if (resource === "invoices" && action === "edit") return <InvoiceBuilder editing id={id} />
  if (resource === "invoices") return <InvoiceDetail id={id} />
  
  if (id === "new") return <RecordForm type={resource as Exclude<Resource, "invoices">} />
  if (action === "edit") return <RecordForm type={resource as Exclude<Resource, "invoices">} editing id={id} />
  
  return <ResourcePage type={resource as Resource} />
}
import { toast } from "sonner"
