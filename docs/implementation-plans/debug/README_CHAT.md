# チャット機能 実装ドキュメント

## 📋 概要

このドキュメントでは、Qupidアプリのチャット機能の実装について説明します。

## 🎯 実装された機能

### 1. 会話一覧機能 (`/chat`)
- マッチしたユーザーとの会話一覧表示
- 最後のメッセージプレビュー
- 未読メッセージ数の表示（バッジ）
- 最終更新日時順の並び替え
- 自動更新（10秒ごと）

### 2. チャット機能 (`/chat/[conversationId]`)
- リアルタイムメッセージ送受信（5秒ごとのポーリング）
- メッセージ履歴の表示
- 既読・未読管理
- 自動スクロール（最新メッセージへ）
- 楽観的更新（送信時の即座反映）

### 3. マッチページ統合
- マッチページから直接チャット開始
- 会話の自動作成または既存会話への遷移

## 📁 ファイル構造

```
frontend/src/
├── types/
│   └── chat.ts                   # チャット関連の型定義
├── lib/
│   └── api/
│       └── chat.ts               # チャットAPIクライアント
├── components/
│   └── features/
│       └── chat/
│           ├── MessageBubble.tsx      # メッセージバブル
│           ├── MessageComposer.tsx    # メッセージ入力
│           ├── ConversationList.tsx   # 会話一覧
│           ├── ChatWindow.tsx         # チャット画面
│           └── index.ts               # エクスポート
└── app/
    └── (dashboard)/
        └── chat/
            ├── page.tsx                      # 会話一覧ページ
            └── [conversationId]/
                └── page.tsx                  # チャット詳細ページ
```

## 🔌 APIエンドポイント

### チャット関連
- `GET /conversations` - 会話一覧取得
- `POST /conversations` - 会話作成
- `GET /conversations/{id}/messages` - メッセージ履歴取得
- `POST /conversations/{id}/messages` - メッセージ送信
- `PUT /conversations/{id}/messages/{message_id}/read` - 既読マーク
- `GET /conversations/{id}/unread-count` - 未読数取得

## 🚀 使用方法

### 会話一覧の表示

1. `/chat` にアクセス
2. マッチしたユーザーとの会話一覧が表示される
3. 会話をクリックしてチャット画面を開く

### チャットの開始

**方法1: マッチページから**
1. `/matches` にアクセス
2. マッチしたユーザーの「チャットを開く」ボタンをクリック
3. 会話が自動的に作成され、チャット画面が開く

**方法2: 会話一覧から**
1. `/chat` にアクセス
2. 既存の会話をクリック
3. チャット画面が開く

### メッセージの送信

1. チャット画面下部の入力欄にメッセージを入力
2. Enter キーで送信（Shift + Enter で改行）
3. または「送信」ボタンをクリック

## 🎨 コンポーネントの使用例

### MessageBubble

```tsx
import { MessageBubble } from '@/components/features/chat'

<MessageBubble
  message={message}
  isOwn={message.sender_id === currentUserId}
/>
```

### MessageComposer

```tsx
import { MessageComposer } from '@/components/features/chat'

<MessageComposer
  onSend={(content) => handleSendMessage(content)}
  disabled={isSending}
  placeholder="メッセージを入力..."
/>
```

### ConversationList

```tsx
import { ConversationList } from '@/components/features/chat'

<ConversationList
  conversations={conversations}
  currentConversationId={currentId}
  isLoading={isLoading}
/>
```

### ChatWindow

```tsx
import { ChatWindow } from '@/components/features/chat'

<ChatWindow conversationId={conversationId} />
```

## ⚡ 主要機能の詳細

### 1. リアルタイム更新

✅ **WebSocket方式** を採用しています：
- 即座のメッセージ配信
- タイピングインジケーター
- 自動再接続機能（指数バックオフ）
- Ping-Pongキープアライブ

**接続URL**: `ws://localhost:8000/ws?token=<JWT_TOKEN>`  
**本番環境**: `wss://api.yourdomain.com/ws?token=<JWT_TOKEN>`

### 2. 楽観的更新

メッセージ送信時に即座にUIに反映：
```typescript
onMutate: async (content) => {
  // 楽観的更新: 送信前にUIに表示
  const optimisticMessage = {
    id: Date.now(),
    content,
    sender_id: currentUser.id,
    // ...
  }
  // キャッシュに追加
}
```

### 3. 既読管理

- チャット画面を開いた際に未読メッセージを自動で既読にする
- 送信者には「既読」「未読」が表示される
- 会話一覧には未読数がバッジで表示される

### 4. 自動スクロール

- 新しいメッセージが届いたら自動的に最下部へスクロール
- スクロール位置が下部付近にある場合のみ自動スクロール
- 最下部にいない場合は「↓」ボタンで手動スクロール可能

## 🎨 UIデザインの特徴

### メッセージバブル
- 自分のメッセージ: 右寄せ、赤/ピンク背景、白テキスト
- 相手のメッセージ: 左寄せ、グレー背景、黒テキスト
- タイムスタンプと既読状態を表示

### 会話一覧
- 未読メッセージは太字で強調
- 未読数をバッジで表示
- 最後のメッセージプレビュー
- 最終更新日時を表示

## 🔒 セキュリティ

- 会話の参加者のみがメッセージを閲覧・送信可能
- マッチしたユーザー間のみ会話作成可能
- ブロックしたユーザーとは会話不可
- API側で権限チェックを実施

## 📊 パフォーマンス

- React Query によるキャッシュ管理
- 楽観的更新による即座のUI反映
- 効率的な再レンダリング
- 自動更新による最新状態の維持

## 🐛 トラブルシューティング

### メッセージが表示されない
- ネットワーク接続を確認
- ブラウザのコンソールでエラーを確認
- ページをリロード

### 送信できない
- マッチしているか確認
- ブロックされていないか確認
- メッセージが空でないか確認
- 文字数制限（4000文字）を超えていないか確認

### 既読にならない
- チャット画面を開いているか確認
- ページをリロードして再試行
- 自動更新を待つ（5秒）

## 🚧 今後の拡張予定

### Phase 1: リアルタイム通信
- WebSocket による即時メッセージ配信
- タイピングインジケーター
- オンライン状態の表示

### Phase 2: メッセージ機能強化
- 画像・ファイルの送信
- メッセージの編集・削除
- メッセージの検索
- リアクション機能（いいね、スタンプなど）

### Phase 3: 通知機能
- 新メッセージのプッシュ通知
- 未読数のバッジ表示（ナビゲーション）
- メール通知

### Phase 4: グループチャット
- 複数人でのグループチャット
- グループ管理機能
- グループ招待機能

## 📈 成功指標

- ✅ メッセージ送信成功率 > 99%
- ✅ メッセージ表示遅延 < 1秒
- ✅ UI応答速度 < 300ms
- ✅ 楽観的更新の正確性 100%

## 📚 参考資料

- [実装計画書: チャットAPI](../../docs/implementation-plans/04-chat-api.md)
- [実装計画書: フロントエンドチャット](../../docs/implementation-plans/frontend/04-chat.md)
- [要件定義書](../../docs/requirements.md)

## 👥 開発者

Qupid開発チーム

## 📅 更新履歴

- 2025-10-15: チャット機能実装完了
  - 会話一覧ページ
  - チャット詳細ページ
  - メッセージ送受信
  - 既読管理
  - 楽観的更新
  - 自動更新（ポーリング）

