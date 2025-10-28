"use client"

import { useSession } from "@/lib/auth-client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useTheme } from "@/app/components/ThemeProvider"

interface User {
  id: string
  name: string
  email: string
  image?: string
}

interface Member {
  role: string
  tier: string
}

interface Attendance {
  id: string
  gameId: string
  userId: string
  status: "attend" | "absent" | "pending"
  createdAt: number
  updatedAt: number
  user: User
  member: Member
}

interface Guest {
  id: string
  gameId: string
  name: string
  tier: string
  createdAt: number
}

interface Score {
  id: string
  gameId: string
  teamNumber: number
  quarter: number
  score: number
  createdAt: number
  updatedAt: number
}

interface Comment {
  id: string
  gameId: string
  userId: string
  content: string
  createdAt: number
  updatedAt: number
  user: User
}

interface Game {
  id: string
  teamId: string
  creatorId: string
  date: number
  location?: string
  description?: string
  creator: User
  attendances: Attendance[]
  teamCount?: number
  teams?: string
  status?: "pending" | "started" | "finished"
}

export default function GameDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const { theme, setTheme } = useTheme()
  const teamId = params.id as string
  const gameId = params.gameId as string
  const [game, setGame] = useState<Game | null>(null)
  const [guests, setGuests] = useState<Guest[]>([])
  const [scores, setScores] = useState<Score[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showGuestModal, setShowGuestModal] = useState(false)
  const [guestForm, setGuestForm] = useState({ name: "", tier: "C" })
  const [addingGuest, setAddingGuest] = useState(false)
  const [isManager, setIsManager] = useState(false)
  const [commentContent, setCommentContent] = useState("")
  const [postingComment, setPostingComment] = useState(false)
  const [deletingGame, setDeletingGame] = useState(false)
  const [maxQuarter, setMaxQuarter] = useState(1)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated") {
      fetchGameDetails()
    }
  }, [status, router, teamId, gameId])

  const fetchGameDetails = async () => {
    try {
      const [gameResponse, guestsResponse, teamResponse, scoresResponse, commentsResponse] =
        await Promise.all([
          fetch(`/api/teams/${teamId}/games/${gameId}`),
          fetch(`/api/teams/${teamId}/games/${gameId}/guests`),
          fetch(`/api/teams/${teamId}`),
          fetch(`/api/teams/${teamId}/games/${gameId}/scores`),
          fetch(`/api/teams/${teamId}/games/${gameId}/comments`),
        ])

      if (gameResponse.ok) {
        const gameData = await gameResponse.json()
        setGame(gameData)
      } else if (gameResponse.status === 404) {
        router.push(`/team/${teamId}`)
      }

      if (guestsResponse.ok) {
        const guestsData = await guestsResponse.json()
        setGuests(guestsData)
      }

      if (teamResponse.ok) {
        const teamData = await teamResponse.json()
        const member = teamData.members.find((m: any) => m.user.id === session?.user?.id)
        setIsManager(member?.role === "MANAGER")
      }

      if (scoresResponse.ok) {
        const scoresData = await scoresResponse.json()
        setScores(scoresData)

        // Calculate max quarter from existing scores
        if (scoresData.length > 0) {
          const maxQ = Math.max(...scoresData.map((s: Score) => s.quarter))
          setMaxQuarter(maxQ)
        }
      }

      if (commentsResponse.ok) {
        const commentsData = await commentsResponse.json()
        setComments(commentsData)
      }
    } catch (error) {
      console.error("Failed to fetch game details:", error)
    } finally {
      setLoading(false)
    }
  }

  const addGuest = async () => {
    if (!guestForm.name || addingGuest) return

    setAddingGuest(true)
    try {
      const response = await fetch(`/api/teams/${teamId}/games/${gameId}/guests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(guestForm),
      })

      if (response.ok) {
        await fetchGameDetails()
        setShowGuestModal(false)
        setGuestForm({ name: "", tier: "C" })
      } else {
        const error = await response.json()
        alert(error.error || "Failed to add guest")
      }
    } catch (error) {
      console.error("Failed to add guest:", error)
      alert("Failed to add guest")
    } finally {
      setAddingGuest(false)
    }
  }

  const deleteGuest = async (guestId: string) => {
    if (!confirm("이 게스트를 삭제하시겠습니까?")) return

    try {
      const response = await fetch(
        `/api/teams/${teamId}/games/${gameId}/guests?guestId=${guestId}`,
        {
          method: "DELETE",
        }
      )

      if (response.ok) {
        await fetchGameDetails()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to delete guest")
      }
    } catch (error) {
      console.error("Failed to delete guest:", error)
      alert("Failed to delete guest")
    }
  }

  const updateScore = async (teamNumber: number, quarter: number, score: number) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/games/${gameId}/scores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ teamNumber, quarter, score }),
      })

      if (response.ok) {
        await fetchGameDetails()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to update score")
      }
    } catch (error) {
      console.error("Failed to update score:", error)
      alert("Failed to update score")
    }
  }

  const postComment = async () => {
    if (!commentContent.trim() || postingComment) return

    setPostingComment(true)
    try {
      const response = await fetch(`/api/teams/${teamId}/games/${gameId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: commentContent }),
      })

      if (response.ok) {
        setCommentContent("")
        await fetchGameDetails()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to post comment")
      }
    } catch (error) {
      console.error("Failed to post comment:", error)
      alert("Failed to post comment")
    } finally {
      setPostingComment(false)
    }
  }

  const deleteComment = async (commentId: string) => {
    if (!confirm("이 댓글을 삭제하시겠습니까?")) return

    try {
      const response = await fetch(
        `/api/teams/${teamId}/games/${gameId}/comments?commentId=${commentId}`,
        {
          method: "DELETE",
        }
      )

      if (response.ok) {
        await fetchGameDetails()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to delete comment")
      }
    } catch (error) {
      console.error("Failed to delete comment:", error)
      alert("Failed to delete comment")
    }
  }

  const startGame = async () => {
    if (!confirm("경기를 시작하시겠습니까? 시작하면 출석 현황이 잠기고 점수 기록이 가능해집니다.")) return

    try {
      const response = await fetch(`/api/teams/${teamId}/games/${gameId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "started" }),
      })

      if (response.ok) {
        await fetchGameDetails()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to start game")
      }
    } catch (error) {
      console.error("Failed to start game:", error)
      alert("Failed to start game")
    }
  }

  const deleteGame = async () => {
    if (!confirm("정말로 이 경기를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return

    setDeletingGame(true)
    try {
      const response = await fetch(`/api/teams/${teamId}/games/${gameId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        alert("경기가 삭제되었습니다.")
        router.push(`/team/${teamId}`)
      } else {
        const error = await response.json()
        alert(error.error || "경기 삭제에 실패했습니다.")
      }
    } catch (error) {
      console.error("Failed to delete game:", error)
      alert("경기 삭제에 실패했습니다.")
    } finally {
      setDeletingGame(false)
    }
  }

  const updateAttendance = async (newStatus: "attend" | "absent" | "pending") => {
    if (!session?.user?.id || updating) return

    setUpdating(true)
    try {
      const response = await fetch(`/api/teams/${teamId}/games/${gameId}/attendances`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        await fetchGameDetails()
      } else {
        console.error("Failed to update attendance")
      }
    } catch (error) {
      console.error("Failed to update attendance:", error)
    } finally {
      setUpdating(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "attend":
        return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
      case "absent":
        return "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
      case "pending":
        return "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "attend":
        return "참석"
      case "absent":
        return "불참"
      case "pending":
        return "미정"
      default:
        return status
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

  const generateMatchups = (teamCount: number): [number, number][] => {
    if (teamCount === 2) {
      return [[1, 2]]
    } else if (teamCount === 3) {
      return [[1, 2], [2, 3], [3, 1]]
    } else {
      // For 4+ teams, generate all possible matchups
      const matchups: [number, number][] = []
      for (let i = 1; i <= teamCount; i++) {
        for (let j = i + 1; j <= teamCount; j++) {
          matchups.push([i, j])
        }
      }
      return matchups
    }
  }

  const addQuarter = () => {
    setMaxQuarter(maxQuarter + 1)
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : theme === "light" ? "dark" : "dark")
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    )
  }

  if (!session || !game) {
    return null
  }

  const currentUserAttendance = game.attendances.find(
    (att) => att.userId === session.user?.id
  )

  const attendCount = game.attendances.filter((att) => att.status === "attend").length
  const absentCount = game.attendances.filter((att) => att.status === "absent").length
  const pendingCount = game.attendances.filter((att) => att.status === "pending").length

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push(`/team/${teamId}`)}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                ← 팀으로 돌아가기
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
              <button
                onClick={toggleTheme}
                className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="테마 전환"
              >
                {theme === "dark" ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              <span className="text-sm text-gray-800 dark:text-gray-200">{session.user?.name}님</span>
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">경기 정보</h1>
            {isManager && (
              <button
                onClick={deleteGame}
                disabled={deletingGame}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
              >
                {deletingGame ? "삭제 중..." : "경기 삭제"}
              </button>
            )}
          </div>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-700 dark:text-gray-300">날짜</span>
              <p className="text-lg font-medium">
                {new Date(game.date).toLocaleString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            {game.location && (
              <div>
                <span className="text-sm text-gray-700 dark:text-gray-300">장소</span>
                <p className="text-lg font-medium text-gray-900 dark:text-white">{game.location}</p>
              </div>
            )}
            {game.description && (
              <div>
                <span className="text-sm text-gray-700 dark:text-gray-300">설명</span>
                <p className="text-lg text-gray-900 dark:text-white">{game.description}</p>
              </div>
            )}
            <div>
              <span className="text-sm text-gray-700 dark:text-gray-300">생성자</span>
              <p className="text-lg font-medium text-gray-900 dark:text-white">{game.creator.name}</p>
            </div>
          </div>
        </div>

        {game.teams && (game.status === "started" || game.status === "finished") && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">팀 구성</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(() => {
                const teamResults = JSON.parse(game.teams)
                return teamResults.map((team: any) => (
                  <div
                    key={team.teamNumber}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                      팀 {team.teamNumber}
                    </h3>
                    <div className="space-y-2">
                      {team.players.map((player: any) => (
                        <div
                          key={player.id}
                          className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
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
                      ))}
                    </div>
                  </div>
                ))
              })()}
            </div>
          </div>
        )}

        {(!game.status || game.status === "pending") && (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">내 출석 상태</h2>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => updateAttendance("attend")}
                  disabled={updating || currentUserAttendance?.status === "attend"}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    currentUserAttendance?.status === "attend"
                      ? "bg-green-600 text-white"
                      : "bg-green-100 text-green-800 hover:bg-green-200"
                  } disabled:opacity-50`}
                >
                  참석
                </button>
                <button
                  onClick={() => updateAttendance("absent")}
                  disabled={updating || currentUserAttendance?.status === "absent"}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    currentUserAttendance?.status === "absent"
                      ? "bg-red-600 text-white"
                      : "bg-red-100 text-red-800 hover:bg-red-200"
                  } disabled:opacity-50`}
                >
                  불참
                </button>
                <button
                  onClick={() => updateAttendance("pending")}
                  disabled={updating || currentUserAttendance?.status === "pending"}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    currentUserAttendance?.status === "pending"
                      ? "bg-yellow-600 text-white"
                      : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                  } disabled:opacity-50`}
                >
                  미정
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">{attendCount}</div>
                <div className="text-sm text-gray-800 dark:text-gray-200">참석</div>
              </div>
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">{absentCount}</div>
                <div className="text-sm text-gray-800 dark:text-gray-200">불참</div>
              </div>
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{pendingCount}</div>
                <div className="text-sm text-gray-800 dark:text-gray-200">미정</div>
              </div>
            </div>
          </>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-8">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">게스트 ({guests.length}명)</h2>
            {isManager && (
              <button
                onClick={() => setShowGuestModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                게스트 추가
              </button>
            )}
          </div>
          {guests.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
              등록된 게스트가 없습니다.
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {guests.map((guest) => (
                <div key={guest.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-purple-300 dark:bg-purple-700 flex items-center justify-center">
                        <span className="text-sm font-medium text-purple-700 dark:text-purple-200">
                          {guest.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{guest.name}</div>
                      <div className="text-xs text-gray-700 dark:text-gray-300">게스트 (자동 참석)</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getTierColor(
                        guest.tier
                      )}`}
                    >
                      티어 {guest.tier}
                    </span>
                    {isManager && (
                      <button
                        onClick={() => deleteGuest(guest.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {(!game.status || game.status === "pending") && (
          <div className="bg-indigo-100 dark:bg-indigo-900 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">팀 매칭</h3>
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  참석자를 기반으로 팀을 자동으로 조합합니다.
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push(`/team/${teamId}/game/${gameId}/match`)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md font-medium"
                >
                  팀 매칭 보기
                </button>
                {isManager && game.teams && (
                  <button
                    onClick={startGame}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md font-medium"
                  >
                    경기 시작
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {game.teams && isManager && (game.status === "started" || game.status === "finished") && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-8">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">쿼터별 스코어</h2>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                    각 매치의 쿼터별 점수를 입력하세요. (매니저만 수정 가능)
                  </p>
                </div>
                <button
                  onClick={addQuarter}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  + 쿼터 추가
                </button>
              </div>
            </div>
            <div className="p-6">
              {(() => {
                const teamResults = JSON.parse(game.teams)
                const matchups = generateMatchups(teamResults.length)

                return (
                  <div className="space-y-8">
                    {matchups.map(([team1Num, team2Num], matchIdx) => {
                      const team1 = teamResults.find((t: any) => t.teamNumber === team1Num)
                      const team2 = teamResults.find((t: any) => t.teamNumber === team2Num)

                      const team1Total = scores
                        .filter((s) => s.teamNumber === team1Num)
                        .reduce((sum, s) => sum + s.score, 0)
                      const team2Total = scores
                        .filter((s) => s.teamNumber === team2Num)
                        .reduce((sum, s) => sum + s.score, 0)

                      return (
                        <div key={matchIdx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                            매치 {matchIdx + 1}: 팀 {team1Num} vs 팀 {team2Num}
                          </h3>

                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-300">팀</th>
                                  {Array.from({ length: maxQuarter }, (_, i) => i + 1).map((quarter) => (
                                    <th key={quarter} className="text-center py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                                      Q{quarter}
                                    </th>
                                  ))}
                                  <th className="text-right py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-300">총점</th>
                                </tr>
                              </thead>
                              <tbody>
                                {/* Team 1 Row */}
                                <tr className="border-b border-gray-100 dark:border-gray-700">
                                  <td className="py-3 px-3 font-medium text-gray-900 dark:text-white">
                                    팀 {team1Num}
                                  </td>
                                  {Array.from({ length: maxQuarter }, (_, i) => i + 1).map((quarter) => {
                                    const scoreRecord = scores.find(
                                      (s) => s.teamNumber === team1Num && s.quarter === quarter
                                    )
                                    return (
                                      <td key={quarter} className="py-3 px-3">
                                        <input
                                          type="number"
                                          min="0"
                                          value={scoreRecord?.score || 0}
                                          onChange={(e) =>
                                            updateScore(
                                              team1Num,
                                              quarter,
                                              parseInt(e.target.value) || 0
                                            )
                                          }
                                          className="w-16 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                      </td>
                                    )
                                  })}
                                  <td className="py-3 px-3 text-right font-bold text-gray-900 dark:text-white">
                                    {team1Total}
                                  </td>
                                </tr>

                                {/* Team 2 Row */}
                                <tr>
                                  <td className="py-3 px-3 font-medium text-gray-900 dark:text-white">
                                    팀 {team2Num}
                                  </td>
                                  {Array.from({ length: maxQuarter }, (_, i) => i + 1).map((quarter) => {
                                    const scoreRecord = scores.find(
                                      (s) => s.teamNumber === team2Num && s.quarter === quarter
                                    )
                                    return (
                                      <td key={quarter} className="py-3 px-3">
                                        <input
                                          type="number"
                                          min="0"
                                          value={scoreRecord?.score || 0}
                                          onChange={(e) =>
                                            updateScore(
                                              team2Num,
                                              quarter,
                                              parseInt(e.target.value) || 0
                                            )
                                          }
                                          className="w-16 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                      </td>
                                    )
                                  })}
                                  <td className="py-3 px-3 text-right font-bold text-gray-900 dark:text-white">
                                    {team2Total}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="text-center">
                              <span className={`text-lg font-bold ${
                                team1Total > team2Total
                                  ? 'text-green-600 dark:text-green-400'
                                  : team1Total < team2Total
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-yellow-600 dark:text-yellow-400'
                              }`}>
                                {team1Total > team2Total
                                  ? `팀 ${team1Num} 승리`
                                  : team1Total < team2Total
                                  ? `팀 ${team2Num} 승리`
                                  : '무승부'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-8">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">댓글 ({comments.length})</h2>
          </div>
          <div className="p-6">
            <div className="mb-6">
              <textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="댓글을 입력하세요..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
              />
              <div className="mt-2 flex justify-end">
                <button
                  onClick={postComment}
                  disabled={!commentContent.trim() || postingComment}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                >
                  {postingComment ? "등록 중..." : "댓글 등록"}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {comments.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        {comment.user.image ? (
                          <img
                            className="h-8 w-8 rounded-full"
                            src={comment.user.image}
                            alt={comment.user.name || ""}
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                              {comment.user.name?.charAt(0).toUpperCase() || "?"}
                            </span>
                            </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {comment.user.name}
                          </div>
                          <div className="text-xs text-gray-700 dark:text-gray-300">
                            {new Date(comment.createdAt).toLocaleString("ko-KR")}
                          </div>
                        </div>
                      </div>
                      {(comment.userId === session?.user?.id || isManager) && (
                        <button
                          onClick={() => deleteComment(comment.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                    <div className="mt-2 text-sm text-gray-700 dark:text-gray-300 ml-11">
                      {comment.content}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              출석 현황 ({game.attendances.length}명)
            </h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {game.attendances.map((attendance) => (
              <div key={attendance.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {attendance.user.image ? (
                      <img
                        className="h-10 w-10 rounded-full"
                        src={attendance.user.image}
                        alt={attendance.user.name || ""}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          {attendance.user.name?.charAt(0).toUpperCase() || "?"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {attendance.user.name}
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">{attendance.user.email}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getTierColor(
                      attendance.member.tier
                    )}`}
                  >
                    티어 {attendance.member.tier}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      attendance.status
                    )}`}
                  >
                    {getStatusText(attendance.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showGuestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">게스트 추가</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  이름 *
                </label>
                <input
                  type="text"
                  value={guestForm.name}
                  onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="게스트 이름 입력"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  티어 *
                </label>
                <select
                  value={guestForm.tier}
                  onChange={(e) => setGuestForm({ ...guestForm, tier: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="A">티어 A</option>
                  <option value="B">티어 B</option>
                  <option value="C">티어 C</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowGuestModal(false)
                  setGuestForm({ name: "", tier: "C" })
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                disabled={addingGuest}
              >
                취소
              </button>
              <button
                onClick={addGuest}
                disabled={!guestForm.name || addingGuest}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
              >
                {addingGuest ? "추가 중..." : "추가"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
