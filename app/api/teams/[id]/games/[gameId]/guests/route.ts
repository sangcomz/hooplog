import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db, guests, teamMembers, games } from "@/lib/db"
import { eq, and } from "drizzle-orm"

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

    // Fetch all guests for this game
    const gameGuests = await db
      .select()
      .from(guests)
      .where(eq(guests.gameId, gameId))

    return NextResponse.json(gameGuests)
  } catch (error) {
    console.error("Failed to fetch guests:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
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
    const { name, tier } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

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
      return NextResponse.json({ error: "Only managers can add guests" }, { status: 403 })
    }

    // Check if the game exists and belongs to the team
    const gameCheck = await db
      .select()
      .from(games)
      .where(and(eq(games.id, gameId), eq(games.teamId, teamId)))
      .limit(1)

    if (gameCheck.length === 0) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }

    // Create the guest
    const [guest] = await db
      .insert(guests)
      .values({
        gameId,
        name,
        tier: tier || "C",
      })
      .returning()

    return NextResponse.json(guest)
  } catch (error) {
    console.error("Failed to create guest:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; gameId: string }> }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id: teamId, gameId } = await params
    const { searchParams } = new URL(request.url)
    const guestId = searchParams.get("guestId")

    if (!guestId) {
      return NextResponse.json({ error: "Guest ID is required" }, { status: 400 })
    }

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
      return NextResponse.json({ error: "Only managers can delete guests" }, { status: 403 })
    }

    // Delete the guest
    await db.delete(guests).where(and(eq(guests.id, guestId), eq(guests.gameId, gameId)))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete guest:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
