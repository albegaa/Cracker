// problems/page.tsx
// 문제 목록 페이지
// 난이도/공격 유형 필터링 및 문제 카드 렌더링

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getProblems, getSolvedProblems, isLoggedIn } from '../lib/api'
import { type Problem } from '../lib/mockData'

const difficultyLabel = {
  easy: 'easy',
  medium: 'medium',
  hard: 'Hard',
}

const difficultyStyle = {
  easy: 'bg-white text-gray-600 border border-gray-300',
  medium: 'bg-gray-100 text-gray-600 border border-gray-300',
  hard: 'bg-black text-white',
}

export default function ProblemsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // 전체 문제 목록 (API로 받아온 원본 데이터)
  const [problems, setProblems] = useState<Problem[]>([])
  const [solvedIds, setSolvedIds] = useState<string[]>([])  // 내가 해결한 문제 ID 목록
  const [isLoading, setIsLoading] = useState(true)

  // 현재 선택된 필터 상태
  // ?type= 쿼리 파라미터로 초기값 설정 (learn 페이지에서 넘어올 때 자동 필터 적용)
  const [selectedType, setSelectedType] = useState(() => searchParams.get('type') ?? 'all')
  const [selectedDiff, setSelectedDiff] = useState('all')

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/login')
      return
    }
    Promise.all([getProblems(), getSolvedProblems()]).then(([problemData, solvedData]) => {
      setProblems(problemData)
      setSolvedIds(solvedData)
      setIsLoading(false)
    })
  }, [router])

// 잠금 처리 로직
// order 기준으로 이전 문제(order - 1)가 solved에 있어야 열림
// order가 없는 문제나 첫 번째 문제(order === 1)는 항상 열림
function isLocked(problem: Problem): boolean {
  if (!problem.order || problem.order === 1) return false
  const prevProblem = problems.find((p) => p.order === problem.order! - 1)
  if (!prevProblem) return false
  return !solvedIds.includes(prevProblem.id)
}

  // 필터링 로직
  // problems 배열에서 선택된 조건에 맞는 문제만 고름
  const filteredProblems = problems.filter((problem) => {
    const matchType = selectedType === 'all' || problem.attack_type === selectedType
    const matchDiff = selectedDiff === 'all' || problem.difficulty === selectedDiff
    return matchType && matchDiff  // 두 조건 모두 만족해야 통과
  })

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">

      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black">연습 문제</h1>
        <p className="mt-2 text-sm text-gray-500">문제를 선택하고 실력을 테스트해보세요.</p>
      </div>

      {/* 필터 드롭다운 2개 */}
      <div className="mb-8 flex gap-4">

        {/* 공격 유형 필터 */}
        {/* selectedType 상태가 바뀌면 filteredProblems가 자동으로 다시 계산됨 */}
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-black"
        >
          <option value="all">공격 유형 - 전체</option>
          <option value="prompt_injection">프롬프트 인젝션</option>
          <option value="prompt_leaking">프롬프트 리킹</option>
          <option value="jailbreak">탈옥</option>
          <option value="obfuscation">난독화</option>
          <option value="challenge">챌린지</option>
        </select>

        {/* 난이도 필터 */}
        <select
          value={selectedDiff}
          onChange={(e) => setSelectedDiff(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-black"
        >
          <option value="all">모든 난이도</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {/* 문제 카드 그리드 */}
      {isLoading ? (
        <p className="text-sm text-gray-400">불러오는 중...</p>
      ) : filteredProblems.length === 0 ? (
        // 필터 결과가 없을 때
        <p className="text-sm text-gray-400">해당하는 문제가 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProblems.map((problem) => {
            const locked = isLocked(problem)
            return (
              <div
                key={problem.id}
                className={`flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-6 ${locked ? 'opacity-50' : ''}`}
              >
                {/* 뱃지 */}
                <div className="mb-4 flex items-center justify-between">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${difficultyStyle[problem.difficulty]}`}>
                    {difficultyLabel[problem.difficulty]}
                  </span>
                  {/* 잠금 아이콘 */}
                  {locked && (
                    <span className="text-sm text-gray-400">🔒</span>
                  )}
                </div>

                {/* 문제 정보 */}
                <div className="mb-6 flex-1">
                  <h2 className="mb-2 text-base font-semibold text-black">{problem.title}</h2>
                  <p className="text-sm leading-relaxed text-gray-500">{problem.description}</p>
                </div>

                {/* 시작하기 / 잠금 버튼 */}
                <button
                  onClick={() => !locked && router.push(`/problems/${problem.id}`)}
                  disabled={locked}
                  className={`w-full rounded-lg py-2.5 text-sm font-medium transition-opacity
                    ${locked
                      ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                      : 'bg-black text-white hover:opacity-80'
                    }`}
                >
                  {locked ? '이전 문제를 먼저 풀어주세요' : '시작하기'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}