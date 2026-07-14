"use client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Eye, EyeOff, LockKeyhole, ReceiptIndianRupee } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useStore } from "@/lib/store-context"

export function LoginPage() {
  const { login } = useStore()
  const [email, setEmail] = useState("aarav@ledgerly.in")
  const [password, setPassword] = useState("ledgerly123")
  const [show, setShow] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const success = await login(email, password)
    setSubmitting(false)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-sidebar p-4">
      <Card className="w-full max-w-md border-0 shadow-lg">
        <CardHeader className="text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ReceiptIndianRupee className="size-7" />
          </span>
          <CardTitle className="mt-6 text-2xl font-bold">Welcome to Ledgerly</CardTitle>
          <CardDescription className="mt-2 text-base">Sign in to manage billing and renewals.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup className="gap-5">
              <Field>
                <FieldLabel>Email address</FieldLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </Field>
              <Field>
                <FieldLabel>Password</FieldLabel>
                <div className="relative">
                  <Input
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10 h-11"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute right-1 top-1"
                    onClick={() => setShow(!show)}
                  >
                    {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                </div>
              </Field>
              <div className="flex items-center gap-2">
                <Checkbox id="remember" defaultChecked />
                <label htmlFor="remember" className="text-sm font-medium">Remember me</label>
              </div>
              <Button type="submit" size="lg" className="h-11 w-full" disabled={submitting}>
                {submitting ? "Signing in..." : "Sign in"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">Demo credentials: aarav@ledgerly.in / ledgerly123</p>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}

export function ChangePassword() {
  const { changePassword } = useStore()
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match")
      return
    }
    setSubmitting(true)
    const success = await changePassword({ currentPassword, newPassword })
    setSubmitting(false)
    if (success) {
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    }
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 p-4 md:p-8">
      <header>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Settings / Security</p>
        <h1 className="mt-2 text-3xl font-bold">Change password</h1>
        <p className="mt-2 text-base text-muted-foreground">Use a unique password with at least eight characters.</p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LockKeyhole className="size-5" />Password security
          </CardTitle>
          <CardDescription>Changing your password will sign out other sessions.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup className="gap-5">
              <Field>
                <FieldLabel>Current password</FieldLabel>
                <div className="relative">
                  <Input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute right-1 top-1"
                    onClick={() => setShowCurrent(!showCurrent)}
                  >
                    {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                </div>
              </Field>

              <Field>
                <FieldLabel>New password</FieldLabel>
                <div className="relative">
                  <Input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute right-1 top-1"
                    onClick={() => setShowNew(!showNew)}
                  >
                    {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                </div>
              </Field>

              <Field>
                <FieldLabel>Confirm new password</FieldLabel>
                <div className="relative">
                  <Input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute right-1 top-1"
                    onClick={() => setShowConfirm(!showConfirm)}
                  >
                    {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                </div>
              </Field>

              <div className="flex justify-end gap-3 pt-3">
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Updating..." : "Update password"}
                </Button>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
