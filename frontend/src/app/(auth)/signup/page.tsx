// signup/page.tsx
// 회원가입 페이지
// 성공 시 토큰 + username 저장 후 홈으로 이동

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signup, saveToken, saveUsername } from '../../lib/api'

export default function SignupPage() {
  const router = useRouter()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)

  const handleSignup = async () => {
    // 빈 필드 검사
    if (!username || !email || !password || !passwordConfirm) {
      setError('모든 항목을 입력해주세요.')
      return
    }

    // 이메일 형식 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('올바른 이메일 형식을 입력해주세요.')
      return
    }

    // 비밀번호 일치 검사
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    try {
      setIsLoading(true)
      setError('')

      const res = await signup(username, email, password)

      saveToken(res.token)
      
      // 회원가입 시 직접 입력한 username을 그대로 저장
      saveUsername(username)
      router.push('/')

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('회원가입에 실패했습니다.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">

        {/* 로고 */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 grid-cols-3 gap-0.5 rounded-sm bg-black p-2">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="rounded-sm bg-white" />
            ))}
          </div>
          <h1 className="text-2xl font-bold">Cracker</h1>
          <p className="mt-1 text-sm text-gray-500">LLM 보안 학습 플랫폼</p>
        </div>

        {/* 회원가입 폼 */}
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">이름</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="홍길동"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-black"
              onKeyDown={(e) => e.key === 'Enter' && handleSignup()}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-black"
              onKeyDown={(e) => e.key === 'Enter' && handleSignup()}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">비밀번호</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-black"
                onKeyDown={(e) => e.key === 'Enter' && handleSignup()}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-700"
              >
                {showPassword ? '숨기기' : '표시'}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">비밀번호 확인</label>
            <div className="relative">
              <input
                type={showPasswordConfirm ? 'text' : 'password'}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="비밀번호를 다시 입력하세요"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-black"
                onKeyDown={(e) => e.key === 'Enter' && handleSignup()}
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-700"
              >
                {showPasswordConfirm ? '숨기기' : '표시'}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            onClick={handleSignup}
            disabled={isLoading}
            className="w-full rounded-lg bg-black py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            {isLoading ? '가입 중...' : '회원가입'}
          </button>
        </div>

        {/* 로그인 링크 */}
        <p className="mt-6 text-center text-sm text-gray-500">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="font-medium text-black hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}