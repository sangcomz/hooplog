import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db, teamMembers, teams } from "@/lib/db"
import { eq } from "drizzle-orm"

export async function GET(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const userTeams = await db
      .select({
        id: teams.id,
        name: teams.name,
        code: teams.code,
        description: teams.description,
        createdAt: teams.createdAt,
        updatedAt: teams.updatedAt,
        role: teamMembers.role,
        tier: teamMembers.tier,
      })
      .from(teamMembers)
      .innerJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(eq(teamMembers.userId, session.user.id))

    return NextResponse.json(userTeams)
  } catch (error) {
    console.error("Failed to fetch teams:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { name, description } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Team name is required" }, { status: 400 })
    }

    const code = Math.random().toString(36).substring(2, 8).toUpperCase()

    const [team] = await db
      .insert(teams)
      .values({
        name,
        description: description || null,
        code,
      })
      .returning()

    await db.insert(teamMembers).values({
      userId: session.user.id,
      teamId: team.id,
      role: "MANAGER",
      tier: "A",
    })

    const teamWithMembers = await db
      .select()
      .from(teams)
      .where(eq(teams.id, team.id))
      .limit(1)

    return NextResponse.json(teamWithMembers[0])
  } catch (error) {
    console.error("Failed to create team:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}