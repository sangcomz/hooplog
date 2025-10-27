"use client"

import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 to-blue-100">
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-6xl font-bold text-gray-900 mb-4">
              🏀 HoopLog
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              농구팀을 효율적으로 관리하는 스마트한 솔루션
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="text-3xl mb-4">👥</div>
              <h3 className="text-lg font-semibold mb-2">팀 관리</h3>
              <p className="text-gray-600">여러 팀에 참여하고 멤버들을 체계적으로 관리하세요</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="text-lg font-semibold mb-2">역할 분담</h3>
              <p className="text-gray-600">매니저와 멤버 역할로 효과적인 팀 운영을 지원합니다</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="text-3xl mb-4">🏆</div>
              <h3 className="text-lg font-semibold mb-2">티어 시스템</h3>
              <p className="text-gray-600">A, B, C 티어로 선수들의 실력을 체계적으로 관리하세요</p>
            </div>
          </div>

          <div className="space-y-4">
            <Link
              href="/auth/signin"
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-colors"
            >
              시작하기
            </Link>
            <div className="text-sm text-gray-500">
              Google 계정으로 간편하게 로그인하세요
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
