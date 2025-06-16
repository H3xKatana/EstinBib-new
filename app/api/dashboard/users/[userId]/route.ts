import { NextResponse } from "next/server"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { getServerAuthSession } from "@/lib/auth"
import bcrypt from "bcryptjs"

type Context = {
  params: Promise<{
    userId: string | string[] | undefined
  }>
}

/**
 * GET - Retrieve user(s) information
 */
export async function GET(
  request: Request,
  context: Context
) {
  try {
    const session = await getServerAuthSession()
    
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    const params = await context.params
    const userId = Array.isArray(params.userId) ? params.userId[0] : params.userId
    
    // If userId is provided, return specific user
    if (userId) {
      // Students can only get their own data
      if (session.user.role !== "LIBRARIAN" && userId !== session.user.id) {
        return new NextResponse("Forbidden", { status: 403 })
      }
      
      const user = await db
        .select({
          id: users.id,
          name: users.name,
          numeroDeBac: users.numeroDeBac,
          email: users.email,
          emailVerified: users.emailVerified,
          image: users.image,
          role: users.role,
          nfcCardId: users.nfcCardId,
          educationYear: users.educationYear,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
          // Exclude password from response
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)
      
      if (!user.length) {
        return new NextResponse("User not found", { status: 404 })
      }
      
      return NextResponse.json(user[0])
    }
    
    // If no userId, return list of users (only for librarians)
    if (session.user.role !== "LIBRARIAN") {
      return new NextResponse("Forbidden", { status: 403 })
    }
    
    // Optional query parameters for pagination
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get("limit") || "10")
    const offset = parseInt(url.searchParams.get("offset") || "0")
    
    // Get all users with pagination (exclude passwords)
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        numeroDeBac: users.numeroDeBac,
        email: users.email,
        emailVerified: users.emailVerified,
        image: users.image,
        role: users.role,
        nfcCardId: users.nfcCardId,
        educationYear: users.educationYear,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        // Exclude password from response
      })
      .from(users)
      .limit(limit)
      .offset(offset)
    
    return NextResponse.json(allUsers)
  } catch (error) {
    console.error("[USER_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

/**
 * DELETE - Remove a user
 */
export async function DELETE(
  request: Request,
  context: Context
) {
  try {
    const session = await getServerAuthSession()
    
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    // Check if user is authorized to delete users (e.g., admin or librarian)
    if (session.user.role !== "LIBRARIAN" ) {
      return new NextResponse("Forbidden", { status: 403 })
    }
    
    const params = await context.params
    const userId = Array.isArray(params.userId) ? params.userId[0] : params.userId
    
    if (!userId) {
      return new NextResponse("Invalid user ID", { status: 400 })
    }
    
    // Prevent self-deletion
    if (userId === session.user.id) {
      return new NextResponse("Cannot delete your own account", { status: 400 })
    }
    
    // Delete user (return without password)
    const [deleted] = await db
      .delete(users)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        name: users.name,
        numeroDeBac: users.numeroDeBac,
        email: users.email,
        role: users.role,
        nfcCardId: users.nfcCardId,
        educationYear: users.educationYear,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
    
    if (!deleted) {
      return new NextResponse("User not found", { status: 404 })
    }
    
    return NextResponse.json(deleted)
  } catch (error) {
    console.error("[USER_DELETE]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

/**
 * PUT - Update user information
 */
export async function PUT(
  request: Request,
  context: Context
) {
  try {
    const session = await getServerAuthSession()
    
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    const params = await context.params
    const userId = params.userId ? (Array.isArray(params.userId) ? params.userId[0] : params.userId) : undefined
    
    if (!userId) {
      return new NextResponse("Invalid user ID", { status: 400 })
    }

    // Students can only update their own data
    if (session.user.role !== "LIBRARIAN" && userId !== session.user.id) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const body = await request.json()
    const { name, email, role, nfcCardId, educationYear, numeroDeBac, password } = body

    // Validate input
    if (!name) {
      return new NextResponse("Name is required", { status: 400 })
    }

    // Only librarians can update roles and numeroDeBac
    if ((role || numeroDeBac) && session.user.role !== "LIBRARIAN") {
      return new NextResponse("Cannot update role or numero de bac", { status: 403 })
    }

    // Validate numeroDeBac format if provided (you can adjust this regex as needed)
    if (numeroDeBac && !/^[0-9]{8,20}$/.test(numeroDeBac)) {
      return new NextResponse("Invalid numero de bac format", { status: 400 })
    }

    // Check if numeroDeBac already exists (if updating)
    if (numeroDeBac) {
      const existingUser = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.numeroDeBac, numeroDeBac))
        .limit(1)
      
      if (existingUser.length > 0 && existingUser[0].id !== userId) {
        return new NextResponse("Numero de bac already exists", { status: 409 })
      }
    }

    // Prepare update data
    const updateData: any = {
      name,
      updatedAt: new Date()
    }

    // Add optional fields if provided
    if (email !== undefined) updateData.email = email
    if (nfcCardId !== undefined) updateData.nfcCardId = nfcCardId
    if (educationYear !== undefined) updateData.educationYear = educationYear as "1CP" | "2CP" | "1CS" | "2CS" | "3CS" | null
    
    // Only librarians can update these fields
    if (session.user.role === "LIBRARIAN") {
      if (role !== undefined) updateData.role = role as "STUDENT" | "LIBRARIAN"
      if (numeroDeBac !== undefined) updateData.numeroDeBac = numeroDeBac
    }

    // Hash password if provided
    if (password) {
      if (password.length < 6) {
        return new NextResponse("Password must be at least 6 characters", { status: 400 })
      }
      updateData.password = await bcrypt.hash(password, 10)
    }

    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        name: users.name,
        numeroDeBac: users.numeroDeBac,
        email: users.email,
        emailVerified: users.emailVerified,
        image: users.image,
        role: users.role,
        nfcCardId: users.nfcCardId,
        educationYear: users.educationYear,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        // Exclude password from response
      })

    if (!updated) {
      return new NextResponse("User not found", { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("[USER_PUT]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}