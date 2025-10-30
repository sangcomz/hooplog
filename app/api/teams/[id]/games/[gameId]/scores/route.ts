import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db, scores, teamMembers, games } from "@/lib/db"
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

    // Fetch all scores for this game
    const gameScores = await db
      .select()
      .from(scores)
      .where(eq(scores.gameId, gameId))

    return NextResponse.json(gameScores)
  } catch (error) {
    console.error("Failed to fetch scores:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

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
    const { teamNumber, quarter, score, roundId } = await request.json()

    if (
      teamNumber === undefined ||
      quarter === undefined ||
      score === undefined
    ) {
      return NextResponse.json(
        { error: "teamNumber, quarter, and score are required" },
        { status: 400 }
      )
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
        { error: "Only managers can update scores" },
        { status: 403 }
      )
    }

    // Check if the game exists and belongs to the team
    const [game] = await db
      .select()
      .from(games)
      .where(and(eq(games.id, gameId), eq(games.teamId, teamId)))
      .limit(1)

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }

    // Update rounds if roundId is provided
    if (roundId && game.rounds) {
      const rounds = JSON.parse(game.rounds as string)
      const roundIndex = rounds.findIndex((r: any) => r.id === roundId)

      if (roundIndex === -1) {
        return NextResponse.json({ error: "Round not found" }, { status: 404 })
      }

      // Find or create quarter score entry
      const quarterScoreIndex = rounds[roundIndex].quarterScores.findIndex(
        (qs: any) => qs.quarter === quarter
      )

      if (quarterScoreIndex === -1) {
        // Create new quarter score
        rounds[roundIndex].quarterScores.push({
          quarter,
          scores: { [teamNumber]: score }
        })
      } else {
        // Update existing quarter score
        rounds[roundIndex].quarterScores[quarterScoreIndex].scores[teamNumber] = score
      }

      // Save updated rounds
      await db
        .update(games)
        .set({
          rounds: JSON.stringify(rounds),
          updatedAt: new Date()
        })
        .where(eq(games.id, gameId))
    }

    // Also update the legacy scores table for backward compatibility
    const existingScore = await db
      .select()
      .from(scores)
      .where(
        and(
          eq(scores.gameId, gameId),
          eq(scores.teamNumber, teamNumber),
          eq(scores.quarter, quarter)
        )
      )
      .limit(1)

    if (existingScore.length > 0) {
      // Update existing score
      const [updatedScore] = await db
        .update(scores)
        .set({ score, updatedAt: new Date() })
        .where(
          and(
            eq(scores.gameId, gameId),
            eq(scores.teamNumber, teamNumber),
            eq(scores.quarter, quarter)
          )
        )
        .returning()

      return NextResponse.json(updatedScore)
    } else {
      // Create new score
      const [newScore] = await db
        .insert(scores)
        .values({
          gameId,
          teamNumber,
          quarter,
          score,
        })
        .returning()

      return NextResponse.json(newScore)
    }
  } catch (error) {
    console.error("Failed to update score:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
