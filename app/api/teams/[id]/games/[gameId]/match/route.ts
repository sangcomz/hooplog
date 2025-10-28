import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db, games, teamMembers, attendances, guests, users } from "@/lib/db"
import { eq, and } from "drizzle-orm"

interface Player {
  id: string
  name: string
  tier: string
  isGuest: boolean
}

interface TeamResult {
  teamNumber: number
  players: Player[]
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function distributePlayersByTier(players: Player[], teamCount: number): TeamResult[] {
  // Group players by tier
  const tierGroups: { [key: string]: Player[] } = {
    A: [],
    B: [],
    C: [],
  }

  players.forEach((player) => {
    if (tierGroups[player.tier]) {
      tierGroups[player.tier].push(player)
    } else {
      // If tier is not A, B, or C, treat as C
      tierGroups.C.push(player)
    }
  })

  // Shuffle each tier group
  const shuffledA = shuffleArray(tierGroups.A)
  const shuffledB = shuffleArray(tierGroups.B)
  const shuffledC = shuffleArray(tierGroups.C)

  // Initialize teams
  const teams: TeamResult[] = Array.from({ length: teamCount }, (_, i) => ({
    teamNumber: i + 1,
    players: [],
  }))

  // Distribute players by tier round-robin
  // First distribute A tier
  shuffledA.forEach((player, index) => {
    const teamIndex = index % teamCount
    teams[teamIndex].players.push(player)
  })

  // Then distribute B tier
  shuffledB.forEach((player, index) => {
    const teamIndex = index % teamCount
    teams[teamIndex].players.push(player)
  })

  // Finally distribute C tier
  shuffledC.forEach((player, index) => {
    const teamIndex = index % teamCount
    teams[teamIndex].players.push(player)
  })

  return teams
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
    const body = await request.json()
    const newTeamCount = body.teamCount

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
      return NextResponse.json({ error: "Only managers can generate matches" }, { status: 403 })
    }

    // Fetch the game
    const [game] = await db
      .select()
      .from(games)
      .where(and(eq(games.id, gameId), eq(games.teamId, teamId)))
      .limit(1)

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }

    // Update teamCount if provided
    const teamCount = newTeamCount || game.teamCount

    if (newTeamCount && newTeamCount !== game.teamCount) {
      await db
        .update(games)
        .set({ teamCount: newTeamCount, updatedAt: new Date() })
        .where(eq(games.id, gameId))
    }

    // Fetch attending members
    const attendingMembers = await db
      .select({
        id: users.id,
        name: users.name,
        tier: teamMembers.tier,
      })
      .from(attendances)
      .innerJoin(users, eq(attendances.userId, users.id))
      .innerJoin(teamMembers, and(
        eq(teamMembers.userId, users.id),
        eq(teamMembers.teamId, teamId)
      ))
      .where(and(eq(attendances.gameId, gameId), eq(attendances.status, "attend")))

    // Fetch all guests (guests are always attending)
    const gameGuests = await db
      .select()
      .from(guests)
      .where(eq(guests.gameId, gameId))

    // Combine members and guests into players array
    const players: Player[] = [
      ...attendingMembers.map((member) => ({
        id: member.id,
        name: member.name || "Unknown",
        tier: member.tier,
        isGuest: false,
      })),
      ...gameGuests.map((guest) => ({
        id: guest.id,
        name: guest.name,
        tier: guest.tier,
        isGuest: true,
      })),
    ]

    if (players.length === 0) {
      return NextResponse.json({ error: "참석 가능한 인원이 없습니다." }, { status: 400 })
    }

    // Calculate minimum required players
    const playersPerTeam = game.playersPerTeam || 5
    const minRequiredPlayers = teamCount * playersPerTeam

    // Check if there are enough players
    if (players.length < minRequiredPlayers) {
      return NextResponse.json(
        {
          error: `인원이 부족합니다. 최소 ${minRequiredPlayers}명이 필요하지만 현재 ${players.length}명만 참석 가능합니다. (${playersPerTeam}대${playersPerTeam} ${teamCount}팀)`,
        },
        { status: 400 }
      )
    }

    // Distribute players into teams with tier balancing
    const teams = distributePlayersByTier(players, teamCount)

    // Save the team result to the database
    await db
      .update(games)
      .set({ teams: JSON.stringify(teams), updatedAt: new Date() })
      .where(eq(games.id, gameId))

    return NextResponse.json({ teams, totalPlayers: players.length })
  } catch (error) {
    console.error("Failed to generate match:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

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

    // Fetch the game with match results
    const [game] = await db
      .select()
      .from(games)
      .where(and(eq(games.id, gameId), eq(games.teamId, teamId)))
      .limit(1)

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }

    return NextResponse.json({
      teamCount: game.teamCount,
      playersPerTeam: game.playersPerTeam,
      teams: game.teams ? JSON.parse(game.teams as string) : null,
    })
  } catch (error) {
    console.error("Failed to fetch match:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
