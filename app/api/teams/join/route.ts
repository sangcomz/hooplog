import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

    const team = await prisma.team.findUnique({
      where: { code: code.toUpperCase() },
    })

    if (!team) {
      return NextResponse.json({ error: "Invalid team code" }, { status: 404 })
    }

    const existingMember = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: session.user.id,
          teamId: team.id,
        },
      },
    })

    if (existingMember) {
      return NextResponse.json({ error: "Already a member of this team" }, { status: 400 })
    }

    const teamMember = await prisma.teamMember.create({
      data: {
        userId: session.user.id,
        teamId: team.id,
        role: "MEMBER",
        tier: "C",
      },
      include: {
        team: true,
      },
    })

    return NextResponse.json({
      ...teamMember.team,
      role: teamMember.role,
      tier: teamMember.tier,
    })
  } catch (error) {
    console.error("Failed to join team:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}