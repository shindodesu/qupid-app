# フロントエンド実装計画書: チャット

## 📋 概要
マッチしたユーザー間の1対1チャットをフロントで実装する計画。履歴取得、送受信、既読、未読数表示までを対象とし、リアルタイムは将来拡張（SSE/WebSocket）。

## 🔌 対応API
- GET `/conversations` 会話一覧
- POST `/conversations` 会話作成（マッチ時）
- GET `/conversations/{id}` 会話詳細
- GET `/conversations/{id}/messages` メッセージ履歴
- POST `/conversations/{id}/messages` 送信
- PUT `/conversations/{id}/messages/{message_id}/read` 既読
- GET `/conversations/{id}/unread-count` 未読数

## 🧭 画面/ルート
- `/chat` 会話一覧
- `/chat/[conversationId]` メッセージ画面

## 🧱 データ型（フロント）
```ts
// src/types/chat.ts
export type Message = {
  id: number
  content: string
  sender_id: number
  sender_name: string
  is_read: boolean
  created_at: string
}

export type Conversation = {
  id: number
  type: 'direct' | 'group'
  title?: string | null
  other_user: { id: number; display_name: string; bio?: string | null }
  last_message?: Pick<Message, 'id' | 'content' | 'sender_id' | 'is_read' | 'created_at'> | null
  unread_count: number
  created_at: string
  updated_at: string
}
```

## 🧰 コンポーネント
- `ConversationList`（無限スクロール/仮想化）
- `ChatWindow`（ヘッダー・メッセージリスト・入力）
- `MessageBubble`（自分/相手でスタイル分岐）
- `MessageComposer`（入力送信、Enter送信、添付は将来）
- `TypingIndicator`（将来）

## 🔄 React Query キー
- `['conversations']` 一覧
- `['conversation', id]` 詳細
- `['messages', id]` 履歴

## 🧠 既読・未読設計
- メッセージ画面表示時に自分以外の最新メッセージを既読化（フォーカス/可視時）
- 一覧では `unread_count` をバッジ表示、送信/既読更新で同期

## ⚡ パフォーマンス
- メッセージリストは仮想化（例: `react-virtuoso`）
- ページング/無限スクロール、逆方向ロード（過去に遡る）

## 🧪 テスト
- 一覧表示/ソート（最新更新順）
- 履歴ページング
- 送信の楽観的追加/失敗ロールバック
- 既読更新の反映

## 🔒 セキュリティ/考慮
- 参加者チェックはAPI側。UIはエラー表示と安全遷移
- XSS対策（テキストのみ、URL自動リンクは将来）

## 📈 成功指標
- メッセージ送信応答 < 300ms（ネットワーク除く）
- 初回履歴表示 < 1s、スクロール遅延なし
- 既読反映遅延 < 1s

## 📋 実装チェックリスト
- [ ] `/chat` 会話一覧（未読数・最終メッセージ）
- [ ] `/chat/[id]` 履歴表示・無限スクロール
- [ ] 送信（楽観的更新）
- [ ] 既読更新（画面表示/フォーカス時）
- [ ] エラー/再試行UX
- [ ] テスト（単体/統合/E2E）

---
作成日: 2025-10-13 / 担当: Qupid開発チーム



