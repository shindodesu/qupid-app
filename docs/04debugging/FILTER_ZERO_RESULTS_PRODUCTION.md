# Filter適用時に0件になる不具合（本番限定）デバッグ記録

## 事象
- フィルターを1つでも適用すると、ユーザー一覧が0件になる。
- エラー表示は出ない。
- ローカル（開発環境）では再現しづらく、本番で顕在化。

## 影響範囲
- 対象画面: `frontend/src/app/(dashboard)/home/page.tsx`（探す画面）
- 対象API: `GET /users/suggestions`, `GET /users/search`
- 対象フィルター: `sexuality`, `relationship_goal`, `sex`（および検索系フィルター連携）

## 調査ログ（要点）
1. フロントのフィルター構築を確認  
   - `DiscoverFilters` と `home/page.tsx` の `filters` 生成・適用処理を確認。
2. APIクライアントを確認  
   - `frontend/src/lib/api/search.ts` のクエリ組み立てを確認。
3. バックエンドの検索条件を確認  
   - `app/routers/users.py` の `search_users` / `get_user_suggestions` のWHERE条件を精査。
4. 本番データ差分を仮説化  
   - 開発: `gay` のような英語保存
   - 本番: `ゲイ` のような日本語保存が混在
   - フィルター値（英語）とDB保存値（日本語）が一致せず0件化。

## 根本原因
- **値の正規化ルールが環境間で不一致**。
- アプリ側は英語コード値（`gay` 等）を前提にフィルターしているが、本番DBに日本語値（`ゲイ` 等）が残存しており、`IN` 条件でヒットしない。

## 実施した修正

### 1) フロントの型・引数不整合修正
- `SearchFilters` の `campus/faculty/grade` を配列型に統一。
- `home/page.tsx` で検索フィルター生成時に `join(',')` をやめ、配列をそのまま `searchApi.searchUsers()` に渡すよう修正。

対象ファイル:
- `frontend/src/types/search.ts`
- `frontend/src/app/(dashboard)/home/page.tsx`

### 2) バックエンドで同義語（英語/日本語）を吸収
- `app/routers/users.py` に互換マッピングと展開関数を追加。
- `get_user_suggestions` の以下条件でエイリアス展開を適用:
  - `sexuality`
  - `relationship_goal`
  - `sex`

例:
- `gay` -> `["gay", "ゲイ"]`
- `dating` -> `["dating", "恋愛関係"]`
- `male` -> `["male", "man", "男性"]`

## なぜこの対応にしたか
- 本番データの混在を即時吸収し、ユーザー影響を先に止血するため（アプリ停止なしで反映可能）。
- 将来の恒久対応（DB正規化）までの移行期間に、安全に互換性を保つため。

## 動作確認ポイント
- 単一フィルター（`sexuality=gay` 等）で0件化しないこと。
- 複数フィルター同時適用時も、想定母集団が段階的に絞られること。
- 開発/本番で同じフィルター値を使ったときの挙動が一致すること。

## 残課題（推奨）
1. 本番DBのデータ正規化マイグレーションを実施  
   - `sexuality`, `gender`, `looking_for` の日本語値を英語コード値へ統一。
2. 正規化後も一定期間は互換マッピングを残し、監視後に縮退。
3. CIまたはE2Eで「フィルター1件適用時に0件固定化しない」回帰テストを追加。

## 再発防止策
- 保存値の仕様（英語コード値）をスキーマ/バリデーションで強制。
- API境界で正規化（入力時正規化 + 出力時整形）を明文化。
- 環境差分（seed/本番データ）を定期監査するジョブを追加。
