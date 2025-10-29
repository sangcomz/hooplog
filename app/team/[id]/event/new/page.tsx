"use client"

import { useSession } from "@/lib/auth-client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useTheme } from "@/app/components/ThemeProvider"
import { ThemeToggle } from "@/app/components/ThemeToggle"

interface TeamMember {
  id: string
  user: {
    id: string
    name: string
    image?: string
  }
  tier: string
}

interface Player {
  type: "member" | "guest"
  userId?: string
  name: string
  tier: string
  id: string // unique identifier
}

export default function NewEventGamePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const { actualTheme } = useTheme()
  const teamId = params.id as string

  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [gameId, setGameId] = useState<string | null>(null)

  const [title, setTitle] = useState("")
  const [type, setType] = useState<"single" | "quarter">("single")
  const [playerA, setPlayerA] = useState<Player[]>([])
  const [playerB, setPlayerB] = useState<Player[]>([])
  const [comment, setComment] = useState("")

  // Guest input states
  const [showGuestModalA, setShowGuestModalA] = useState(false)
  const [showGuestModalB, setShowGuestModalB] = useState(false)
  const [guestName, setGuestName] = useState("")
  const [guestTier, setGuestTier] = useState<"A" | "B" | "C">("C")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated") {
      // Get gameId from query params if present
      const urlParams = new URLSearchParams(window.location.search)
      const gId = urlParams.get("gameId")
      if (gId) {
        setGameId(gId)
      }
      fetchTeamMembers()
    }
  }, [status, router, teamId])

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch(`/api/teams/${teamId}`)
      if (response.ok) {
        const teamData = await response.json()
        setTeamMembers(teamData.members || [])
      }
    } catch (error) {
      console.error("Failed to fetch team members:", error)
    } finally {
      setLoading(false)
    }
  }

  const togglePlayer = (member: TeamMember, team: "A" | "B") => {
    const player: Player = {
      type: "member",
      userId: member.user.id,
      name: member.user.name,
      tier: member.tier,
      id: member.user.id,
    }

    if (team === "A") {
      const existingIndex = playerA.findIndex(p => p.id === player.id)
      if (existingIndex >= 0) {
        setPlayerA(playerA.filter(p => p.id !== player.id))
      } else {
        setPlayerA([...playerA, player])
        // Remove from team B if present
        setPlayerB(playerB.filter(p => p.id !== player.id))
      }
    } else {
      const existingIndex = playerB.findIndex(p => p.id === player.id)
      if (existingIndex >= 0) {
        setPlayerB(playerB.filter(p => p.id !== player.id))
      } else {
        setPlayerB([...playerB, player])
        // Remove from team A if present
        setPlayerA(playerA.filter(p => p.id !== player.id))
      }
    }
  }

  const addGuest = (team: "A" | "B") => {
    if (!guestName.trim()) {
      alert("게스트 이름을 입력해주세요")
      return
    }

    const guest: Player = {
      type: "guest",
      name: guestName.trim(),
      tier: guestTier,
      id: `guest-${Date.now()}-${Math.random()}`,
    }

    if (team === "A") {
      setPlayerA([...playerA, guest])
      setShowGuestModalA(false)
    } else {
      setPlayerB([...playerB, guest])
      setShowGuestModalB(false)
    }

    setGuestName("")
    setGuestTier("C")
  }

  const removePlayer = (playerId: string, team: "A" | "B") => {
    if (team === "A") {
      setPlayerA(playerA.filter(p => p.id !== playerId))
    } else {
      setPlayerB(playerB.filter(p => p.id !== playerId))
    }
  }

  const createEventGame = async () => {
    if (!title.trim() || playerA.length === 0 || playerB.length === 0) {
      alert("제목과 참가자를 입력해주세요")
      return
    }

    setCreating(true)
    try {
      const response = await fetch(`/api/teams/${teamId}/event-games`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          scoreA: 0,
          scoreB: 0,
          playerA: playerA,
          playerB: playerB,
          type,
          quarters: null,
          comment: comment.trim() || null,
          gameId: gameId || null,
        }),
      })

      if (response.ok) {
        const eventGame = await response.json()
        // If linked to a game, return to game page, otherwise go to event detail
        if (gameId) {
          router.push(`/team/${teamId}/game/${gameId}`)
        } else {
          router.push(`/team/${teamId}/event/${eventGame.id}`)
        }
      } else {
        const error = await response.json()
        alert(error.error || "Failed to create event game")
      }
    } catch (error) {
      console.error("Failed to create event game:", error)
      alert("Failed to create event game")
    } finally {
      setCreating(false)
    }
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
    <div className="min-h-screen bg-bg-secondary">
      <div className="bg-bg-primary shadow-sm border-b border-border-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  if (gameId) {
                    router.push(`/team/${teamId}/game/${gameId}`)
                  } else {
                    router.push(`/team/${teamId}`)
                  }
                }}
                className="text-text-tertiary hover:text-text-primary transition-colors"
              >
                ← {gameId ? "경기로 돌아가기" : "팀으로 돌아가기"}
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <span className="text-sm text-text-secondary">{session.user?.name}님</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-text-primary mb-8">
          {gameId ? "경기 연결 번외 경기 생성" : "번외 경기 생성"}
        </h1>
        {gameId && (
          <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg">
            <p className="text-sm text-purple-800 dark:text-purple-200">
              이 번외 경기는 현재 경기와 연결되어 해당 경기 페이지에 표시됩니다.
            </p>
          </div>
        )}

        <div className="bg-bg-primary rounded-lg shadow-md p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              경기 제목 *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 1:1 번외전, 프리스로 대결 등"
              className="w-full px-3 py-2 border border-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary-solid bg-bg-primary text-text-primary"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              경기 형태 *
            </label>
            <div className="flex space-x-4">
              <button
                onClick={() => setType("single")}
                className={`px-4 py-2 rounded-md font-medium ${
                  type === "single"
                    ? "bg-primary-solid text-white"
                    : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
                }`}
              >
                단일 경기
              </button>
              <button
                onClick={() => setType("quarter")}
                className={`px-4 py-2 rounded-md font-medium ${
                  type === "quarter"
                    ? "bg-primary-solid text-white"
                    : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
                }`}
              >
                쿼터 기반
              </button>
            </div>
          </div>

          {/* Player Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Team A */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-text-primary">
                  팀 A ({playerA.length}명)
                </h3>
                <button
                  onClick={() => setShowGuestModalA(true)}
                  className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 font-medium"
                >
                  + 게스트
                </button>
              </div>

              {/* Selected Players */}
              {playerA.length > 0 && (
                <div className="mb-3 space-y-2">
                  <p className="text-xs text-text-tertiary">선택된 참가자:</p>
                  {playerA.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-300 dark:border-blue-700"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-text-primary">{player.name}</span>
                        {player.type === "guest" && (
                          <span className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded">
                            게스트
                          </span>
                        )}
                        <span className="text-xs text-text-tertiary">티어 {player.tier}</span>
                      </div>
                      <button
                        onClick={() => removePlayer(player.id, "A")}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Team Members */}
              <div className="space-y-2">
                <p className="text-xs text-text-tertiary mb-2">팀 멤버:</p>
                {teamMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => togglePlayer(member, "A")}
                    className={`w-full p-3 rounded-lg border-2 transition-colors text-left ${
                      playerA.find(p => p.id === member.user.id)
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-border-primary hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-text-primary">
                        {member.user.name}
                      </span>
                      <span className="text-sm text-text-tertiary">
                        티어 {member.tier}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Team B */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-text-primary">
                  팀 B ({playerB.length}명)
                </h3>
                <button
                  onClick={() => setShowGuestModalB(true)}
                  className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 font-medium"
                >
                  + 게스트
                </button>
              </div>

              {/* Selected Players */}
              {playerB.length > 0 && (
                <div className="mb-3 space-y-2">
                  <p className="text-xs text-text-tertiary">선택된 참가자:</p>
                  {playerB.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-300 dark:border-red-700"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-text-primary">{player.name}</span>
                        {player.type === "guest" && (
                          <span className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded">
                            게스트
                          </span>
                        )}
                        <span className="text-xs text-text-tertiary">티어 {player.tier}</span>
                      </div>
                      <button
                        onClick={() => removePlayer(player.id, "B")}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Team Members */}
              <div className="space-y-2">
                <p className="text-xs text-text-tertiary mb-2">팀 멤버:</p>
                {teamMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => togglePlayer(member, "B")}
                    className={`w-full p-3 rounded-lg border-2 transition-colors text-left ${
                      playerB.find(p => p.id === member.user.id)
                        ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                        : "border-border-primary hover:border-red-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-text-primary">
                        {member.user.name}
                      </span>
                      <span className="text-sm text-text-tertiary">
                        티어 {member.tier}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              코멘트 (선택)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="경기에 대한 설명이나 특이사항을 입력하세요"
              rows={4}
              className="w-full px-3 py-2 border border-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary-solid bg-bg-primary text-text-primary"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              onClick={() => {
                if (gameId) {
                  router.push(`/team/${teamId}/game/${gameId}`)
                } else {
                  router.push(`/team/${teamId}`)
                }
              }}
              className="px-6 py-2 text-text-secondary hover:text-text-primary font-medium"
              disabled={creating}
            >
              취소
            </button>
            <button
              onClick={createEventGame}
              disabled={creating || !title.trim() || playerA.length === 0 || playerB.length === 0}
              className="bg-primary-solid hover:bg-primary-solid-hover text-white px-6 py-2 rounded-md font-medium disabled:opacity-50"
            >
              {creating ? "생성 중..." : "생성하기"}
            </button>
          </div>
        </div>
      </div>

      {/* Guest Modal for Team A */}
      {showGuestModalA && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-bg-primary rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-text-primary mb-4">팀 A 게스트 추가</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  이름 *
                </label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="게스트 이름"
                  className="w-full px-3 py-2 border border-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary-solid bg-bg-primary text-text-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  티어 *
                </label>
                <div className="flex space-x-2">
                  {(["A", "B", "C"] as const).map((tier) => (
                    <button
                      key={tier}
                      onClick={() => setGuestTier(tier)}
                      className={`flex-1 px-4 py-2 rounded-md font-medium ${
                        guestTier === tier
                          ? "bg-primary-solid text-white"
                          : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowGuestModalA(false)
                    setGuestName("")
                    setGuestTier("C")
                  }}
                  className="px-4 py-2 text-text-secondary hover:text-text-primary font-medium"
                >
                  취소
                </button>
                <button
                  onClick={() => addGuest("A")}
                  className="bg-primary-solid hover:bg-primary-solid-hover text-white px-4 py-2 rounded-md font-medium"
                >
                  추가
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Guest Modal for Team B */}
      {showGuestModalB && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-bg-primary rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-text-primary mb-4">팀 B 게스트 추가</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  이름 *
                </label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="게스트 이름"
                  className="w-full px-3 py-2 border border-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary-solid bg-bg-primary text-text-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  티어 *
                </label>
                <div className="flex space-x-2">
                  {(["A", "B", "C"] as const).map((tier) => (
                    <button
                      key={tier}
                      onClick={() => setGuestTier(tier)}
                      className={`flex-1 px-4 py-2 rounded-md font-medium ${
                        guestTier === tier
                          ? "bg-primary-solid text-white"
                          : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowGuestModalB(false)
                    setGuestName("")
                    setGuestTier("C")
                  }}
                  className="px-4 py-2 text-text-secondary hover:text-text-primary font-medium"
                >
                  취소
                </button>
                <button
                  onClick={() => addGuest("B")}
                  className="bg-primary-solid hover:bg-primary-solid-hover text-white px-4 py-2 rounded-md font-medium"
                >
                  추가
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
