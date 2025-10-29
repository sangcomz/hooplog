import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증되지 않은 사용자입니다." }, { status: 401 })
    }

    const body = await request.json()
    const { name } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "닉네임을 입력해주세요." }, { status: 400 })
    }

    if (name.trim().length > 50) {
      return NextResponse.json({ error: "닉네임은 50자 이하로 입력해주세요." }, { status: 400 })
    }

    // Update user name
    await db
      .update(users)
      .set({
        name: name.trim(),
        updatedAt: new Date()
      })
      .where(eq(users.id, session.user.id))

    return NextResponse.json({
      success: true,
      name: name.trim()
    })
  } catch (error) {
    console.error("Failed to update profile:", error)
    return NextResponse.json({ error: "프로필 업데이트에 실패했습니다." }, { status: 500 })
  }
}
