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

interface Match {
  team1: number
  team2: number
  score1: number
  score2: number
}

interface QuarterScore {
  quarter: number
  matches: Match[]
}

interface Round {
  id: string
  roundNumber: number
  teams: TeamResult[]
  quarterScores: QuarterScore[]
  maxQuarter: number
  createdAt: number
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

  // Distribute players by tier round-robin with continuous indexing
  let globalIndex = 0

  // First distribute A tier
  shuffledA.forEach((player) => {
    const teamIndex = globalIndex % teamCount
    teams[teamIndex].players.push(player)
    globalIndex++
  })

  // Then distribute B tier
  shuffledB.forEach((player) => {
    const teamIndex = globalIndex % teamCount
    teams[teamIndex].players.push(player)
    globalIndex++
  })

  // Finally distribute C tier
  shuffledC.forEach((player) => {
    const teamIndex = globalIndex % teamCount
    teams[teamIndex].players.push(player)
    globalIndex++
  })

  return teams
}

function distributePlayersRandomly(players: Player[], teamCount: number): TeamResult[] {
  // Shuffle all players randomly
  const shuffled = shuffleArray(players)

  // Initialize teams
  const teams: TeamResult[] = Array.from({ length: teamCount }, (_, i) => ({
    teamNumber: i + 1,
    players: [],
  }))

  // Distribute players round-robin
  shuffled.forEach((player, index) => {
    const teamIndex = index % teamCount
    teams[teamIndex].players.push(player)
  })

  return teams
}

function generateMatchPairs(teamCount: number): [number, number][] {
  const pairs: [number, number][] = []

  // For 2 teams, just one match
  if (teamCount === 2) {
    pairs.push([1, 2])
  } else {
    // For 3+ teams, generate all possible pairs (round robin)
    for (let i = 1; i <= teamCount; i++) {
      for (let j = i + 1; j <= teamCount; j++) {
        pairs.push([i, j])
      }
    }
  }

  return pairs
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
    const matchType = body.matchType || "balance" // "balance" or "random"

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

    // Distribute players based on match type
    const teams = matchType === "random"
      ? distributePlayersRandomly(players, teamCount)
      : distributePlayersByTier(players, teamCount)

    // Get existing rounds (migrate from old teams format if needed)
    let rounds: Round[] = []

    console.log('[MATCH POST] Current game.rounds:', game.rounds ? 'exists' : 'null')
    console.log('[MATCH POST] Current game.teams:', game.teams ? 'exists' : 'null')

    if (game.rounds) {
      // Parse existing rounds
      rounds = JSON.parse(game.rounds as string)
      console.log('[MATCH POST] Parsed existing rounds, count:', rounds.length)
    } else if (game.teams) {
      // Migrate old teams format to rounds - this only happens on first access
      const oldTeams = JSON.parse(game.teams as string)
      rounds = [{
        id: `round-${Date.now()}-1`,
        roundNumber: 1,
        teams: oldTeams,
        quarterScores: [],
        maxQuarter: 1,
        createdAt: Date.now(),
      }]
      console.log('[MATCH POST] Migrated old teams to round 1')
    }

    // Generate match pairs for this team count
    const matchPairs = generateMatchPairs(teamCount)

    // Create initial quarter with matches (all scores set to 0)
    const initialMatches: Match[] = matchPairs.map(([team1, team2]) => ({
      team1,
      team2,
      score1: 0,
      score2: 0
    }))

    // Create new round
    const newRound: Round = {
      id: `round-${Date.now()}-${rounds.length + 1}`,
      roundNumber: rounds.length + 1,
      teams,
      quarterScores: [{
        quarter: 1,
        matches: initialMatches
      }],
      maxQuarter: 1,
      createdAt: Date.now(),
    }

    rounds.push(newRound)
    console.log('[MATCH POST] Created new round, total rounds:', rounds.length)
    console.log('[MATCH POST] Round IDs:', rounds.map(r => `${r.roundNumber}:${r.id}`))

    // Save rounds to the database
    const roundsJson = JSON.stringify(rounds)
    console.log('[MATCH POST] Saving rounds to DB, length:', roundsJson.length)

    const [updatedGame] = await db
      .update(games)
      .set({
        rounds: roundsJson,
        teams: JSON.stringify(teams), // Keep for backward compatibility
        updatedAt: new Date()
      })
      .where(eq(games.id, gameId))
      .returning()

    console.log('[MATCH POST] Saved to DB successfully, rounds field:', updatedGame.rounds ? 'exists' : 'null')
    console.log('[MATCH POST] Updated game rounds length:', updatedGame.rounds ? JSON.parse(updatedGame.rounds as string).length : 0)

    // Verify by reading back from DB
    const [verifyGame] = await db
      .select()
      .from(games)
      .where(eq(games.id, gameId))
      .limit(1)

    console.log('[MATCH POST] VERIFY - Read back from DB, rounds field:', verifyGame.rounds ? 'exists' : 'null')
    if (verifyGame.rounds) {
      const verifyRounds = JSON.parse(verifyGame.rounds as string)
      console.log('[MATCH POST] VERIFY - Rounds count:', verifyRounds.length)
      console.log('[MATCH POST] VERIFY - Round IDs:', verifyRounds.map((r: any) => `${r.roundNumber}:${r.id}`))
    }

    return NextResponse.json({
      rounds,
      currentRound: newRound,
      totalPlayers: players.length
    })
  } catch (error) {
    console.error("Failed to generate match:", error)
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
    const { roundId, maxQuarter } = await request.json()

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
      return NextResponse.json({ error: "Only managers can update rounds" }, { status: 403 })
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

    if (!game.rounds) {
      return NextResponse.json({ error: "No rounds found" }, { status: 404 })
    }

    // Update the specific round's maxQuarter
    const rounds = JSON.parse(game.rounds as string)
    const roundIndex = rounds.findIndex((r: any) => r.id === roundId)

    if (roundIndex === -1) {
      return NextResponse.json({ error: "Round not found" }, { status: 404 })
    }

    const round = rounds[roundIndex]
    const teamCount = round.teams.length
    const matchPairs = generateMatchPairs(teamCount)

    // Add new quarter with initial matches (all scores set to 0)
    const newMatches: Match[] = matchPairs.map(([team1, team2]) => ({
      team1,
      team2,
      score1: 0,
      score2: 0
    }))

    round.quarterScores.push({
      quarter: maxQuarter,
      matches: newMatches
    })

    round.maxQuarter = maxQuarter

    // Save updated rounds
    const [updatedGame] = await db
      .update(games)
      .set({
        rounds: JSON.stringify(rounds),
        updatedAt: new Date()
      })
      .where(eq(games.id, gameId))
      .returning()

    console.log('[MATCH PATCH] Updated maxQuarter for round:', roundId, 'to:', maxQuarter)

    return NextResponse.json({ success: true, rounds })
  } catch (error) {
    console.error("Failed to update round:", error)
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

    // Get rounds (migrate from old teams format if needed)
    let rounds: Round[] = []

    console.log('[MATCH GET] game.rounds:', game.rounds ? 'exists' : 'null')
    console.log('[MATCH GET] game.teams:', game.teams ? 'exists' : 'null')

    if (game.rounds) {
      rounds = JSON.parse(game.rounds as string)
      console.log('[MATCH GET] Returning existing rounds, count:', rounds.length)
      console.log('[MATCH GET] Round IDs:', rounds.map(r => `${r.roundNumber}:${r.id}`))
    } else if (game.teams) {
      // Migrate old teams format to rounds
      const oldTeams = JSON.parse(game.teams as string)
      rounds = [{
        id: `round-${Date.now()}-1`,
        roundNumber: 1,
        teams: oldTeams,
        quarterScores: [],
        maxQuarter: 1,
        createdAt: Date.now(),
      }]
      console.log('[MATCH GET] Migrated old teams to round 1 (temporary, not saved)')
    }

    return NextResponse.json({
      teamCount: game.teamCount,
      playersPerTeam: game.playersPerTeam,
      rounds,
      teams: game.teams ? JSON.parse(game.teams as string) : null, // Keep for backward compatibility
    })
  } catch (error) {
    console.error("Failed to fetch match:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
