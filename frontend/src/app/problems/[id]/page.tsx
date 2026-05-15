// problems/[id]/page.tsx
// 실습 페이지
// 문제 정보 확인 + 채팅 인터페이스로 공격 프롬프트 입력

'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getProblem, submitAttack, isLoggedIn } from '../../lib/api'
import { type Problem, type AttackResponse } from '../../lib/mockData'

interface Message {
  role: 'ai' | 'user'
  content: string
  result?: AttackResponse
}

const difficultyStyle: Record<string, string> = {
  easy: 'bg-white text-gray-600 border border-gray-300',
  medium: 'bg-gray-100 text-gray-600 border border-gray-300',
  hard: 'bg-black text-white',
}

const attackTypeGuide: Record<string, string> = {
  prompt_injection: 'AI가 숨기고 있는 비밀 정보를 프롬프트 조작으로 끌어내보세요.',
  prompt_leaking: '시스템에 숨겨진 지시사항을 프롬프트를 통해 유출시켜보세요.',
  jailbreak: '프롬프트를 창의적으로 활용해 AI의 제한을 풀어보세요.',
  obfuscation: '다양한 우회 기법으로 필터를 속이고 공격에 성공해보세요.',
  challenge: '지금까지 배운 모든 기법을 총동원해 최고 난이도의 방어를 뚫어보세요.',
}

function getResultMessage(response: AttackResponse): { message: string; color: string } {
  if (response.blocked_at === 'input' && !response.is_success) {
    return { message: '입력 단계에서 공격 패턴이 감지되었습니다.', color: 'bg-red-50 border-red-200 text-red-700' }
  }
  if (response.blocked_at === 'output' && !response.is_success) {
    return { message: 'LLM 응답에 기밀 정보가 포함되어 차단되었습니다.', color: 'bg-orange-50 border-orange-200 text-orange-700' }
  }
  if (response.blocked_at === '' && !response.is_success) {
    return { message: 'AI가 공격을 방어했습니다.', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' }
  }
  if (response.blocked_at === '' && response.is_success) {
    return { message: '🎉 공격 성공!', color: 'bg-green-50 border-green-200 text-green-700' }
  }
  return { message: '', color: '' }
}

const INITIAL_MESSAGE: Message = {
  role: 'ai',
  content: '안녕하세요! 저는 AI 어시스턴트 크래커입니다. 무엇을 도와드릴까요?',
}

export default function PracticePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [problem, setProblem] = useState<Problem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [error, setError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)              // 공격 성공 여부
  const [showExitConfirm, setShowExitConfirm] = useState(false)  // 종료 확인 멘트 표시 여부

  const chatBottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/login')
      return
    }
    getProblem(id)
      .then((data) => {
        setProblem(data)
        setIsLoading(false)
      })
      .catch(() => {
        setError('문제를 찾을 수 없습니다.')
        setIsLoading(false)
      })
  }, [id, router])

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!isSending) {
      inputRef.current?.focus()
    }
  }, [isSending])

  const handleSubmit = async () => {
    if (!input.trim() || isSending) return

    const userMessage: Message = { role: 'user', content: input.trim() }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsSending(true)
    setError('')

    try {
      const response = await submitAttack(id, userMessage.content)

      // 공격 성공 시 state 업데이트
      if (response.is_success) {
        setIsSuccess(true)
      }

      if (response.blocked_at !== 'input') {
        const aiMessage: Message = {
          role: 'ai',
          content: response.reply,
          result: response,
        }
        setMessages((prev) => [...prev, aiMessage])
      } else {
        const blockedMessage: Message = {
          role: 'ai',
          content: '',
          result: response,
        }
        setMessages((prev) => [...prev, blockedMessage])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleReset = () => {
    setMessages([INITIAL_MESSAGE])
    setInput('')
    setError('')
    setShowHint(false)
    setShowExitConfirm(false)
    setIsSuccess(false)
    inputRef.current?.focus()
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-100 px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm text-gray-400">불러오는 중...</p>
        </div>
      </main>
    )
  }

  if (error && !problem) {
    return (
      <main className="min-h-screen bg-gray-100 px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-12">
      <div className="mx-auto max-w-3xl space-y-6">

        {/* 뒤로가기 버튼 */}
        <button
          onClick={() => router.push('/problems')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          문제 목록으로
        </button>

        {/* 문제 정보 카드 */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${difficultyStyle[problem!.difficulty]}`}>
              {problem!.difficulty}
            </span>
            <h1 className="text-xl font-bold text-black">{problem!.title}</h1>
          </div>
          {/* 목표 박스 */}
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
            <p className="mb-2 text-sm font-semibold text-black">목표:</p>
            <p className="text-sm leading-relaxed text-gray-600">
              {problem!.description}{' '}
              <span className="text-gray-800 font-medium">
                {attackTypeGuide[problem!.attack_type] ?? ''}
              </span>
            </p>
          </div>
        </div>

        {/* 채팅 인터페이스 카드 */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">

          {/* Chat Interface 헤더 → bg-gray-50 */}
          <div className="flex items-center gap-2 border-b border-gray-200 px-6 py-4 bg-gray-50">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="font-semibold text-black">Chat Interface</span>
          </div>

          {/* 메시지 목록 */}
          <div className="h-96 overflow-y-auto px-6 py-4 space-y-6 bg-white">
            {messages.map((msg, idx) => (
              <div key={idx}>
                {msg.role === 'ai' ? (
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="10" rx="2" />
                        <circle cx="12" cy="5" r="2" />
                        <path d="M12 7v4" />
                        <line x1="8" y1="16" x2="8" y2="16" />
                        <line x1="16" y1="16" x2="16" y2="16" />
                      </svg>
                    </div>
                    <div className="space-y-2">
                      {msg.content && (
                        <div className="rounded-2xl rounded-tl-none bg-gray-100 px-4 py-3 text-sm text-gray-800 max-w-sm">
                          {msg.content}
                        </div>
                      )}
                      {msg.result && (
                        <div className={`rounded-lg border px-4 py-2 text-xs font-medium ${getResultMessage(msg.result).color}`}>
                          {getResultMessage(msg.result).message}
                          {msg.result.is_mocked && (
                            <span className="ml-2 text-gray-400">⚠️ 현재 테스트 모드입니다</span>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-gray-400">System</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-end gap-3">
                    <div className="space-y-1 flex flex-col items-end">
                      <div className="rounded-2xl rounded-tr-none bg-black px-4 py-3 text-sm text-white max-w-sm">
                        {msg.content}
                      </div>
                      <p className="text-xs text-gray-400">You</p>
                    </div>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="gray" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          {/* 공격 성공 축하 멘트 */}
          {isSuccess && (
            <div className="mx-6 mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 font-medium">
              🎉 축하합니다! 공격에 성공했어요. 종료 버튼을 눌러 결과를 확인해보세요!
            </div>
          )}

          {/* 종료 확인 경고 멘트 */}
          {!isSuccess && showExitConfirm && (
            <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 font-medium">
              ⚠️ 아직 문제를 풀지 못했어요. 정말 종료하시겠습니까?
            </div>
          )}

          {/* 힌트 표시 영역 */}
          {showHint && problem!.hint && (
            <div className="mx-6 mt-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
              💡 {problem!.hint}
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-600">
              {error}
            </div>
          )}

          {/* 입력창 + 버튼 영역 → bg-gray-50 */}
          <div className="border-t border-gray-200 px-6 py-4 space-y-3 bg-gray-50">
            <div className="flex items-center gap-3">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter your prompt"
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-black"
              />
              <button
                onClick={handleSubmit}
                disabled={isSending || !input.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black text-white transition-opacity hover:opacity-80 disabled:opacity-40"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>

            {/* 힌트 / 초기화 버튼 */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowHint((prev) => !prev)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-600 transition-colors hover:border-black hover:text-black"
              >
                {showHint ? '힌트 닫기' : '힌트'}
              </button>
              <button
                onClick={handleReset}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-600 transition-colors hover:border-black hover:text-black"
              >
                초기화
              </button>
            </div>
          </div>
        </div>

        {/* 종료 버튼 영역 - 채팅 카드 바깥 */}
        <div className="flex justify-end">
          <button
            onClick={() => {
              if (isSuccess) {
                router.push(`/problems/${id}/result`)
              } else if (showExitConfirm) {
                // 이번 시도에서 성공하지 않고 종료 — 과거 성공 로그와 구분
                router.push(`/problems/${id}/result?outcome=fail`)
              } else {
                setShowExitConfirm(true)
              }
            }}
            className="rounded-lg border border-gray-300 bg-white px-6 py-2 text-sm text-gray-600 transition-colors hover:border-black hover:text-black"
          >
            {showExitConfirm && !isSuccess ? '정말 종료할게요' : '종료'}
          </button>
        </div>

      </div>
    </main>
  )
}