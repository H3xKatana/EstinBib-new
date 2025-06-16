"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ChevronLeft, Save, User, Mail, Trash2, AlertTriangle, CreditCard, GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface PageProps {
  params: Promise<{ userid: string }>
}

type UserRole = "STUDENT" | "LIBRARIAN"

type EducationYear = "1CP" | "2CP" | "1CS" | "2CS" | "3CS" | null

interface User {
  id: string
  name: string
  email: string
  role: UserRole
  numeroDeBac: string | null
  emailVerified: Date | null
  image: string | null
  nfcCardId: string | null
  educationYear: EducationYear
  createdAt: Date
  updatedAt: Date
}

export default function UserEditPage({ params }: PageProps) {
  const { toast } = useToast()
  const [userId, setUserId] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isCurrentUser, setIsCurrentUser] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "STUDENT" as UserRole,
    nfcCardId: null as string | null,
    educationYear: null as EducationYear,
    numeroDeBac: null as string | null,
  })

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()

  // Resolve userId
  useEffect(() => {
    async function resolveParams() {
      try {
        const { userid } = await params
        setUserId(userid)
      } catch (err) {
        console.error("Failed to resolve params:", err)
        toast({ title: "Error", description: "Failed to load user information", variant: "destructive" })
      }
    }
    resolveParams()
  }, [params, toast])

  // Fetch user data
  useEffect(() => {
    if (!userId) return

    async function fetchData() {
      try {
        setIsLoading(true)

        // Check current user session
        const sessionRes = await fetch('/api/auth/session')
        if (sessionRes.ok) {
          const { user: sessionUser } = await sessionRes.json()
          if (sessionUser?.id === userId) setIsCurrentUser(true)
        }

        // Get user details
        const res = await fetch(`/api/dashboard/users/${userId}`)
        if (!res.ok) {
          if (res.status === 403) {
            toast({ title: "Access Denied", description: "You don't have permission to edit this user", variant: "destructive" })
            setIsAuthorized(false)
            return
          }
          throw new Error('Failed to fetch user')
        }

        setIsAuthorized(true)
        const data: User = await res.json()
        setUser(data)

        setFormData({
          name: data.name,
          email: data.email,
          role: data.role,
          nfcCardId: data.nfcCardId,
          educationYear: data.educationYear,
          numeroDeBac: data.numeroDeBac,
        })
      } catch (err) {
        toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to load user data", variant: "destructive" })
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [userId, toast])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleRoleChange = (value: string) => setFormData(prev => ({ ...prev, role: value as UserRole }))

  const handleNfcCardIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target
    setFormData(prev => ({ ...prev, nfcCardId: value || null }))
  }

  const handleNumeroDeBacChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target
    setFormData(prev => ({ ...prev, numeroDeBac: value || null }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return

    try {
      setIsSaving(true)
      const res = await fetch(`/api/dashboard/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) {
        if (res.status === 403) throw new Error("You don't have permission to update this user")
        throw new Error(await res.text())
      }
      toast({ title: "Success", description: "User information updated successfully" })
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to update user information", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!userId) return
    try {
      const res = await fetch(`/api/dashboard/users/${userId}`, { method: 'DELETE' })
      if (!res.ok) {
        const text = await res.text()
        if (res.status === 400 && text === "Cannot delete your own account") throw new Error("You cannot delete your own account. Please contact an administrator.")
        if (res.status === 403) throw new Error("You don't have permission to delete this user")
        throw new Error(text)
      }
      toast({ title: "Success", description: "User deleted successfully" })
      window.location.href = '/dashboard/users'
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to delete user", variant: "destructive" })
      setIsDeleteDialogOpen(false)
    }
  }

  if (isLoading || !userId) return (
    <div className="flex h-[300px] w-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )

  if (!isAuthorized) return (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
      <p className="mb-6">You don't have permission to edit this user.</p>
      <Button asChild><Link href="/dashboard">Return to Dashboard</Link></Button>
    </div>
  )

  if (!user) return (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold mb-4">User Not Found</h1>
      <Button asChild><Link href="/dashboard/users">Return to Users List</Link></Button>
    </div>
  )

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Button variant="outline" size="icon" asChild className="mr-4">
            <Link href={`/dashboard/users/${userId}`}><ChevronLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="text-2xl font-bold">Edit User</h1>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>Update user details and permissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
              <div className="flex flex-col items-center space-y-2">
                <Avatar className="h-24 w-24">
                  {user.image
                    ? <AvatarImage src={user.image} alt={user.name} />
                    : <AvatarFallback className="text-xl">{getInitials(user.name)}</AvatarFallback>
                  }
                </Avatar>
                <span className="text-sm text-gray-500 dark:text-gray-400">Profile Image</span>
              </div>

              <div className="w-full space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input id="name" name="name" value={formData.name} onChange={handleInputChange} className="pl-9" placeholder="Full Name" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} className="pl-9" placeholder="Email Address" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="numeroDeBac">Numéro de Bac</Label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input id="numeroDeBac" name="numeroDeBac" type="text" placeholder="e.g. 12345678" value={formData.numeroDeBac || ''} onChange={handleNumeroDeBacChange} className="pl-9" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nfcCardId">NFC Card ID</Label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input id="nfcCardId" name="nfcCardId" value={formData.nfcCardId || ''} onChange={handleNfcCardIdChange} className="pl-9" placeholder="NFC Card ID (optional)" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">User Role</Label>
                  <Select value={formData.role} onValueChange={handleRoleChange}>
                    <SelectTrigger id="role"><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STUDENT">Student</SelectItem>
                      <SelectItem value="LIBRARIAN">Librarian</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formData.role === "LIBRARIAN"
                      ? "Librarians have full access to manage books, loans, and users."
                      : "Students can browse books and manage their loans."
                    }
                  </p>
                </div>

                {formData.role === "STUDENT" && (
                  <div className="space-y-2">
                    <Label htmlFor="educationYear">Education Year</Label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                      <Select value={formData.educationYear || ''} onValueChange={(val) => setFormData(prev => ({ ...prev, educationYear: val as EducationYear }))}>
                        <SelectTrigger id="educationYear" className="pl-9"><SelectValue placeholder="Select year" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1CP">1CP</SelectItem>
                          <SelectItem value="2CP">2CP</SelectItem>
                          <SelectItem value="1CS">1CS</SelectItem>
                          <SelectItem value="2CS">2CS</SelectItem>
                          <SelectItem value="3CS">3CS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {isCurrentUser && (
                  <div className="rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/20">
                    <div className="flex">
                      <AlertTriangle className="h-5 w-5 text-yellow-400" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Warning</h3>
                        <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                          <p>You are editing your own account. Some changes may affect your access privileges.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between">
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" type="button" disabled={isCurrentUser}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete User
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>This action cannot be undone. This will permanently delete the user account and remove all associated data.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> Saving...
                </>
              ) : (
                <><Save className="mr-2 h-4 w-4" /> Save Changes</>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
