import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db, votes, users, teamMembers, games, attendances } from "@/lib/db"
import { eq, and, sql } from "drizzle-orm"

// Get votes for a game
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; gameId: string }> }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { gameId } = await params

    // Get vote counts grouped by player
    const voteResults = await db
      .select({
        playerId: votes.playerId,
        playerName: users.name,
        playerImage: users.image,
        voteCount: sql<number>`cast(count(*) as integer)`,
      })
      .from(votes)
      .innerJoin(users, eq(votes.playerId, users.id))
      .where(eq(votes.gameId, gameId))
      .groupBy(votes.playerId, users.name, users.image)
      .orderBy(sql`count(*) desc`)

    // Get current user's vote
    const [userVote] = await db
      .select({
        playerId: votes.playerId,
      })
      .from(votes)
      .where(and(eq(votes.gameId, gameId), eq(votes.voterId, session.user.id)))
      .limit(1)

    return NextResponse.json({
      votes: voteResults,
      userVote: userVote?.playerId || null,
    })
  } catch (error) {
    console.error("Failed to fetch votes:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// Cast or update a vote
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; gameId: string }> }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id: teamId, gameId } = await params
    const { playerId } = await request.json()

    if (!playerId) {
      return NextResponse.json({ error: "Player ID is required" }, { status: 400 })
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
      return NextResponse.json({ error: "You must be a team member to vote" }, { status: 403 })
    }

    // Check if user already voted
    const [existingVote] = await db
      .select()
      .from(votes)
      .where(and(eq(votes.gameId, gameId), eq(votes.voterId, session.user.id)))
      .limit(1)

    if (existingVote) {
      // Update existing vote
      await db
        .update(votes)
        .set({ playerId })
        .where(eq(votes.id, existingVote.id))
    } else {
      // Create new vote
      await db.insert(votes).values({
        gameId,
        voterId: session.user.id,
        playerId,
      })
    }

    // Check if all team members who attended have voted
    const attendingMembers = await db
      .select({ userId: attendances.userId })
      .from(attendances)
      .innerJoin(teamMembers, and(
        eq(teamMembers.userId, attendances.userId),
        eq(teamMembers.teamId, teamId)
      ))
      .where(and(eq(attendances.gameId, gameId), eq(attendances.status, "attend")))

    const attendingMemberIds = attendingMembers.map(m => m.userId)

    // Count votes from attending members
    const voteCount = await db
      .select({ count: sql<number>`cast(count(distinct ${votes.voterId}) as integer)` })
      .from(votes)
      .where(eq(votes.gameId, gameId))

    const totalVotes = voteCount[0]?.count || 0

    // If all attending members have voted, close voting
    if (totalVotes >= attendingMemberIds.length && attendingMemberIds.length > 0) {
      await db
        .update(games)
        .set({ votingStatus: "closed", updatedAt: new Date() })
        .where(eq(games.id, gameId))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to cast vote:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// Close voting (manager only)
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
      return NextResponse.json({ error: "Only managers can close voting" }, { status: 403 })
    }

    // Close voting
    await db
      .update(games)
      .set({ votingStatus: "closed", updatedAt: new Date() })
      .where(eq(games.id, gameId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to close voting:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
