import { NextResponse } from "next/server"
import { db } from "@/db"
import { borrows, users } from "@/db/schema"
import { count, eq, and, sql, gte, lt, isNull, isNotNull } from "drizzle-orm"

export async function GET() {
  try {
    // Get current timestamp for calculations
    const now = new Date()
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(now.getMonth() - 6);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get active borrowers (users with current borrows in last 30 days)
    const activeBorrowers = await db
      .select({
        count: count(),
      })
      .from(borrows)
      .where(
        and(
          isNull(borrows.returnedAt),
          gte(borrows.borrowedAt, thirtyDaysAgo)
        )
      )

    // Get top borrowers
    const topBorrowers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        borrowCount: count(borrows.id).as("borrowCount"),
      })
      .from(users)
      .leftJoin(borrows, eq(users.id, borrows.userId))
      .groupBy(users.id, users.name, users.email, users.image)
      .orderBy(sql`count(${borrows.id}) desc`)
      .limit(5)

    // Get overdue borrows count
    const overdueBorrows = await db
      .select({
        count: count(),
      })
      .from(borrows)
      .where(
        and(
          isNull(borrows.returnedAt),
          lt(borrows.dueDate, now)
        )
      )

    // Get monthly activity data (borrows and returns per month)
    const months = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date(now);
      date.setMonth(now.getMonth() - i);
      months.unshift({
        month: date.getMonth() + 1, // SQL months are 1-based
        year: date.getFullYear(),
        monthName: new Intl.DateTimeFormat('en', { month: 'short' }).format(date)
      });
    }

    // Query to get borrow counts by month
    const borrowsByMonth = await db
      .select({
        month: sql`EXTRACT(MONTH FROM ${borrows.borrowedAt})::int`,
        year: sql`EXTRACT(YEAR FROM ${borrows.borrowedAt})::int`,
        count: count().as("count")
      })
      .from(borrows)
      .where(gte(borrows.borrowedAt, sixMonthsAgo))
      .groupBy(sql`EXTRACT(MONTH FROM ${borrows.borrowedAt})`, sql`EXTRACT(YEAR FROM ${borrows.borrowedAt})`)

    // Query to get return counts by month
    const returnsByMonth = await db
      .select({
        month: sql`EXTRACT(MONTH FROM ${borrows.returnedAt})::int`,
        year: sql`EXTRACT(YEAR FROM ${borrows.returnedAt})::int`,
        count: count().as("count")
      })
      .from(borrows)
      .where(and(
        isNotNull(borrows.returnedAt),
        gte(borrows.returnedAt, sixMonthsAgo)
      ))
      .groupBy(sql`EXTRACT(MONTH FROM ${borrows.returnedAt})`, sql`EXTRACT(YEAR FROM ${borrows.returnedAt})`)

    // Combine the data into the expected format
    const activityData = months.map(monthData => {
      const borrowData = borrowsByMonth.find(
        b => b.month === monthData.month && b.year === monthData.year
      );
      
      const returnData = returnsByMonth.find(
        r => r.month === monthData.month && r.year === monthData.year
      );
      
      return {
        date: monthData.monthName,
        borrows: Number(borrowData?.count || 0),
        returns: Number(returnData?.count || 0)
      };
    });

    return NextResponse.json({
      activeBorrowers: activeBorrowers[0]?.count ?? 0,
      overdueBorrows: overdueBorrows[0]?.count ?? 0,
      topBorrowers,
      activity: activityData
    })
  } catch (error) {
    console.error("[USERS_ACTIVITY_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}