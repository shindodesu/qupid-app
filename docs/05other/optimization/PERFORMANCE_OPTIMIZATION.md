# ⚡ パフォーマンス最適化ガイド

## 📋 概要

このドキュメントでは、Qupidアプリケーションのパフォーマンスを最適化するための手法とベストプラクティスを説明します。

---

## 🎨 フロントエンド最適化

### 1. 画像最適化

#### Next.js Image コンポーネントの使用

```tsx
import Image from 'next/image'

// ❌ 悪い例
<img src="/avatar.jpg" alt="Avatar" />

// ✅ 良い例
<Image
  src="/avatar.jpg"
  alt="Avatar"
  width={100}
  height={100}
  quality={85}
  loading="lazy"
  placeholder="blur"
/>
```

#### WebP/AVIF フォーマットへの変換

`next.config.ts` で既に設定済み：

```typescript
images: {
  formats: ['image/webp', 'image/avif'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
}
```

### 2. コード分割

#### Dynamic Import の使用

```tsx
import dynamic from 'next/dynamic'

// ❌ 重いコンポーネントを直接インポート
import HeavyChart from '@/components/HeavyChart'

// ✅ 動的インポート
const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <Skeleton height={400} />,
  ssr: false, // クライアントサイドのみでレンダリング
})
```

#### Route-based Code Splitting

Next.js は自動的にルートごとにコード分割を行いますが、さらに最適化可能：

```tsx
// app/(dashboard)/layout.tsx
const DashboardLayoutClient = dynamic(
  () => import('./DashboardLayoutClient'),
  { ssr: false }
)
```

### 3. バンドルサイズの削減

#### バンドル分析

```bash
# @next/bundle-analyzer をインストール
npm install --save-dev @next/bundle-analyzer

# 分析実行
ANALYZE=true npm run build
```

#### Tree Shaking

不要なコードを削除するため、named imports を使用：

```tsx
// ❌ 全体をインポート
import * as Icons from 'lucide-react'

// ✅ 必要なものだけインポート
import { Heart, MessageCircle } from 'lucide-react'
```

### 4. レンダリング最適化

#### React.memo の使用

```tsx
import { memo } from 'react'

// 頻繁に再レンダリングされるコンポーネントをメモ化
export const MessageBubble = memo(function MessageBubble({ message }: Props) {
  return <div>{message.content}</div>
})
```

#### useMemo と useCallback

```tsx
import { useMemo, useCallback } from 'react'

function MyComponent({ items, onSelect }) {
  // 重い計算をメモ化
  const sortedItems = useMemo(() => {
    return items.sort((a, b) => a.timestamp - b.timestamp)
  }, [items])

  // コールバックをメモ化
  const handleSelect = useCallback((id) => {
    onSelect(id)
  }, [onSelect])

  return <List items={sortedItems} onSelect={handleSelect} />
}
```

### 5. データフェッチング最適化

#### React Query のキャッシュ戦略

```tsx
import { useQuery } from '@tanstack/react-query'

function UserProfile() {
  const { data } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    staleTime: 5 * 60 * 1000, // 5分間はキャッシュを使用
    cacheTime: 10 * 60 * 1000, // 10分間キャッシュを保持
  })
}
```

#### Prefetching

```tsx
import { useQueryClient } from '@tanstack/react-query'

function DiscoverPage() {
  const queryClient = useQueryClient()

  const handleUserHover = (userId) => {
    // ホバー時にプロフィールをプリフェッチ
    queryClient.prefetchQuery({
      queryKey: ['user', userId],
      queryFn: () => fetchUser(userId),
    })
  }
}
```

### 6. フォントの最適化

`next/font` を使用（既に実装済み）：

```tsx
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // フォント読み込み中もテキストを表示
  preload: true,
})
```

### 7. JavaScript の削減

#### 本番環境でのコンソールログ削除

`next.config.ts` で既に設定済み：

```typescript
compiler: {
  removeConsole: process.env.NODE_ENV === 'production' ? {
    exclude: ['error', 'warn'],
  } : false,
}
```

---

## 🔧 バックエンド最適化

### 1. データベースクエリ最適化

#### N+1 問題の解決

```python
# ❌ N+1 問題
users = await db.execute(select(User))
for user in users.scalars():
    # 各ユーザーごとにクエリが発行される
    tags = await db.execute(select(Tag).where(Tag.user_id == user.id))

# ✅ JOIN を使用
users = await db.execute(
    select(User)
    .options(selectinload(User.tags))
)
```

#### インデックスの追加

```python
# alembic/versions/xxx_add_indexes.py
def upgrade() -> None:
    op.create_index('idx_users_email', 'users', ['email'])
    op.create_index('idx_messages_conversation_id', 'messages', ['conversation_id'])
    op.create_index('idx_messages_created_at', 'messages', ['created_at'])
```

#### クエリのページネーション

```python
# ❌ すべてのデータを取得
messages = await db.execute(select(Message))

# ✅ ページネーション
messages = await db.execute(
    select(Message)
    .limit(50)
    .offset(page * 50)
    .order_by(Message.created_at.desc())
)
```

### 2. キャッシング

#### Redis の統合

```python
import redis
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from fastapi_cache.decorator import cache

# 初期化
@app.on_event("startup")
async def startup():
    redis_client = redis.from_url("redis://localhost")
    FastAPICache.init(RedisBackend(redis_client), prefix="qupid-cache")

# キャッシュの使用
@router.get("/users/{user_id}")
@cache(expire=300)  # 5分間キャッシュ
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
    return await db.get(User, user_id)
```

### 3. 非同期処理

#### バックグラウンドタスク

```python
from fastapi import BackgroundTasks

async def send_welcome_email(email: str):
    # メール送信処理
    await email_service.send_welcome(email)

@router.post("/register")
async def register(
    user_data: UserCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    user = await create_user(db, user_data)
    
    # バックグラウンドでメール送信
    background_tasks.add_task(send_welcome_email, user.email)
    
    return {"user": user}
```

### 4. データベース接続プール

`app/db/session.py` で既に設定済み：

```python
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_size=20,          # 接続プールサイズ
    max_overflow=0,        # 追加接続数
    pool_pre_ping=True,    # 接続の健全性チェック
    pool_recycle=3600,     # 1時間ごとに接続をリサイクル
)
```

### 5. レスポンス圧縮

```python
from fastapi.middleware.gzip import GZipMiddleware

app.add_middleware(
    GZipMiddleware,
    minimum_size=1000,  # 1KB以上のレスポンスを圧縮
)
```

---

## 📊 パフォーマンス測定

### フロントエンド

#### Lighthouse

```bash
# CLI で測定
lighthouse https://yourdomain.com --view

# プログラマティックに測定
npm install -g lighthouse
lighthouse https://yourdomain.com --output json --output-path ./lighthouse-report.json
```

#### Web Vitals

```tsx
// pages/_app.tsx
export function reportWebVitals(metric) {
  // Core Web Vitals
  if (metric.label === 'web-vital') {
    console.log(metric) // { id, name, value, label }
    
    // アナリティクスに送信
    if (window.gtag) {
      window.gtag('event', metric.name, {
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        event_label: metric.id,
        non_interaction: true,
      })
    }
  }
}
```

### バックエンド

#### プロファイリング

```python
# cProfile を使用
python -m cProfile -o profile.stats app/main.py

# 結果を可視化
snakeviz profile.stats
```

#### ロギング

```python
import time
from fastapi import Request

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    
    # 遅いリクエストをログ
    if process_time > 1.0:
        logger.warning(f"Slow request: {request.url.path} took {process_time:.2f}s")
    
    return response
```

---

## 🎯 パフォーマンス目標

### フロントエンド

| メトリクス | 目標 | 現在値 |
|----------|------|--------|
| First Contentful Paint (FCP) | < 1.8s | - |
| Largest Contentful Paint (LCP) | < 2.5s | - |
| First Input Delay (FID) | < 100ms | - |
| Cumulative Layout Shift (CLS) | < 0.1 | - |
| Time to Interactive (TTI) | < 3.8s | - |
| Total Blocking Time (TBT) | < 200ms | - |

### バックエンド

| メトリクス | 目標 |
|----------|------|
| APIレスポンスタイム (平均) | < 100ms |
| APIレスポンスタイム (95パーセンタイル) | < 500ms |
| WebSocket接続時間 | < 200ms |
| データベースクエリ時間 | < 50ms |
| メモリ使用量 | < 512MB |
| CPU使用率 | < 70% |

---

## 🔍 パフォーマンステスト

### 負荷テスト

#### Apache Bench

```bash
# 1000リクエスト、10並行接続
ab -n 1000 -c 10 https://api.yourdomain.com/health

# POST リクエスト
ab -n 100 -c 10 -p data.json -T application/json https://api.yourdomain.com/auth/login
```

#### k6

```javascript
// loadtest.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  const res = http.get('https://api.yourdomain.com/health');
  check(res, { 'status was 200': (r) => r.status == 200 });
  sleep(1);
}
```

```bash
k6 run loadtest.js
```

---

## 📚 チェックリスト

### フロントエンド

- [ ] 画像を最適化（WebP/AVIF、lazy loading）
- [ ] コード分割を実装
- [ ] バンドルサイズを確認（< 200KB gzipped）
- [ ] React.memo を適切に使用
- [ ] useMemo/useCallback を適切に使用
- [ ] フォントを最適化
- [ ] 不要なコンソールログを削除
- [ ] Lighthouse スコア 90+ を達成
- [ ] Service Worker を有効化（PWA）
- [ ] CDN を使用

### バックエンド

- [ ] データベースクエリを最適化
- [ ] インデックスを適切に設定
- [ ] キャッシングを実装
- [ ] レスポンス圧縮を有効化
- [ ] 接続プールを設定
- [ ] バックグラウンドタスクを使用
- [ ] APIレスポンスタイム < 100ms
- [ ] 負荷テストをパス
- [ ] プロファイリングを実行
- [ ] 監視ツールを設定

---

## 🔗 参考資料

- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Web.dev Performance](https://web.dev/performance/)
- [FastAPI Performance](https://fastapi.tiangolo.com/async/)
- [PostgreSQL Performance Tips](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)

---

**パフォーマンス最適化、頑張ってください！🚀**





