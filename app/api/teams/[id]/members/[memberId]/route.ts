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
    const { tier, role } = await request.json()

    // Validate tier if provided
    if (tier && !["A", "B", "C"].includes(tier)) {
      return NextResponse.json(
        { error: "Invalid tier. Must be 'A', 'B', or 'C'" },
        { status: 400 }
      )
    }

    // Validate role if provided
    if (role && !["MANAGER", "MEMBER"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be 'MANAGER' or 'MEMBER'" },
        { status: 400 }
      )
    }

    // At least one field must be provided
    if (!tier && !role) {
      return NextResponse.json(
        { error: "Must provide tier or role to update" },
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
        { error: "Only managers can update members" },
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

    // If demoting a manager to member, check there's at least one other manager
    if (role === "MEMBER" && targetMember[0].role === "MANAGER") {
      const managerCount = await db
        .select()
        .from(teamMembers)
        .where(
          and(
            eq(teamMembers.teamId, teamId),
            eq(teamMembers.role, "MANAGER")
          )
        )

      if (managerCount.length <= 1) {
        return NextResponse.json(
          { error: "Cannot demote the last manager of the team" },
          { status: 400 }
        )
      }
    }

    // Prepare update object with proper types
    const updateData: {
      tier?: "A" | "B" | "C"
      role?: "MANAGER" | "MEMBER"
    } = {}
    if (tier) updateData.tier = tier as "A" | "B" | "C"
    if (role) updateData.role = role as "MANAGER" | "MEMBER"

    // Update the member
    const [updatedMember] = await db
      .update(teamMembers)
      .set(updateData)
      .where(eq(teamMembers.id, memberId))
      .returning()

    return NextResponse.json(updatedMember)
  } catch (error) {
    console.error("Failed to update member tier:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id: teamId, memberId } = await params

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
        { error: "Only managers can delete team members" },
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

    // Prevent deleting the last manager
    if (targetMember[0].role === "MANAGER") {
      const managerCount = await db
        .select()
        .from(teamMembers)
        .where(
          and(
            eq(teamMembers.teamId, teamId),
            eq(teamMembers.role, "MANAGER")
          )
        )

      if (managerCount.length <= 1) {
        return NextResponse.json(
          { error: "Cannot delete the last manager of the team" },
          { status: 400 }
        )
      }
    }

    // Delete the member
    await db
      .delete(teamMembers)
      .where(eq(teamMembers.id, memberId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete team member:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
