"use client"

import { useSession } from "@/lib/auth-client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface Team {
  id: string
  name: string
  code: string
  description?: string
  role: string
  tier: string
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showJoinForm, setShowJoinForm] = useState(false)
  const [createTeamData, setCreateTeamData] = useState({ name: "", description: "" })
  const [joinCode, setJoinCode] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated") {
      fetchTeams()
    }
  }, [status, router])

  const fetchTeams = async () => {
    try {
      const response = await fetch("/api/teams")
      if (response.ok) {
        const teamsData = await response.json()
        setTeams(teamsData)
      }
    } catch (error) {
      console.error("Failed to fetch teams:", error)
    } finally {
      setLoading(false)
    }
  }

  const createTeam = async () => {
    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createTeamData),
      })

      if (response.ok) {
        setShowCreateForm(false)
        setCreateTeamData({ name: "", description: "" })
        fetchTeams()
      }
    } catch (error) {
      console.error("Failed to create team:", error)
    }
  }

  const joinTeam = async () => {
    try {
      const response = await fetch("/api/teams/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: joinCode }),
      })

      if (response.ok) {
        setShowJoinForm(false)
        setJoinCode("")
        fetchTeams()
      } else {
        const error = await response.json()
        alert(error.error || "팀 참여에 실패했습니다.")
      }
    } catch (error) {
      console.error("Failed to join team:", error)
      alert("팀 참여에 실패했습니다.")
    }
  }

  const selectTeam = (teamId: string) => {
    router.push(`/team/${teamId}`)
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">안녕하세요, {session.user?.name}님!</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">참여할 팀을 선택하거나 새로운 팀을 만들어보세요.</p>
          </div>
          <button
            onClick={() => {
              window.location.href = "/api/auth/signout?callbackUrl=" + encodeURIComponent("/")
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            로그아웃
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {teams.map((team) => (
            <div
              key={team.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => selectTeam(team.id)}
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{team.name}</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">{team.description || "설명이 없습니다."}</p>
              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    team.role === "MANAGER" ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200" : "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                  }`}>
                    {team.role === "MANAGER" ? "매니저" : "멤버"}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    team.tier === "A" ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200" :
                    team.tier === "B" ? "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200" :
                    "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  }`}>
                    티어 {team.tier}
                  </span>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">코드: {team.code}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex space-x-4">
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md font-medium"
          >
            새 팀 만들기
          </button>
          <button
            onClick={() => setShowJoinForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md font-medium"
          >
            팀 참여하기
          </button>
        </div>

        {/* 팀 생성 모달 */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">새 팀 만들기</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">팀 이름</label>
                  <input
                    type="text"
                    value={createTeamData.name}
                    onChange={(e) => setCreateTeamData({ ...createTeamData, name: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="팀 이름을 입력하세요"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">설명 (선택사항)</label>
                  <textarea
                    value={createTeamData.description}
                    onChange={(e) => setCreateTeamData({ ...createTeamData, description: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={3}
                    placeholder="팀 설명을 입력하세요"
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={createTeam}
                  disabled={!createTeamData.name.trim()}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white py-2 rounded-md font-medium"
                >
                  팀 만들기
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 py-2 rounded-md font-medium"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 팀 참여 모달 */}
        {showJoinForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">팀 참여하기</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">팀 코드</label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="팀 코드를 입력하세요"
                  maxLength={6}
                />
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={joinTeam}
                  disabled={!joinCode.trim()}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-2 rounded-md font-medium"
                >
                  참여하기
                </button>
                <button
                  onClick={() => setShowJoinForm(false)}
                  className="flex-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 py-2 rounded-md font-medium"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}