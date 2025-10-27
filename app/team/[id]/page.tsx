"use client"

import { useSession } from "@/lib/auth-client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"

interface TeamMember {
  id: string
  role: string
  tier: string
  user: {
    id: string
    name: string
    email: string
    image?: string
  }
}

interface Team {
  id: string
  name: string
  code: string
  description?: string
  members: TeamMember[]
}

export default function TeamPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const teamId = params.id as string
  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated") {
      fetchTeamDetails()
    }
  }, [status, router, teamId])

  const fetchTeamDetails = async () => {
    try {
      const response = await fetch(`/api/teams/${teamId}`)
      if (response.ok) {
        const teamData = await response.json()
        setTeam(teamData)
      } else if (response.status === 404) {
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Failed to fetch team details:", error)
    } finally {
      setLoading(false)
    }
  }

  const getRoleColor = (role: string) => {
    return role === "MANAGER" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "A": return "bg-yellow-100 text-yellow-800"
      case "B": return "bg-orange-100 text-orange-800"
      case "C": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    )
  }

  if (!session || !team) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← 대시보드로 돌아가기
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {session.user?.name}님
              </span>
              <button
                onClick={() => {
                  window.location.href = "/api/auth/signout?callbackUrl=" + encodeURIComponent("/")
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">{team.name}</h1>
            <div className="text-sm text-gray-500">
              팀 코드: <span className="font-mono font-medium">{team.code}</span>
            </div>
          </div>
          {team.description && (
            <p className="text-gray-600">{team.description}</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              팀 멤버 ({team.members.length}명)
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {team.members.map((member) => (
              <div key={member.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {member.user.image ? (
                      <img
                        className="h-10 w-10 rounded-full"
                        src={member.user.image}
                        alt={member.user.name || ""}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {member.user.name?.charAt(0).toUpperCase() || "?"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {member.user.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {member.user.email}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                    {member.role === "MANAGER" ? "매니저" : "멤버"}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTierColor(member.tier)}`}>
                    티어 {member.tier}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">팀 정보</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-indigo-600">
                {team.members.filter(m => m.role === "MANAGER").length}
              </div>
              <div className="text-sm text-gray-600">매니저</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {team.members.filter(m => m.role === "MEMBER").length}
              </div>
              <div className="text-sm text-gray-600">멤버</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {team.members.length}
              </div>
              <div className="text-sm text-gray-600">전체 인원</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}