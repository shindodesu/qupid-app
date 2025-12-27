# PostgreSQLデータベース構造確認ツール

PostgreSQLのデータベース構造を表形式で確認するためのツールです。

## 📋 利用可能な方法

### 1. psqlコマンドラインツール（推奨）

Docker Composeを使用している場合：

```bash
# psqlに接続
docker-compose exec db psql -U user -d mydatabase

# 接続後、以下のコマンドを実行
\dt                    # すべてのテーブル一覧
\d table_name          # 特定のテーブルの詳細構造
\d+ table_name         # より詳細な情報（サイズなども含む）
\di                    # インデックス一覧
\df                    # 関数一覧
```

### 2. Bashスクリプト（`show_db_structure.sh`）

```bash
# スクリプトを実行
./dev_tools/show_db_structure.sh
```

このスクリプトは以下を表示します：
- すべてのテーブル一覧
- 各テーブルの詳細構造（カラム情報）
- 外部キー制約
- インデックス情報

### 3. SQLファイル（`show_db_structure.sql`）

```bash
# psqlでSQLファイルを実行
docker-compose exec -T db psql -U user -d mydatabase < dev_tools/show_db_structure.sql
```

または、psqlに接続してから：

```bash
docker-compose exec db psql -U user -d mydatabase
\i dev_tools/show_db_structure.sql
```

### 4. Pythonスクリプト（`show_db_structure.py`）

```bash
# すべての情報を表示
python dev_tools/show_db_structure.py

# 特定のテーブルのみ表示
python dev_tools/show_db_structure.py --table users

# 外部キー制約のみ表示
python dev_tools/show_db_structure.py --foreign-keys

# テーブルサイズ情報のみ表示
python dev_tools/show_db_structure.py --sizes
```

## 🔍 よく使うpsqlコマンド

| コマンド | 説明 |
|---------|------|
| `\dt` | すべてのテーブル一覧 |
| `\dt+` | テーブル一覧（サイズ情報付き） |
| `\d table_name` | テーブルの詳細構造 |
| `\d+ table_name` | テーブルの詳細構造（サイズ情報付き） |
| `\di` | インデックス一覧 |
| `\df` | 関数一覧 |
| `\dv` | ビュー一覧 |
| `\du` | ユーザー一覧 |
| `\dn` | スキーマ一覧 |
| `\l` | データベース一覧 |
| `\q` | psqlを終了 |

## 📊 SQLクエリで構造を確認

### すべてのテーブルとカラム情報

```sql
SELECT 
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
```

### 外部キー制約

```sql
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, kcu.column_name;
```

### テーブルサイズ

```sql
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## 🛠️ トラブルシューティング

### Docker Composeが起動していない場合

```bash
docker-compose up -d
```

### 接続エラーが発生する場合

`compose.yml`の設定を確認してください：
- `POSTGRES_USER`: デフォルトは `user`
- `POSTGRES_PASSWORD`: デフォルトは `password`
- `POSTGRES_DB`: デフォルトは `mydatabase`

### Pythonスクリプトでエラーが発生する場合

必要なパッケージがインストールされているか確認：

```bash
pip install sqlalchemy psycopg2-binary
```

より見やすい表形式で表示したい場合（オプション）：

```bash
pip install tabulate
```

## 📝 注意事項

- 本番環境で実行する場合は、データベースへの負荷を考慮してください
- 大きなテーブルがある場合、サイズ情報の取得に時間がかかる場合があります
- 接続情報は環境変数（`DATABASE_URL`）から自動的に取得されます

