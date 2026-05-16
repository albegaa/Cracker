// ranking/page.tsx
// 랭킹 페이지
// 전체 더미 데이터 (Sprint 2에서 실제 API 연동 예정)

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isLoggedIn, getUsername } from '../lib/api'

// ── 더미 데이터 ─────────────────────────────────────────────
const TOP3 = [
  { rank: 1, username: '심기쁨', score: 3280, solved: 58 },
  { rank: 2, username: '조영우', score: 2450, solved: 42 },
  { rank: 3, username: '서주연', score: 2180, solved: 38 },
]

const REST = [
  { rank: 4, username: '이예원', score: 1920, solved: 35 },
  { rank: 5, username: '최호정', score: 1450, solved: 32 },
  { rank: 6, username: '김동효', score: 1270, solved: 29 },
]

const RANK_MEDAL: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
}

export default function RankingPage() {
  const router = useRouter()
  const [myUsername, setMyUsername] = useState<string>('')

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/login')
      return
    }
    setMyUsername(getUsername() ?? '')
  }, [router])

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-6 py-12 space-y-8">

        {/* ── 헤더 ── */}
        <div>
          <h1 className="text-3xl font-bold text-black">랭킹</h1>
          <p className="mt-2 text-sm text-gray-400">CRACKER 챌린지 TOP 랭커</p>
        </div>

        {/* ── TOP 3 포디움 ── */}
        <div className="grid grid-cols-3 gap-4 items-end">

          {/* 2위 */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-lg">
            <p className="mb-3 text-3xl">{RANK_MEDAL[2]}</p>
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-xl font-bold text-gray-500">
              {TOP3[1].username[0]}
            </div>
            <p className="font-semibold text-black">{TOP3[1].username}</p>
            <p className="mt-1 text-2xl font-bold text-black">
              {TOP3[1].score.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-gray-400">{TOP3[1].solved} problems solved</p>
          </div>

          {/* 1위 */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-lg">
            <p className="mb-3 text-3xl">{RANK_MEDAL[1]}</p>
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-xl font-bold text-gray-500">
              {TOP3[0].username[0]}
            </div>
            <p className="font-semibold text-black">{TOP3[0].username}</p>
            <p className="mt-1 text-2xl font-bold text-black">
              {TOP3[0].score.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-gray-400">{TOP3[0].solved} problems solved</p>
          </div>

          {/* 3위 */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-lg">
            <p className="mb-3 text-3xl">{RANK_MEDAL[3]}</p>
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-xl font-bold text-gray-500">
              {TOP3[2].username[0]}
            </div>
            <p className="font-semibold text-black">{TOP3[2].username}</p>
            <p className="mt-1 text-2xl font-bold text-black">
              {TOP3[2].score.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-gray-400">{TOP3[2].solved} problems solved</p>
          </div>

        </div>

        {/* ── 랭킹 테이블 (4위~) ── */}
        <div className="mt-10 rounded-xl border border-gray-300 bg-white overflow-hidden">
          {/* 헤더 */}
          <div className="grid grid-cols-4 border-b border-gray-100 bg-gray-100 px-6 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">Rank</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">User</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">Score</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">Solved</p>
          </div>

          {/* 행 */}
          {REST.map((entry, i) => {
            const isMe = entry.username === myUsername
            return (
              <div
                key={entry.rank}
                className={`grid grid-cols-4 px-6 py-4 ${
                  i !== REST.length - 1 ? 'border-b border-gray-100' : ''
                } ${isMe ? 'bg-gray-50 font-semibold' : ''}`}
              >
                <p className="text-sm text-gray-500">{entry.rank}</p>
                <p className="text-sm text-black">
                  {entry.username}
                  {isMe && (
                    <span className="ml-2 rounded-full bg-black px-2 py-0.5 text-xs text-white">
                      me
                    </span>
                  )}
                </p>
                <p className="text-sm text-black">{entry.score.toLocaleString()}</p>
                <p className="text-sm text-black">{entry.solved}</p>
              </div>
            )
          })}
        </div>

      </div>
    </main>
  )
}