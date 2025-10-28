import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db, teamMembers, teams } from "@/lib/db"
import { eq, and } from "drizzle-orm"

export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ error: "Team code is required" }, { status: 400 })
    }

    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.code, code.toUpperCase()))
      .limit(1)

    if (!team) {
      return NextResponse.json({ error: "Invalid team code" }, { status: 404 })
    }

    const existingMember = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.userId, session.user.id),
          eq(teamMembers.teamId, team.id)
        )
      )
      .limit(1)

    if (existingMember.length > 0) {
      return NextResponse.json({ error: "Already a member of this team" }, { status: 400 })
    }

    const [newMember] = await db
      .insert(teamMembers)
      .values({
        userId: session.user.id,
        teamId: team.id,
        role: "MEMBER",
        tier: "C",
      })
      .returning()

    return NextResponse.json({
      ...team,
      role: newMember.role,
      tier: newMember.tier,
    })
  } catch (error) {
    console.error("Failed to join team:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}