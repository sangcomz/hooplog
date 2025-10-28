"use client"

import { useSession } from "@/lib/auth-client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"

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

interface Game {
  id: string
  teamId: string
  creatorId: string
  date: number
  location?: string
  description?: string
  creator: User
  attendances: Attendance[]
}

export default function GameDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const teamId = params.id as string
  const gameId = params.gameId as string
  const [game, setGame] = useState<Game | null>(null)
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showGuestModal, setShowGuestModal] = useState(false)
  const [guestForm, setGuestForm] = useState({ name: "", tier: "C" })
  const [addingGuest, setAddingGuest] = useState(false)
  const [isManager, setIsManager] = useState(false)

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
      const [gameResponse, guestsResponse, teamResponse] = await Promise.all([
        fetch(`/api/teams/${teamId}/games/${gameId}`),
        fetch(`/api/teams/${teamId}/games/${gameId}/guests`),
        fetch(`/api/teams/${teamId}`),
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
        return "bg-green-100 text-green-800"
      case "absent":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
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
        return "bg-yellow-100 text-yellow-800"
      case "B":
        return "bg-orange-100 text-orange-800"
      case "C":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push(`/team/${teamId}`)}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← 팀으로 돌아가기
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{session.user?.name}님</span>
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
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">경기 정보</h1>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-500">날짜</span>
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
                <span className="text-sm text-gray-500">장소</span>
                <p className="text-lg font-medium">{game.location}</p>
              </div>
            )}
            {game.description && (
              <div>
                <span className="text-sm text-gray-500">설명</span>
                <p className="text-lg">{game.description}</p>
              </div>
            )}
            <div>
              <span className="text-sm text-gray-500">생성자</span>
              <p className="text-lg font-medium">{game.creator.name}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">내 출석 상태</h2>
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
          <div className="text-center p-4 bg-white rounded-lg shadow-md">
            <div className="text-3xl font-bold text-green-600">{attendCount}</div>
            <div className="text-sm text-gray-600">참석</div>
          </div>
          <div className="text-center p-4 bg-white rounded-lg shadow-md">
            <div className="text-3xl font-bold text-red-600">{absentCount}</div>
            <div className="text-sm text-gray-600">불참</div>
          </div>
          <div className="text-center p-4 bg-white rounded-lg shadow-md">
            <div className="text-3xl font-bold text-yellow-600">{pendingCount}</div>
            <div className="text-sm text-gray-600">미정</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">게스트 ({guests.length}명)</h2>
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
            <div className="px-6 py-8 text-center text-gray-500">
              등록된 게스트가 없습니다.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {guests.map((guest) => (
                <div key={guest.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-purple-300 flex items-center justify-center">
                        <span className="text-sm font-medium text-purple-700">
                          {guest.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{guest.name}</div>
                      <div className="text-xs text-gray-500">게스트 (자동 참석)</div>
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

        <div className="bg-indigo-100 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">팀 매칭</h3>
              <p className="text-sm text-gray-600">
                참석자를 기반으로 팀을 자동으로 조합합니다.
              </p>
            </div>
            <button
              onClick={() => router.push(`/team/${teamId}/game/${gameId}/match`)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md font-medium"
            >
              팀 매칭 보기
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              출석 현황 ({game.attendances.length}명)
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
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
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {attendance.user.name?.charAt(0).toUpperCase() || "?"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {attendance.user.name}
                    </div>
                    <div className="text-sm text-gray-500">{attendance.user.email}</div>
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
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">게스트 추가</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이름 *
                </label>
                <input
                  type="text"
                  value={guestForm.name}
                  onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="게스트 이름 입력"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  티어 *
                </label>
                <select
                  value={guestForm.tier}
                  onChange={(e) => setGuestForm({ ...guestForm, tier: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
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
