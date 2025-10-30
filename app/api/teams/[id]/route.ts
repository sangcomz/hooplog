import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db, teamMembers, teams, users, games } from "@/lib/db"
import { eq, and, desc, asc } from "drizzle-orm"

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

    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1)

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    const members = await db
      .select({
        id: teamMembers.id,
        userId: teamMembers.userId,
        teamId: teamMembers.teamId,
        role: teamMembers.role,
        tier: teamMembers.tier,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          image: users.image,
        },
      })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.teamId, teamId))
      .orderBy(desc(teamMembers.role), asc(teamMembers.tier))

    return NextResponse.json({
      ...team,
      members,
    })
  } catch (error) {
    console.error("Failed to fetch team:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id: teamId } = await params
    const { name, description } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Team name is required" },
        { status: 400 }
      )
    }

    // Check if the requester is a manager of the team
    const managerCheck = await db
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

    if (managerCheck.length === 0) {
      return NextResponse.json(
        { error: "Only managers can update the team" },
        { status: 403 }
      )
    }

    // Update the team
    const [updatedTeam] = await db
      .update(teams)
      .set({
        name: name.trim(),
        description: description ? description.trim() : null,
        updatedAt: new Date(),
      })
      .where(eq(teams.id, teamId))
      .returning()

    if (!updatedTeam) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    return NextResponse.json(updatedTeam)
  } catch (error) {
    console.error("Failed to update team:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id: teamId } = await params

    // Check if the requester is a manager of the team
    const managerCheck = await db
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

    if (managerCheck.length === 0) {
      return NextResponse.json(
        { error: "Only managers can delete the team" },
        { status: 403 }
      )
    }

    // Check if team exists
    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1)

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    // Delete the team (cascade will delete members, games, etc. due to foreign key constraints)
    await db.delete(teams).where(eq(teams.id, teamId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete team:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}