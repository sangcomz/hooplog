"use client"

import { useSession } from "@/lib/auth-client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { getTierColor, getRoleColor } from "@/app/utils/colors"
import { ThemeToggle } from "@/app/components/ThemeToggle"
import TeamStatistics from "@/app/components/TeamStatistics"

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

interface Game {
  id: string
  teamId: string
  creatorId: string
  date: number
  location?: string
  description?: string
  creator: {
    id: string
    name: string
    email: string
    image?: string
  }
}

export default function TeamPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const teamId = params.id as string
  const [team, setTeam] = useState<Team | null>(null)
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [showGameModal, setShowGameModal] = useState(false)
  const [creatingGame, setCreatingGame] = useState(false)
  const [activeTab, setActiveTab] = useState<"games" | "stats">("games")
  const [gameForm, setGameForm] = useState({
    date: "",
    location: "",
    description: "",
    teamCount: 2,
    playersPerTeam: 5,
  })

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
      const [teamResponse, gamesResponse] = await Promise.all([
        fetch(`/api/teams/${teamId}`),
        fetch(`/api/teams/${teamId}/games`),
      ])

      if (teamResponse.ok) {
        const teamData = await teamResponse.json()
        setTeam(teamData)
      } else if (teamResponse.status === 404) {
        router.push("/dashboard")
      }

      if (gamesResponse.ok) {
        const gamesData = await gamesResponse.json()
        setGames(gamesData)
      }
    } catch (error) {
      console.error("Failed to fetch team details:", error)
    } finally {
      setLoading(false)
    }
  }

  const createGame = async () => {
    if (!gameForm.date || creatingGame) return

    setCreatingGame(true)
    try {
      // Convert local datetime to timestamp
      const localDate = new Date(gameForm.date)
      const timestamp = localDate.getTime()

      const response = await fetch(`/api/teams/${teamId}/games`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...gameForm,
          date: timestamp,
        }),
      })

      if (response.ok) {
        await fetchTeamDetails()
        setShowGameModal(false)
        setGameForm({ date: "", location: "", description: "", teamCount: 2, playersPerTeam: 5 })
      } else {
        const error = await response.json()
        alert(error.error || "Failed to create game")
      }
    } catch (error) {
      console.error("Failed to create game:", error)
      alert("Failed to create game")
    } finally {
      setCreatingGame(false)
    }
  }

  const isManager = team?.members.find(
    (m) => m.user.id === session?.user?.id
  )?.role === "MANAGER"

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
                onClick={() => router.push("/dashboard")}
                className="text-text-tertiary hover:text-text-primary transition-colors"
              >
                ← 대시보드로 돌아가기
              </button>
            </div>
            <div className="flex items-center space-x-4">
              {isManager && (
                <button
                  onClick={() => router.push(`/team/${teamId}/settings`)}
                  className="text-text-tertiary hover:text-text-primary transition-colors text-sm font-medium"
                >
                  ⚙️ 팀 설정
                </button>
              )}
              <ThemeToggle />
              <span className="text-sm text-text-secondary">
                {session.user?.name}님
              </span>
              <button
                onClick={() => {
                  window.location.href = "/api/auth/signout?callbackUrl=" + encodeURIComponent("/")
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
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-text-primary">{team.name}</h1>
            <div className="text-sm text-text-tertiary">
              팀 코드: <span className="font-mono font-medium">{team.code}</span>
            </div>
          </div>
          {team.description && (
            <p className="text-text-secondary">{team.description}</p>
          )}
        </div>

        <div className="bg-bg-primary rounded-lg shadow-md">
          <div className="border-b border-border-primary">
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex space-x-4">
                <button
                  onClick={() => setActiveTab("games")}
                  className={`px-4 py-2 font-medium text-sm transition-colors ${
                    activeTab === "games"
                      ? "text-primary-solid border-b-2 border-primary-solid"
                      : "text-text-tertiary hover:text-text-primary"
                  }`}
                >
                  경기 일정
                </button>
                <button
                  onClick={() => setActiveTab("stats")}
                  className={`px-4 py-2 font-medium text-sm transition-colors ${
                    activeTab === "stats"
                      ? "text-primary-solid border-b-2 border-primary-solid"
                      : "text-text-tertiary hover:text-text-primary"
                  }`}
                >
                  통계
                </button>
              </div>
              {isManager && activeTab === "games" && (
                <button
                  onClick={() => setShowGameModal(true)}
                  className="bg-primary-solid hover:bg-primary-solid-hover text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  경기 생성
                </button>
              )}
            </div>
          </div>

          {activeTab === "games" && (
            <>
              {games.length === 0 ? (
                <div className="px-6 py-12 text-center text-text-muted">
                  아직 생성된 경기가 없습니다.
                </div>
              ) : (
                <div className="divide-y divide-border-primary">
                  {games.map((game) => (
                    <div
                      key={game.id}
                      onClick={() => router.push(`/team/${teamId}/game/${game.id}`)}
                      className="px-6 py-4 hover:bg-bg-secondary cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-text-primary">
                            {new Date(game.date).toLocaleString("ko-KR", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                          {game.location && (
                            <div className="text-sm text-text-tertiary mt-1">
                              장소: {game.location}
                            </div>
                          )}
                          {game.description && (
                            <div className="text-sm text-text-tertiary mt-1">
                              {game.description}
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-text-muted">
                          생성자: {game.creator.name}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === "stats" && (
            <div className="p-6">
              <TeamStatistics teamId={teamId} />
            </div>
          )}
        </div>

        <div className="mt-8 bg-bg-primary rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-border-primary">
            <h2 className="text-xl font-semibold text-text-primary">
              팀 멤버 ({team.members.length}명)
            </h2>
          </div>
          <div className="divide-y divide-border-primary">
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
                      <div className="h-10 w-10 rounded-full bg-bg-tertiary flex items-center justify-center">
                        <span className="text-sm font-medium text-text-secondary">
                          {member.user.name?.charAt(0).toUpperCase() || "?"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text-primary">
                      {member.user.name}
                    </div>
                    <div className="text-sm text-text-tertiary">
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

        <div className="mt-8 bg-bg-primary rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">팀 정보</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-bg-secondary rounded-lg">
              <div className="text-2xl font-bold text-primary-solid">
                {team.members.filter(m => m.role === "MANAGER").length}
              </div>
              <div className="text-sm text-text-secondary">매니저</div>
            </div>
            <div className="text-center p-4 bg-bg-secondary rounded-lg">
              <div className="text-2xl font-bold text-success-solid">
                {team.members.filter(m => m.role === "MEMBER").length}
              </div>
              <div className="text-sm text-text-secondary">멤버</div>
            </div>
            <div className="text-center p-4 bg-bg-secondary rounded-lg">
              <div className="text-2xl font-bold text-warning-solid">
                {team.members.length}
              </div>
              <div className="text-sm text-text-secondary">전체 인원</div>
            </div>
          </div>
        </div>
      </div>

      {showGameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-bg-primary rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-text-primary mb-4">경기 생성</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  날짜 및 시간 *
                </label>
                <input
                  type="datetime-local"
                  value={gameForm.date}
                  onChange={(e) =>
                    setGameForm({ ...gameForm, date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary-solid bg-bg-primary text-text-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  장소
                </label>
                <input
                  type="text"
                  value={gameForm.location}
                  onChange={(e) =>
                    setGameForm({ ...gameForm, location: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary-solid bg-bg-primary text-text-primary"
                  placeholder="경기 장소 입력"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  설명
                </label>
                <textarea
                  value={gameForm.description}
                  onChange={(e) =>
                    setGameForm({ ...gameForm, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary-solid bg-bg-primary text-text-primary"
                  placeholder="경기에 대한 설명 입력"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  팀 수 *
                </label>
                <select
                  value={gameForm.teamCount}
                  onChange={(e) =>
                    setGameForm({ ...gameForm, teamCount: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary-solid bg-bg-primary text-text-primary"
                >
                  <option value={2}>2팀</option>
                  <option value={3}>3팀</option>
                  <option value={4}>4팀</option>
                  <option value={5}>5팀</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  팀당 인원 *
                </label>
                <select
                  value={gameForm.playersPerTeam}
                  onChange={(e) =>
                    setGameForm({ ...gameForm, playersPerTeam: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary-solid bg-bg-primary text-text-primary"
                >
                  <option value={3}>3대3</option>
                  <option value={4}>4대4</option>
                  <option value={5}>5대5</option>
                  <option value={6}>6대6</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowGameModal(false)
                  setGameForm({ date: "", location: "", description: "", teamCount: 2, playersPerTeam: 5 })
                }}
                className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary"
                disabled={creatingGame}
              >
                취소
              </button>
              <button
                onClick={createGame}
                disabled={!gameForm.date || creatingGame}
                className="bg-primary-solid hover:bg-primary-solid-hover text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
              >
                {creatingGame ? "생성 중..." : "생성"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
