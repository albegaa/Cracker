// page.tsx
// 홈(메인인) 페이지
// 플랫폼 소개 및 학습/실습 페이지로 이동하는 버튼 제공

'use client'

import Link from 'next/link'

const features = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 5h7" /><path d="M9 3v2c0 4.418-2.239 8-5 8" />
        <path d="M11 17a9 9 0 0 1-8-4" /><path d="M21 5h-7" />
        <path d="M15 3v2c0 4.418 2.239 8 5 8" /><path d="M13 17a9 9 0 0 0 8-4" />
      </svg>
    ),
    title: '한국어 특화 공격 유형 학습',
    description: '한국어의 언어적 특성을 반영한 학습 및 실습',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    ),
    title: 'CTF / 워게임 방식 실습',
    description: '다양한 문제에 도전하고 보상을 획득하세요',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    title: '공격 결과 시각화 및 피드백 제공',
    description: '내 공격에 대한 설명과 분석을 확인하세요',
  },
]

export default function HomePage() {
  return (
    <main className="flex min-h-[calc(100vh-65px)] flex-col items-center justify-start bg-white px-6 pt-24">

      {/* 히어로 섹션 */}
      <div className="flex flex-col items-center text-center">

        {/* 로고 */}
        <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-black">
          <div className="grid h-10 w-10 grid-cols-3 gap-0.5 p-1">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="rounded-sm bg-white" />
            ))}
          </div>
        </div>

        {/* 타이틀 */}
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-black">
          크래커 - LLM 보안 학습 플랫폼
        </h1>
        <p className="mb-10 text-base text-gray-500">
          지금 바로 프롬프트 인젝션을 학습하고, 한국어 특화 AI와 직접 실습하세요.
        </p>

        {/* CTA 버튼 */}
        <div className="flex gap-4">
          <Link
            href="/learn"
            className="rounded-lg bg-black px-10 py-3 text-sm font-medium text-white transition-opacity hover:opacity-80"
          >
            학습하러 가기
          </Link>
          <Link
            href="/problems"
            className="rounded-lg border border-black px-10 py-3 text-sm font-medium text-black transition-colors hover:bg-gray-50"
          >
            실습하러 가기
          </Link>
        </div>
      </div>

      {/* 피처 카드 섹션 */}
      <div className="mt-20 grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="rounded-xl border border-gray-200 bg-white p-6"
          >
            <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-black">
              {feature.icon}
            </div>
            <h3 className="mb-2 text-sm font-semibold text-black">{feature.title}</h3>
            <p className="text-sm text-gray-500">{feature.description}</p>
          </div>
        ))}
      </div>
    </main>
  )
}