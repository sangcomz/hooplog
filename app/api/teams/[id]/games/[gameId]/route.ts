import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db, games, teamMembers, users, attendances } from "@/lib/db"
import { eq, and } from "drizzle-orm"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; gameId: string }> }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id: teamId, gameId } = await params

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

    // Fetch the game
    const [game] = await db
      .select({
        id: games.id,
        teamId: games.teamId,
        creatorId: games.creatorId,
        date: games.date,
        location: games.location,
        description: games.description,
        teamCount: games.teamCount,
        playersPerTeam: games.playersPerTeam,
        teams: games.teams,
        status: games.status,
        createdAt: games.createdAt,
        updatedAt: games.updatedAt,
        creator: {
          id: users.id,
          name: users.name,
          email: users.email,
          image: users.image,
        },
      })
      .from(games)
      .innerJoin(users, eq(games.creatorId, users.id))
      .where(and(eq(games.id, gameId), eq(games.teamId, teamId)))
      .limit(1)

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }

    // Fetch attendance records for this game
    const gameAttendances = await db
      .select({
        id: attendances.id,
        gameId: attendances.gameId,
        userId: attendances.userId,
        status: attendances.status,
        createdAt: attendances.createdAt,
        updatedAt: attendances.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          image: users.image,
        },
        member: {
          role: teamMembers.role,
          tier: teamMembers.tier,
        },
      })
      .from(attendances)
      .innerJoin(users, eq(attendances.userId, users.id))
      .innerJoin(teamMembers, and(
        eq(teamMembers.userId, users.id),
        eq(teamMembers.teamId, teamId)
      ))
      .where(eq(attendances.gameId, gameId))

    return NextResponse.json({
      ...game,
      attendances: gameAttendances,
    })
  } catch (error) {
    console.error("Failed to fetch game:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

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

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    // Validate status value
    const validStatuses = ["pending", "started", "finished"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 })
    }

    // Check if user is a manager of the team
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
        { error: "Only managers can update game status" },
        { status: 403 }
      )
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

    // Update the game status
    const [updatedGame] = await db
      .update(games)
      .set({ status, updatedAt: new Date() })
      .where(eq(games.id, gameId))
      .returning()

    return NextResponse.json(updatedGame)
  } catch (error) {
    console.error("Failed to update game status:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
