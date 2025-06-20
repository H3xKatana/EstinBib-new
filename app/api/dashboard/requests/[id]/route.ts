  import { NextResponse } from "next/server"
  import { db } from "@/db"
  import { bookRequests } from "@/db/schema"
  import { eq } from "drizzle-orm"
  type Context = {
    params: Promise<{
      id: string | string[] | undefined
    }>
  }

  export async function DELETE(
    request: Request,
    context: Context
  ) {
    try {

      const params = await context.params
      const id = Array.isArray(params.id) ? params.id[0] : params.id

      if (!id) {
        return new NextResponse("Invalid request ID", { status: 400 })
      }


      // Delete the request
      const [deleted] = await db
        .delete(bookRequests)
        .where(eq(bookRequests.id, id))
        .returning()

      if (!deleted) {
        return new NextResponse("Request not found", { status: 404 })
      }

      return NextResponse.json(deleted)
    } catch (error) {
      console.error("[REQUEST_DELETE]", error)
      return new NextResponse("Internal error", { status: 500 })
    }
  }