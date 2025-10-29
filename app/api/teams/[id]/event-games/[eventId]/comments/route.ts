import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db, eventGameComments, eventGames, teamMembers, users } from "@/lib/db"
import { eq, and, desc } from "drizzle-orm"

// Get comments for an event game
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id: teamId, eventId } = await params

    // Verify user is a member of the team
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
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Fetch comments
    const comments = await db
      .select({
        id: eventGameComments.id,
        eventGameId: eventGameComments.eventGameId,
        userId: eventGameComments.userId,
        content: eventGameComments.content,
        createdAt: eventGameComments.createdAt,
        updatedAt: eventGameComments.updatedAt,
        userName: users.name,
        userImage: users.image,
      })
      .from(eventGameComments)
      .innerJoin(users, eq(eventGameComments.userId, users.id))
      .where(eq(eventGameComments.eventGameId, eventId))
      .orderBy(desc(eventGameComments.createdAt))

    return NextResponse.json(comments)
  } catch (error) {
    console.error("Failed to fetch comments:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// Create a comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id: teamId, eventId } = await params
    const { content } = await request.json()

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    // Verify user is a member of the team
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
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Verify event game exists and belongs to this team
    const [eventGame] = await db
      .select()
      .from(eventGames)
      .where(and(eq(eventGames.id, eventId), eq(eventGames.teamId, teamId)))
      .limit(1)

    if (!eventGame) {
      return NextResponse.json({ error: "Event game not found" }, { status: 404 })
    }

    // Create comment
    const [comment] = await db
      .insert(eventGameComments)
      .values({
        eventGameId: eventId,
        userId: session.user.id,
        content: content.trim(),
      })
      .returning()

    return NextResponse.json(comment)
  } catch (error) {
    console.error("Failed to create comment:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// Delete a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id: teamId, eventId } = await params
    const { searchParams } = new URL(request.url)
    const commentId = searchParams.get("commentId")

    if (!commentId) {
      return NextResponse.json({ error: "Comment ID is required" }, { status: 400 })
    }

    // Verify user is a member of the team
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
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Check if comment exists and user is the author or manager
    const [comment] = await db
      .select({
        id: eventGameComments.id,
        userId: eventGameComments.userId,
      })
      .from(eventGameComments)
      .where(
        and(
          eq(eventGameComments.id, commentId),
          eq(eventGameComments.eventGameId, eventId)
        )
      )
      .limit(1)

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    // Only allow deletion by comment author or team manager
    const isAuthor = comment.userId === session.user.id
    const isManager = memberCheck[0].role === "MANAGER"

    if (!isAuthor && !isManager) {
      return NextResponse.json(
        { error: "You can only delete your own comments" },
        { status: 403 }
      )
    }

    // Delete comment
    await db.delete(eventGameComments).where(eq(eventGameComments.id, commentId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete comment:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
