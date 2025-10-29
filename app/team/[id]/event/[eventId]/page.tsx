"use client"

import { useSession } from "@/lib/auth-client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useTheme } from "@/app/components/ThemeProvider"
import { ThemeToggle } from "@/app/components/ThemeToggle"

interface User {
  id: string
  name: string
  image?: string
}

interface Player {
  type: "member" | "guest"
  userId?: string
  name: string
  tier: string
  id: string
}

interface EventGame {
  id: string
  teamId: string
  title: string
  scoreA: number
  scoreB: number
  playerA: Player[]
  playerB: Player[]
  type: "single" | "quarter"
  quarters?: Array<{ quarter: number; scoreA: number; scoreB: number }>
  comment?: string
  gameId?: string
  createdById: string
  createdAt: number
  updatedAt: number
  creatorName: string
  creatorImage?: string
}

interface Comment {
  id: string
  eventGameId: string
  userId: string
  content: string
  createdAt: number
  updatedAt: number
  userName: string
  userImage?: string
}

interface TeamMember {
  id: string
  user: {
    id: string
    name: string
    image?: string
  }
  tier: string
}

export default function EventGameDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const teamId = params.id as string
  const eventId = params.eventId as string

  const [loading, setLoading] = useState(true)
  const [eventGame, setEventGame] = useState<EventGame | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isManager, setIsManager] = useState(false)

  const [commentContent, setCommentContent] = useState("")
  const [postingComment, setPostingComment] = useState(false)
  const [deletingComment, setDeletingComment] = useState<string | null>(null)
  const [deletingGame, setDeletingGame] = useState(false)

  // Score editing states
  const [editingScore, setEditingScore] = useState(false)
  const [tempScoreA, setTempScoreA] = useState(0)
  const [tempScoreB, setTempScoreB] = useState(0)
  const [tempQuarters, setTempQuarters] = useState<Array<{ quarter: number; scoreA: number; scoreB: number }>>([])
  const [savingScore, setSavingScore] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated") {
      fetchEventGameDetails()
      fetchTeamMembers()
    }
  }, [status, router, teamId, eventId])

  const fetchEventGameDetails = async () => {
    try {
      const [eventResponse, commentsResponse] = await Promise.all([
        fetch(`/api/teams/${teamId}/event-games/${eventId}`),
        fetch(`/api/teams/${teamId}/event-games/${eventId}/comments`),
      ])

      if (eventResponse.ok) {
        const eventData = await eventResponse.json()
        setEventGame({
          ...eventData,
          playerA: JSON.parse(eventData.playerA),
          playerB: JSON.parse(eventData.playerB),
          quarters: eventData.quarters ? JSON.parse(eventData.quarters) : undefined,
        })
      } else if (eventResponse.status === 404) {
        router.push(`/team/${teamId}`)
      }

      if (commentsResponse.ok) {
        const commentsData = await commentsResponse.json()
        setComments(commentsData)
      }
    } catch (error) {
      console.error("Failed to fetch event game details:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch(`/api/teams/${teamId}`)
      if (response.ok) {
        const teamData = await response.json()
        setTeamMembers(teamData.members || [])
        const member = teamData.members.find(
          (m: any) => m.user.id === session?.user?.id
        )
        setIsManager(member?.role === "MANAGER")
      }
    } catch (error) {
      console.error("Failed to fetch team members:", error)
    }
  }

  const startEditingScore = () => {
    if (eventGame) {
      setTempScoreA(eventGame.scoreA)
      setTempScoreB(eventGame.scoreB)
      setTempQuarters(eventGame.quarters ? [...eventGame.quarters] : [])
      setEditingScore(true)
    }
  }

  const cancelEditingScore = () => {
    setEditingScore(false)
    setTempScoreA(0)
    setTempScoreB(0)
    setTempQuarters([])
  }

  const addQuarter = () => {
    setTempQuarters([
      ...tempQuarters,
      { quarter: tempQuarters.length + 1, scoreA: 0, scoreB: 0 },
    ])
  }

  const updateQuarter = (index: number, field: "scoreA" | "scoreB", value: number) => {
    const newQuarters = [...tempQuarters]
    newQuarters[index][field] = value
    setTempQuarters(newQuarters)

    // Update total scores for quarter mode
    if (eventGame?.type === "quarter") {
      const totalA = newQuarters.reduce((sum, q) => sum + q.scoreA, 0)
      const totalB = newQuarters.reduce((sum, q) => sum + q.scoreB, 0)
      setTempScoreA(totalA)
      setTempScoreB(totalB)
    }
  }

  const removeQuarter = (index: number) => {
    const newQuarters = tempQuarters.filter((_, i) => i !== index)
    // Renumber quarters
    newQuarters.forEach((q, i) => {
      q.quarter = i + 1
    })
    setTempQuarters(newQuarters)

    // Update total scores
    if (eventGame?.type === "quarter") {
      const totalA = newQuarters.reduce((sum, q) => sum + q.scoreA, 0)
      const totalB = newQuarters.reduce((sum, q) => sum + q.scoreB, 0)
      setTempScoreA(totalA)
      setTempScoreB(totalB)
    }
  }

  const saveScore = async () => {
    if (!eventGame) return

    setSavingScore(true)
    try {
      const response = await fetch(`/api/teams/${teamId}/event-games/${eventId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scoreA: tempScoreA,
          scoreB: tempScoreB,
          quarters: eventGame.type === "quarter" && tempQuarters.length > 0 ? tempQuarters : null,
        }),
      })

      if (response.ok) {
        await fetchEventGameDetails()
        setEditingScore(false)
      } else {
        const error = await response.json()
        alert(error.error || "Failed to save score")
      }
    } catch (error) {
      console.error("Failed to save score:", error)
      alert("Failed to save score")
    } finally {
      setSavingScore(false)
    }
  }

  const postComment = async () => {
    if (!commentContent.trim() || postingComment) return

    setPostingComment(true)
    try {
      const response = await fetch(`/api/teams/${teamId}/event-games/${eventId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: commentContent }),
      })

      if (response.ok) {
        await fetchEventGameDetails()
        setCommentContent("")
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
    if (!confirm("댓글을 삭제하시겠습니까?")) return

    setDeletingComment(commentId)
    try {
      const response = await fetch(
        `/api/teams/${teamId}/event-games/${eventId}/comments?commentId=${commentId}`,
        {
          method: "DELETE",
        }
      )

      if (response.ok) {
        await fetchEventGameDetails()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to delete comment")
      }
    } catch (error) {
      console.error("Failed to delete comment:", error)
      alert("Failed to delete comment")
    } finally {
      setDeletingComment(null)
    }
  }

  const deleteEventGame = async () => {
    if (!confirm("번외 경기를 삭제하시겠습니까?")) return

    setDeletingGame(true)
    try {
      const response = await fetch(`/api/teams/${teamId}/event-games/${eventId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        router.push(`/team/${teamId}`)
      } else {
        const error = await response.json()
        alert(error.error || "Failed to delete event game")
      }
    } catch (error) {
      console.error("Failed to delete event game:", error)
      alert("Failed to delete event game")
    } finally {
      setDeletingGame(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    )
  }

  if (!session || !eventGame) {
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Event Game Info */}
        <div className="bg-bg-primary rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-text-primary">{eventGame.title}</h1>
            {isManager && (
              <button
                onClick={deleteEventGame}
                disabled={deletingGame}
                className="bg-error-solid hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
              >
                {deletingGame ? "삭제 중..." : "경기 삭제"}
              </button>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-sm text-text-tertiary">경기 형태</span>
              <p className="text-lg font-medium text-text-primary">
                {eventGame.type === "single" ? "단일 경기" : "쿼터 기반"}
              </p>
            </div>
            <div>
              <span className="text-sm text-text-tertiary">생성자</span>
              <p className="text-lg font-medium text-text-primary">{eventGame.creatorName}</p>
            </div>
            <div>
              <span className="text-sm text-text-tertiary">생성일</span>
              <p className="text-lg text-text-primary">
                {new Date(eventGame.createdAt).toLocaleString("ko-KR")}
              </p>
            </div>
            {eventGame.comment && (
              <div>
                <span className="text-sm text-text-tertiary">코멘트</span>
                <p className="text-lg text-text-primary">{eventGame.comment}</p>
              </div>
            )}
          </div>
        </div>

        {/* Score */}
        <div className="bg-bg-primary rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-text-primary">경기 결과</h2>
            {!editingScore && (
              <button
                onClick={startEditingScore}
                className="bg-primary-solid hover:bg-primary-solid-hover text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                점수 입력
              </button>
            )}
          </div>

          {!editingScore ? (
            <div className="flex items-center justify-center space-x-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                  {eventGame.scoreA}
                </div>
                <div className="text-sm text-text-tertiary mt-2">팀 A</div>
              </div>
              <div className="text-3xl font-bold text-text-tertiary">:</div>
              <div className="text-center">
                <div className="text-4xl font-bold text-red-600 dark:text-red-400">
                  {eventGame.scoreB}
                </div>
                <div className="text-sm text-text-tertiary mt-2">팀 B</div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {eventGame.type === "single" ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      팀 A 점수
                    </label>
                    <input
                      type="number"
                      value={tempScoreA}
                      onChange={(e) => setTempScoreA(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary-solid bg-bg-primary text-text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      팀 B 점수
                    </label>
                    <input
                      type="number"
                      value={tempScoreB}
                      onChange={(e) => setTempScoreB(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary-solid bg-bg-primary text-text-primary"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-text-primary">
                      쿼터별 점수 (총점: {tempScoreA} - {tempScoreB})
                    </h3>
                    <button
                      onClick={addQuarter}
                      className="bg-primary-solid hover:bg-primary-solid-hover text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      쿼터 추가
                    </button>
                  </div>
                  <div className="space-y-3">
                    {tempQuarters.map((quarter, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-4 p-4 bg-bg-secondary rounded-lg"
                      >
                        <span className="font-medium text-text-primary w-20">
                          {quarter.quarter}쿼터
                        </span>
                        <div className="flex-1 grid grid-cols-2 gap-4">
                          <input
                            type="number"
                            value={quarter.scoreA}
                            onChange={(e) =>
                              updateQuarter(index, "scoreA", parseInt(e.target.value) || 0)
                            }
                            placeholder="팀 A"
                            className="px-3 py-2 border border-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary-solid bg-bg-primary text-text-primary"
                          />
                          <input
                            type="number"
                            value={quarter.scoreB}
                            onChange={(e) =>
                              updateQuarter(index, "scoreB", parseInt(e.target.value) || 0)
                            }
                            placeholder="팀 B"
                            className="px-3 py-2 border border-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary-solid bg-bg-primary text-text-primary"
                          />
                        </div>
                        <button
                          onClick={() => removeQuarter(index)}
                          className="text-error-solid hover:text-red-700 px-3 py-2"
                        >
                          삭제
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  onClick={cancelEditingScore}
                  className="px-6 py-2 text-text-secondary hover:text-text-primary font-medium"
                  disabled={savingScore}
                >
                  취소
                </button>
                <button
                  onClick={saveScore}
                  disabled={savingScore}
                  className="bg-primary-solid hover:bg-primary-solid-hover text-white px-6 py-2 rounded-md font-medium disabled:opacity-50"
                >
                  {savingScore ? "저장 중..." : "저장"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Players */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Team A */}
          <div className="bg-bg-primary rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-text-primary mb-4 border-b-2 border-blue-500 pb-2">
              팀 A
            </h3>
            <div className="space-y-2">
              {eventGame.playerA.map((player) => (
                <div key={player.id} className="p-3 bg-bg-secondary rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-text-primary">
                      {player.name}
                    </span>
                    <div className="flex items-center space-x-2">
                      {player.type === "guest" && (
                        <span className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded">
                          게스트
                        </span>
                      )}
                      <span className="text-sm text-text-tertiary">
                        티어 {player.tier}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team B */}
          <div className="bg-bg-primary rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-text-primary mb-4 border-b-2 border-red-500 pb-2">
              팀 B
            </h3>
            <div className="space-y-2">
              {eventGame.playerB.map((player) => (
                <div key={player.id} className="p-3 bg-bg-secondary rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-text-primary">
                      {player.name}
                    </span>
                    <div className="flex items-center space-x-2">
                      {player.type === "guest" && (
                        <span className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded">
                          게스트
                        </span>
                      )}
                      <span className="text-sm text-text-tertiary">
                        티어 {player.tier}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quarters */}
        {eventGame.type === "quarter" && eventGame.quarters && eventGame.quarters.length > 0 && (
          <div className="bg-bg-primary rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-text-primary mb-4">쿼터별 점수</h2>
            <div className="space-y-3">
              {eventGame.quarters.map((quarter) => (
                <div
                  key={quarter.quarter}
                  className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg"
                >
                  <span className="font-medium text-text-primary w-24">
                    {quarter.quarter}쿼터
                  </span>
                  <div className="flex items-center space-x-8">
                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {quarter.scoreA}
                    </span>
                    <span className="text-text-tertiary">-</span>
                    <span className="text-xl font-bold text-red-600 dark:text-red-400">
                      {quarter.scoreB}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments */}
        <div className="bg-bg-primary rounded-lg shadow-md mb-8">
          <div className="px-6 py-4 border-b border-border-primary">
            <h2 className="text-xl font-semibold text-text-primary">댓글 ({comments.length})</h2>
          </div>
          <div className="p-6">
            <div className="mb-6">
              <textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="댓글을 입력하세요..."
                className="w-full px-3 py-2 border border-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary-solid bg-bg-primary text-text-primary"
                rows={3}
              />
              <div className="mt-2 flex justify-end">
                <button
                  onClick={postComment}
                  disabled={!commentContent.trim() || postingComment}
                  className="bg-primary-solid hover:bg-primary-solid-hover text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                >
                  {postingComment ? "등록 중..." : "댓글 등록"}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {comments.length === 0 ? (
                <div className="text-center py-8 text-text-muted">
                  아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="border-b border-border-primary pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {comment.userImage ? (
                            <img
                              className="h-10 w-10 rounded-full"
                              src={comment.userImage}
                              alt={comment.userName}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-bg-tertiary flex items-center justify-center">
                              <span className="text-sm font-medium text-text-secondary">
                                {comment.userName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-text-primary">
                              {comment.userName}
                            </span>
                            <span className="text-sm text-text-tertiary">
                              {new Date(comment.createdAt).toLocaleString("ko-KR")}
                            </span>
                          </div>
                          <p className="mt-1 text-text-secondary">{comment.content}</p>
                        </div>
                      </div>
                      {(comment.userId === session.user?.id || isManager) && (
                        <button
                          onClick={() => deleteComment(comment.id)}
                          disabled={deletingComment === comment.id}
                          className="text-error-solid hover:text-red-700 text-sm font-medium disabled:opacity-50"
                        >
                          {deletingComment === comment.id ? "삭제 중..." : "삭제"}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
