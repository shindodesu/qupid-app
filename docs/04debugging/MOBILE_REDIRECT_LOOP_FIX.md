# スマホアプリでのリダイレクトループ問題の修正

## 問題の概要

スマホでアプリをダウンロードして開くと、「リダイレクト中です」という表示がずっと出続ける問題が発生していました。

## 根本原因

### 1. 認証状態の初期化タイミングの問題

**問題の流れ**:
1. アプリが起動すると、`AuthProvider`が認証状態の初期化を開始
2. しかし、初期化が完了する前に、各コンポーネント（`page.tsx`、`DashboardLayoutClient`、`AuthLayoutClient`）が認証状態をチェック
3. 初期化前の状態では`isAuthenticated`が`false`と判定される
4. 未認証と判断してログインページにリダイレクト
5. しかし、実際にはCookieやLocalStorageにトークンが存在する
6. トークンを検出して再度リダイレクト
7. **無限ループ発生**

**問題のコード**: `frontend/src/app/page.tsx`

```typescript
// 修正前: ローディング状態をチェックしていない
useEffect(() => {
  if (isAuthenticated) {
    router.replace('/home')
  } else {
    router.replace('/auth/login')
  }
}, [isAuthenticated, router])
```

### 2. CookieとLocalStorageの同期問題（PWA環境）

**問題**:
- PWAとしてインストールされたアプリでは、CookieとLocalStorageの状態が一致しない場合がある
- サーバーサイドのミドルウェアはCookieをチェック
- クライアントサイドの認証ストアはLocalStorageをチェック
- 両者が不一致の場合、リダイレクトループが発生

**問題のコード**: `frontend/src/stores/auth.ts`

```typescript
// 修正前: CookieとLocalStorageの同期を考慮していない
initialize: async () => {
  const state = get()
  if (state.isAuthenticated && state.tokens) {
    // LocalStorageの状態のみをチェック
    // Cookieとの同期を確認していない
  }
}
```

### 3. ミドルウェアとクライアント側のリダイレクトの競合

**問題**:
- サーバーサイドのミドルウェアが`/`にアクセスして`/auth/login`にリダイレクト
- クライアントサイドの`page.tsx`も認証状態をチェックしてリダイレクト
- 両者が同時に動作して競合

**問題のコード**: `frontend/src/middleware/auth.ts`

```typescript
// 修正前: ルートパス(/)の特別処理がない
if (!isAuthenticated) {
  return NextResponse.redirect(new URL('/auth/login', request.url))
}
```

## 修正内容

### 1. ルートページ (`page.tsx`) の修正

**ファイル**: `frontend/src/app/page.tsx`

**変更内容**:
- 認証状態のローディング完了を待つように修正
- `hasRedirected` refで重複リダイレクトを防止

```typescript
// 修正後
const isLoading = useAuthLoading()
const hasRedirected = useRef(false)

useEffect(() => {
  // ローディング中はリダイレクトしない
  if (isLoading || hasRedirected.current) {
    return
  }

  // 認証状態が確定したらリダイレクト
  hasRedirected.current = true
  if (isAuthenticated) {
    router.replace('/home')
  } else {
    router.replace('/auth/login')
  }
}, [isAuthenticated, isLoading, router])
```

### 2. DashboardLayoutClient の修正

**ファイル**: `frontend/src/app/(dashboard)/DashboardLayoutClient.tsx`

**変更内容**:
- ローディング完了を待つように修正
- `router.push`を`router.replace`に変更（履歴をクリーンに保つ）

```typescript
// 修正後
useEffect(() => {
  // ローディング中または既にリダイレクト中は何もしない
  if (isLoading || redirectingRef.current) {
    return
  }
  
  // 未認証の場合はログインページへ
  if (!isAuthenticated) {
    redirectingRef.current = true
    router.replace('/auth/login')
    return
  }
  
  // プロフィール未完了の場合は初期プロフィール設定へ
  if (user && user.profile_completed === false) {
    redirectingRef.current = true
    router.replace('/initial-profile')
  }
}, [isLoading, isAuthenticated, user, router])
```

### 3. AuthLayoutClient の修正

**ファイル**: `frontend/src/app/(auth)/AuthLayoutClient.tsx`

**変更内容**:
- ローディング完了を待つように修正
- `router.push`を`router.replace`に変更

```typescript
// 修正後
useEffect(() => {
  // ローディング中または既にリダイレクト中は何もしない
  if (isLoading || redirectingRef.current) {
    return
  }
  
  // initial-profileページは認証済みユーザーもアクセス可能
  if (pathname === '/initial-profile') {
    return
  }
  
  // 認証済みの場合はホームへ
  if (isAuthenticated) {
    redirectingRef.current = true
    router.replace('/home')
  }
}, [isLoading, isAuthenticated, pathname, router])
```

### 4. 認証ストア (`auth.ts`) の修正

**ファイル**: `frontend/src/stores/auth.ts`

**変更内容**:
- CookieとLocalStorageのトークンを同期
- PWA環境でも正しく動作するように改善

```typescript
// 修正後
initialize: async () => {
  console.log('[Auth] Initializing auth state...')
  set({ isLoading: true })
  
  try {
    // Cookieからトークンを取得（PWA対応）
    let tokenFromCookie: string | null = null
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';')
      const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth-token='))
      if (authCookie) {
        tokenFromCookie = authCookie.split('=')[1]?.trim() || null
      }
    }
    
    // LocalStorageからトークンを取得
    let tokenFromStorage: string | null = null
    if (typeof window !== 'undefined') {
      tokenFromStorage = localStorage.getItem('auth-token')
    }
    
    // CookieとLocalStorageのトークンを同期
    const token = tokenFromCookie || tokenFromStorage
    if (token) {
      // トークンが見つかった場合、両方に保存して同期
      if (tokenFromCookie && !tokenFromStorage) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth-token', tokenFromCookie)
        }
      }
      if (tokenFromStorage && !tokenFromCookie) {
        saveTokenToCookie(tokenFromStorage)
      }
      
      // トークンが有効な場合、ユーザー情報を取得して状態を更新
      // ... (ユーザー情報取得処理)
    }
  } catch (error) {
    console.error('[Auth] Initialization error:', error)
    set({ isLoading: false })
  }
}
```

### 5. ミドルウェア (`auth.ts`) の修正

**ファイル**: `frontend/src/middleware/auth.ts`

**変更内容**:
- ルートパス(`/`)を特別に処理
- 認証済みの場合はサーバーサイドで直接`/home`にリダイレクト

```typescript
// 修正後
// ルートパス（/）の特別処理
if (pathname === '/') {
  if (isAuthenticated) {
    console.log(`[Middleware] Root path, authenticated, redirecting to home`)
    return NextResponse.redirect(new URL('/home', request.url))
  } else {
    console.log(`[Middleware] Root path, not authenticated, redirecting to login`)
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
}
```

## 修正による改善点

1. **認証状態の初期化完了を待つ**: ローディング中はリダイレクトを実行しないため、無限ループを防止
2. **CookieとLocalStorageの同期**: PWA環境でも正しく動作するように改善
3. **ミドルウェアでのルート処理**: サーバーサイドで適切にリダイレクトすることで、クライアント側の処理を簡素化
4. **履歴のクリーンアップ**: `router.replace`を使用することで、ブラウザ履歴をクリーンに保つ

## テスト結果

- ✅ スマホでアプリを開いた際にリダイレクトループが発生しない
- ✅ 認証済みユーザーは正常にホームページに遷移
- ✅ 未認証ユーザーは正常にログインページに遷移
- ✅ PWA環境でも正常に動作

## 関連ファイル

- `frontend/src/app/page.tsx`
- `frontend/src/app/(dashboard)/DashboardLayoutClient.tsx`
- `frontend/src/app/(auth)/AuthLayoutClient.tsx`
- `frontend/src/middleware/auth.ts`
- `frontend/src/stores/auth.ts`

## コミット情報

- コミット: `18fd962` - "fix: スマホアプリでのリダイレクトループ問題を修正"

## 今後の改善点

1. 認証状態の初期化をより効率的にする
2. CookieとLocalStorageの同期をより堅牢にする
3. エラーハンドリングの改善（ネットワークエラー時の処理）

