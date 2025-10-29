"use client"

import { useSession } from "@/lib/auth-client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { getTierColor, getRoleColor } from "@/app/utils/colors"
import { ThemeToggle } from "@/app/components/ThemeToggle"

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
  const [deletingTeam, setDeletingTeam] = useState(false)

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

  const updateMemberRole = async (memberId: string, newRole: string) => {
    if (updating) return

    const confirmMessage = newRole === "MANAGER"
      ? "이 멤버를 매니저로 승격하시겠습니까?"
      : "이 매니저를 일반 멤버로 변경하시겠습니까?"

    if (!confirm(confirmMessage)) return

    setUpdating(memberId)
    try {
      const response = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (response.ok) {
        await fetchTeamDetails()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to update role")
      }
    } catch (error) {
      console.error("Failed to update role:", error)
      alert("Failed to update role")
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

  const deleteTeam = async () => {
    if (deletingTeam) return

    const confirmText = team?.name || ""
    const userInput = prompt(
      `팀을 삭제하면 모든 경기 기록과 데이터가 영구적으로 삭제됩니다.\n\n정말로 삭제하시려면 팀 이름 "${confirmText}"을(를) 입력해주세요.`
    )

    if (userInput !== confirmText) {
      if (userInput !== null) {
        alert("팀 이름이 일치하지 않습니다.")
      }
      return
    }

    setDeletingTeam(true)
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        alert("팀이 삭제되었습니다.")
        router.push("/dashboard")
      } else {
        const error = await response.json()
        alert(error.error || "팀 삭제에 실패했습니다.")
      }
    } catch (error) {
      console.error("Failed to delete team:", error)
      alert("팀 삭제에 실패했습니다.")
    } finally {
      setDeletingTeam(false)
    }
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

  // Count number of managers
  const managerCount = team.members.filter(m => m.role === "MANAGER").length

  return (
    <div className="min-h-screen bg-bg-secondary">
      <div className="bg-bg-primary shadow-sm border-b border-border-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push(`/team/${teamId}`)}
                className="text-text-tertiary hover:text-text-primary transition-colors"
              >
                ← 팀으로 돌아가기
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <span className="text-sm text-text-secondary">{session.user?.name}님</span>
              <button
                onClick={() => {
                  window.location.href =
                    "/api/auth/signout?callbackUrl=" + encodeURIComponent("/")
                }}
                className="bg-error-solid hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">팀 설정</h1>
          <p className="text-text-secondary">{team.name}</p>
        </div>

        <div className="bg-bg-primary rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-border-primary">
            <h2 className="text-xl font-semibold text-text-primary">
              팀원 관리 ({team.members.length}명)
            </h2>
            <p className="text-sm text-text-tertiary mt-1">
              팀원의 티어를 변경할 수 있습니다. 티어는 팀 매칭 시 균등하게 분배됩니다.
            </p>
          </div>

          <div className="divide-y divide-border-primary">
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
                      <div className="h-12 w-12 rounded-full bg-bg-tertiary flex items-center justify-center">
                        <span className="text-lg font-medium text-text-secondary">
                          {member.user.name?.charAt(0).toUpperCase() || "?"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-base font-medium text-text-primary">
                      {member.user.name}
                    </div>
                    <div className="text-sm text-text-tertiary">{member.user.email}</div>
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
                  <span className="text-sm text-text-tertiary mr-2">티어</span>
                  <div className="flex space-x-2">
                    {["A", "B", "C"].map((tier) => (
                      <button
                        key={tier}
                        onClick={() => updateMemberTier(member.id, tier)}
                        disabled={updating === member.id || member.tier === tier || deleting === member.id}
                        className={`px-4 py-2 rounded-md font-medium text-sm border-2 transition-colors ${
                          member.tier === tier
                            ? getTierColor(tier) + " border-current"
                            : "bg-bg-primary text-text-tertiary border-border-primary hover:border-border-secondary"
                        } disabled:opacity-50`}
                      >
                        {tier}
                      </button>
                    ))}
                  </div>
                  {updating === member.id && (
                    <div className="text-sm text-text-tertiary">변경 중...</div>
                  )}
                  <div className="flex items-center space-x-2">
                    {member.role === "MEMBER" ? (
                      <button
                        onClick={() => updateMemberRole(member.id, "MANAGER")}
                        disabled={updating === member.id || deleting === member.id}
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium disabled:opacity-50"
                      >
                        매니저로 승격
                      </button>
                    ) : (
                      <div className="relative group">
                        <button
                          onClick={() => updateMemberRole(member.id, "MEMBER")}
                          disabled={updating === member.id || deleting === member.id || managerCount <= 1}
                          className="text-orange-600 hover:text-orange-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          title={managerCount <= 1 ? "마지막 매니저는 변경할 수 없습니다" : ""}
                        >
                          멤버로 변경
                        </button>
                        {managerCount <= 1 && (
                          <span className="absolute hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded whitespace-nowrap">
                            마지막 매니저는 변경할 수 없습니다
                          </span>
                        )}
                      </div>
                    )}
                    {deleting === member.id ? (
                      <div className="text-sm text-text-tertiary">삭제 중...</div>
                    ) : (
                      <button
                        onClick={() => deleteMember(member.id, member.user.name)}
                        disabled={updating === member.id}
                        className="text-error-solid hover:text-red-800 text-sm font-medium disabled:opacity-50"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 bg-primary-bg border border-border-primary rounded-lg p-6">
          <h3 className="text-lg font-semibold text-primary-text mb-2">
            티어 시스템 안내
          </h3>
          <ul className="space-y-2 text-sm text-primary-text">
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

        {/* Danger Zone */}
        <div className="mt-8 bg-red-50 dark:bg-red-900/10 border-2 border-red-200 dark:border-red-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-400 mb-2">
            위험 구역
          </h3>
          <p className="text-sm text-red-700 dark:text-red-300 mb-4">
            아래 작업은 되돌릴 수 없습니다. 신중하게 진행해주세요.
          </p>
          <div className="flex items-center justify-between bg-white dark:bg-gray-800 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">팀 삭제</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                팀을 삭제하면 모든 경기 기록, 멤버 정보, 출석 데이터가 영구적으로 삭제됩니다.
              </p>
            </div>
            <button
              onClick={deleteTeam}
              disabled={deletingTeam}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-6 py-2 rounded-md font-medium whitespace-nowrap ml-4"
            >
              {deletingTeam ? "삭제 중..." : "팀 삭제"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
