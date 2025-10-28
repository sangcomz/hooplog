"use client"

import { useSession } from "@/lib/auth-client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"

interface Player {
  id: string
  name: string
  tier: string
  isGuest: boolean
}

interface TeamResult {
  teamNumber: number
  players: Player[]
}

interface MatchData {
  teamCount: number
  playersPerTeam: number
  teams: TeamResult[] | null
}

export default function MatchPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const teamId = params.id as string
  const gameId = params.gameId as string
  const [matchData, setMatchData] = useState<MatchData | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [newTeamCount, setNewTeamCount] = useState<number>(2)
  const [isManager, setIsManager] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated") {
      fetchMatchData()
      checkIfManager()
    }
  }, [status, router, teamId, gameId])

  const checkIfManager = async () => {
    try {
      const response = await fetch(`/api/teams/${teamId}`)
      if (response.ok) {
        const teamData = await response.json()
        const member = teamData.members.find(
          (m: any) => m.user.id === session?.user?.id
        )
        setIsManager(member?.role === "MANAGER")
      }
    } catch (error) {
      console.error("Failed to check manager status:", error)
    }
  }

  const fetchMatchData = async () => {
    try {
      const response = await fetch(`/api/teams/${teamId}/games/${gameId}/match`)
      if (response.ok) {
        const data = await response.json()
        setMatchData(data)
        setNewTeamCount(data.teamCount)
      } else if (response.status === 404) {
        router.push(`/team/${teamId}/game/${gameId}`)
      }
    } catch (error) {
      console.error("Failed to fetch match data:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateMatch = async () => {
    if (generating) return

    setGenerating(true)
    try {
      const response = await fetch(`/api/teams/${teamId}/games/${gameId}/match`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ teamCount: newTeamCount }),
      })

      if (response.ok) {
        await fetchMatchData()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to generate match")
      }
    } catch (error) {
      console.error("Failed to generate match:", error)
      alert("Failed to generate match")
    } finally {
      setGenerating(false)
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

  const getTeamColor = (teamNumber: number) => {
    const colors = [
      "border-blue-500 bg-blue-50",
      "border-red-500 bg-red-50",
      "border-green-500 bg-green-50",
      "border-yellow-500 bg-yellow-50",
      "border-purple-500 bg-purple-50",
    ]
    return colors[(teamNumber - 1) % colors.length]
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    )
  }

  if (!session || !matchData) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push(`/team/${teamId}/game/${gameId}`)}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                ← 경기로 돌아가기
              </button>
            </div>
            <div className="flex items-center space-x-4">
              {isManager && (
                <button
                  onClick={() => router.push(`/team/${teamId}/settings`)}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors text-sm font-medium"
                >
                  ⚙️ 팀 설정
                </button>
              )}
              <span className="text-sm text-gray-600 dark:text-gray-300">{session.user?.name}님</span>
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">팀 매칭</h1>
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium">
              {matchData.playersPerTeam}대{matchData.playersPerTeam}
            </span>
            <span>•</span>
            <span>
              최소 {matchData.teamCount * matchData.playersPerTeam}명 필요
            </span>
          </div>
        </div>

        {isManager && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">매칭 설정</h2>
            <div className="flex items-end space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  팀 수
                </label>
                <select
                  value={newTeamCount}
                  onChange={(e) => setNewTeamCount(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={2}>2팀</option>
                  <option value={3}>3팀</option>
                  <option value={4}>4팀</option>
                  <option value={5}>5팀</option>
                </select>
              </div>
              <button
                onClick={generateMatch}
                disabled={generating}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md font-medium disabled:opacity-50"
              >
                {generating ? "생성 중..." : matchData.teams ? "재조합" : "팀 조합"}
              </button>
            </div>
          </div>
        )}

        {!matchData.teams ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <div className="text-gray-500 dark:text-gray-400 mb-4">
              아직 팀 매칭이 생성되지 않았습니다.
            </div>
            {isManager && (
              <p className="text-sm text-gray-400 dark:text-gray-500">
                위의 설정에서 팀 수를 선택하고 팀 조합 버튼을 눌러주세요.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matchData.teams.map((team) => (
              <div
                key={team.teamNumber}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-md border-l-4 ${getTeamColor(
                  team.teamNumber
                )} overflow-hidden`}
              >
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    팀 {team.teamNumber}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{team.players.length}명</p>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {team.players.map((player) => (
                    <div key={player.id} className="px-6 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {player.name}
                          </span>
                          {player.isGuest && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded">
                              게스트
                            </span>
                          )}
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${getTierColor(
                            player.tier
                          )}`}
                        >
                          티어 {player.tier}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
