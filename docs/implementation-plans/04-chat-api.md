# チャットAPI実装計画書

## 📋 概要

マッチしたユーザー間でのメッセージ送受信機能を実装する。  
九州大学のLGBTQ当事者学生が、マッチング成立後に安全で快適なチャット機能を通じてコミュニケーションを取れるようにする。

## 🎯 目的

- マッチしたユーザー間での1対1チャット
- メッセージの送信・受信機能
- メッセージ履歴の取得
- 既読管理機能
- リアルタイム通信（将来実装）
- セキュアなコミュニケーション環境の提供

## 🏗️ データベース設計

### 既存テーブル構造

#### `conversations` テーブル
```sql
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) DEFAULT 'direct' NOT NULL,
    title VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `conversation_members` テーブル
```sql
CREATE TABLE conversation_members (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);
```

#### `messages` テーブル
```sql
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content VARCHAR(4000) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### チャットフロー設計

1. **マッチング成立** → 会話（Conversation）作成
2. **メッセージ送信** → Messageレコード作成
3. **メッセージ受信** → 既読フラグ更新
4. **履歴取得** → ページネーション対応

## 🔌 API仕様

### エンドポイント一覧

| メソッド | エンドポイント | 説明 | 認証 |
|---------|---------------|------|------|
| GET | `/conversations` | 会話一覧取得 | 必要 |
| POST | `/conversations` | 会話作成（マッチ時） | 必要 |
| GET | `/conversations/{conversation_id}` | 会話詳細取得 | 必要 |
| GET | `/conversations/{conversation_id}/messages` | メッセージ履歴取得 | 必要 |
| POST | `/conversations/{conversation_id}/messages` | メッセージ送信 | 必要 |
| PUT | `/conversations/{conversation_id}/messages/{message_id}/read` | 既読マーク | 必要 |
| GET | `/conversations/{conversation_id}/unread-count` | 未読メッセージ数取得 | 必要 |

### リクエスト/レスポンス仕様

#### 1. 会話一覧取得
```http
GET /conversations?limit=20&offset=0
Authorization: Bearer <token>
```

**レスポンス:**
```json
{
  "conversations": [
    {
      "id": 1,
      "type": "direct",
      "title": null,
      "other_user": {
        "id": 123,
        "display_name": "ユーザーA",
        "bio": "よろしくお願いします"
      },
      "last_message": {
        "id": 5,
        "content": "こんにちは！",
        "sender_id": 123,
        "created_at": "2024-01-01T12:00:00Z",
        "is_read": true
      },
      "unread_count": 0,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T12:00:00Z"
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

#### 2. 会話作成（マッチ時）
```http
POST /conversations
Authorization: Bearer <token>
```

**リクエスト:**
```json
{
  "other_user_id": 123
}
```

**レスポンス:**
```json
{
  "id": 1,
  "type": "direct",
  "title": null,
  "other_user": {
    "id": 123,
    "display_name": "ユーザーA",
    "bio": "よろしくお願いします"
  },
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### 3. メッセージ履歴取得
```http
GET /conversations/1/messages?limit=50&offset=0
Authorization: Bearer <token>
```

**レスポンス:**
```json
{
  "messages": [
    {
      "id": 1,
      "content": "はじめまして！",
      "sender_id": 456,
      "sender_name": "ユーザーB",
      "is_read": true,
      "created_at": "2024-01-01T00:00:00Z"
    },
    {
      "id": 2,
      "content": "こんにちは！よろしくお願いします",
      "sender_id": 123,
      "sender_name": "ユーザーA",
      "is_read": true,
      "created_at": "2024-01-01T00:05:00Z"
    }
  ],
  "total": 2,
  "limit": 50,
  "offset": 0
}
```

#### 4. メッセージ送信
```http
POST /conversations/1/messages
Authorization: Bearer <token>
```

**リクエスト:**
```json
{
  "content": "こんにちは！映画の話をしましょう"
}
```

**レスポンス:**
```json
{
  "id": 3,
  "content": "こんにちは！映画の話をしましょう",
  "sender_id": 456,
  "sender_name": "ユーザーB",
  "is_read": false,
  "created_at": "2024-01-01T12:00:00Z"
}
```

#### 5. 既読マーク
```http
PUT /conversations/1/messages/3/read
Authorization: Bearer <token>
```

**レスポンス:**
```json
{
  "message": "Message marked as read",
  "message_id": 3
}
```

#### 6. 未読メッセージ数取得
```http
GET /conversations/1/unread-count
Authorization: Bearer <token>
```

**レスポンス:**
```json
{
  "unread_count": 2
}
```

## 📝 スキーマ定義

### Pydanticスキーマ

```python
# app/schemas/chat.py

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from app.models.enums import ConversationType

class ConversationCreate(BaseModel):
    other_user_id: int = Field(..., gt=0, description="会話相手のユーザーID")

class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=4000, description="メッセージ内容")

class UserInfo(BaseModel):
    id: int
    display_name: str
    bio: Optional[str]

    class Config:
        from_attributes = True

class MessageRead(BaseModel):
    id: int
    content: str
    sender_id: int
    sender_name: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class LastMessage(BaseModel):
    id: int
    content: str
    sender_id: int
    created_at: datetime
    is_read: bool

    class Config:
        from_attributes = True

class ConversationRead(BaseModel):
    id: int
    type: ConversationType
    title: Optional[str]
    other_user: UserInfo
    last_message: Optional[LastMessage]
    unread_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ConversationListResponse(BaseModel):
    conversations: List[ConversationRead]
    total: int
    limit: int
    offset: int

class MessageListResponse(BaseModel):
    messages: List[MessageRead]
    total: int
    limit: int
    offset: int

class UnreadCountResponse(BaseModel):
    unread_count: int

class MessageReadResponse(BaseModel):
    message: str
    message_id: int
```

## 🛠️ 実装手順

### Phase 1: スキーマ定義
1. `app/schemas/chat.py` を作成
2. 上記のPydanticスキーマを実装

### Phase 2: ルーター実装
1. `app/routers/chat.py` を作成
2. 各エンドポイントの実装

### Phase 3: 会話管理機能
1. 会話作成機能
2. 会話一覧取得機能
3. 会話詳細取得機能

### Phase 4: メッセージ機能
1. メッセージ送信機能
2. メッセージ履歴取得機能
3. 既読管理機能

### Phase 5: 権限・セキュリティ
1. 会話参加者チェック
2. メッセージ送信権限チェック
3. プライバシー保護

### Phase 6: テスト実装
1. 単体テスト
2. 統合テスト
3. APIテスト

## 🔒 セキュリティ・権限管理

### 会話参加者チェック
```python
async def check_conversation_member(conversation_id: int, user_id: int):
    # ユーザーが会話の参加者かチェック
    pass
```

### メッセージ送信権限
```python
async def can_send_message(conversation_id: int, user_id: int):
    # マッチしたユーザー間のみメッセージ送信可能
    pass
```

### プライバシー保護
- 会話内容の暗号化（将来実装）
- メッセージの削除機能（将来実装）
- 通報機能との連携

## 🧪 テストケース

### 正常系
- [ ] 会話一覧取得
- [ ] 会話作成（マッチ時）
- [ ] 会話詳細取得
- [ ] メッセージ送信
- [ ] メッセージ履歴取得
- [ ] 既読マーク
- [ ] 未読メッセージ数取得

### 異常系
- [ ] 存在しない会話へのアクセス
- [ ] 参加者でない会話へのアクセス
- [ ] マッチしていないユーザーとの会話作成
- [ ] 空のメッセージ送信
- [ ] 長すぎるメッセージ送信

### エッジケース
- [ ] 大量のメッセージ履歴
- [ ] 同時メッセージ送信
- [ ] 会話削除後のアクセス
- [ ] ユーザー削除後の会話

## ⚠️ 注意点・考慮事項

### セキュリティ
- 会話参加者のみアクセス可能
- マッチしたユーザー間のみメッセージ送信可能
- メッセージ内容の適切な検証

### パフォーマンス
- メッセージ履歴のページネーション
- 未読メッセージ数の効率的な計算
- 会話一覧の最適化

### データ整合性
- 会話削除時のメッセージ自動削除（CASCADE）
- ユーザー削除時の会話・メッセージ処理
- 重複メッセージの防止

### ユーザビリティ
- 既読管理の正確性
- メッセージ送信の即座性
- エラーメッセージの分かりやすさ

### 将来の拡張性
- リアルタイム通信（WebSocket）
- メッセージの暗号化
- ファイル送信機能
- グループチャット機能
- メッセージの編集・削除機能

## 📊 成功指標

- [ ] 全APIエンドポイントが正常に動作
- [ ] テストカバレッジ80%以上
- [ ] メッセージ送信レスポンス時間500ms以下
- [ ] 会話一覧取得レスポンス時間1秒以下
- [ ] セキュリティ要件を満たす
- [ ] 既読管理が正確に動作

## 🔄 次のステップ

1. **リアルタイム通信** - WebSocket実装
2. **通知機能** - 新メッセージ通知
3. **ファイル送信** - 画像・ファイル共有
4. **メッセージ管理** - 編集・削除機能

## 🎯 チャットフロー図

```
マッチング成立 → 会話作成 → メッセージ送信
    ↓
メッセージ受信 → 既読マーク → 返信
    ↓
会話履歴管理 → 未読管理
```

## 📈 メッセージ管理戦略

### 1. 既読管理
- メッセージ受信時の自動既読マーク
- 手動既読マーク機能
- 未読メッセージ数の効率的な計算

### 2. 履歴管理
- ページネーション対応
- 古いメッセージのアーカイブ（将来実装）
- メッセージ検索機能（将来実装）

### 3. パフォーマンス最適化
- 会話一覧のキャッシュ（将来実装）
- メッセージの遅延読み込み
- インデックスの最適化

## 🌐 リアルタイム通信（将来実装）

### WebSocket実装計画
```python
# 将来実装予定
@app.websocket("/ws/conversations/{conversation_id}")
async def websocket_endpoint(websocket: WebSocket, conversation_id: int):
    # リアルタイムメッセージ送受信
    pass
```

### 通知機能
- 新メッセージ受信時の即座通知
- プッシュ通知（将来実装）
- メール通知（将来実装）

---

**作成日**: 2024年1月  
**更新日**: 2024年1月  
**担当者**: Qupid開発チーム

