import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db, teamMembers } from "@/lib/db"
import { eq, and } from "drizzle-orm"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id: teamId, memberId } = await params
    const { tier } = await request.json()

    if (!tier || !["A", "B", "C"].includes(tier)) {
      return NextResponse.json(
        { error: "Invalid tier. Must be 'A', 'B', or 'C'" },
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
        { error: "Only managers can update member tiers" },
        { status: 403 }
      )
    }

    // Check if the target member exists in the team
    const targetMember = await db
      .select()
      .from(teamMembers)
      .where(and(eq(teamMembers.id, memberId), eq(teamMembers.teamId, teamId)))
      .limit(1)

    if (targetMember.length === 0) {
      return NextResponse.json({ error: "Member not found in this team" }, { status: 404 })
    }

    // Update the tier
    const [updatedMember] = await db
      .update(teamMembers)
      .set({ tier })
      .where(eq(teamMembers.id, memberId))
      .returning()

    return NextResponse.json(updatedMember)
  } catch (error) {
    console.error("Failed to update member tier:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
