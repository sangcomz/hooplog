"use client"

import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

interface AttendanceStat {
  userId: string
  userName: string
  userImage?: string
  totalGames: number
  attendedGames: number
  attendanceRate: number
}

interface MVPRanking {
  playerId: string
  playerName: string
  playerImage?: string
  totalVotes: number
  gamesVotedIn: number
}

interface TeamWinRate {
  teamNumber: number
  wins: number
  totalGames: number
  winRate: number
}

interface StatisticsData {
  attendanceStats: AttendanceStat[]
  mvpRankings: MVPRanking[]
  teamWinRates: TeamWinRate[]
  totalFinishedGames: number
}

interface Props {
  teamId: string
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function TeamStatistics({ teamId }: Props) {
  const [statistics, setStatistics] = useState<StatisticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStatistics()
  }, [teamId])

  const fetchStatistics = async () => {
    try {
      const response = await fetch(`/api/teams/${teamId}/statistics`)
      if (response.ok) {
        const data = await response.json()
        setStatistics(data)
      }
    } catch (error) {
      console.error("Failed to fetch statistics:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-600 dark:text-gray-400">통계 로딩 중...</div>
      </div>
    )
  }

  if (!statistics || statistics.totalFinishedGames === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-600 dark:text-gray-400">
          완료된 경기가 없습니다. 경기를 완료하면 통계를 확인할 수 있습니다.
        </div>
      </div>
    )
  }

  const attendanceChartData = statistics.attendanceStats.map(stat => ({
    name: stat.userName,
    출석률: Math.round(stat.attendanceRate * 10) / 10,
    출석: stat.attendedGames,
    전체: stat.totalGames,
  }))

  const mvpChartData = statistics.mvpRankings.map(ranking => ({
    name: ranking.playerName,
    득표수: ranking.totalVotes,
  }))

  return (
    <div className="space-y-8">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">완료된 경기</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            {statistics.totalFinishedGames}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">참여 인원</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            {statistics.attendanceStats.length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">평균 출석률</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            {statistics.attendanceStats.length > 0
              ? Math.round(
                  (statistics.attendanceStats.reduce((sum, s) => sum + s.attendanceRate, 0) /
                    statistics.attendanceStats.length) *
                    10
                ) / 10
              : 0}%
          </div>
        </div>
      </div>

      {/* Attendance Rate Chart */}
      {statistics.attendanceStats.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            팀원별 출석률
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={attendanceChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Legend />
              <Bar dataKey="출석률" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            * 출석률 = (출석 경기 수 / 전체 경기 수) × 100%
          </div>
        </div>
      )}

      {/* MVP Rankings */}
      {statistics.mvpRankings.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            MVP 누적 랭킹 (Top 10)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mvpChartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Legend />
              <Bar dataKey="득표수" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              상세 랭킹
            </h4>
            <div className="space-y-2">
              {statistics.mvpRankings.slice(0, 5).map((ranking, idx) => (
                <div
                  key={ranking.playerId}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                        idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-amber-600' : 'bg-gray-500'
                      }`}>
                        {idx + 1}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {ranking.playerName}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {ranking.gamesVotedIn}개 경기에서 득표
                      </div>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {ranking.totalVotes}표
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Team Win Rates */}
      {statistics.teamWinRates.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            팀별 승률
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statistics.teamWinRates.map(t => ({
                    name: `팀 ${t.teamNumber}`,
                    value: t.wins,
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}승`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statistics.teamWinRates.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-3">
              {statistics.teamWinRates.map((team, idx) => (
                <div
                  key={team.teamNumber}
                  className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      팀 {team.teamNumber}
                    </div>
                    <div className="text-lg font-bold" style={{ color: COLORS[idx % COLORS.length] }}>
                      {team.winRate}%
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {team.wins}승 / {team.totalGames}경기
                  </div>
                  <div className="mt-2 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${team.winRate}%`,
                        backgroundColor: COLORS[idx % COLORS.length],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
