# タグ管理API実装計画書

## 📋 概要

ユーザーがタグを作成・管理し、プロフィールにタグを追加・削除する機能を実装する。  
九州大学のLGBTQ当事者学生が、趣味や興味、属性をタグとして表現し、マッチングの精度向上を図る。

## 🎯 目的

- ユーザーが自由にタグを作成・管理できる
- プロフィールにタグを追加・削除できる
- タグベースでの検索・フィルタリングを可能にする
- 将来的なAI自動タグ生成の基盤を構築する

## 🏗️ データベース設計

### 既存テーブル構造

#### `tags` テーブル
```sql
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(64) UNIQUE NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `user_tags` テーブル（多対多関連）
```sql
CREATE TABLE user_tags (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, tag_id)
);
```

## 🔌 API仕様

### エンドポイント一覧

| メソッド | エンドポイント | 説明 | 認証 |
|---------|---------------|------|------|
| GET | `/tags` | タグ一覧取得 | 不要 |
| POST | `/tags` | タグ作成 | 必要 |
| GET | `/tags/{tag_id}` | タグ詳細取得 | 不要 |
| DELETE | `/tags/{tag_id}` | タグ削除 | 必要 |
| GET | `/users/me/tags` | 自分のタグ一覧取得 | 必要 |
| POST | `/users/me/tags` | 自分のタグに追加 | 必要 |
| DELETE | `/users/me/tags/{tag_id}` | 自分のタグから削除 | 必要 |

### リクエスト/レスポンス仕様

#### 1. タグ一覧取得
```http
GET /tags?limit=20&offset=0&search=映画
```

**レスポンス:**
```json
{
  "tags": [
    {
      "id": 1,
      "name": "映画好き",
      "description": "映画鑑賞が趣味",
      "user_count": 15,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

#### 2. タグ作成
```http
POST /tags
Authorization: Bearer <token>
```

**リクエスト:**
```json
{
  "name": "ゲーム好き",
  "description": "ゲームが趣味"
}
```

**レスポンス:**
```json
{
  "id": 2,
  "name": "ゲーム好き",
  "description": "ゲームが趣味",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### 3. 自分のタグ一覧取得
```http
GET /users/me/tags
Authorization: Bearer <token>
```

**レスポンス:**
```json
{
  "tags": [
    {
      "id": 1,
      "name": "映画好き",
      "description": "映画鑑賞が趣味",
      "added_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### 4. 自分のタグに追加
```http
POST /users/me/tags
Authorization: Bearer <token>
```

**リクエスト:**
```json
{
  "tag_id": 1
}
```

**レスポンス:**
```json
{
  "message": "Tag added successfully",
  "tag": {
    "id": 1,
    "name": "映画好き",
    "description": "映画鑑賞が趣味"
  }
}
```

## 📝 スキーマ定義

### Pydanticスキーマ

```python
# app/schemas/tag.py

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class TagBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=64)
    description: Optional[str] = Field(None, max_length=255)

class TagCreate(TagBase):
    pass

class TagRead(TagBase):
    id: int
    user_count: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TagWithUserCount(TagRead):
    user_count: int

class UserTagAdd(BaseModel):
    tag_id: int

class UserTagRead(BaseModel):
    id: int
    name: str
    description: Optional[str]
    added_at: datetime

    class Config:
        from_attributes = True
```

## 🛠️ 実装手順

### Phase 1: スキーマ定義
1. `app/schemas/tag.py` を作成
2. 上記のPydanticスキーマを実装

### Phase 2: ルーター実装
1. `app/routers/tags.py` を作成
2. 各エンドポイントの実装

### Phase 3: CRUD操作実装
1. タグの基本CRUD操作
2. ユーザータグの関連操作
3. 検索・フィルタリング機能

### Phase 4: エラーハンドリング
1. バリデーションエラー
2. 権限エラー
3. データベースエラー

### Phase 5: テスト実装
1. 単体テスト
2. 統合テスト
3. APIテスト

## 🧪 テストケース

### 正常系
- [ ] タグ一覧取得（ページネーション）
- [ ] タグ作成（新規タグ）
- [ ] タグ詳細取得
- [ ] 自分のタグ一覧取得
- [ ] 自分のタグに追加
- [ ] 自分のタグから削除

### 異常系
- [ ] 重複タグ名での作成
- [ ] 存在しないタグIDでの操作
- [ ] 未認証での認証必要エンドポイントアクセス
- [ ] 既に追加済みのタグの重複追加
- [ ] 存在しないタグの削除

### エッジケース
- [ ] 空のタグ名
- [ ] 長すぎるタグ名（65文字以上）
- [ ] 長すぎる説明文（256文字以上）
- [ ] 特殊文字を含むタグ名

## ⚠️ 注意点・考慮事項

### セキュリティ
- タグ作成は認証済みユーザーのみ
- タグ削除は作成者のみ（将来的に管理者権限も考慮）
- SQLインジェクション対策（SQLAlchemy ORM使用）

### パフォーマンス
- タグ一覧取得時のページネーション実装
- インデックスの適切な設定（name, user_id, tag_id）
- N+1問題の回避（eager loading）

### データ整合性
- タグ削除時のUserTag関連レコードの自動削除（CASCADE）
- 重複タグ追加の防止（UniqueConstraint）

### 将来の拡張性
- タグのカテゴリ分類
- タグの使用頻度統計
- AI自動タグ生成との連携
- タグの多言語対応

## 📊 成功指標

- [ ] 全APIエンドポイントが正常に動作
- [ ] テストカバレッジ80%以上
- [ ] レスポンス時間500ms以下
- [ ] エラーハンドリングが適切に動作
- [ ] セキュリティ要件を満たす

## 🔄 次のステップ

1. **いいね・マッチングAPI** - タグベースのマッチング機能
2. **ユーザー検索API** - タグでの絞り込み検索
3. **AI自動タグ生成** - n8n連携での自動タグ提案

---

**作成日**: 2024年1月  
**更新日**: 2024年1月  
**担当者**: Qupid開発チーム

