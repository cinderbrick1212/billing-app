"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { toast } from "sonner"

interface StoreContextType {
  currentUser: any
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  changePassword: (passwordData: any) => Promise<boolean>
  
  // CRUD
  companies: any[]
  totalCompanies: number
  fetchCompanies: (page?: number, search?: string) => Promise<void>
  getCompany: (id: string) => Promise<any>
  createCompany: (data: any) => Promise<boolean>
  updateCompany: (id: string, data: any) => Promise<boolean>
  deleteCompany: (id: string) => Promise<boolean>

  clients: any[]
  totalClients: number
  fetchClients: (page?: number, search?: string, clientId?: string, startDate?: string, endDate?: string) => Promise<void>
  getClient: (id: string) => Promise<any>
  createClient: (data: any) => Promise<boolean>
  updateClient: (id: string, data: any) => Promise<boolean>
  deleteClient: (id: string) => Promise<boolean>

  invoices: any[]
  totalInvoices: number
  fetchInvoices: (page?: number, search?: string) => Promise<void>
  getInvoice: (id: string) => Promise<any>
  createInvoice: (data: any) => Promise<any>
  updateInvoice: (id: string, data: any) => Promise<boolean>
  deleteInvoice: (id: string) => Promise<boolean>

  usersList: any[]
  totalUsers: number
  fetchUsers: (page?: number, search?: string) => Promise<void>
  getUser: (id: string) => Promise<any>
  createUser: (data: any) => Promise<boolean>
  updateUser: (id: string, data: any) => Promise<boolean>
  deleteUser: (id: string) => Promise<boolean>

  renewals: any[]
  totalRenewals: number
  fetchRenewals: (page?: number, search?: string, type?: string, timeframe?: string) => Promise<void>
  getRenewal: (id: string) => Promise<any>
  createRenewal: (data: any) => Promise<boolean>
  updateRenewal: (id: string, data: any) => Promise<boolean>
  deleteRenewal: (id: string) => Promise<boolean>

  // Dash
  dashboardData: any
  fetchDashboard: () => Promise<void>
}

const StoreContext = React.createContext<StoreContextType | undefined>(undefined)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const [currentUser, setCurrentUser] = React.useState<any>(null)
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(false)
  const [isLoading, setIsLoading] = React.useState<boolean>(true)

  // Entities state
  const [companies, setCompanies] = React.useState<any[]>([])
  const [totalCompanies, setTotalCompanies] = React.useState(0)

  const [clients, setClients] = React.useState<any[]>([])
  const [totalClients, setTotalClients] = React.useState(0)

  const [invoices, setInvoices] = React.useState<any[]>([])
  const [totalInvoices, setTotalInvoices] = React.useState(0)

  const [usersList, setUsersList] = React.useState<any[]>([])
  const [totalUsers, setTotalUsers] = React.useState(0)

  const [renewals, setRenewals] = React.useState<any[]>([])
  const [totalRenewals, setTotalRenewals] = React.useState(0)

  const [dashboardData, setDashboardData] = React.useState<any>(null)

  // Load user from localStorage on mount
  React.useEffect(() => {
    const savedUser = localStorage.getItem("ledgerly_user")
    if (savedUser) {
      const parsed = JSON.parse(savedUser)
      setCurrentUser(parsed)
      setIsAuthenticated(true)
    } else {
      if (pathname !== "/login") {
        router.push("/login")
      }
    }
    setIsLoading(false)
  }, [pathname, router])

  // Login
  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error || "Login failed")
        return false
      }
      setCurrentUser(result.user)
      setIsAuthenticated(true)
      localStorage.setItem("ledgerly_user", JSON.stringify(result.user))
      toast.success("Welcome back!")
      router.push("/")
      return true
    } catch (err: any) {
      toast.error(err.message || "An error occurred during sign in")
      return false
    }
  }

  // Logout
  const logout = () => {
    setCurrentUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem("ledgerly_user")
    toast.info("Logged out successfully")
    router.push("/login")
  }

  // Change Password
  const changePassword = async (passwordData: any) => {
    try {
      const res = await fetch("/api/auth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentUser?.email, ...passwordData }),
      })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error || "Password change failed")
        return false
      }
      toast.success("Password changed successfully!")
      router.push("/")
      return true
    } catch (err: any) {
      toast.error(err.message || "An error occurred")
      return false
    }
  }

  // Companies CRUD
  const fetchCompanies = async (page = 1, search = "") => {
    try {
      const res = await fetch(`/api/companies?page=${page}&limit=25&search=${encodeURIComponent(search)}`)
      const result = await res.json()
      if (res.ok) {
        setCompanies(result.data)
        setTotalCompanies(result.total)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const getCompany = async (id: string) => {
    try {
      const res = await fetch(`/api/companies/${id}`)
      const result = await res.json()
      return res.ok ? result.company : null
    } catch (err) {
      console.error(err)
      return null
    }
  }

  const createCompany = async (data: any) => {
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error || "Failed to create company")
        return false
      }
      toast.success("Company created successfully!")
      fetchCompanies()
      return true
    } catch (err: any) {
      toast.error(err.message)
      return false
    }
  }

  const updateCompany = async (id: string, data: any) => {
    try {
      const res = await fetch(`/api/companies/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error || "Failed to update company")
        return false
      }
      toast.success("Company details updated!")
      fetchCompanies()
      return true
    } catch (err: any) {
      toast.error(err.message)
      return false
    }
  }

  const deleteCompany = async (id: string) => {
    try {
      const res = await fetch(`/api/companies/${id}`, { method: "DELETE" })
      if (!res.ok) {
        toast.error("Failed to delete company")
        return false
      }
      toast.success("Company deleted")
      fetchCompanies()
      return true
    } catch (err) {
      return false
    }
  }

  // Clients CRUD
  const fetchClients = async (page = 1, search = "", clientId = "", startDate = "", endDate = "") => {
    try {
      const queryStr = new URLSearchParams({
        page: String(page),
        limit: "25",
        search,
        clientId,
        startDate,
        endDate
      }).toString()
      const res = await fetch(`/api/clients?${queryStr}`)
      const result = await res.json()
      if (res.ok) {
        setClients(result.data)
        setTotalClients(result.total)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const getClient = async (id: string) => {
    try {
      const res = await fetch(`/api/clients/${id}`)
      const result = await res.json()
      return res.ok ? result.client : null
    } catch (err) {
      console.error(err)
      return null
    }
  }

  const createClient = async (data: any) => {
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error || "Failed to create client")
        return false
      }
      toast.success("Client added successfully!")
      fetchClients()
      return true
    } catch (err: any) {
      toast.error(err.message)
      return false
    }
  }

  const updateClient = async (id: string, data: any) => {
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error || "Failed to update client")
        return false
      }
      toast.success("Client details updated!")
      fetchClients()
      return true
    } catch (err: any) {
      toast.error(err.message)
      return false
    }
  }

  const deleteClient = async (id: string) => {
    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" })
      if (!res.ok) {
        toast.error("Failed to delete client")
        return false
      }
      toast.success("Client deleted")
      fetchClients()
      return true
    } catch (err) {
      return false
    }
  }

  // Invoices CRUD
  const fetchInvoices = async (page = 1, search = "") => {
    try {
      const res = await fetch(`/api/invoices?page=${page}&limit=25&search=${encodeURIComponent(search)}`)
      const result = await res.json()
      if (res.ok) {
        setInvoices(result.data)
        setTotalInvoices(result.total)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const getInvoice = async (id: string) => {
    try {
      const res = await fetch(`/api/invoices/${id}`)
      const result = await res.json()
      return res.ok ? result.invoice : null
    } catch (err) {
      console.error(err)
      return null
    }
  }

  const createInvoice = async (data: any) => {
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error || "Failed to generate invoice")
        return null
      }
      toast.success("Invoice created successfully!")
      fetchInvoices()
      return result.invoice
    } catch (err: any) {
      toast.error(err.message)
      return null
    }
  }

  const updateInvoice = async (id: string, data: any) => {
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error || "Failed to update invoice")
        return false
      }
      toast.success("Invoice updated successfully!")
      fetchInvoices()
      return true
    } catch (err: any) {
      toast.error(err.message)
      return false
    }
  }

  const deleteInvoice = async (id: string) => {
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" })
      if (!res.ok) {
        toast.error("Failed to delete invoice")
        return false
      }
      toast.success("Invoice removed")
      fetchInvoices()
      return true
    } catch (err) {
      return false
    }
  }

  // Users CRUD
  const fetchUsers = async (page = 1, search = "") => {
    try {
      const res = await fetch(`/api/users?page=${page}&limit=25&search=${encodeURIComponent(search)}`)
      const result = await res.json()
      if (res.ok) {
        setUsersList(result.data)
        setTotalUsers(result.total)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const getUser = async (id: string) => {
    try {
      const res = await fetch(`/api/users/${id}`)
      const result = await res.json()
      return res.ok ? result.user : null
    } catch (err) {
      console.error(err)
      return null
    }
  }

  const createUser = async (data: any) => {
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error || "Failed to create user")
        return false
      }
      toast.success("Staff user account created!")
      fetchUsers()
      return true
    } catch (err: any) {
      toast.error(err.message)
      return false
    }
  }

  const updateUser = async (id: string, data: any) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error || "Failed to update user")
        return false
      }
      toast.success("User credentials modified.")
      fetchUsers()
      return true
    } catch (err: any) {
      toast.error(err.message)
      return false
    }
  }

  const deleteUser = async (id: string) => {
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" })
      if (!res.ok) {
        toast.error("Failed to delete user")
        return false
      }
      toast.success("User deleted")
      fetchUsers()
      return true
    } catch (err) {
      return false
    }
  }

  // Renewals CRUD
  const fetchRenewals = async (page = 1, search = "", type = "all", timeframe = "") => {
    try {
      const queryStr = new URLSearchParams({
        page: String(page),
        limit: "25",
        search,
        type,
        timeframe
      }).toString()
      const res = await fetch(`/api/renewals?${queryStr}`)
      const result = await res.json()
      if (res.ok) {
        setRenewals(result.data)
        setTotalRenewals(result.total)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const getRenewal = async (id: string) => {
    try {
      const res = await fetch(`/api/renewals/${id}`)
      const result = await res.json()
      return res.ok ? result.renewal : null
    } catch (err) {
      console.error(err)
      return null
    }
  }

  const createRenewal = async (data: any) => {
    try {
      const res = await fetch("/api/renewals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error || "Failed to schedule renewal")
        return false
      }
      toast.success("Renewal scheduled successfully!")
      fetchRenewals()
      return true
    } catch (err: any) {
      toast.error(err.message)
      return false
    }
  }

  const updateRenewal = async (id: string, data: any) => {
    try {
      const res = await fetch(`/api/renewals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error || "Failed to update renewal")
        return false
      }
      toast.success("Renewal updated!")
      fetchRenewals()
      return true
    } catch (err: any) {
      toast.error(err.message)
      return false
    }
  }

  const deleteRenewal = async (id: string) => {
    try {
      const res = await fetch(`/api/renewals/${id}`, { method: "DELETE" })
      if (!res.ok) {
        toast.error("Failed to delete renewal")
        return false
      }
      toast.success("Renewal deleted")
      fetchRenewals()
      return true
    } catch (err) {
      return false
    }
  }

  // Dashboard Fetching
  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/dashboard")
      const result = await res.json()
      if (res.ok) {
        setDashboardData(result)
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <StoreContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        isLoading,
        login,
        logout,
        changePassword,
        
        companies,
        totalCompanies,
        fetchCompanies,
        getCompany,
        createCompany,
        updateCompany,
        deleteCompany,

        clients,
        totalClients,
        fetchClients,
        getClient,
        createClient,
        updateClient,
        deleteClient,

        invoices,
        totalInvoices,
        fetchInvoices,
        getInvoice,
        createInvoice,
        updateInvoice,
        deleteInvoice,

        usersList,
        totalUsers,
        fetchUsers,
        getUser,
        createUser,
        updateUser,
        deleteUser,

        renewals,
        totalRenewals,
        fetchRenewals,
        getRenewal,
        createRenewal,
        updateRenewal,
        deleteRenewal,

        dashboardData,
        fetchDashboard,
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const context = React.useContext(StoreContext)
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider")
  }
  return context
}
