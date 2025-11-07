# ユーザー検索・フィルターAPI実装計画書

## 📋 概要

ユーザーが他のユーザーを検索・フィルタリングする機能を実装する。  
九州大学のLGBTQ当事者学生が、タグや属性（学部・学年等）でユーザーを絞り込み、いいね送信の対象を見つけるための機能を提供する。

## 🎯 目的

- タグベースでのユーザー検索
- 学部・学年でのフィルタリング
- 複数条件での絞り込み検索
- ページネーション対応
- 検索結果の並び替え機能
- いいね送信対象の効率的な発見

## 🏗️ データベース設計

### 検索対象のテーブル構造

#### `users` テーブル（検索対象フィールド）
```sql
-- 検索可能なフィールド
id, display_name, bio, faculty, grade, is_active, created_at
```

#### `tags` テーブル（タグ検索用）
```sql
-- タグ名での検索
id, name, description
```

#### `user_tags` テーブル（ユーザー-タグ関連）
```sql
-- ユーザーとタグの関連
user_id, tag_id
```

### 検索インデックス設計

```sql
-- 検索パフォーマンス向上のためのインデックス
CREATE INDEX idx_users_faculty ON users(faculty);
CREATE INDEX idx_users_grade ON users(grade);
CREATE INDEX idx_users_active_faculty ON users(is_active, faculty);
CREATE INDEX idx_users_active_grade ON users(is_active, grade);
CREATE INDEX idx_user_tags_user_id ON user_tags(user_id);
CREATE INDEX idx_user_tags_tag_id ON user_tags(tag_id);
```

## 🔌 API仕様

### エンドポイント一覧

| メソッド | エンドポイント | 説明 | 認証 |
|---------|---------------|------|------|
| GET | `/users/search` | ユーザー検索・フィルタリング | 必要 |
| GET | `/users/suggestions` | おすすめユーザー取得 | 必要 |
| GET | `/users/nearby` | 近くのユーザー取得（将来実装） | 必要 |

### リクエスト/レスポンス仕様

#### 1. ユーザー検索・フィルタリング
```http
GET /users/search?tags=映画,ゲーム&faculty=工学部&grade=3年生&limit=20&offset=0&sort=recent
Authorization: Bearer <token>
```

**クエリパラメータ:**
- `tags`: カンマ区切りのタグ名（例: "映画,ゲーム"）
- `faculty`: 学部名（例: "工学部", "文学部"）
- `grade`: 学年（例: "1年生", "修士1年"）
- `search`: フリーテキスト検索（display_name, bio）
- `limit`: 取得件数（デフォルト: 20, 最大: 100）
- `offset`: オフセット（デフォルト: 0）
- `sort`: 並び順（`recent`: 新規順, `popular`: 人気順, `alphabetical`: 名前順）

**レスポンス:**
```json
{
  "users": [
    {
      "id": 123,
      "display_name": "ユーザーA",
      "bio": "映画とゲームが好きです",
      "faculty": "工学部",
      "grade": "3年生",
      "tags": [
        {
          "id": 1,
          "name": "映画好き",
          "description": "映画鑑賞が趣味"
        },
        {
          "id": 2,
          "name": "ゲーム好き",
          "description": "ゲームが趣味"
        }
      ],
      "created_at": "2024-01-01T00:00:00Z",
      "like_status": {
        "i_liked": false,
        "they_liked": false,
        "is_matched": false
      }
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0,
  "filters_applied": {
    "tags": ["映画", "ゲーム"],
    "faculty": "工学部",
    "grade": "3年生"
  }
}
```

#### 2. おすすめユーザー取得
```http
GET /users/suggestions?limit=10
Authorization: Bearer <token>
```

**レスポンス:**
```json
{
  "users": [
    {
      "id": 456,
      "display_name": "ユーザーB",
      "bio": "同じ趣味の人が見つかると嬉しいです",
      "faculty": "工学部",
      "grade": "2年生",
      "tags": [
        {
          "id": 1,
          "name": "映画好き",
          "description": "映画鑑賞が趣味"
        }
      ],
      "match_score": 0.85,
      "reason": "同じタグ「映画好き」を持っています"
    }
  ],
  "total": 1,
  "limit": 10
}
```

## 📝 スキーマ定義

### Pydanticスキーマ

```python
# app/schemas/search.py

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from enum import Enum

class SortOrder(str, Enum):
    RECENT = "recent"
    POPULAR = "popular"
    ALPHABETICAL = "alphabetical"

class UserSearchFilters(BaseModel):
    tags: Optional[str] = Field(None, description="カンマ区切りのタグ名")
    faculty: Optional[str] = Field(None, description="学部名")
    grade: Optional[str] = Field(None, description="学年")
    search: Optional[str] = Field(None, description="フリーテキスト検索")
    limit: int = Field(20, ge=1, le=100, description="取得件数")
    offset: int = Field(0, ge=0, description="オフセット")
    sort: SortOrder = Field(SortOrder.RECENT, description="並び順")

class TagInfo(BaseModel):
    id: int
    name: str
    description: Optional[str]

    class Config:
        from_attributes = True

class LikeStatus(BaseModel):
    i_liked: bool
    they_liked: bool
    is_matched: bool

class UserSearchResult(BaseModel):
    id: int
    display_name: str
    bio: Optional[str]
    faculty: Optional[str]
    grade: Optional[str]
    tags: List[TagInfo]
    created_at: datetime
    like_status: LikeStatus

    class Config:
        from_attributes = True

class UserSearchResponse(BaseModel):
    users: List[UserSearchResult]
    total: int
    limit: int
    offset: int
    filters_applied: dict

class UserSuggestion(BaseModel):
    id: int
    display_name: str
    bio: Optional[str]
    faculty: Optional[str]
    grade: Optional[str]
    tags: List[TagInfo]
    match_score: float
    reason: str

    class Config:
        from_attributes = True

class UserSuggestionsResponse(BaseModel):
    users: List[UserSuggestion]
    total: int
    limit: int
```

## 🛠️ 実装手順

### Phase 1: スキーマ定義
1. `app/schemas/search.py` を作成
2. 上記のPydanticスキーマを実装

### Phase 2: ルーター実装
1. `app/routers/search.py` を作成
2. 各エンドポイントの実装

### Phase 3: 検索ロジック実装
1. 基本的な検索機能
2. フィルタリング機能
3. 並び替え機能

### Phase 4: 高度な検索機能
1. 複数タグでの検索
2. フリーテキスト検索
3. おすすめユーザー機能

### Phase 5: パフォーマンス最適化
1. インデックス最適化
2. クエリ最適化
3. キャッシュ機能（将来実装）

### Phase 6: テスト実装
1. 単体テスト
2. 統合テスト
3. パフォーマンステスト

## 🔍 検索ロジック詳細

### 1. タグ検索
```python
# 複数タグでの検索（AND条件）
def search_by_tags(tag_names: List[str]):
    # 指定されたタグをすべて持つユーザーを検索
    pass
```

### 2. 属性フィルタリング
```python
# 学部・学年でのフィルタリング
def filter_by_attributes(faculty: str = None, grade: str = None):
    # 学部・学年で絞り込み
    pass
```

### 3. フリーテキスト検索
```python
# display_name, bioでの部分一致検索
def search_by_text(search_term: str):
    # ILIKE演算子を使用した部分一致検索
    pass
```

### 4. おすすめユーザー
```python
# 共通タグ数に基づくおすすめ
def get_suggestions(current_user_id: int):
    # 共通タグが多いユーザーを優先
    pass
```

## 🧪 テストケース

### 正常系
- [ ] タグでの検索（単一タグ）
- [ ] タグでの検索（複数タグ）
- [ ] 学部でのフィルタリング
- [ ] 学年でのフィルタリング
- [ ] フリーテキスト検索
- [ ] 複数条件での絞り込み
- [ ] ページネーション
- [ ] 並び替え機能
- [ ] おすすめユーザー取得

### 異常系
- [ ] 存在しないタグでの検索
- [ ] 無効なパラメータ
- [ ] 未認証でのアクセス
- [ ] 制限を超えたlimit値

### エッジケース
- [ ] 空の検索結果
- [ ] 特殊文字を含む検索
- [ ] 大量データでのパフォーマンス
- [ ] 同時検索リクエスト

## ⚠️ 注意点・考慮事項

### セキュリティ
- 検索は認証済みユーザーのみ
- 自分のプロフィールは検索結果に含めない
- 非アクティブユーザーは検索結果から除外

### パフォーマンス
- 適切なインデックスの設定
- ページネーションの実装
- 複雑なクエリの最適化
- N+1問題の回避

### プライバシー
- メールアドレスは検索結果に含めない
- 必要最小限の情報のみ返却
- 将来的なプライバシー設定への対応

### ビジネスロジック
- いいね送信済みユーザーの表示制御
- マッチ済みユーザーの表示制御
- ブロックユーザーの除外

### 将来の拡張性
- 位置情報ベースの検索
- AI によるおすすめ機能
- 検索履歴の保存
- 検索結果のキャッシュ

## 📊 成功指標

- [ ] 全APIエンドポイントが正常に動作
- [ ] テストカバレッジ80%以上
- [ ] 検索レスポンス時間1秒以下
- [ ] 複数条件検索が正確に動作
- [ ] ページネーションが正常に動作
- [ ] セキュリティ要件を満たす

## 🔄 次のステップ

1. **いいね・マッチングAPI** - 検索結果からいいね送信
2. **通知機能** - 検索結果の保存・通知
3. **統計機能** - 検索統計・人気タグ等
4. **位置情報検索** - 近くのユーザー検索

## 🎯 検索フロー図

```
ユーザー → 検索条件入力 → API呼び出し
    ↓
データベース検索 → フィルタリング → 並び替え
    ↓
ページネーション → 結果返却
    ↓
いいね送信可能
```

## 📈 検索パフォーマンス最適化

### 1. インデックス戦略
- 複合インデックスの活用
- 部分インデックスの使用
- 検索パターンに応じた最適化

### 2. クエリ最適化
- JOINの最適化
- サブクエリの回避
- 適切なWHERE句の使用

### 3. キャッシュ戦略（将来実装）
- 人気検索結果のキャッシュ
- ユーザー情報のキャッシュ
- タグ情報のキャッシュ

---

**作成日**: 2024年1月  
**更新日**: 2024年1月  
**担当者**: Qupid開発チーム

