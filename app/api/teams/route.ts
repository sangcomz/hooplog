import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const teams = await prisma.teamMember.findMany({
      where: { userId: session.user.id },
      include: {
        team: true,
      },
    })

    return NextResponse.json(teams.map(tm => ({
      ...tm.team,
      role: tm.role,
      tier: tm.tier,
    })))
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

    const team = await prisma.team.create({
      data: {
        name,
        description: description || null,
        code,
        members: {
          create: {
            userId: session.user.id,
            role: "MANAGER",
            tier: "A",
          },
        },
      },
      include: {
        members: true,
      },
    })

    return NextResponse.json(team)
  } catch (error) {
    console.error("Failed to create team:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}