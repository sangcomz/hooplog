import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db, games, teamMembers, users, attendances } from "@/lib/db"
import { eq, and, desc } from "drizzle-orm"

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

    // Fetch all games for the team
    const teamGames = await db
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
      .where(eq(games.teamId, teamId))
      .orderBy(desc(games.date))

    return NextResponse.json(teamGames)
  } catch (error) {
    console.error("Failed to fetch games:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

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
    const { date, location, description, teamCount, playersPerTeam } = await request.json()

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 })
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
      return NextResponse.json({ error: "Only managers can create games" }, { status: 403 })
    }

    // Create the game
    const [game] = await db
      .insert(games)
      .values({
        teamId,
        creatorId: session.user.id,
        date: typeof date === 'number' ? new Date(date) : new Date(date),
        location: location || null,
        description: description || null,
        teamCount: teamCount || 2,
        playersPerTeam: playersPerTeam || 5,
      })
      .returning()

    // Create attendance records for all team members
    const members = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.teamId, teamId))

    await db.insert(attendances).values(
      members.map((member) => ({
        gameId: game.id,
        userId: member.userId,
        status: "pending" as const,
      }))
    )

    return NextResponse.json(game)
  } catch (error) {
    console.error("Failed to create game:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
