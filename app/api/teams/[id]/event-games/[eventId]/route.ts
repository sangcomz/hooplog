import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db, eventGames, teamMembers, users } from "@/lib/db"
import { eq, and } from "drizzle-orm"

// Get event game details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id: teamId, eventId } = await params

    // Verify user is a member of the team
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
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Fetch event game details
    const [eventGame] = await db
      .select({
        id: eventGames.id,
        teamId: eventGames.teamId,
        title: eventGames.title,
        scoreA: eventGames.scoreA,
        scoreB: eventGames.scoreB,
        playerA: eventGames.playerA,
        playerB: eventGames.playerB,
        type: eventGames.type,
        quarters: eventGames.quarters,
        comment: eventGames.comment,
        gameId: eventGames.gameId,
        createdById: eventGames.createdById,
        createdAt: eventGames.createdAt,
        updatedAt: eventGames.updatedAt,
        creatorName: users.name,
        creatorImage: users.image,
      })
      .from(eventGames)
      .innerJoin(users, eq(eventGames.createdById, users.id))
      .where(and(eq(eventGames.id, eventId), eq(eventGames.teamId, teamId)))
      .limit(1)

    if (!eventGame) {
      return NextResponse.json({ error: "Event game not found" }, { status: 404 })
    }

    return NextResponse.json(eventGame)
  } catch (error) {
    console.error("Failed to fetch event game:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// Update event game
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id: teamId, eventId } = await params
    const body = await request.json()
    const { title, scoreA, scoreB, playerA, playerB, type, quarters, comment } = body

    // Verify user is a member of the team
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
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Check if event game exists and user is the creator
    const [existingEventGame] = await db
      .select()
      .from(eventGames)
      .where(and(eq(eventGames.id, eventId), eq(eventGames.teamId, teamId)))
      .limit(1)

    if (!existingEventGame) {
      return NextResponse.json({ error: "Event game not found" }, { status: 404 })
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    }

    if (title !== undefined) updateData.title = title
    if (scoreA !== undefined) updateData.scoreA = scoreA
    if (scoreB !== undefined) updateData.scoreB = scoreB
    if (playerA !== undefined) updateData.playerA = JSON.stringify(playerA)
    if (playerB !== undefined) updateData.playerB = JSON.stringify(playerB)
    if (type !== undefined) updateData.type = type
    if (quarters !== undefined) updateData.quarters = JSON.stringify(quarters)
    if (comment !== undefined) updateData.comment = comment

    // Update event game
    const [updatedEventGame] = await db
      .update(eventGames)
      .set(updateData)
      .where(eq(eventGames.id, eventId))
      .returning()

    return NextResponse.json(updatedEventGame)
  } catch (error) {
    console.error("Failed to update event game:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// Delete event game
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id: teamId, eventId } = await params

    // Verify user is a manager of the team
    const memberCheck = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.userId, session.user.id),
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.role, "MANAGER")
        )
      )
      .limit(1)

    if (memberCheck.length === 0) {
      return NextResponse.json(
        { error: "Only managers can delete event games" },
        { status: 403 }
      )
    }

    // Delete event game (comments will be cascaded)
    await db
      .delete(eventGames)
      .where(and(eq(eventGames.id, eventId), eq(eventGames.teamId, teamId)))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete event game:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
