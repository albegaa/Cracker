// mypage/page.tsx
// 마이 페이지
// 프로필 정보, 통계, 뱃지(틀), 최근 해결한 문제 목록 표시

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getUsername, getSolvedProblems, getProblems, isLoggedIn } from '../lib/api'
import { type Problem } from '../lib/mockData'

// 스프린트 2 예정 — 더미 데이터 하드코딩
const DUMMY_RANK = 3
const DUMMY_POINTS = 2180
const DUMMY_STREAK = 12
const DUMMY_BADGES = [
  { icon: '🏆', label: '첫번째 해결' },
  { icon: '🎯', label: '10문제 풀이' },
  { icon: '🔥', label: '7일 연속 기록' },
  { icon: '🎓', label: '랭킹 1위 달성' },
]

const attackTypeLabel: Record<string, string> = {
  prompt_injection: 'Prompt Injection',
  prompt_leaking: 'Prompt Leaking',
  jailbreak: 'Jailbreak',
  obfuscation: 'Obfuscation',
  challenge: 'Challenge',
}

const attackTypeStyle: Record<string, string> = {
  prompt_injection: 'bg-gray-100 text-gray-600',
  prompt_leaking: 'bg-gray-100 text-gray-600',
  jailbreak: 'bg-gray-100 text-gray-600',
  obfuscation: 'bg-gray-100 text-gray-600',
  challenge: 'bg-gray-100 text-gray-600',
}

export default function MyPage() {
  const router = useRouter()

  const [username, setUsername] = useState<string>('')
  const [solvedIds, setSolvedIds] = useState<string[]>([])
  const [solvedProblems, setSolvedProblems] = useState<Problem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/login')
      return
    }

    const name = getUsername() ?? ''
    setUsername(name)

    Promise.all([getSolvedProblems(), getProblems()])
      .then(([solvedData, allProblems]) => {
        setSolvedIds(solvedData)
        // 해결한 문제만 필터링 (order 기준 정렬)
        const solved = allProblems
          .filter((p) => solvedData.includes(p.id))
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        setSolvedProblems(solved)
      })
      .catch((err) => {
        if (err.message?.includes('로그인')) {
          router.push('/login')
        }
      })
      .finally(() => setIsLoading(false))
  }, [router])

  // 이니셜 아바타 (username 첫 글자)
  const initial = username ? username[0].toUpperCase() : '?'

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-4xl px-6 py-12 space-y-6">

        {/* ── 프로필 카드 ── */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            {/* 아바타 + 이름 */}
            <div className="flex items-center gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gray-200 text-2xl font-bold text-gray-500">
                {isLoading ? '?' : initial}
              </div>
              <div>
                <p className="text-xl font-bold text-black">
                  {isLoading ? '불러오는 중...' : username}
                </p>
                <p className="mt-1 text-sm text-gray-400">2024년 가입함</p>
              </div>
            </div>

            {/* 랭크 + 포인트 (스프린트 2 예정 — 더미) */}
            <div className="flex flex-col items-end gap-2">
              <span className="flex w-32 items-center justify-center rounded-full bg-black py-1.5 text-sm font-semibold text-white">
                Rank #{DUMMY_RANK}
              </span>
              <span className="flex w-32 items-center justify-center rounded-full border border-gray-200 bg-white py-1.5 text-sm font-medium text-gray-700">
                {DUMMY_POINTS.toLocaleString()} points
              </span>
            </div>
          </div>
        </div>

        {/* ── 통계 카드 3개 ── */}
        <div className="grid grid-cols-3 gap-4">
          {/* 해결한 문제 수 (실제 API) */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 text-center">
            <p className="text-xl font-semibold text-black">
              {isLoading ? '-' : solvedIds.length}개
            </p>
            <p className="mt-1 text-sm text-gray-400">해결한 문제</p>
          </div>
          {/* 수집한 뱃지 (더미) */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 text-center">
            <p className="text-xl font-semibold text-black">{DUMMY_BADGES.length}개</p>
            <p className="mt-1 text-sm text-gray-400">수집한 뱃지</p>
          </div>
          {/* 연속 기록 (더미) */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 text-center">
            <p className="text-xl font-semibold text-black">{DUMMY_STREAK} Days</p>
            <p className="mt-1 text-sm text-gray-400">연속 기록</p>
          </div>
        </div>

        {/* ── 수집한 뱃지 (더미) ── */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-black">수집한 뱃지</h2>
          <div className="flex gap-4 overflow-x-auto pb-1">
            {DUMMY_BADGES.map((badge, i) => (
              <div
                key={i}
                className="flex shrink-0 flex-col items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-6 py-5"
              >
                <span className="text-3xl">{badge.icon}</span>
                <p className="text-xs font-medium text-gray-600 whitespace-nowrap">{badge.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── 최근 해결한 문제 (실제 API) ── */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-black">최근 해결한 문제</h2>

          {isLoading ? (
            <p className="text-sm text-gray-400">불러오는 중...</p>
          ) : solvedProblems.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 py-10 text-center">
              <p className="text-sm text-gray-400">아직 해결한 문제가 없어요.</p>
              <button
                onClick={() => router.push('/problems')}
                className="mt-3 rounded-lg bg-black px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-80"
              >
                문제 풀러 가기
              </button>
            </div>
          ) : (
            <ul className="space-y-3">
              {solvedProblems.map((problem) => (
                <li
                  key={problem.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    {/* 체크 아이콘 */}
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-black">
                      <svg
                        className="h-3.5 w-3.5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-black">{problem.title}</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        attackTypeStyle[problem.attack_type] ?? 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {attackTypeLabel[problem.attack_type] ?? problem.attack_type}
                    </span>
                  </div>
                  {/* 다시 풀기 버튼 */}
                  <button
                    onClick={() => router.push(`/problems/${problem.id}`)}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-opacity hover:opacity-70"
                  >
                    다시 풀기
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </main>
  )
}