// Navbar.tsx
// 공통 네비게이션 바 (로그인/회원가입 페이지 제외 모든 페이지에 표시)
// 로그인 상태에 따라 우측에 사용자명 + 로그아웃 / 로그인 버튼 표시

'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { isLoggedIn, removeToken, getUsername } from '../lib/api'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    removeToken()
    router.push('/login')
  }

  if (pathname === '/login' || pathname === '/signup') {
    return null
  }

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/learn', label: 'Learn' },
    { href: '/problems', label: 'Practice' },
    { href: '/ranking', label: 'Ranking' },
    { href: '/mypage', label: 'My Page' },
  ]

  const loggedIn = isLoggedIn()
  const username = getUsername() || '사용자'

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 grid-cols-3 gap-0.5 rounded-sm bg-black p-1.5">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="rounded-sm bg-white" />
            ))}
          </div>
          <span className="text-lg font-semibold">Cracker</span>
        </Link>

        <div className="flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm transition-colors ${
                pathname === link.href
                  ? 'font-semibold text-black'
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              {link.label}
            </Link>
          ))}

          {loggedIn ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">{username} 님</span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-black transition-colors"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-sm text-gray-500 hover:text-black transition-colors"
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}