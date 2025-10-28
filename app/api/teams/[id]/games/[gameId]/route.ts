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
