"use client"

import { useSession } from "@/lib/auth-client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { ThemeToggle } from "@/app/components/ThemeToggle"

interface Team {
  id: string
  name: string
  code: string
  description?: string
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
        router.push(`/team/${teamId}`)
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
      </div>
    </div>
  )
}
