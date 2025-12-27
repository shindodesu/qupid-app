-- PostgreSQLデータベース構造を表示するSQLクエリ集
-- psqlで実行するか、show_db_structure.shスクリプトを使用してください

-- ============================================
-- 1. すべてのテーブル一覧
-- ============================================
\dt

-- ============================================
-- 2. 各テーブルの詳細構造（列情報）
-- ============================================
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

-- ============================================
-- 3. 外部キー制約
-- ============================================
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

-- ============================================
-- 4. インデックス情報
-- ============================================
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================
-- 5. 主キー制約
-- ============================================
SELECT
    tc.table_name,
    kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'PRIMARY KEY'
ORDER BY tc.table_name, kcu.ordinal_position;

-- ============================================
-- 6. ユニーク制約
-- ============================================
SELECT
    tc.table_name,
    kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'UNIQUE'
ORDER BY tc.table_name, kcu.column_name;

-- ============================================
-- 7. テーブルサイズ情報
-- ============================================
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================
-- 8. 特定のテーブルの詳細構造（例: usersテーブル）
-- ============================================
\d users

-- ============================================
-- 9. データベース全体のER図風の情報
-- ============================================
SELECT
    t.table_name,
    COUNT(c.column_name) AS column_count,
    COUNT(DISTINCT fk.constraint_name) AS foreign_key_count
FROM information_schema.tables t
LEFT JOIN information_schema.columns c
    ON t.table_name = c.table_name
    AND t.table_schema = c.table_schema
LEFT JOIN information_schema.table_constraints fk
    ON t.table_name = fk.table_name
    AND t.table_schema = fk.table_schema
    AND fk.constraint_type = 'FOREIGN KEY'
WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
GROUP BY t.table_name
ORDER BY t.table_name;

