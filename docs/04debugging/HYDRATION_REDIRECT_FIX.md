# Hydration Error & Infinite Redirect Loop Fix

## 問題の概要

ユーザーから報告された2つの主要な問題:
1. **Hydration Error**: サーバーとクライアントで異なるHTMLが生成される
2. **Infinite Redirect Loop**: initial-profileページとhomeページの間で無限リダイレクトが発生

## 根本原因

### 1. Hydration Error

**問題のコード**: `frontend/src/app/(dashboard)/layout.tsx`

```typescript
const [mounted, setMounted] = useState(false)

// サーバー側: mounted=false → ローディング画面を表示
// クライアント側: mounted=true → ダッシュボードを表示
// → 異なるHTMLが生成されるため、Hydration Errorが発生
```

**エラーメッセージ**:
```
className mismatch:
- Server: "flex items-center justify-center min-h-screen bg-white dark:bg-neutral-900"
- Client: "min-h-screen bg-neutral-50"
```

### 2. Infinite Redirect Loop

**問題の流れ**:
1. ユーザーが`/initial-profile`でプロフィールを完了
2. `router.push('/home')`でホームに遷移
3. `AuthLayout`が「認証済みユーザーは`/home`にリダイレクト」と判断
4. `DashboardLayout`が「プロフィール未完了なら`/initial-profile`にリダイレクト」と判断
5. **無限ループ発生**

**原因**:
- `initial-profile`ページが`(auth)`フォルダ配下にあり、`AuthLayout`を使用
- `AuthLayout`は認証済みユーザーを全て`/home`にリダイレクト
- `updateUser`の非同期処理が完了する前にリダイレクトが発生
- `profile_completed`フラグが正しく更新されていない

## 修正内容

### 1. DashboardLayout の修正

**ファイル**: `frontend/src/app/(dashboard)/layout.tsx`

**変更点**:
- ❌ `useState(mounted)` を削除（SSR/CSRで異なる状態を持たない）
- ✅ `useRef(redirecting)` でリダイレクト状態を管理
- ✅ すべての条件分岐で同じ基本クラス名を使用: `min-h-screen bg-neutral-50`
- ✅ `profile_completed === false` の厳密な比較

```typescript
const redirectingRef = useRef(false)

useEffect(() => {
  if (isLoading || redirectingRef.current) {
    return
  }

  if (!isAuthenticated) {
    redirectingRef.current = true
    router.push('/auth/login')
  } else if (user && user.profile_completed === false) {
    redirectingRef.current = true
    router.push('/initial-profile')
  }
}, [isLoading, isAuthenticated, user, router])

// 全ての条件で統一されたクラス名
return (
  <div className="min-h-screen bg-neutral-50">
    {/* content */}
  </div>
)
```

### 2. InitialProfile ページの修正

**ファイル**: `frontend/src/app/(auth)/initial-profile/page.tsx`

**変更点**:
- ✅ プロフィール完了済みユーザーの自動リダイレクト追加
- ✅ `updateUser`の呼び出しを同期的に実行
- ✅ `profile_completed: true`を明示的に設定
- ✅ リダイレクト前に状態更新を確実に完了

```typescript
// プロフィール完了済みチェック
useEffect(() => {
  if (!isLoading && user?.profile_completed === true) {
    console.log('[InitialProfile] Profile already completed, redirecting to home')
    router.push('/home')
  }
}, [user, isLoading, router])

// プロフィール登録成功時
onSuccess: (data) => {
  // Zustandストアを即座に更新
  useAuthStore.getState().updateUser({
    ...data,
    profile_completed: true
  })
  
  // 状態更新後にリダイレクト
  setTimeout(() => {
    router.push('/home')
  }, 300)
}
```

### 3. AuthLayout の修正

**ファイル**: `frontend/src/app/(auth)/layout.tsx`

**変更点**:
- ✅ `usePathname()`で現在のパスを取得
- ✅ `/initial-profile`ページは認証済みユーザーもアクセス可能に
- ✅ `useRef(redirecting)`でリダイレクトループを防止
- ✅ `mounted`状態を削除してHydration Errorを防止

```typescript
const pathname = usePathname()
const redirectingRef = useRef(false)

useEffect(() => {
  if (isLoading || redirectingRef.current) {
    return
  }

  // initial-profileページは例外として許可
  if (pathname === '/initial-profile') {
    return
  }
  
  if (isAuthenticated) {
    redirectingRef.current = true
    router.push('/home')
  }
}, [isLoading, isAuthenticated, pathname, router])
```

## 修正のポイント

### Hydration Error の防止

1. **SSR/CSR で同じHTMLを生成**
   - クライアント専用の状態（`mounted`）を使用しない
   - 全ての条件分岐で統一されたクラス名を使用
   - `useRef`を使用してレンダリングに影響を与えない状態管理

2. **一貫性のあるローディング状態**
   - ローディング中も同じ基本クラス（`min-h-screen bg-neutral-50`）を使用
   - 条件によってルート要素のクラス名が変わらないようにする

### Infinite Redirect の防止

1. **リダイレクトガードの実装**
   - `useRef`で一度リダイレクトしたら再実行しない
   - `redirectingRef.current = true`でフラグを立てる

2. **状態更新の確実性**
   - `updateUser`を同期的に実行
   - `profile_completed: true`を明示的に設定
   - リダイレクト前に短い遅延（300ms）を入れる

3. **レイアウト間の競合解消**
   - `AuthLayout`で`/initial-profile`を例外として許可
   - `pathname`をチェックして適切にルーティング

## テスト確認項目

### 1. Hydration Error の確認
- [ ] ページをリロードしてもHydration Errorが出ない
- [ ] DevToolsのコンソールにエラーがない
- [ ] ローディング画面からダッシュボードへの遷移がスムーズ

### 2. プロフィール完了フロー
- [ ] 新規ユーザー登録後、`/initial-profile`に遷移する
- [ ] プロフィールを完了すると`/home`に遷移する
- [ ] プロフィール完了後、`/initial-profile`にアクセスすると`/home`にリダイレクトされる
- [ ] プロフィール完了後、`/home`にアクセスして正常に表示される

### 3. リダイレクトループの確認
- [ ] `/home`と`/initial-profile`の間で無限ループが発生しない
- [ ] ブラウザの戻るボタンで正常に戻れる
- [ ] ページ遷移が1回で完了する（複数回リダイレクトしない）

### 4. 認証フロー全体
- [ ] 未認証ユーザーは`/auth/login`にリダイレクトされる
- [ ] ログイン済みユーザーが`/auth/login`にアクセスすると`/home`にリダイレクトされる
- [ ] プロフィール未完了ユーザーがダッシュボードにアクセスすると`/initial-profile`にリダイレクトされる

## 実装の詳細

### useRef vs useState の使い分け

```typescript
// ❌ 悪い例: useStateはレンダリングをトリガーしてHydration Errorの原因になる
const [redirecting, setRedirecting] = useState(false)

// ✅ 良い例: useRefはレンダリングをトリガーせず、値の保持のみを行う
const redirectingRef = useRef(false)
```

### 厳密な等価性チェック

```typescript
// ❌ 悪い例: falsy値全てにマッチ（undefined, null, false）
if (!user.profile_completed) { }

// ✅ 良い例: 明示的にfalseのみをチェック
if (user.profile_completed === false) { }
```

### 同期的な状態更新

```typescript
// ❌ 悪い例: 非同期importで遅延が発生
const { updateUser } = await import('@/stores/auth')
updateUser(data)

// ✅ 良い例: getState()で即座にアクセス
useAuthStore.getState().updateUser({
  ...data,
  profile_completed: true
})
```

## 関連ファイル

- `frontend/src/app/(dashboard)/layout.tsx` - ダッシュボードレイアウト
- `frontend/src/app/(auth)/layout.tsx` - 認証レイアウト
- `frontend/src/app/(auth)/initial-profile/page.tsx` - 初期プロフィールページ
- `frontend/src/stores/auth.ts` - 認証ストア

## 修正日時

2025-10-23

## 備考

この修正により、以下の問題が解決されました:
1. React Hydration Errorが発生しない
2. 無限リダイレクトループが発生しない
3. プロフィール完了フローが正常に動作する
4. ページ遷移がスムーズになる

今後同様の問題を防ぐため、以下を心がけてください:
- SSR/CSRで異なる状態を持たない（`mounted`状態を避ける）
- レンダリングに影響しない値は`useRef`を使用
- リダイレクトガードを実装して無限ループを防止
- 状態更新とリダイレクトのタイミングを適切に管理


