# 本番デバッグ記録: アバター画像404 + WebSocket CSPブロック

作成日: 2026-04-24  
対象環境: Render 本番

## 1. 事象

### 症状A: アバター画像が表示されない
- APIログに `GET /uploads/avatars/... 404` が継続的に出る
- `GET /users/suggestions` 自体は `200` で成功している
- 認証は `POST /auth/login 200` で成功している

### 症状B: フロントで接続エラー
- ブラウザコンソールに `Failed to load resource: the server responded with a status of 408`
- さらに詳細ログで以下を確認:
  - `Connecting to 'wss://qupid-app.onrender.com/ws?...' violates Content Security Policy directive "connect-src ..."`

## 2. 切り分け結果

## A. 画像404の原因
- 原因は認証ではなく、**DBの `avatar_url` が指すファイル実体が無いこと**
- 具体的には、DBには `uploads/avatars/<user>_<uuid>.<ext>` が残っているが、Render側ディスクに該当ファイルが存在しない
- `app/main.py` で `/uploads` は正しくStaticFilesマウントされており、ルーティング不備ではない

### 技術的背景
- Renderのローカルファイルは永続ではないため、再デプロイ/再起動で消える
- そのため「DBにはURLが残るが、実ファイルが消える」状態が発生する

## B. WebSocket接続失敗の原因
- CSPの `connect-src` に `https://...` はあるが、`wss://...` が未許可
- CSPはスキーム単位で判定するため、`https` 許可は `wss` 許可を含まない
- その結果、`wss://qupid-app.onrender.com/ws` がブラウザでブロックされた

## 3. 実施した修正

## A. 壊れたアバターURLの自動フォールバック
- 追加: `app/schemas/avatar_utils.py`
  - `normalize_avatar_url()` を実装
  - ローカルパス (`uploads/...`) で実体が無い場合は `None` を返す
- 適用先:
  - `app/schemas/user.py` (`UserRead.avatar_url`)
  - `app/schemas/search.py` (`UserSearchResult.avatar_url`, `UserSuggestion.avatar_url`)
  - `app/schemas/chat.py` (`UserInfo.avatar_url`)

効果:
- APIレスポンス段階で壊れた `avatar_url` を除去
- フロントの既存デフォルト画像フォールバック (`/initial_icon.svg`) へ自然に遷移
- 不要な404リクエストの連打を抑制

## B. 既存データのクリーンアップスクリプト追加
- 追加: `dev_tools/cleanup_missing_avatars.py`
- 機能:
  - `users.avatar_url` を走査
  - 実体が無いローカルアバターのみ抽出
  - `--apply` 指定時に `avatar_url = NULL` へ更新
- 実装方式:
  - 環境差分に強くするため、ORM全面依存を避けて `SELECT/UPDATE` の生SQLベースで処理

## C. CSP修正（WebSocket許可）
- 修正: `frontend/next.config.ts` の `Content-Security-Policy`
- `connect-src` に以下を追加:
  - `ws://localhost:8000`
  - `wss://api.qupid.app`
  - `wss://qupid-api.onrender.com`
  - `wss://qupid-app.onrender.com`

効果:
- `wss://.../ws` 接続がCSPでブロックされなくなる
- 反映後はNetworkで `101 Switching Protocols` を期待

## 4. 実行ログ要点

## クリーンアップスクリプト実行
- ローカル実行時:
  - dry-run: `scanned=0 / missing=0 / updated=0`
  - apply: `scanned=0 / missing=0 / updated=0`
- 注記:
  - ローカルDBは本番データを持っていないため0件
  - 本番効果確認はRender本番DB接続で実行が必要

## 5. 本番での実行手順

1. フロントを再デプロイ（CSP変更反映）
2. Renderシェル/ジョブで以下を実行

```bash
PYTHONPATH=. python3 dev_tools/cleanup_missing_avatars.py
PYTHONPATH=. python3 dev_tools/cleanup_missing_avatars.py --apply
```

3. 検証
- WebSocket: `/ws` が `101 Switching Protocols`
- 画像: `GET /uploads/avatars/... 404` が減少/解消
- 画面: 壊れたアバターがデフォルト画像表示にフォールバック

## 6. 再発防止（恒久対策）

- ローカル `uploads` 保存をやめ、S3/Cloudinary等の永続ストレージへ移行
- DBには永続URL（CDN/オブジェクトストレージURL）を保存
- 定期バッチ（nightly）で `avatar_url` の実体検査を自動実行

---

## 変更ファイル一覧
- `app/schemas/avatar_utils.py` (新規)
- `app/schemas/user.py`
- `app/schemas/search.py`
- `app/schemas/chat.py`
- `dev_tools/cleanup_missing_avatars.py` (新規)
- `frontend/next.config.ts`
