import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware } from './src/middleware/auth'

export function middleware(request: NextRequest) {
  // 認証ミドルウェアを有効化
  return authMiddleware(request)
}

// ミドルウェアを実行するパスの設定
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - manifest.webmanifest (PWA manifest)
     * - robots.txt (robots file)
     * - sitemap.xml (sitemap file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public|manifest.webmanifest|manifest.json|robots.txt|sitemap.xml|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.ico).*)',
  ],
}
