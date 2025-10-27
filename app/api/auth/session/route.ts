import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (session?.user) {
      return NextResponse.json({
        user: session.user,
        expires: session.expires
      })
    }

    return NextResponse.json({})
  } catch (error) {
    console.error("Session error:", error)
    return NextResponse.json({})
  }
}