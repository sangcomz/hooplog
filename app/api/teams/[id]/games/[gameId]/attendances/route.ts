import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db, attendances, teamMembers, games } from "@/lib/db"
import { eq, and } from "drizzle-orm"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; gameId: string }> }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id: teamId, gameId } = await params
    const { status } = await request.json()

    if (!status || !["attend", "absent", "pending"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'attend', 'absent', or 'pending'" },
        { status: 400 }
      )
    }

    // Check if user is a member of the team
    const memberCheck = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.userId, session.user.id),
          eq(teamMembers.teamId, teamId)
        )
      )
      .limit(1)

    if (memberCheck.length === 0) {
      return NextResponse.json({ error: "Team not found or access denied" }, { status: 404 })
    }

    // Check if the game exists and belongs to the team
    const gameCheck = await db
      .select()
      .from(games)
      .where(and(eq(games.id, gameId), eq(games.teamId, teamId)))
      .limit(1)

    if (gameCheck.length === 0) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }

    // Update or create attendance record
    const existingAttendance = await db
      .select()
      .from(attendances)
      .where(
        and(
          eq(attendances.gameId, gameId),
          eq(attendances.userId, session.user.id)
        )
      )
      .limit(1)

    if (existingAttendance.length === 0) {
      // Create new attendance record
      const [newAttendance] = await db
        .insert(attendances)
        .values({
          gameId,
          userId: session.user.id,
          status,
        })
        .returning()

      return NextResponse.json(newAttendance)
    } else {
      // Update existing attendance record
      const [updatedAttendance] = await db
        .update(attendances)
        .set({ status, updatedAt: new Date() })
        .where(
          and(
            eq(attendances.gameId, gameId),
            eq(attendances.userId, session.user.id)
          )
        )
        .returning()

      return NextResponse.json(updatedAttendance)
    }
  } catch (error) {
    console.error("Failed to update attendance:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
