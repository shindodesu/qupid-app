import { NextRequest, NextResponse } from 'next/server'

// 認証なしでアクセス可能なページ（ログイン・登録関連のみ）
const AUTH_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/email-login',
]

// 初回プロフィール入力ページ（認証必要）
const INITIAL_PROFILE_ROUTE = '/initial-profile'

// 静的リソース（認証不要）
const PUBLIC_RESOURCES = [
  '/manifest.webmanifest',
  '/manifest.json',
  '/robots.txt',
  '/sitemap.xml',
  '/favicon.ico',
  '/icon.png',
  '/apple-icon.png',
  '/sw-custom.js',
  '/sw.js',
]

export function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  console.log(`[Middleware] Request to: ${pathname}`)
  
  // 静的リソースは認証チェックをスキップ
  if (PUBLIC_RESOURCES.some(resource => pathname === resource)) {
    console.log(`[Middleware] Public resource, allowing access: ${pathname}`)
    return NextResponse.next()
  }
  
  // 認証トークンを取得
  const token = request.cookies.get('auth-token')?.value
  
  // 認証状態を判定
  const isAuthenticated = !!token
  
  console.log(`[Middleware] Auth status: ${isAuthenticated ? 'authenticated' : 'not authenticated'}`)

  // 認証ページ（ログイン・登録）へのアクセス
  if (AUTH_ROUTES.some(route => pathname.startsWith(route))) {
    console.log(`[Middleware] Auth route detected: ${pathname}`)
    if (isAuthenticated) {
      // 認証済みの場合はホームページにリダイレクト
      console.log(`[Middleware] Already authenticated, redirecting to home`)
      return NextResponse.redirect(new URL('/home', request.url))
    }
    console.log(`[Middleware] Not authenticated, allowing access to auth page`)
    return NextResponse.next()
  }

  // 未認証の場合は全てログインページにリダイレクト
  if (!isAuthenticated) {
    console.log(`[Middleware] Not authenticated, redirecting to login: ${pathname}`)
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 認証済みの場合は全てのページにアクセス可能
  console.log(`[Middleware] Authenticated, allowing access: ${pathname}`)
  return NextResponse.next()
}

// 認証状態の確認用ヘルパー関数
export function isAuthenticated(request: NextRequest): boolean {
  const token = request.cookies.get('auth-token')?.value
  return !!token
}

// 認証ページかどうかを判定
export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(route => pathname.startsWith(route))
}

// 静的リソースかどうかを判定
export function isPublicResource(pathname: string): boolean {
  return PUBLIC_RESOURCES.some(resource => pathname === resource)
}
