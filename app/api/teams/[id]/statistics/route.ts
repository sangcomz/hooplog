import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db, teamMembers, games, attendances, votes, users, scores } from "@/lib/db"
import { eq, and, sql } from "drizzle-orm"

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

    // Get all finished games for this team
    const finishedGames = await db
      .select({ id: games.id })
      .from(games)
      .where(and(eq(games.teamId, teamId), eq(games.status, "finished")))

    const finishedGameIds = finishedGames.map(g => g.id)

    // 1. Member Attendance Rate (only for finished games)
    const attendanceStats = await db
      .select({
        userId: teamMembers.userId,
        userName: users.name,
        userImage: users.image,
        totalGames: sql<number>`cast(count(distinct ${games.id}) as integer)`,
        attendedGames: sql<number>`cast(sum(case when ${attendances.status} = 'attend' then 1 else 0 end) as integer)`,
        attendanceRate: sql<number>`cast(round(cast(sum(case when ${attendances.status} = 'attend' then 1 else 0 end) as real) * 100.0 / count(distinct ${games.id}), 1) as real)`,
      })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .leftJoin(games, and(eq(games.teamId, teamId), eq(games.status, "finished")))
      .leftJoin(
        attendances,
        and(
          eq(attendances.gameId, games.id),
          eq(attendances.userId, teamMembers.userId)
        )
      )
      .where(eq(teamMembers.teamId, teamId))
      .groupBy(teamMembers.userId, users.name, users.image)
      .orderBy(sql`attendance_rate desc`)

    // 2. MVP Rankings (total votes across all games)
    const mvpRankings = await db
      .select({
        playerId: votes.playerId,
        playerName: users.name,
        playerImage: users.image,
        totalVotes: sql<number>`cast(count(*) as integer)`,
        gamesVotedIn: sql<number>`cast(count(distinct ${votes.gameId}) as integer)`,
      })
      .from(votes)
      .innerJoin(users, eq(votes.playerId, users.id))
      .innerJoin(games, eq(votes.gameId, games.id))
      .where(eq(games.teamId, teamId))
      .groupBy(votes.playerId, users.name, users.image)
      .orderBy(sql`total_votes desc`)
      .limit(10)

    // 3. Team Win Rate (calculate from scores)
    // Get all games with their team assignments and scores
    const gameResults = await db
      .select({
        gameId: games.id,
        teams: games.teams,
      })
      .from(games)
      .where(and(eq(games.teamId, teamId), eq(games.status, "finished")))

    let totalGames = 0
    const teamWins: Record<number, number> = {}

    for (const game of gameResults) {
      if (!game.teams) continue

      const teamsData = game.teams as any[]
      const teamNumbers = teamsData.map((_, idx) => idx + 1)

      // Get scores for this game
      const gameScores = await db
        .select({
          teamNumber: scores.teamNumber,
          totalScore: sql<number>`cast(sum(${scores.score}) as integer)`,
        })
        .from(scores)
        .where(eq(scores.gameId, game.gameId))
        .groupBy(scores.teamNumber)

      if (gameScores.length === 0) continue

      // Find winning team
      const maxScore = Math.max(...gameScores.map(s => s.totalScore))
      const winners = gameScores.filter(s => s.totalScore === maxScore)

      // Only count if there's a clear winner (no tie)
      if (winners.length === 1) {
        totalGames++
        const winningTeamNumber = winners[0].teamNumber
        teamWins[winningTeamNumber] = (teamWins[winningTeamNumber] || 0) + 1
      }
    }

    const teamWinRates = Object.entries(teamWins).map(([teamNumber, wins]) => ({
      teamNumber: parseInt(teamNumber),
      wins,
      totalGames,
      winRate: totalGames > 0 ? Math.round((wins / totalGames) * 1000) / 10 : 0,
    }))

    return NextResponse.json({
      attendanceStats,
      mvpRankings,
      teamWinRates,
      totalFinishedGames: finishedGameIds.length,
    })
  } catch (error) {
    console.error("Failed to fetch statistics:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
