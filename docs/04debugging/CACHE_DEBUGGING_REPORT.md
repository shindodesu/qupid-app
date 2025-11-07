# キャッシュ問題のデバッグレポート

## 問題の概要

プロフィールページで以下の問題が発生していました：

1. **ハードリロード（Ctrl+Shift+R / Cmd+Shift+R）**: 正しく更新された状態（キャンパスフィールドあり、正しい順序、プライバシー設定ボタンが基本情報の下）
2. **通常リロード（F5 / Cmd+R）**: 古い状態（キャンパスフィールドなし、古い順序、プライバシー設定ボタンがアカウント設定内）

## 根本原因

### 1. Service WorkerによるHTMLキャッシュ

**問題**: Service WorkerがHTMLドキュメント（ページ全体）をキャッシュしていた。

**影響**:
- 通常リロード時、Service Workerがキャッシュされた古いHTMLを返していた
- ハードリロード時は、ブラウザがキャッシュを無視してService Workerをバイパスするため、新しいHTMLが取得できていた

**原因箇所**: `frontend/public/sw-custom.js`
```javascript
// ❌ 古いコード（問題あり）
event.respondWith(
  caches.match(event.request)
    .then((response) => {
      if (response) {
        return response // HTMLもキャッシュから返していた
      }
      return fetch(event.request)
        .then((response) => {
          // GETリクエストは全てキャッシュに保存
          if (event.request.method === 'GET') {
            cache.put(event.request, responseToCache)
          }
        })
    })
)
```

### 2. Next.jsのアセットキャッシュ

**問題**: Service WorkerがNext.jsの内部アセット（`/_next/static/`, `/_next/data/`など）もキャッシュしていた。

**影響**:
- ReactコンポーネントのJavaScriptバンドルが古いバージョンでキャッシュされていた可能性
- コンポーネントの更新が反映されない

### 3. React Queryのキャッシュ設定

**問題**: React Queryがデータをキャッシュし、ページマウント時に古いデータを使用していた。

**影響**:
- APIから最新データを取得していても、React Queryのキャッシュが優先されていた
- `staleTime`や`gcTime`のデフォルト値により、一定期間キャッシュが有効だった

**原因箇所**: `frontend/src/app/(dashboard)/profile/page.tsx`
```typescript
// ❌ 古いコード（デフォルトのキャッシュ設定）
const { data: userData } = useQuery({
  queryKey: ['user', 'me'],
  queryFn: () => apiClient.getCurrentUser(),
  // staleTimeやgcTimeが未指定 → デフォルト値でキャッシュされる
})
```

## 解決策

### 1. Service Workerの修正

**変更内容**: HTMLドキュメントとNext.jsアセットのキャッシュを無効化

```javascript
// ✅ 修正後
// HTMLドキュメント（ページ）は常にネットワークから取得
if (event.request.destination === 'document' || 
    event.request.headers.get('accept')?.includes('text/html')) {
  event.respondWith(
    fetch(event.request, {
      cache: 'no-store',
    })
  )
  return
}

// Next.jsの内部アセットもキャッシュしない
if (url.pathname.includes('/_next/') || 
    url.pathname.includes('/_next/static/') ||
    url.pathname.includes('/_next/image') ||
    url.pathname.includes('/_next/data')) {
  event.respondWith(fetch(event.request, { cache: 'no-store' }))
  return
}

// 静的リソース（画像、フォント）のみキャッシュ
```

**効果**:
- HTMLドキュメントは常に最新版を取得
- Next.jsのアセットも常に最新版を取得
- 静的リソースのみキャッシュしてパフォーマンスを維持

### 2. React Queryのキャッシュ設定

**変更内容**: プロフィールページでキャッシュを無効化

```typescript
// ✅ 修正後
const { data: userData } = useQuery({
  queryKey: ['user', 'me'],
  queryFn: () => apiClient.getCurrentUser(),
  staleTime: 0, // 常にstaleとして扱う
  gcTime: 0, // キャッシュを保持しない（React Query v5）
  refetchOnMount: 'always', // マウント時は常に再取得
  refetchOnWindowFocus: true, // ウィンドウフォーカス時にも再取得
})

// ページマウント時にクエリキャッシュを無効化
useEffect(() => {
  queryClient.invalidateQueries({ queryKey: ['user', 'me'] })
}, [queryClient])
```

**効果**:
- 常に最新のユーザーデータを取得
- ページマウント時に必ずAPIから最新データを取得

## 修正ファイル一覧

1. **`frontend/public/sw-custom.js`**
   - HTMLドキュメントのキャッシュ無効化
   - Next.jsアセットのキャッシュ無効化
   - 静的リソースのみキャッシュ

2. **`frontend/src/app/(dashboard)/profile/page.tsx`**
   - React Queryのキャッシュ設定を追加（`staleTime: 0`, `gcTime: 0`）
   - `refetchOnMount: 'always'`を追加
   - マウント時のクエリキャッシュ無効化を追加

## 今後の注意点

### Service Workerのキャッシュ戦略

**原則**:
- ✅ **キャッシュする**: 静的リソース（画像、フォント、CSS）
- ❌ **キャッシュしない**: HTMLドキュメント、APIレスポンス、Next.jsアセット

**理由**:
- HTMLドキュメントは動的コンテンツを含むため、常に最新版が必要
- Next.jsアセットはビルドごとにハッシュが変わるため、古いキャッシュが残ると問題が発生

### React Queryのキャッシュ設定

**推奨設定**:

1. **常に最新データが必要なページ**（プロフィール、設定など）:
   ```typescript
   staleTime: 0,
   gcTime: 0,
   refetchOnMount: 'always',
   ```

2. **ある程度キャッシュしても良いデータ**（タグ一覧、ユーザー一覧など）:
   ```typescript
   staleTime: 5 * 60 * 1000, // 5分
   gcTime: 10 * 60 * 1000, // 10分
   refetchOnMount: true, // デフォルト
   ```

## 関連する問題

### CORSエラーの修正

**問題**: エラーレスポンスにCORSヘッダーが含まれていなかった

**修正**: `app/middleware/error_handler.py`でエラーハンドラーにCORSヘッダーを追加

### データベースマイグレーション

**問題**: `campus`カラムがデータベースに存在しなかった

**修正**: Alembicマイグレーションファイルを作成してカラムを追加

## 確認方法

修正後、以下を確認してください：

1. **Service Workerの登録解除**: DevTools → Application → Service Workers → Unregister
2. **キャッシュストレージのクリア**: DevTools → Application → Cache Storage → すべて削除
3. **通常リロードで確認**: F5キー（Cmd+R）で通常リロードし、正しく表示されるか確認

## まとめ

今回の問題の根本原因は、**Service WorkerがHTMLドキュメントをキャッシュしていたこと**と、**React Queryがデータをキャッシュしていたこと**です。

Service WorkerはPWAのオフライン機能に必要ですが、動的コンテンツ（HTML）はキャッシュすべきではありません。静的リソースのみをキャッシュすることで、パフォーマンスを維持しながら常に最新のコンテンツを表示できます。

