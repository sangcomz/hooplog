"use client"

import { useSession } from "@/lib/auth-client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"

interface User {
  id: string
  name: string
  email: string
  image?: string
}

interface TeamMember {
  id: string
  userId: string
  teamId: string
  role: string
  tier: string
  user: User
}

interface Team {
  id: string
  name: string
  code: string
  description?: string
  members: TeamMember[]
}

export default function TeamSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const teamId = params.id as string
  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [isManager, setIsManager] = useState(false)

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

        // Check if current user is a manager
        const currentMember = teamData.members.find(
          (m: TeamMember) => m.user.id === session?.user?.id
        )
        if (currentMember?.role === "MANAGER") {
          setIsManager(true)
        } else {
          // Redirect non-managers to team page
          router.push(`/team/${teamId}`)
        }
      } else if (response.status === 404) {
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Failed to fetch team details:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateMemberTier = async (memberId: string, newTier: string) => {
    if (updating) return

    setUpdating(memberId)
    try {
      const response = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tier: newTier }),
      })

      if (response.ok) {
        await fetchTeamDetails()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to update tier")
      }
    } catch (error) {
      console.error("Failed to update tier:", error)
      alert("Failed to update tier")
    } finally {
      setUpdating(null)
    }
  }

  const deleteMember = async (memberId: string, memberName: string) => {
    if (deleting) return

    if (!confirm(`정말 ${memberName}님을 팀에서 삭제하시겠습니까?`)) return

    setDeleting(memberId)
    try {
      const response = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchTeamDetails()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to delete member")
      }
    } catch (error) {
      console.error("Failed to delete member:", error)
      alert("Failed to delete member")
    } finally {
      setDeleting(null)
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "A":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "B":
        return "bg-orange-100 text-orange-800 border-orange-300"
      case "C":
        return "bg-gray-100 text-gray-800 border-gray-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getRoleColor = (role: string) => {
    return role === "MANAGER"
      ? "bg-blue-100 text-blue-800"
      : "bg-green-100 text-green-800"
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    )
  }

  if (!session || !team || !isManager) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push(`/team/${teamId}`)}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← 팀으로 돌아가기
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-800">{session.user?.name}님</span>
              <button
                onClick={() => {
                  window.location.href =
                    "/api/auth/signout?callbackUrl=" + encodeURIComponent("/")
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">팀 설정</h1>
          <p className="text-gray-800">{team.name}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              팀원 관리 ({team.members.length}명)
            </h2>
            <p className="text-sm text-gray-700 mt-1">
              팀원의 티어를 변경할 수 있습니다. 티어는 팀 매칭 시 균등하게 분배됩니다.
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {team.members.map((member) => (
              <div
                key={member.id}
                className="px-6 py-4 flex items-center justify-between"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {member.user.image ? (
                      <img
                        className="h-12 w-12 rounded-full"
                        src={member.user.image}
                        alt={member.user.name || ""}
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-lg font-medium text-gray-700">
                          {member.user.name?.charAt(0).toUpperCase() || "?"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-base font-medium text-gray-900">
                      {member.user.name}
                    </div>
                    <div className="text-sm text-gray-700">{member.user.email}</div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(
                      member.role
                    )}`}
                  >
                    {member.role === "MANAGER" ? "매니저" : "멤버"}
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-700 mr-2">티어</span>
                  <div className="flex space-x-2">
                    {["A", "B", "C"].map((tier) => (
                      <button
                        key={tier}
                        onClick={() => updateMemberTier(member.id, tier)}
                        disabled={updating === member.id || member.tier === tier || deleting === member.id}
                        className={`px-4 py-2 rounded-md font-medium text-sm border-2 transition-colors ${
                          member.tier === tier
                            ? getTierColor(tier) + " border-current"
                            : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                        } disabled:opacity-50`}
                      >
                        {tier}
                      </button>
                    ))}
                  </div>
                  {updating === member.id && (
                    <div className="text-sm text-gray-700">변경 중...</div>
                  )}
                  {deleting === member.id ? (
                    <div className="text-sm text-gray-700">삭제 중...</div>
                  ) : (
                    <button
                      onClick={() => deleteMember(member.id, member.user.name)}
                      disabled={updating === member.id}
                      className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            티어 시스템 안내
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <span className="font-bold mr-2">•</span>
              <span>
                <strong>티어 A:</strong> 최상위 실력자. 팀 매칭 시 각 팀에 고르게 분배됩니다.
              </span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">•</span>
              <span>
                <strong>티어 B:</strong> 중급 실력자. A티어 배치 후 균등하게 분배됩니다.
              </span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">•</span>
              <span>
                <strong>티어 C:</strong> 초급 또는 일반 실력자. 마지막으로 균등하게 분배됩니다.
              </span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">•</span>
              <span>
                매니저만 티어를 변경할 수 있으며, 변경 사항은 즉시 다음 경기 매칭에 반영됩니다.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
