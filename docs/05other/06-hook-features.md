# Qupid フック事業機能 要件定義書

## 📋 概要

Qupidアプリケーションに、競合との差別化を図るための「フック事業」機能を追加します。  
これらの機能は、ユーザーのエンゲージメント向上と、マッチングアプリとしての付加価値提供を目的としています。

**作成日**: 2025年1月  
**ステータス**: 要件定義完了

---

## 🎯 目的

マッチングアプリとしての基本機能だけでは市場で競争力を持てないため、以下の4つのフック事業機能を追加することで：

1. **ユーザーエンゲージメントの向上** - アプリ滞在時間の増加
2. **差別化要素の創出** - 他アプリにはない独自機能の提供
3. **マッチング精度の向上** - より深い相性判定によるマッチング品質向上
4. **コミュニティ形成** - LGBTQ+コミュニティへの理解促進と教育

---

## 🧩 機能要件

### 1. 即日デート機能（Same-Day Date）

#### 1.1 機能概要
ユーザーが即日（当日）でデートを企画・提案できる機能。マッチしたユーザー間で、気軽にデートを提案・承認できる仕組みを提供します。

#### 1.2 機能詳細

**基本機能:**
- マッチしたユーザーに対して即日デートを提案できる
- デート提案には以下を含める：
  - デートの種類（カフェ、映画、散歩、食事など）
  - 希望時間帯（午前、午後、夜など）
  - 希望場所（学内、学外、オンラインなど）
  - メッセージ（任意）
- 提案されたデートに対して承認・拒否ができる
- 承認されたデートは「確定デート」として管理される
- デート提案の履歴を確認できる

**制約・ルール:**
- マッチしたユーザー間でのみ利用可能
- 1日あたりの提案数に制限（例：3件まで）
- 提案は当日のみ有効（翌日0時で自動的に無効化）
- 確定デートは24時間以内に実施される想定

**セーフティ機能:**
- デート提案の拒否理由を記録（任意）
- 不適切な提案の通報機能
- デート後のフィードバック機能（任意）

#### 1.3 データモデル要件

**テーブル: `same_day_dates`**
- `id`: 主キー
- `proposer_id`: 提案者ユーザーID（外部キー）
- `proposed_to_id`: 提案先ユーザーID（外部キー）
- `date_type`: デートの種類（ENUM: cafe, movie, walk, meal, online, other）
- `preferred_time`: 希望時間帯（ENUM: morning, afternoon, evening, flexible）
- `preferred_location`: 希望場所（ENUM: on_campus, off_campus, online, flexible）
- `message`: メッセージ（テキスト、最大500文字）
- `status`: ステータス（ENUM: pending, accepted, rejected, expired, completed）
- `rejected_reason`: 拒否理由（テキスト、最大200文字、任意）
- `scheduled_at`: 確定日時（DateTime、任意）
- `created_at`: 作成日時
- `updated_at`: 更新日時

**インデックス:**
- `(proposer_id, status)` - 提案者の提案一覧取得用
- `(proposed_to_id, status)` - 提案先の受信一覧取得用
- `created_at` - 有効期限チェック用

---

### 2. 性格診断機能（Personality Assessment）

#### 2.1 機能概要
ユーザーが自分の性格を診断し、結果をプロフィールに表示できる機能。診断結果はマッチングの相性判定にも活用されます。

#### 2.2 機能詳細

**基本機能:**
- 複数の質問に回答して性格診断を実施
- 診断結果を複数の性格タイプで表示（例：Big Five、MBTI風など）
- 診断結果をプロフィールに表示（公開/非公開設定可能）
- 診断結果に基づいた相性スコアの計算
- 診断結果の再診断機能（一定期間後に再実施可能）

**診断内容:**
- 質問数: 20-30問程度
- 回答形式: 5段階評価（強く同意する〜強く反対する）
- 診断時間: 5-10分程度
- 結果表示: 複数の性格特性スコア（例：外向性、協調性、誠実性、情緒安定性、開放性）

**相性判定:**
- 性格診断結果に基づいて、他のユーザーとの相性スコアを計算
- 相性スコアは検索結果やおすすめユーザーに反映
- 相性スコアの詳細を表示（任意）

#### 2.3 データモデル要件

**テーブル: `personality_questions`**
- `id`: 主キー
- `question_text`: 質問文（テキスト、最大500文字）
- `question_category`: 質問カテゴリ（ENUM: extraversion, agreeableness, conscientiousness, neuroticism, openness）
- `order`: 表示順序（整数）
- `is_active`: 有効フラグ（Boolean）
- `created_at`: 作成日時
- `updated_at`: 更新日時

**テーブル: `personality_assessments`**
- `id`: 主キー
- `user_id`: ユーザーID（外部キー、一意制約）
- `extraversion_score`: 外向性スコア（0-100）
- `agreeableness_score`: 協調性スコア（0-100）
- `conscientiousness_score`: 誠実性スコア（0-100）
- `neuroticism_score`: 情緒安定性スコア（0-100）
- `openness_score`: 開放性スコア（0-100）
- `personality_type`: 性格タイプ（テキスト、例："外向的で協調的なタイプ"）
- `is_public`: 公開設定（Boolean）
- `completed_at`: 診断完了日時
- `created_at`: 作成日時
- `updated_at`: 更新日時

**テーブル: `personality_responses`**
- `id`: 主キー
- `assessment_id`: 診断ID（外部キー）
- `question_id`: 質問ID（外部キー）
- `response_value`: 回答値（1-5）
- `created_at`: 作成日時

**テーブル: `personality_compatibility`**
- `id`: 主キー
- `user1_id`: ユーザー1のID（外部キー）
- `user2_id`: ユーザー2のID（外部キー）
- `compatibility_score`: 相性スコア（0-100）
- `calculated_at`: 計算日時
- `created_at`: 作成日時
- `updated_at`: 更新日時
- 一意制約: `(user1_id, user2_id)`

---

### 3. 本音マッチ機能（Honest Match）

#### 3.1 機能概要
通常のマッチングに加えて、より深い質問に答えることで「本音」を共有し、より相性の高いマッチングを実現する機能。

#### 3.2 機能詳細

**基本機能:**
- 本音マッチ用の質問セットに回答
- 回答は匿名で、マッチング成立後に共有される
- 本音マッチの回答に基づいて、より精度の高いマッチングを提案
- マッチしたユーザー間で、お互いの回答を確認できる
- 回答の一致度に基づいた「本音マッチ度」を表示

**質問内容:**
- 質問数: 10-15問程度
- 質問カテゴリ:
  - 恋愛観・関係性について
  - 価値観・ライフスタイル
  - コミュニケーションスタイル
  - LGBTQ+コミュニティへの考え
  - 将来の展望
- 回答形式: 複数選択、自由記述、5段階評価など

**マッチングロジック:**
- 本音マッチの回答に基づいて、相性スコアを計算
- 通常のマッチング結果に、本音マッチ度を追加表示
- 本音マッチ度が高いユーザーを優先的に表示

#### 3.3 データモデル要件

**テーブル: `honest_match_questions`**
- `id`: 主キー
- `question_text`: 質問文（テキスト、最大1000文字）
- `question_category`: 質問カテゴリ（ENUM: relationship, values, communication, community, future）
- `answer_type`: 回答形式（ENUM: multiple_choice, text, scale）
- `answer_options`: 選択肢（JSON、複数選択の場合）
- `order`: 表示順序（整数）
- `is_active`: 有効フラグ（Boolean）
- `created_at`: 作成日時
- `updated_at`: 更新日時

**テーブル: `honest_match_responses`**
- `id`: 主キー
- `user_id`: ユーザーID（外部キー）
- `question_id`: 質問ID（外部キー）
- `answer_text`: 回答テキスト（テキスト、最大2000文字）
- `answer_value`: 回答値（数値、スケール回答の場合）
- `created_at`: 作成日時
- `updated_at`: 更新日時
- 一意制約: `(user_id, question_id)`

**テーブル: `honest_match_compatibility`**
- `id`: 主キー
- `user1_id`: ユーザー1のID（外部キー）
- `user2_id`: ユーザー2のID（外部キー）
- `match_score`: 本音マッチ度（0-100）
- `common_answers`: 一致した回答数（整数）
- `calculated_at`: 計算日時
- `created_at`: 作成日時
- `updated_at`: 更新日時
- 一意制約: `(user1_id, user2_id)`

---

### 4. LGBTQ+クイズゲーム機能（LGBTQ Quiz Game）

#### 4.1 機能概要
LGBTQ+に関する知識を楽しく学べるクイズゲーム機能。教育とエンターテイメントを兼ね備えた機能として提供します。

#### 4.1 機能詳細

**基本機能:**
- 複数のクイズカテゴリから選択してクイズに挑戦
- クイズは4択形式
- 正解・不正解に応じてスコアを獲得
- スコアに応じたランキング表示（任意）
- クイズ結果をプロフィールに表示（任意）
- クイズの履歴を確認できる

**クイズカテゴリ:**
- LGBTQ+基礎知識
- 用語・定義
- 歴史・文化
- 権利・法律
- コミュニティ・リソース
- アライ（支援者）向け知識

**ゲーム要素:**
- 連続正解ボーナス
- カテゴリ別の達成バッジ
- 週間・月間ランキング
- クイズの難易度設定（初級・中級・上級）

**教育要素:**
- 各問題に解説を表示
- 間違えた問題を復習できる
- おすすめリソースの紹介

#### 4.3 データモデル要件

**テーブル: `quiz_categories`**
- `id`: 主キー
- `name`: カテゴリ名（テキスト、最大100文字）
- `description`: 説明（テキスト、最大500文字）
- `difficulty_level`: 難易度（ENUM: beginner, intermediate, advanced）
- `is_active`: 有効フラグ（Boolean）
- `created_at`: 作成日時
- `updated_at`: 更新日時

**テーブル: `quiz_questions`**
- `id`: 主キー
- `category_id`: カテゴリID（外部キー）
- `question_text`: 問題文（テキスト、最大1000文字）
- `option_a`: 選択肢A（テキスト、最大200文字）
- `option_b`: 選択肢B（テキスト、最大200文字）
- `option_c`: 選択肢C（テキスト、最大200文字）
- `option_d`: 選択肢D（テキスト、最大200文字）
- `correct_answer`: 正解（ENUM: A, B, C, D）
- `explanation`: 解説（テキスト、最大1000文字）
- `difficulty_level`: 難易度（ENUM: beginner, intermediate, advanced）
- `is_active`: 有効フラグ（Boolean）
- `created_at`: 作成日時
- `updated_at`: 更新日時

**テーブル: `quiz_sessions`**
- `id`: 主キー
- `user_id`: ユーザーID（外部キー）
- `category_id`: カテゴリID（外部キー）
- `score`: スコア（整数）
- `total_questions`: 総問題数（整数）
- `correct_answers`: 正解数（整数）
- `completed_at`: 完了日時
- `created_at`: 作成日時

**テーブル: `quiz_responses`**
- `id`: 主キー
- `session_id`: セッションID（外部キー）
- `question_id`: 問題ID（外部キー）
- `selected_answer`: 選択した回答（ENUM: A, B, C, D）
- `is_correct`: 正解フラグ（Boolean）
- `answered_at`: 回答日時
- `created_at`: 作成日時

**テーブル: `quiz_achievements`**
- `id`: 主キー
- `user_id`: ユーザーID（外部キー）
- `category_id`: カテゴリID（外部キー）
- `achievement_type`: 達成タイプ（ENUM: perfect_score, streak, category_master）
- `achieved_at`: 達成日時
- `created_at`: 作成日時

---

## 🔌 API設計

### 即日デートAPI

| メソッド | エンドポイント | 説明 | 認証 |
|---------|---------------|------|------|
| POST | `/same-day-dates` | 即日デートを提案 | 必要 |
| GET | `/same-day-dates/sent` | 送信した提案一覧 | 必要 |
| GET | `/same-day-dates/received` | 受信した提案一覧 | 必要 |
| PUT | `/same-day-dates/{id}/accept` | 提案を承認 | 必要 |
| PUT | `/same-day-dates/{id}/reject` | 提案を拒否 | 必要 |
| GET | `/same-day-dates/{id}` | 提案詳細取得 | 必要 |
| DELETE | `/same-day-dates/{id}` | 提案をキャンセル | 必要 |

### 性格診断API

| メソッド | エンドポイント | 説明 | 認証 |
|---------|---------------|------|------|
| GET | `/personality/questions` | 質問一覧取得 | 必要 |
| POST | `/personality/assessments` | 診断を開始 | 必要 |
| POST | `/personality/assessments/{id}/responses` | 回答を送信 | 必要 |
| PUT | `/personality/assessments/{id}/complete` | 診断を完了 | 必要 |
| GET | `/personality/assessments/me` | 自分の診断結果取得 | 必要 |
| GET | `/personality/compatibility/{user_id}` | 相性スコア取得 | 必要 |
| PUT | `/personality/assessments/me/visibility` | 公開設定を変更 | 必要 |

### 本音マッチAPI

| メソッド | エンドポイント | 説明 | 認証 |
|---------|---------------|------|------|
| GET | `/honest-match/questions` | 質問一覧取得 | 必要 |
| POST | `/honest-match/responses` | 回答を送信 | 必要 |
| PUT | `/honest-match/responses/{question_id}` | 回答を更新 | 必要 |
| GET | `/honest-match/responses/me` | 自分の回答一覧取得 | 必要 |
| GET | `/honest-match/compatibility/{user_id}` | 本音マッチ度取得 | 必要 |
| GET | `/honest-match/matches/{user_id}/answers` | マッチしたユーザーの回答取得 | 必要 |

### LGBTQ+クイズゲームAPI

| メソッド | エンドポイント | 説明 | 認証 |
|---------|---------------|------|------|
| GET | `/quiz/categories` | カテゴリ一覧取得 | 必要 |
| GET | `/quiz/questions` | 問題一覧取得（カテゴリ別） | 必要 |
| POST | `/quiz/sessions` | クイズセッション開始 | 必要 |
| POST | `/quiz/sessions/{id}/responses` | 回答を送信 | 必要 |
| PUT | `/quiz/sessions/{id}/complete` | セッション完了 | 必要 |
| GET | `/quiz/sessions/me` | 自分のセッション履歴 | 必要 |
| GET | `/quiz/leaderboard` | ランキング取得 | 必要 |
| GET | `/quiz/achievements/me` | 自分の達成状況取得 | 必要 |

---

## 🎨 UI/UX要件

### デザイン原則
- **ゲーミフィケーション**: 楽しく、やりがいのある体験
- **教育性**: 学習要素を自然に組み込む
- **プライバシー**: 回答内容の公開範囲をユーザーが制御可能
- **アクセシビリティ**: 誰でも使いやすいインターフェース

### 主要画面

**即日デート機能:**
- デート提案作成画面
- 受信した提案一覧画面
- 提案詳細・承認画面
- 確定デート一覧画面

**性格診断機能:**
- 診断開始画面
- 質問回答画面（プログレス表示）
- 診断結果表示画面
- 相性スコア表示画面

**本音マッチ機能:**
- 質問回答画面
- 回答一覧・編集画面
- 本音マッチ度表示画面
- マッチしたユーザーの回答閲覧画面

**LGBTQ+クイズゲーム:**
- カテゴリ選択画面
- クイズ画面（タイマー、スコア表示）
- 結果・解説画面
- ランキング画面
- 達成バッジ画面

---

## 🔒 セキュリティ・プライバシー要件

### データ保護
- 診断結果・回答内容はユーザーの同意なく公開されない
- 本音マッチの回答は、マッチング成立後にのみ共有
- クイズの回答履歴は個人情報として保護

### セーフティ機能
- 不適切なデート提案の通報機能
- クイズ問題の不適切内容の通報機能
- 管理者によるコンテンツ管理機能

---

## 📈 実装優先順位

### Phase 1: 基盤機能（優先度: 高）
1. 性格診断機能 - マッチング精度向上に直結
2. 本音マッチ機能 - 差別化要素として重要

### Phase 2: エンゲージメント機能（優先度: 中）
3. LGBTQ+クイズゲーム - コミュニティ教育とエンゲージメント向上

### Phase 3: 高度機能（優先度: 中〜低）
4. 即日デート機能 - 実装複雑度が高いため後回し

---

## 🎓 基本情報技術者試験関連知識

### データベース設計（テクノロジ系）
- **正規化**: 各テーブルは第3正規形以上を目指す
- **インデックス設計**: 検索性能を考慮したインデックス設計
- **外部キー制約**: データ整合性の確保
- **トランザクション管理**: 一貫性の保証

### システム設計（テクノロジ系）
- **API設計**: RESTful APIの設計原則
- **認証・認可**: JWT認証によるセキュアなアクセス制御
- **スケーラビリティ**: 将来の拡張を考慮した設計

### プロジェクトマネジメント（マネジメント系）
- **要件定義**: ユーザーニーズの明確化
- **優先順位付け**: 実装順序の決定
- **リスク管理**: セキュリティリスクの考慮

---

## 📚 参考資料

- Big Five Personality Model: https://en.wikipedia.org/wiki/Big_Five_personality_traits
- RESTful API Design: https://restfulapi.net/
- Database Normalization: https://en.wikipedia.org/wiki/Database_normalization

---

**作成者**: Qupid開発チーム  
**承認日**: 2025年1月


