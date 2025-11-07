# いいね・マッチングAPI実装計画書

## 📋 概要

ユーザー間のいいね機能とマッチング判定機能を実装する。  
九州大学のLGBTQ当事者学生が、気になる相手にいいねを送信し、両想いの場合にマッチングが成立する仕組みを構築する。

## 🎯 目的

- ユーザーが他のユーザーにいいねを送信できる
- 両想いの場合にマッチングが成立する
- マッチしたユーザー一覧を取得できる
- いいねの履歴を管理できる
- チャット機能への橋渡しを提供する

## 🏗️ データベース設計

### 既存テーブル構造

#### `likes` テーブル
```sql
CREATE TABLE likes (
    id SERIAL PRIMARY KEY,
    liker_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    liked_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(liker_id, liked_id),
    CHECK (liker_id <> liked_id)
);
```

### マッチング判定ロジック

マッチングは以下の条件で成立：
1. ユーザーAがユーザーBにいいねを送信
2. ユーザーBがユーザーAにいいねを送信
3. 両方のいいねが存在する場合、マッチング成立

## 🔌 API仕様

### エンドポイント一覧

| メソッド | エンドポイント | 説明 | 認証 |
|---------|---------------|------|------|
| POST | `/likes` | いいね送信 | 必要 |
| GET | `/likes/sent` | 送信したいいね一覧 | 必要 |
| GET | `/likes/received` | 受け取ったいいね一覧 | 必要 |
| GET | `/matches` | マッチしたユーザー一覧 | 必要 |
| GET | `/matches/{user_id}` | 特定ユーザーとのマッチ状況確認 | 必要 |
| DELETE | `/likes/{liked_user_id}` | いいね取り消し | 必要 |

### リクエスト/レスポンス仕様

#### 1. いいね送信
```http
POST /likes
Authorization: Bearer <token>
```

**リクエスト:**
```json
{
  "liked_user_id": 123
}
```

**レスポンス（新規いいね）:**
```json
{
  "message": "Like sent successfully",
  "like": {
    "id": 1,
    "liker_id": 456,
    "liked_id": 123,
    "created_at": "2024-01-01T00:00:00Z"
  },
  "is_match": false
}
```

**レスポンス（マッチング成立）:**
```json
{
  "message": "Like sent successfully - It's a match!",
  "like": {
    "id": 1,
    "liker_id": 456,
    "liked_id": 123,
    "created_at": "2024-01-01T00:00:00Z"
  },
  "is_match": true,
  "match": {
    "id": 1,
    "user": {
      "id": 123,
      "display_name": "ユーザーA",
      "bio": "よろしくお願いします"
    }
  }
}
```

#### 2. 送信したいいね一覧
```http
GET /likes/sent?limit=20&offset=0
Authorization: Bearer <token>
```

**レスポンス:**
```json
{
  "likes": [
    {
      "id": 1,
      "liked_user": {
        "id": 123,
        "display_name": "ユーザーA",
        "bio": "よろしくお願いします",
        "faculty": "工学部",
        "grade": "3年生"
      },
      "created_at": "2024-01-01T00:00:00Z",
      "is_matched": true
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

#### 3. 受け取ったいいね一覧
```http
GET /likes/received?limit=20&offset=0
Authorization: Bearer <token>
```

**レスポンス:**
```json
{
  "likes": [
    {
      "id": 2,
      "liker_user": {
        "id": 456,
        "display_name": "ユーザーB",
        "bio": "映画が好きです",
        "faculty": "文学部",
        "grade": "2年生"
      },
      "created_at": "2024-01-01T00:00:00Z",
      "is_matched": false
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

#### 4. マッチしたユーザー一覧
```http
GET /matches?limit=20&offset=0
Authorization: Bearer <token>
```

**レスポンス:**
```json
{
  "matches": [
    {
      "id": 1,
      "user": {
        "id": 123,
        "display_name": "ユーザーA",
        "bio": "よろしくお願いします",
        "faculty": "工学部",
        "grade": "3年生",
        "tags": [
          {
            "id": 1,
            "name": "映画好き",
            "description": "映画鑑賞が趣味"
          }
        ]
      },
      "matched_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

#### 5. 特定ユーザーとのマッチ状況確認
```http
GET /matches/123
Authorization: Bearer <token>
```

**レスポンス（マッチ済み）:**
```json
{
  "is_matched": true,
  "match": {
    "id": 1,
    "user": {
      "id": 123,
      "display_name": "ユーザーA"
    },
    "matched_at": "2024-01-01T00:00:00Z"
  }
}
```

**レスポンス（未マッチ）:**
```json
{
  "is_matched": false,
  "like_status": {
    "i_liked": true,
    "they_liked": false
  }
}
```

#### 6. いいね取り消し
```http
DELETE /likes/123
Authorization: Bearer <token>
```

**レスポンス:**
```json
{
  "message": "Like removed successfully"
}
```

## 📝 スキーマ定義

### Pydanticスキーマ

```python
# app/schemas/like.py

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from app.schemas.user import UserRead

class LikeCreate(BaseModel):
    liked_user_id: int = Field(..., gt=0, description="いいねを送るユーザーのID")

class LikeResponse(BaseModel):
    message: str
    like: dict
    is_match: bool
    match: Optional[dict] = None

class LikeRead(BaseModel):
    id: int
    liked_user: Optional[UserRead] = None
    liker_user: Optional[UserRead] = None
    created_at: datetime
    is_matched: bool

    class Config:
        from_attributes = True

class MatchRead(BaseModel):
    id: int
    user: UserRead
    matched_at: datetime

    class Config:
        from_attributes = True

class MatchStatus(BaseModel):
    is_matched: bool
    match: Optional[MatchRead] = None
    like_status: Optional[dict] = None

class LikeListResponse(BaseModel):
    likes: List[LikeRead]
    total: int
    limit: int
    offset: int

class MatchListResponse(BaseModel):
    matches: List[MatchRead]
    total: int
    limit: int
    offset: int
```

## 🛠️ 実装手順

### Phase 1: スキーマ定義
1. `app/schemas/like.py` を作成
2. 上記のPydanticスキーマを実装

### Phase 2: ルーター実装
1. `app/routers/likes.py` を作成
2. 各エンドポイントの実装

### Phase 3: いいね機能実装
1. いいね送信機能
2. いいね一覧取得機能
3. いいね取り消し機能

### Phase 4: マッチング機能実装
1. マッチング判定ロジック
2. マッチ一覧取得機能
3. マッチ状況確認機能

### Phase 5: エラーハンドリング
1. バリデーションエラー
2. 権限エラー
3. データベースエラー

### Phase 6: テスト実装
1. 単体テスト
2. 統合テスト
3. APIテスト

## 🧪 テストケース

### 正常系
- [ ] いいね送信（新規）
- [ ] いいね送信（マッチング成立）
- [ ] 送信したいいね一覧取得
- [ ] 受け取ったいいね一覧取得
- [ ] マッチしたユーザー一覧取得
- [ ] 特定ユーザーとのマッチ状況確認
- [ ] いいね取り消し

### 異常系
- [ ] 存在しないユーザーへのいいね
- [ ] 自分自身へのいいね
- [ ] 重複いいね送信
- [ ] 未認証でのアクセス
- [ ] 存在しないいいねの取り消し

### エッジケース
- [ ] 無効なユーザーID（負の数、0）
- [ ] ページネーションの境界値
- [ ] 大量のいいねデータでのパフォーマンス
- [ ] 同時いいね送信（競合状態）

## ⚠️ 注意点・考慮事項

### セキュリティ
- いいね送信は認証済みユーザーのみ
- 自分のいいね履歴のみアクセス可能
- 他のユーザーのいいね履歴は見えない

### パフォーマンス
- いいね一覧取得時のページネーション実装
- マッチング判定の効率的なクエリ
- インデックスの適切な設定（liker_id, liked_id）
- N+1問題の回避（eager loading）

### データ整合性
- いいね送信時の重複防止（UniqueConstraint）
- 自己いいねの防止（CheckConstraint）
- ユーザー削除時のいいね関連レコードの自動削除（CASCADE）

### ビジネスロジック
- マッチング成立時の通知機能（将来的に実装）
- いいねの取り消しによるマッチング解除
- ブロックユーザーへのいいね送信制限

### 将来の拡張性
- いいねの種類（スーパーいいね等）
- いいねの制限（1日あたりのいいね数）
- マッチング後のアクション（チャット開始等）

## 📊 成功指標

- [ ] 全APIエンドポイントが正常に動作
- [ ] テストカバレッジ80%以上
- [ ] レスポンス時間500ms以下
- [ ] マッチング判定が正確に動作
- [ ] エラーハンドリングが適切に動作
- [ ] セキュリティ要件を満たす

## 🔄 次のステップ

1. **チャットAPI** - マッチしたユーザー間でのメッセージ機能
2. **通知機能** - マッチング成立時の通知
3. **ユーザー検索API** - いいね送信対象のユーザー検索
4. **統計機能** - いいね・マッチングの統計情報

## 🎯 マッチングフロー図

```
ユーザーA → いいね送信 → ユーザーB
    ↓
ユーザーB → いいね送信 → ユーザーA
    ↓
マッチング成立！
    ↓
チャット開始可能
```

## 📈 データフロー

1. **いいね送信**: `POST /likes` → いいねレコード作成
2. **マッチング判定**: 双方向のいいね存在確認
3. **マッチング成立**: マッチ情報の返却
4. **いいね一覧**: 送信・受信の履歴取得
5. **マッチ一覧**: マッチしたユーザー一覧取得

---

**作成日**: 2024年1月  
**更新日**: 2024年1月  
**担当者**: Qupid開発チーム

