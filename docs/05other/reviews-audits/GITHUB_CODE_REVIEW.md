# GitHubでコードレビューを受ける方法

先輩などにコードを見せてチェックしてもらう場合、GitHubを使った方法を推奨します。

## 方法1: プルリクエスト（Pull Request）を作成する（推奨）

最も一般的で推奨される方法です。変更をブランチにコミットして、プルリクエストを作成します。

### 手順

1. **新しいブランチを作成**
   ```bash
   git checkout -b feature/your-feature-name
   # または
   git checkout -b fix/bug-description
   ```

2. **変更をコミット**
   ```bash
   git add .
   git commit -m "説明: 変更内容の説明"
   ```

3. **ブランチをGitHubにプッシュ**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **GitHub上でプルリクエストを作成**
   - GitHubのリポジトリページ（https://github.com/shindodesu/qupid-app）にアクセス
   - 「Compare & pull request」ボタンが表示されるのでクリック
   - または「Pull requests」タブから「New pull request」を選択
   - ベースブランチ（通常は`main`）と比較ブランチ（作成したブランチ）を選択
   - タイトルと説明を入力
   - 「Create pull request」をクリック

5. **レビュアーを指定**
   - プルリクエストの右側に「Reviewers」セクションがあるので、先輩のGitHubアカウントを指定

### メリット
- 変更内容が明確に表示される
- コメントで具体的な指摘ができる
- 変更履歴が残る
- 複数人でレビューできる

## 方法2: コラボレーターとして追加する

先輩をコラボレーターとして追加して、直接コードを見てもらう方法です。

### 手順

1. **GitHubリポジトリの設定**
   - リポジトリページで「Settings」をクリック
   - 左側メニューから「Collaborators」を選択
   - 「Add people」をクリック
   - 先輩のGitHubユーザー名またはメールアドレスを入力
   - 招待を送信

2. **コラボレーターの権限設定**
   - 「Read」: コードを見るだけ
   - 「Write」: コードを編集・プッシュできる
   - 「Admin」: リポジトリの設定を変更できる
   
   レビューだけの場合は「Read」で十分です。

### メリット
- 簡単に設定できる
- 直接ブランチやコードを見てもらえる
- プルリクエストなしでもレビュー可能

## 方法3: 特定のブランチを共有する

特定のブランチだけを見てもらう方法です。

### 手順

1. **ブランチを作成してプッシュ**
   ```bash
   git checkout -b review/feature-name
   git add .
   git commit -m "レビュー用: 変更内容"
   git push origin review/feature-name
   ```

2. **ブランチのURLを共有**
   - ブランチのURL: `https://github.com/shindodesu/qupid-app/tree/review/feature-name`
   - または、コミットのURLを共有

### メリット
- 簡単に共有できる
- プルリクエストを作成する必要がない

## 方法4: Issueにコードスニペットを貼り付ける

小さな変更や質問の場合は、Issueにコードを貼り付ける方法もあります。

### 手順

1. GitHubリポジトリで「Issues」タブを開く
2. 「New Issue」をクリック
3. タイトルと説明を入力
4. コードブロックを使ってコードを貼り付け：
   ```markdown
   ```python
   # コードをここに貼り付け
   ```
   ```
5. 先輩をメンション（`@username`）して通知

## 推奨されるワークフロー

### 開発中のコードレビュー
1. 機能ブランチを作成
2. 変更をコミット・プッシュ
3. プルリクエストを作成（ドラフトPRでも可）
4. 先輩にレビューを依頼
5. フィードバックを受けて修正
6. 修正をコミット・プッシュ（自動的にPRに反映）
7. 承認後にマージ

### コードスニペットの確認
- 小さな変更や質問の場合は、Issueを使用
- コードブロック（```）で囲んで貼り付ける

## プルリクエストのベストプラクティス

### 良いPRの説明の例
```markdown
## 変更内容
- 認証機能のバグ修正
- エラーハンドリングの改善

## 背景
ユーザーがログイン時にエラーが発生する問題がありました。

## 変更の詳細
- `app/routers/auth.py`のエラーハンドリングを改善
- テストケースを追加

## 確認してほしいポイント
- エラーハンドリングの実装が適切か
- セキュリティ上の問題がないか
```

## セキュリティ上の注意

- `.env`ファイルや機密情報はコミットしない（`.gitignore`に含まれています）
- データベースのパスワードやAPIキーは含めない
- 本番環境の設定は含めない

## 現在のリポジトリ情報

- リポジトリURL: https://github.com/shindodesu/qupid-app
- リモート名: origin
- メインブランチ: main

## よく使うコマンド

```bash
# 現在のブランチを確認
git branch

# 新しいブランチを作成
git checkout -b feature/your-feature

# 変更をステージング
git add .

# コミット
git commit -m "説明: 変更内容"

# プッシュ
git push origin feature/your-feature

# リモートのブランチを確認
git branch -r

# リモートの情報を更新
git fetch origin
```

