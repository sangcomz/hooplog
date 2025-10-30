"use client"

import { useSession } from "@/lib/auth-client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { ThemeToggle } from "@/app/components/ThemeToggle"

interface User {
  id: string
  name: string
  email: string
  image?: string
}

interface Member {
  id: string
  userId: string
  teamId: string
  role: "MANAGER" | "MEMBER"
  tier: "A" | "B" | "C"
  user: User
}

interface Team {
  id: string
  name: string
  code: string
  description?: string
  members: Member[]
}

export default function TeamSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const teamId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [team, setTeam] = useState<Team | null>(null)
  const [teamName, setTeamName] = useState("")
  const [teamDescription, setTeamDescription] = useState("")
  const [updatingMember, setUpdatingMember] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated") {
      fetchTeam()
    }
  }, [status, router, teamId])

  const fetchTeam = async () => {
    try {
      const response = await fetch(`/api/teams/${teamId}`)
      if (response.ok) {
        const teamData = await response.json()
        setTeam(teamData)
        setTeamName(teamData.name)
        setTeamDescription(teamData.description || "")

        // Check if user is a manager
        const member = teamData.members.find(
          (m: any) => m.user.id === session?.user?.id
        )
        if (member?.role !== "MANAGER") {
          // Redirect if not a manager
          router.push(`/team/${teamId}`)
        }
      } else if (response.status === 404) {
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Failed to fetch team:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveTeamSettings = async () => {
    if (!teamName.trim()) {
      alert("팀 이름을 입력해주세요")
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: teamName.trim(),
          description: teamDescription.trim() || null,
        }),
      })

      if (response.ok) {
        alert("팀 정보가 수정되었습니다")
        await fetchTeam()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to update team")
      }
    } catch (error) {
      console.error("Failed to update team:", error)
      alert("Failed to update team")
    } finally {
      setSaving(false)
    }
  }

  const updateMemberTier = async (memberId: string, newTier: "A" | "B" | "C") => {
    setUpdatingMember(memberId)
    try {
      const response = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tier: newTier }),
      })

      if (response.ok) {
        await fetchTeam()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to update member tier")
      }
    } catch (error) {
      console.error("Failed to update member tier:", error)
      alert("Failed to update member tier")
    } finally {
      setUpdatingMember(null)
    }
  }

  const updateMemberRole = async (memberId: string, newRole: "MANAGER" | "MEMBER") => {
    setUpdatingMember(memberId)
    try {
      const response = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (response.ok) {
        await fetchTeam()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to update member role")
      }
    } catch (error) {
      console.error("Failed to update member role:", error)
      alert("Failed to update member role")
    } finally {
      setUpdatingMember(null)
    }
  }

  const deleteMember = async (memberId: string, memberName: string) => {
    if (!confirm(`${memberName}님을 팀에서 제외하시겠습니까?`)) return

    setUpdatingMember(memberId)
    try {
      const response = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchTeam()
        alert("멤버가 제외되었습니다")
      } else {
        const error = await response.json()
        alert(error.error || "Failed to delete member")
      }
    } catch (error) {
      console.error("Failed to delete member:", error)
      alert("Failed to delete member")
    } finally {
      setUpdatingMember(null)
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "A":
        return "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
      case "B":
        return "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200"
      case "C":
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
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
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-text-primary mb-8">팀 설정</h1>

        <div className="bg-bg-primary rounded-lg shadow-md p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              팀 코드
            </label>
            <div className="px-3 py-2 bg-bg-secondary rounded-md text-text-tertiary font-mono">
              {team.code}
            </div>
            <p className="text-xs text-text-tertiary mt-1">
              팀 코드는 변경할 수 없습니다
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              팀 이름 *
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full px-3 py-2 border border-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary-solid bg-bg-primary text-text-primary"
              placeholder="팀 이름을 입력하세요"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              팀 소개
            </label>
            <textarea
              value={teamDescription}
              onChange={(e) => setTeamDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary-solid bg-bg-primary text-text-primary"
              placeholder="팀에 대한 설명을 입력하세요"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              onClick={() => router.push(`/team/${teamId}`)}
              className="px-6 py-2 text-text-secondary hover:text-text-primary font-medium"
              disabled={saving}
            >
              취소
            </button>
            <button
              onClick={saveTeamSettings}
              disabled={saving || !teamName.trim()}
              className="bg-primary-solid hover:bg-primary-solid-hover text-white px-6 py-2 rounded-md font-medium disabled:opacity-50"
            >
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>

        {/* Members Management Section */}
        <div className="bg-bg-primary rounded-lg shadow-md mt-8">
          <div className="px-6 py-4 border-b border-border-primary">
            <h2 className="text-xl font-semibold text-text-primary">
              팀 멤버 관리 ({team.members.length}명)
            </h2>
          </div>
          <div className="divide-y divide-border-primary">
            {team.members.map((member) => (
              <div key={member.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
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
                          <span className="text-sm font-medium text-text-secondary">
                            {member.user.name?.charAt(0).toUpperCase() || "?"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-text-primary">
                        {member.user.name}
                        {member.userId === session?.user?.id && (
                          <span className="ml-2 text-xs text-text-tertiary">(나)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {/* Tier Selector */}
                    <div>
                      <label className="block text-xs text-text-tertiary mb-1">티어</label>
                      <select
                        value={member.tier}
                        onChange={(e) => updateMemberTier(member.id, e.target.value as "A" | "B" | "C")}
                        disabled={updatingMember === member.id}
                        className="px-3 py-1.5 border border-border-primary rounded-md text-sm bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-solid disabled:opacity-50"
                      >
                        <option value="A">티어 A</option>
                        <option value="B">티어 B</option>
                        <option value="C">티어 C</option>
                      </select>
                    </div>

                    {/* Role Selector */}
                    <div>
                      <label className="block text-xs text-text-tertiary mb-1">권한</label>
                      <select
                        value={member.role}
                        onChange={(e) => updateMemberRole(member.id, e.target.value as "MANAGER" | "MEMBER")}
                        disabled={updatingMember === member.id}
                        className="px-3 py-1.5 border border-border-primary rounded-md text-sm bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-solid disabled:opacity-50"
                      >
                        <option value="MANAGER">매니저</option>
                        <option value="MEMBER">멤버</option>
                      </select>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => deleteMember(member.id, member.user.name || "멤버")}
                      disabled={updatingMember === member.id}
                      className="mt-5 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium disabled:opacity-50"
                    >
                      제외
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
