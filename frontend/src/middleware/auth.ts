import { NextRequest, NextResponse } from 'next/server'

// 認証が必要なページのパス
const PROTECTED_ROUTES = [
  '/home',
  '/profile',
  '/settings',
  '/matches',
  '/chat',
  '/likes',
  '/search',
  '/safety',
]

// 認証済みユーザーがアクセスできないページのパス
const AUTH_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
]

// パブリックページのパス
const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
]

export function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 認証トークンを取得
  const token = request.cookies.get('auth-token')?.value
  
  // 認証状態を判定
  const isAuthenticated = !!token

  // 認証が必要なページへのアクセス
  if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      // 未認証の場合はログインページにリダイレクト
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // 認証済みユーザーが認証ページにアクセス
  if (AUTH_ROUTES.some(route => pathname.startsWith(route))) {
    if (isAuthenticated) {
      // 認証済みの場合はホームページにリダイレクト
      return NextResponse.redirect(new URL('/home', request.url))
    }
  }

  // パブリックページは常にアクセス可能
  return NextResponse.next()
}

// 認証状態の確認用ヘルパー関数
export function isAuthenticated(request: NextRequest): boolean {
  const token = request.cookies.get('auth-token')?.value
  return !!token
}

// 認証が必要なページかどうかを判定
export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route))
}

// 認証ページかどうかを判定
export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(route => pathname.startsWith(route))
}

// パブリックページかどうかを判定
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route))
}
