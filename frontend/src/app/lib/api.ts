// api.ts
// API 호출 함수 모음
// USE_MOCK = true로 설정 시   →  Mock 데이터 반환
// USE_MOCK = false로 설정 시  →  백엔드 API 호출

import {
    mockProblems,
    mockAttackResponse,
    mockLogs,
    type Problem,
    type AttackResponse,
    type AttackLog,
  } from './mockData'
  
  // TODO: 백엔드 연동 시 false 변경 필요
  const USE_MOCK = true // false
  const BASE_URL = 'http://localhost:3000'  // 'https://cracker-api.onrender.com'
  
  // 토큰 관리 함수 ─────────────────────────────────────────
  
  export function saveToken(token: string) {  // 토큰 저장
    localStorage.setItem('token', token)
  }
  
  export function getToken(): string | null {  // 토큰 조회
    return localStorage.getItem('token')
  }
  
  export function removeToken() {  // 토큰 삭제
    localStorage.removeItem('token')
    localStorage.removeItem('username')
  }
  
  export function isLoggedIn(): boolean {  // 로그인 여부 확인
    return !!getToken()
  }

  // username을 localStorage에 저장 (로그인/회원가입 시)
  export function saveUsername(username: string) {
    localStorage.setItem('username', username)
  }
  
  // localStorage에서 username 조회
  // Navbar에서 현재 로그인한 사용자의 username 표시하기 위함
  export function getUsername(): string | null {
    return localStorage.getItem('username')
  }
  
  // localStorage에서 username 삭제 (로그아웃 시)
  export function removeUsername() {
    localStorage.removeItem('username')
  }
  
  // Auth API 호출 함수 ─────────────────────────────────────────
  
  // 회원가입
  export async function signup(
    username: string,
    email: string,
    password: string
  ): Promise<{ message: string; token: string }> {
    if (USE_MOCK) {
      await delay(500)
      return { message: '회원가입 성공', token: 'mock-token-1234' }
    }
  
    const res = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    })
  
    if (res.status === 400) throw new Error('이미 사용 중인 이메일입니다.')
    if (res.status === 422) throw new Error('올바른 이메일 형식을 입력해주세요.')
    if (!res.ok) throw new Error('회원가입에 실패했습니다.')
  
    return res.json()
  }
  
  // 로그인
  export async function login(
    email: string,
    password: string
  ): Promise<{ message: string; token: string; username: string }> {
    if (USE_MOCK) {
      await delay(500)
      return {
        message: '로그인 성공',
        token: 'mock-token-1234',
        username: email.split('@')[0],
      }
    }
  
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
  
    if (res.status === 401) {
        throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.')
      }
      if (!res.ok) {
        throw new Error('로그인에 실패했습니다.')
      }
  
    return res.json()
  }
  
  // 문제 API 호출 함수 ─────────────────────────────────────────
  
  // 문제 목록 조회
  export async function getProblems(): Promise<Problem[]> {
    if (USE_MOCK) {
      await delay(300)
      return mockProblems
    }
  
    const res = await fetch(`${BASE_URL}/api/problems/`)
    if (!res.ok) throw new Error('문제 목록을 불러오지 못했습니다.')
    return res.json()
  }
  
  // 문제 단건 조회
  export async function getProblem(id: string): Promise<Problem> {
    if (USE_MOCK) {
      await delay(300)
      const problem = mockProblems.find((p) => p.id === id)
      if (!problem) throw new Error('문제를 찾을 수 없습니다.')
      return problem
    }
  
    const res = await fetch(`${BASE_URL}/api/problems/${id}`)
    if (!res.ok) throw new Error('문제를 찾을 수 없습니다.')
    return res.json()
  }
  
  // 공격 API 호출 함수 ─────────────────────────────────────────
  
  // 공격 실습 실행 (인증 필요)
  export async function submitAttack(
    problemId: string,
    userPrompt: string
  ): Promise<AttackResponse> {
    if (USE_MOCK) {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: userPrompt }] }],
          }),
        }
      )
      const data = await res.json()

      if (!res.ok || !data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('AI 응답을 받지 못했습니다. 잠시 후 다시 시도해주세요.')
      }

      const reply = data.candidates[0].content.parts[0].text
      return {
        reply,
        is_success: false,
        blocked_at: '',
        is_mocked: true,
      }
    }
  
    const token = getToken()
    const res = await fetch(`${BASE_URL}/api/attack/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ problem_id: problemId, user_prompt: userPrompt }),
    })
  
    if (res.status === 401) {
      removeToken()
      window.location.href = '/login'
      throw new Error('로그인이 필요합니다.')
    }
    if (res.status === 404) throw new Error('문제를 찾을 수 없습니다.')
    if (!res.ok) throw new Error('공격 실행에 실패했습니다.')
  
    return res.json()
  }
  
  // 공격 로그 API 호출 함수 ─────────────────────────────────────────
  
  // 문제별 로그 조회 (인증 필요)
  export async function getProblemLogs(problemId: string): Promise<AttackLog[]> {
    if (USE_MOCK) {
      await delay(300)
      return mockLogs.filter((log) => log.problem_id === problemId)
    }
  
    const token = getToken()
    const res = await fetch(`${BASE_URL}/api/logs/problem/${problemId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  
    if (res.status === 401) {
      removeToken()
      window.location.href = '/login'
      throw new Error('로그인이 필요합니다.')
    }
  
    if (!res.ok) throw new Error('로그를 불러오지 못했습니다.')
    return res.json()
  }

  // 내가 해결한 문제 목록 조회 (인증 필요)
  export async function getSolvedProblems(): Promise<string[]> {
    if (USE_MOCK) {
      await delay(300)
      return ['test-001', 'test-002', 'test-003']  // 1, 2번 푼 상태 → 3번까지 열려야 함
    }

    const token = getToken()
    const res = await fetch(`${BASE_URL}/api/logs/me/solved`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (res.status === 401) {
      removeToken()
      window.location.href = '/login'
      throw new Error('로그인이 필요합니다.')
    }

    if (!res.ok) throw new Error('해결한 문제 목록을 불러오지 못했습니다.')

    const data = await res.json()
    return data.solved_problem_ids  
  }

  // Mock 딜레이 함수 ───────────────────────────────────
  
  // Mock 딜레이 함수 ───────────────────────────────────
  // 실제 API 로딩처럼 보이기 위해

  function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }