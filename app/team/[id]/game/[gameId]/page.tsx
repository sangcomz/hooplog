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
  votingStatus?: "open" | "closed"
}

export default function GameDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const { theme, setTheme, actualTheme } = useTheme()
  const teamId = params.id as string
  const gameId = params.gameId as string
  const [game, setGame] = useState<Game | null>(null)
  const [guests, setGuests] = useState<Guest[]>([])
  const [scores, setScores] = useState<Score[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [eventGames, setEventGames] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showGuestModal, setShowGuestModal] = useState(false)
  const [guestForm, setGuestForm] = useState({ name: "", tier: "C" })
  const [addingGuest, setAddingGuest] = useState(false)
  const [isManager, setIsManager] = useState(false)
  const [commentContent, setCommentContent] = useState("")
  const [postingComment, setPostingComment] = useState(false)
  const [deletingGame, setDeletingGame] = useState(false)
  const [votes, setVotes] = useState<{ playerId: string; playerName: string; playerImage?: string; voteCount: number }[]>([])
  const [userVote, setUserVote] = useState<string | null>(null)
  const [votingFor, setVotingFor] = useState<string | null>(null)
  const [rounds, setRounds] = useState<any[]>([])
  const [expandedRounds, setExpandedRounds] = useState<Set<string>>(new Set())
  const [editingScores, setEditingScores] = useState<{ [key: string]: number }>({})
  const [savingScore, setSavingScore] = useState<string | null>(null)

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
      const [gameResponse, guestsResponse, teamResponse, scoresResponse, commentsResponse, votesResponse, eventGamesResponse, matchResponse] =
        await Promise.all([
          fetch(`/api/teams/${teamId}/games/${gameId}`),
          fetch(`/api/teams/${teamId}/games/${gameId}/guests`),
          fetch(`/api/teams/${teamId}`),
          fetch(`/api/teams/${teamId}/games/${gameId}/scores`),
          fetch(`/api/teams/${teamId}/games/${gameId}/comments`),
          fetch(`/api/teams/${teamId}/games/${gameId}/votes`),
          fetch(`/api/teams/${teamId}/event-games?gameId=${gameId}`),
          fetch(`/api/teams/${teamId}/games/${gameId}/match`),
        ])

      if (gameResponse.ok) {
        const gameData = await gameResponse.json()
        setGame(gameData)
      } else if (gameResponse.status === 404) {
        router.push(`/team/${teamId}`)
      }

      if (matchResponse.ok) {
        const matchData = await matchResponse.json()
        console.log('[FRONTEND] Received match data:', {
          hasRounds: !!matchData.rounds,
          roundsCount: matchData.rounds?.length || 0,
          roundIds: matchData.rounds?.map((r: any) => `${r.roundNumber}:${r.id}`) || []
        })
        if (matchData.rounds && matchData.rounds.length > 0) {
          setRounds(matchData.rounds)
          // Automatically expand the latest round
          const latestRound = matchData.rounds[matchData.rounds.length - 1]
          console.log('[FRONTEND] Expanding latest round:', latestRound.id)
          setExpandedRounds(new Set([latestRound.id]))
        }
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
      }

      if (commentsResponse.ok) {
        const commentsData = await commentsResponse.json()
        setComments(commentsData)
      }

      if (votesResponse.ok) {
        const votesData = await votesResponse.json()
        setVotes(votesData.votes)
        setUserVote(votesData.userVote)
      }

      if (eventGamesResponse.ok) {
        const eventGamesData = await eventGamesResponse.json()
        setEventGames(eventGamesData)
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

  const toggleRound = (roundId: string) => {
    setExpandedRounds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(roundId)) {
        newSet.delete(roundId)
      } else {
        newSet.add(roundId)
      }
      return newSet
    })
  }

  const createNewRound = async (matchType: "balance" | "random" = "balance") => {
    if (updating) return

    console.log('[FRONTEND] Creating new round, matchType:', matchType)
    console.log('[FRONTEND] Current rounds count:', rounds.length)

    setUpdating(true)
    try {
      const response = await fetch(`/api/teams/${teamId}/games/${gameId}/match`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teamCount: game?.teamCount || 2,
          matchType,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('[FRONTEND] Round created successfully:', {
          totalRounds: result.rounds?.length || 0,
          roundIds: result.rounds?.map((r: any) => `${r.roundNumber}:${r.id}`) || []
        })
        await fetchGameDetails()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to create new round")
      }
    } catch (error) {
      console.error("Failed to create new round:", error)
      alert("Failed to create new round")
    } finally {
      setUpdating(false)
    }
  }

  const addQuarterToRound = async (roundId: string, currentMaxQuarter: number) => {
    if (updating) return

    console.log('[FRONTEND] Adding quarter to round:', roundId, 'current:', currentMaxQuarter, 'new:', currentMaxQuarter + 1)

    setUpdating(true)
    try {
      const response = await fetch(`/api/teams/${teamId}/games/${gameId}/match`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roundId,
          maxQuarter: currentMaxQuarter + 1,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('[FRONTEND] Quarter added successfully:', result)
        await fetchGameDetails()
      } else {
        const error = await response.json()
        console.error('[FRONTEND] Failed to add quarter:', error)
        alert(error.error || "Failed to add quarter")
      }
    } catch (error) {
      console.error("Failed to add quarter:", error)
      alert("Failed to add quarter")
    } finally {
      setUpdating(false)
    }
  }

  const getScoreKey = (roundId: string, quarter: number, teamNumber: number) => {
    return `${roundId}-${quarter}-${teamNumber}`
  }

  const getEditingScore = (roundId: string, quarter: number, teamNumber: number, defaultScore: number) => {
    const key = getScoreKey(roundId, quarter, teamNumber)
    return editingScores[key] !== undefined ? editingScores[key] : defaultScore
  }

  const setEditingScore = (roundId: string, quarter: number, teamNumber: number, score: number) => {
    const key = getScoreKey(roundId, quarter, teamNumber)
    setEditingScores(prev => ({ ...prev, [key]: Math.max(0, score) }))
  }

  const saveScore = async (roundId: string, quarter: number, teamNumber: number) => {
    const key = getScoreKey(roundId, quarter, teamNumber)
    const score = editingScores[key]

    if (score === undefined) return

    setSavingScore(key)
    try {
      const response = await fetch(`/api/teams/${teamId}/games/${gameId}/scores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ teamNumber, quarter, score, roundId }),
      })

      if (response.ok) {
        await fetchGameDetails()
        // Clear editing state after successful save
        setEditingScores(prev => {
          const newState = { ...prev }
          delete newState[key]
          return newState
        })
      } else {
        const error = await response.json()
        alert(error.error || "Failed to update score")
      }
    } catch (error) {
      console.error("Failed to update score:", error)
      alert("Failed to update score")
    } finally {
      setSavingScore(null)
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

  const finishGame = async () => {
    if (!confirm("경기를 종료하시겠습니까? 종료하면 MVP 투표가 가능해집니다.")) return

    try {
      const response = await fetch(`/api/teams/${teamId}/games/${gameId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "finished" }),
      })

      if (response.ok) {
        await fetchGameDetails()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to finish game")
      }
    } catch (error) {
      console.error("Failed to finish game:", error)
      alert("Failed to finish game")
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


  const voteForMVP = async (playerId: string) => {
    if (votingFor) return

    setVotingFor(playerId)
    try {
      const response = await fetch(`/api/teams/${teamId}/games/${gameId}/votes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ playerId }),
      })

      if (response.ok) {
        await fetchGameDetails()
      } else {
        const error = await response.json()
        alert(error.error || "투표에 실패했습니다")
      }
    } catch (error) {
      console.error("Failed to vote:", error)
      alert("투표에 실패했습니다")
    } finally {
      setVotingFor(null)
    }
  }

  const closeVoting = async () => {
    if (!confirm("투표를 종료하시겠습니까? 종료하면 더 이상 투표할 수 없습니다.")) return

    try {
      const response = await fetch(`/api/teams/${teamId}/games/${gameId}/votes`, {
        method: "PATCH",
      })

      if (response.ok) {
        await fetchGameDetails()
        alert("투표가 종료되었습니다")
      } else {
        const error = await response.json()
        alert(error.error || "투표 종료에 실패했습니다")
      }
    } catch (error) {
      console.error("Failed to close voting:", error)
      alert("투표 종료에 실패했습니다")
    }
  }

  const toggleTheme = () => {
    setTheme(actualTheme === "dark" ? "light" : "dark")
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
                {actualTheme === "dark" ? (
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
            <div className="flex items-center space-x-2">
              {isManager && game.status === "started" && (
                <button
                  onClick={finishGame}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  경기 종료
                </button>
              )}
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

        {(game.status === "started" || game.status === "finished") && rounds.length > 0 && (
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">경기 라운드</h2>
              {isManager && game.status === "started" && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => createNewRound("balance")}
                    disabled={updating}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                  >
                    새 라운드 (밸런스)
                  </button>
                  <button
                    onClick={() => createNewRound("random")}
                    disabled={updating}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                  >
                    새 라운드 (랜덤)
                  </button>
                </div>
              )}
            </div>

            {rounds.map((round, index) => {
              const isExpanded = expandedRounds.has(round.id)
              const isLatest = index === rounds.length - 1

              console.log(`[FRONTEND] Rendering round ${round.roundNumber}:`, {
                id: round.id,
                maxQuarter: round.maxQuarter,
                quarterScoresCount: round.quarterScores?.length || 0,
                teamsCount: round.teams?.length || 0
              })

              // Calculate total scores for this round
              const totalScores: { [teamNumber: number]: number } = {}
              round.quarterScores.forEach((qs: any) => {
                Object.entries(qs.scores).forEach(([teamNum, score]: [string, any]) => {
                  const num = parseInt(teamNum)
                  totalScores[num] = (totalScores[num] || 0) + score
                })
              })

              // Ensure all teams have a score (default to 0)
              round.teams.forEach((team: any) => {
                if (totalScores[team.teamNumber] === undefined) {
                  totalScores[team.teamNumber] = 0
                }
              })

              // Sort team numbers for consistent display
              const sortedTeamNumbers = Object.keys(totalScores).map(Number).sort((a, b) => a - b)

              return (
                <div
                  key={round.id}
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden ${
                    isLatest ? "ring-2 ring-indigo-500" : ""
                  }`}
                >
                  <div
                    onClick={() => toggleRound(round.id)}
                    className="px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-4">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        라운드 {round.roundNumber}
                        {isLatest && (
                          <span className="ml-2 px-2 py-1 text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded">
                            최신
                          </span>
                        )}
                      </h3>
                    </div>
                    <div className="flex items-center space-x-4">
                      {sortedTeamNumbers.length > 0 && (
                        <div className="flex items-center space-x-2 text-sm font-medium">
                          {sortedTeamNumbers.map((teamNum, idx) => (
                            <span key={teamNum}>
                              {idx > 0 && " : "}
                              <span className="text-gray-900 dark:text-white">{totalScores[teamNum]}</span>
                            </span>
                          ))}
                        </div>
                      )}
                      <svg
                        className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${
                          isExpanded ? "transform rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-6 pb-6 space-y-6">
                      {/* Team Composition */}
                      <div>
                        <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">팀 구성</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {round.teams.map((team: any) => (
                            <div
                              key={team.teamNumber}
                              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                            >
                              <h5 className="text-md font-bold text-gray-900 dark:text-white mb-3">
                                팀 {team.teamNumber}
                              </h5>
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
                          ))}
                        </div>
                      </div>

                      {/* Quarter Scores */}
                      {isManager && (
                        <div>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                            <h4 className="text-md font-semibold text-gray-900 dark:text-white">쿼터별 점수</h4>
                            <button
                              onClick={() => addQuarterToRound(round.id, round.maxQuarter || 1)}
                              disabled={updating}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 sm:py-1 rounded-md text-sm font-medium disabled:opacity-50 w-full sm:w-auto"
                            >
                              + 쿼터 추가
                            </button>
                          </div>
                          <div className="space-y-3">
                            {Array.from({ length: round.maxQuarter || 1 }, (_, i) => i + 1).map((quarter) => {
                              const quarterScore = round.quarterScores.find((qs: any) => qs.quarter === quarter)
                              return (
                                <div key={quarter} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                  <div className="font-medium text-gray-900 dark:text-white mb-3">
                                    쿼터 {quarter}
                                  </div>
                                  <div className="space-y-3">
                                    {round.teams.map((team: any) => {
                                      const currentScore = quarterScore?.scores[team.teamNumber] || 0
                                      const editingScore = getEditingScore(round.id, quarter, team.teamNumber, currentScore)
                                      const scoreKey = getScoreKey(round.id, quarter, team.teamNumber)
                                      const isSaving = savingScore === scoreKey
                                      const hasChanges = editingScores[scoreKey] !== undefined && editingScores[scoreKey] !== currentScore

                                      return (
                                        <div key={team.teamNumber} className="bg-white dark:bg-gray-800 rounded-lg p-3">
                                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            팀 {team.teamNumber}
                                          </label>
                                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
                                            <div className="flex items-stretch gap-2 w-full">
                                              {/* Minus Button */}
                                              <button
                                                onClick={() => setEditingScore(round.id, quarter, team.teamNumber, editingScore - 1)}
                                                disabled={isSaving || editingScore <= 0}
                                                className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-lg font-bold text-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
                                              >
                                                −
                                              </button>

                                              {/* Score Input */}
                                              <input
                                                type="number"
                                                min="0"
                                                value={editingScore}
                                                onChange={(e) => setEditingScore(round.id, quarter, team.teamNumber, parseInt(e.target.value) || 0)}
                                                disabled={isSaving}
                                                className="flex-1 min-w-0 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                                              />

                                              {/* Plus Button */}
                                              <button
                                                onClick={() => setEditingScore(round.id, quarter, team.teamNumber, editingScore + 1)}
                                                disabled={isSaving}
                                                className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-lg font-bold text-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
                                              >
                                                +
                                              </button>
                                            </div>

                                            {/* Save Button */}
                                            <button
                                              onClick={() => saveScore(round.id, quarter, team.teamNumber)}
                                              disabled={!hasChanges || isSaving}
                                              className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto ${
                                                hasChanges
                                                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                                  : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                                              }`}
                                            >
                                              {isSaving ? '저장중...' : '저장'}
                                            </button>
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )
                            })}
                          </div>

                          {/* Winner Display */}
                          {Object.keys(totalScores).length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                              <div className="text-center">
                                {(() => {
                                  const scores = Object.entries(totalScores).map(([teamNum, score]) => ({
                                    teamNum: parseInt(teamNum),
                                    score: score as number
                                  }))
                                  const maxScore = Math.max(...scores.map(s => s.score))
                                  const winners = scores.filter(s => s.score === maxScore)

                                  if (winners.length > 1) {
                                    return (
                                      <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                                        무승부 ({winners.map(w => `팀 ${w.teamNum}`).join(', ')}: {maxScore}점)
                                      </span>
                                    )
                                  } else if (winners.length === 1) {
                                    return (
                                      <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                        팀 {winners[0].teamNum} 승리! ({maxScore}점)
                                      </span>
                                    )
                                  }
                                  return null
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Display quarter scores for non-managers */}
                      {!isManager && round.quarterScores.length > 0 && (
                        <div>
                          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">쿼터별 점수</h4>
                          <div className="space-y-2">
                            {round.quarterScores.map((qs: any) => (
                              <div key={qs.quarter} className="flex items-center space-x-4 text-sm">
                                <span className="font-medium text-gray-900 dark:text-white w-16">
                                  Q{qs.quarter}:
                                </span>
                                <div className="flex items-center space-x-2">
                                  {Object.entries(qs.scores).map(([teamNum, score]: [string, any], idx) => (
                                    <span key={teamNum}>
                                      {idx > 0 && " : "}
                                      <span className="font-bold text-gray-900 dark:text-white">{score}</span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
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

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-8">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">게스트 ({guests.length}명)</h2>
            {isManager && (!game.status || game.status === "pending") && (
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


        {/* Event Games Section */}
        {game.teams && (game.status === "started" || game.status === "finished") && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-8">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">번외 경기 ({eventGames.length})</h2>
              <button
                onClick={() => router.push(`/team/${teamId}/event/new?gameId=${gameId}`)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                번외 경기 추가
              </button>
            </div>
            {eventGames.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                아직 번외 경기가 없습니다. 이 경기와 관련된 번외 경기를 추가해보세요.
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {eventGames.map((eventGame) => (
                  <div
                    key={eventGame.id}
                    onClick={() => router.push(`/team/${teamId}/event/${eventGame.id}`)}
                    className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                            {eventGame.title}
                          </div>
                          <div className="flex items-center space-x-4 text-sm">
                            <div className="flex items-center space-x-2">
                              <span className="text-blue-600 dark:text-blue-400 font-bold">
                                {eventGame.scoreA}
                              </span>
                              <span className="text-gray-500 dark:text-gray-400">:</span>
                              <span className="text-red-600 dark:text-red-400 font-bold">
                                {eventGame.scoreB}
                              </span>
                            </div>
                            <span className="text-gray-400 dark:text-gray-500">•</span>
                            <span className="text-gray-600 dark:text-gray-400">
                              {eventGame.type === "single" ? "단일 경기" : "쿼터 기반"}
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 text-right">
                          <div>{eventGame.creatorName}</div>
                          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {new Date(eventGame.createdAt).toLocaleDateString("ko-KR")}
                          </div>
                        </div>
                      </div>

                      {/* Team compositions */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-3">
                          <div className="font-semibold text-blue-700 dark:text-blue-300 mb-2">팀 A</div>
                          <div className="space-y-1">
                            {JSON.parse(eventGame.playerA).map((player: any, idx: number) => (
                              <div key={idx} className="text-gray-700 dark:text-gray-300">
                                {player.name} <span className="text-xs text-gray-500 dark:text-gray-400">(티어 {player.tier})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/20 rounded p-3">
                          <div className="font-semibold text-red-700 dark:text-red-300 mb-2">팀 B</div>
                          <div className="space-y-1">
                            {JSON.parse(eventGame.playerB).map((player: any, idx: number) => (
                              <div key={idx} className="text-gray-700 dark:text-gray-300">
                                {player.name} <span className="text-xs text-gray-500 dark:text-gray-400">(티어 {player.tier})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {game.status === "finished" && game.teams && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-8">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">MVP 투표</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {game.votingStatus === "closed"
                      ? "투표가 종료되었습니다"
                      : "이 경기의 MVP를 선택해주세요 (한 경기당 1표)"}
                  </p>
                </div>
                {isManager && game.votingStatus === "open" && (
                  <button
                    onClick={closeVoting}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    투표 종료
                  </button>
                )}
              </div>
            </div>
            <div className="p-6">
              {votes.length > 0 && (
                <div className="mb-6 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-lg p-4 border-2 border-yellow-200 dark:border-yellow-700">
                  <div className="flex items-center space-x-3">
                    <svg className="w-8 h-8 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">현재 1위</h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {votes[0].playerName} - {votes[0].voteCount}표
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(() => {
                  const teamResults = JSON.parse(game.teams)
                  const allPlayers = teamResults.flatMap((team: any) =>
                    team.players.map((p: any) => ({
                      id: p.id,
                      name: p.name,
                      tier: p.tier,
                      teamNumber: team.teamNumber,
                      isGuest: p.isGuest,
                    }))
                  )

                  return allPlayers.map((player: any) => {
                    const voteData = votes.find(v => v.playerId === player.id)
                    const voteCount = voteData?.voteCount || 0
                    const hasVoted = userVote === player.id
                    const isVoting = votingFor === player.id

                    return (
                      <button
                        key={player.id}
                        onClick={() => voteForMVP(player.id)}
                        disabled={isVoting || game.votingStatus === "closed"}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          hasVoted
                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                            : "border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              {voteData?.playerImage ? (
                                <img
                                  className="h-10 w-10 rounded-full"
                                  src={voteData.playerImage}
                                  alt={player.name}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                    {player.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="text-left">
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
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                팀 {player.teamNumber} · 티어 {player.tier}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {hasVoted && (
                              <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                              {voteCount}
                            </span>
                          </div>
                        </div>
                      </button>
                    )
                  })
                })()}
              </div>

              {userVote && game.votingStatus === "open" && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 text-center">
                  투표를 변경하려면 다른 선수를 선택하세요
                </p>
              )}
              {game.votingStatus === "closed" && (
                <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-center">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    투표가 종료되어 더 이상 투표하거나 변경할 수 없습니다
                  </p>
                </div>
              )}
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
