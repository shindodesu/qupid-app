# 通報・ブロックAPI実装計画書

## 📋 概要

不適切なユーザーへの対応機能を実装する。  
九州大学のLGBTQ当事者学生が、安全で快適なコミュニケーション環境を維持するために、不適切なユーザーを通報・ブロックできる機能を提供する。

## 🎯 目的

- 不適切なユーザーを通報する機能
- 特定ユーザーをブロックする機能
- 通報の管理・処理機能（管理者用）
- ブロックユーザーとの相互作用制限
- セーフティ機能の提供
- コミュニティの健全性維持

## 🏗️ データベース設計

### 既存テーブル構造

#### `reports` テーブル
```sql
CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    reporter_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    target_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reason VARCHAR(1000) NOT NULL,
    status VARCHAR(20) DEFAULT 'open' NOT NULL,
    admin_note VARCHAR(1000),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `blocks` テーブル
```sql
CREATE TABLE blocks (
    id SERIAL PRIMARY KEY,
    blocker_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    blocked_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id),
    CHECK (blocker_id <> blocked_id)
);
```

### 通報ステータス管理

```python
class ReportStatus(str, Enum):
    open = "open"          # 新規通報
    reviewing = "reviewing" # 審査中
    resolved = "resolved"   # 解決済み
    rejected = "rejected"   # 却下
```

## 🔌 API仕様

### エンドポイント一覧

| メソッド | エンドポイント | 説明 | 認証 |
|---------|---------------|------|------|
| POST | `/reports` | ユーザー通報 | 必要 |
| GET | `/reports/my` | 自分の通報一覧 | 必要 |
| GET | `/reports/{report_id}` | 通報詳細取得 | 必要 |
| POST | `/blocks` | ユーザーブロック | 必要 |
| GET | `/blocks/my` | ブロック一覧取得 | 必要 |
| DELETE | `/blocks/{blocked_user_id}` | ブロック解除 | 必要 |
| GET | `/admin/reports` | 通報管理一覧（管理者用） | 管理者権限 |
| PUT | `/admin/reports/{report_id}` | 通報ステータス更新（管理者用） | 管理者権限 |

### リクエスト/レスポンス仕様

#### 1. ユーザー通報
```http
POST /reports
Authorization: Bearer <token>
```

**リクエスト:**
```json
{
  "target_user_id": 123,
  "reason": "不適切なメッセージを送信してきました。"
}
```

**レスポンス:**
```json
{
  "id": 1,
  "target_user_id": 123,
  "target_user_name": "ユーザーA",
  "reason": "不適切なメッセージを送信してきました。",
  "status": "open",
  "created_at": "2024-01-01T00:00:00Z",
  "message": "Report submitted successfully"
}
```

#### 2. 自分の通報一覧
```http
GET /reports/my?limit=20&offset=0
Authorization: Bearer <token>
```

**レスポンス:**
```json
{
  "reports": [
    {
      "id": 1,
      "target_user": {
        "id": 123,
        "display_name": "ユーザーA"
      },
      "reason": "不適切なメッセージを送信してきました。",
      "status": "open",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

#### 3. 通報詳細取得
```http
GET /reports/1
Authorization: Bearer <token>
```

**レスポンス:**
```json
{
  "id": 1,
  "target_user": {
    "id": 123,
    "display_name": "ユーザーA"
  },
  "reason": "不適切なメッセージを送信してきました。",
  "status": "open",
  "admin_note": null,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### 4. ユーザーブロック
```http
POST /blocks
Authorization: Bearer <token>
```

**リクエスト:**
```json
{
  "blocked_user_id": 123
}
```

**レスポンス:**
```json
{
  "id": 1,
  "blocked_user": {
    "id": 123,
    "display_name": "ユーザーA"
  },
  "created_at": "2024-01-01T00:00:00Z",
  "message": "User blocked successfully"
}
```

#### 5. ブロック一覧取得
```http
GET /blocks/my?limit=20&offset=0
Authorization: Bearer <token>
```

**レスポンス:**
```json
{
  "blocks": [
    {
      "id": 1,
      "blocked_user": {
        "id": 123,
        "display_name": "ユーザーA"
      },
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

#### 6. ブロック解除
```http
DELETE /blocks/123
Authorization: Bearer <token>
```

**レスポンス:**
```json
{
  "message": "Block removed successfully",
  "blocked_user_id": 123
}
```

#### 7. 通報管理一覧（管理者用）
```http
GET /admin/reports?status=open&limit=20&offset=0
Authorization: Bearer <admin_token>
```

**レスポンス:**
```json
{
  "reports": [
    {
      "id": 1,
      "reporter": {
        "id": 456,
        "display_name": "ユーザーB"
      },
      "target_user": {
        "id": 123,
        "display_name": "ユーザーA"
      },
      "reason": "不適切なメッセージを送信してきました。",
      "status": "open",
      "admin_note": null,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

#### 8. 通報ステータス更新（管理者用）
```http
PUT /admin/reports/1
Authorization: Bearer <admin_token>
```

**リクエスト:**
```json
{
  "status": "resolved",
  "admin_note": "該当ユーザーに警告を発出しました。"
}
```

**レスポンス:**
```json
{
  "id": 1,
  "status": "resolved",
  "admin_note": "該当ユーザーに警告を発出しました。",
  "updated_at": "2024-01-01T12:00:00Z",
  "message": "Report status updated successfully"
}
```

## 📝 スキーマ定義

### Pydanticスキーマ

```python
# app/schemas/report_block.py

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from app.models.enums import ReportStatus

class ReportCreate(BaseModel):
    target_user_id: int = Field(..., gt=0, description="通報対象ユーザーのID")
    reason: str = Field(..., min_length=1, max_length=1000, description="通報理由")

class BlockCreate(BaseModel):
    blocked_user_id: int = Field(..., gt=0, description="ブロック対象ユーザーのID")

class ReportStatusUpdate(BaseModel):
    status: ReportStatus = Field(..., description="通報ステータス")
    admin_note: Optional[str] = Field(None, max_length=1000, description="管理者メモ")

class UserInfo(BaseModel):
    id: int
    display_name: str

    class Config:
        from_attributes = True

class ReportRead(BaseModel):
    id: int
    target_user: Optional[UserInfo] = None
    reporter: Optional[UserInfo] = None
    reason: str
    status: ReportStatus
    admin_note: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class BlockRead(BaseModel):
    id: int
    blocked_user: UserInfo
    created_at: datetime

    class Config:
        from_attributes = True

class ReportListResponse(BaseModel):
    reports: List[ReportRead]
    total: int
    limit: int
    offset: int

class BlockListResponse(BaseModel):
    blocks: List[BlockRead]
    total: int
    limit: int
    offset: int

class ReportResponse(BaseModel):
    id: int
    target_user_id: int
    target_user_name: str
    reason: str
    status: ReportStatus
    created_at: datetime
    message: str

class BlockResponse(BaseModel):
    id: int
    blocked_user: UserInfo
    created_at: datetime
    message: str

class BlockRemoveResponse(BaseModel):
    message: str
    blocked_user_id: int
```

## 🛠️ 実装手順

### Phase 1: スキーマ定義
1. `app/schemas/report_block.py` を作成
2. 上記のPydanticスキーマを実装

### Phase 2: ルーター実装
1. `app/routers/reports.py` を作成
2. `app/routers/blocks.py` を作成
3. 各エンドポイントの実装

### Phase 3: 通報機能実装
1. 通報作成機能
2. 通報一覧取得機能
3. 通報詳細取得機能

### Phase 4: ブロック機能実装
1. ブロック作成機能
2. ブロック一覧取得機能
3. ブロック解除機能

### Phase 5: 管理者機能実装
1. 通報管理一覧機能
2. 通報ステータス更新機能
3. 管理者権限チェック

### Phase 6: 統合機能実装
1. ブロックユーザーとの相互作用制限
2. 通報・ブロックの連携機能
3. 通知機能（将来実装）

### Phase 7: テスト実装
1. 単体テスト
2. 統合テスト
3. APIテスト

## 🔒 セキュリティ・権限管理

### 通報権限チェック
```python
async def can_report_user(reporter_id: int, target_user_id: int):
    # 自分自身を通報できない
    # 既に通報済みでないかチェック
    pass
```

### ブロック権限チェック
```python
async def can_block_user(blocker_id: int, blocked_user_id: int):
    # 自分自身をブロックできない
    # 既にブロック済みでないかチェック
    pass
```

### 管理者権限チェック
```python
async def is_admin(user_id: int):
    # 管理者権限の確認
    pass
```

### ブロックユーザーとの相互作用制限
```python
async def check_block_status(user1_id: int, user2_id: int):
    # 相互ブロックの確認
    # いいね、メッセージ送信の制限
    pass
```

## 🧪 テストケース

### 正常系
- [ ] ユーザー通報
- [ ] 自分の通報一覧取得
- [ ] 通報詳細取得
- [ ] ユーザーブロック
- [ ] ブロック一覧取得
- [ ] ブロック解除
- [ ] 管理者通報一覧取得
- [ ] 通報ステータス更新

### 異常系
- [ ] 存在しないユーザーへの通報
- [ ] 自分自身への通報
- [ ] 重複通報
- [ ] 存在しないユーザーのブロック
- [ ] 自分自身のブロック
- [ ] 重複ブロック
- [ ] 未認証でのアクセス
- [ ] 管理者権限なしでの管理機能アクセス

### エッジケース
- [ ] 空の通報理由
- [ ] 長すぎる通報理由
- [ ] ブロックユーザーとのいいね送信
- [ ] ブロックユーザーとのメッセージ送信
- [ ] 大量の通報・ブロックデータ

## ⚠️ 注意点・考慮事項

### セキュリティ
- 通報・ブロックは認証済みユーザーのみ
- 自分自身への通報・ブロックを防止
- 重複通報・ブロックの防止
- 管理者権限の厳格な管理

### プライバシー
- 通報者の匿名性保護
- 通報内容の適切な管理
- ブロック状況の非公開

### パフォーマンス
- 通報・ブロック一覧のページネーション
- ブロックチェックの効率化
- 大量データでのパフォーマンス

### データ整合性
- ユーザー削除時の通報・ブロック処理
- 通報・ブロックの重複防止
- ステータス変更の整合性

### ビジネスロジック
- ブロックユーザーとの相互作用制限
- 通報の適切な処理フロー
- 管理者による適切な対応

### 将来の拡張性
- 自動ブロック機能
- 通報の自動分類
- 統計・分析機能
- 通知機能

## 📊 成功指標

- [ ] 全APIエンドポイントが正常に動作
- [ ] テストカバレッジ80%以上
- [ ] 通報・ブロック処理レスポンス時間500ms以下
- [ ] セキュリティ要件を満たす
- [ ] ブロック機能が適切に動作
- [ ] 管理者機能が正常に動作

## 🔄 次のステップ

1. **通知機能** - 通報・ブロック時の通知
2. **統計機能** - 通報・ブロックの統計
3. **自動処理** - 自動ブロック・警告機能
4. **分析機能** - 不適切行為の分析

## 🎯 通報・ブロックフロー図

```
不適切行為発見 → 通報/ブロック → 管理者確認
    ↓
管理者判断 → 対応実施 → ステータス更新
    ↓
ユーザー通知 → 改善確認
```

## 📈 セーフティ機能の統合

### 1. いいね機能との連携
```python
async def send_like(liker_id: int, liked_id: int):
    # ブロック状況をチェック
    if await is_blocked(liker_id, liked_id):
        raise HTTPException(403, "User is blocked")
    # いいね送信処理
```

### 2. メッセージ機能との連携
```python
async def send_message(sender_id: int, conversation_id: int):
    # 会話相手とのブロック状況をチェック
    if await is_conversation_blocked(sender_id, conversation_id):
        raise HTTPException(403, "User is blocked")
    # メッセージ送信処理
```

### 3. 検索機能との連携
```python
async def search_users(user_id: int, filters: dict):
    # ブロックユーザーを検索結果から除外
    blocked_users = await get_blocked_users(user_id)
    # 検索結果から除外
```

## 🛡️ コミュニティ保護戦略

### 1. 予防的措置
- 利用規約の明確化
- ガイドラインの提供
- 教育コンテンツの提供

### 2. 事後対応
- 迅速な通報処理
- 適切な制裁措置
- 改善支援の提供

### 3. 継続的改善
- 通報データの分析
- システムの改善
- コミュニティの健全性向上

---

**作成日**: 2025年10月13日 
**更新日**: 2025年10月13日日  
**担当者**: 進藤（Qupid開発チーム）

