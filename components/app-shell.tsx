"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { Bell, Building2, ChevronDown, CreditCard, FileText, Gauge, KeyRound, LogOut, Menu, ReceiptIndianRupee, Settings, Users, X } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store-context"

const baseLinks = [
  { label: "Dashboard", href: "/", icon: Gauge },
  { label: "Companies", href: "/companies", icon: Building2 },
  { label: "Clients", href: "/clients", icon: Users },
  { label: "Invoices", href: "/invoices", icon: FileText },
  { label: "Users", href: "/users", icon: Users, adminOnly: true },
  { label: "Renewals", href: "/renewals", icon: CreditCard },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const { currentUser, isAuthenticated, logout } = useStore()

  if (path === "/login") return <>{children}</>
  if (!isAuthenticated) return null

  // Filter navigation links based on user role
  const links = baseLinks.filter(link => !link.adminOnly || currentUser?.role === "Administrator")

  return (
    <div className="min-h-screen bg-background">
      {open && <button aria-label="Close navigation overlay" className="fixed inset-0 bg-foreground/20 lg:hidden z-20" onClick={() => setOpen(false)} />}
      <aside className={cn("fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex h-20 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ReceiptIndianRupee className="size-5" />
            </span>
            <span className="text-lg font-semibold">Ledgerly</span>
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(false)}>
            <X />
          </Button>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          <p className="px-3 pb-2 text-xs uppercase tracking-widest text-sidebar-foreground/50">Workspace</p>
          {links.map((link) => {
            const active = link.href === "/" ? path === "/" : path.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-all hover:translate-x-1 duration-200",
                  active ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm font-semibold" : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <link.icon className="size-4" />
                {link.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-foreground/10 bg-sidebar/50">
          <Link
            href="/change-password"
            className={cn(
              "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
              path === "/change-password" ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/65 hover:bg-sidebar-accent"
            )}
          >
            <Settings className="size-4" />
            Settings
          </Link>
        </div>
      </aside>
      <div className="lg:pl-64">
        <header className="flex h-20 items-center justify-between border-b bg-background px-4 md:px-8 sticky top-0 z-10">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation">
            <Menu />
          </Button>
          <div className="flex items-center gap-2 ml-auto">

            <Separator orientation="vertical" className="h-7" />
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" className="h-11 px-2 gap-2" />}>
                <Avatar>
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {currentUser?.initials || "AK"}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-left sm:block">
                  <span className="block text-sm font-medium">{currentUser?.name || "Aarav Khanna"}</span>
                  <span className="block text-xs text-muted-foreground">{currentUser?.role || "Staff"}</span>
                </span>
                <ChevronDown className="size-4 opacity-50" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>My account</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => router.push("/change-password")}>
                    <KeyRound className="size-4 mr-2" />Change password
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem variant="destructive" onClick={logout}>
                    <LogOut className="size-4 mr-2" />Log out
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <div className="min-h-[calc(100vh-5rem)] pb-12">{children}</div>
      </div>
    </div>
  )
}
