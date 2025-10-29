import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db, eventGames, teamMembers, users } from "@/lib/db"
import { eq, and, desc } from "drizzle-orm"

// Get all event games for a team
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id: teamId } = await params
    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get("gameId")

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

    // Build query
    let query = db
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
        creatorName: users.name,
        creatorImage: users.image,
      })
      .from(eventGames)
      .innerJoin(users, eq(eventGames.createdById, users.id))
      .$dynamic()

    // Filter by gameId if provided
    if (gameId) {
      const eventGamesList = await query
        .where(and(eq(eventGames.teamId, teamId), eq(eventGames.gameId, gameId)))
        .orderBy(desc(eventGames.createdAt))
      return NextResponse.json(eventGamesList)
    }

    // Otherwise fetch all event games for this team
    const eventGamesList = await query
      .where(eq(eventGames.teamId, teamId))
      .orderBy(desc(eventGames.createdAt))

    return NextResponse.json(eventGamesList)
  } catch (error) {
    console.error("Failed to fetch event games:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// Create a new event game
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id: teamId } = await params
    const body = await request.json()
    const { title, scoreA, scoreB, playerA, playerB, type, quarters, comment, gameId } = body

    if (!title || !playerA || !playerB || playerA.length === 0 || playerB.length === 0) {
      return NextResponse.json(
        { error: "Title, playerA, and playerB are required" },
        { status: 400 }
      )
    }

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

    // Create event game
    const [eventGame] = await db
      .insert(eventGames)
      .values({
        teamId,
        title,
        scoreA: scoreA || 0,
        scoreB: scoreB || 0,
        playerA: JSON.stringify(playerA),
        playerB: JSON.stringify(playerB),
        type: type || "single",
        quarters: quarters ? JSON.stringify(quarters) : null,
        comment: comment || null,
        gameId: gameId || null,
        createdById: session.user.id,
      })
      .returning()

    return NextResponse.json(eventGame)
  } catch (error) {
    console.error("Failed to create event game:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
