#!/bin/bash
# PostgreSQLデータベース構造を表示するスクリプト

# Docker Composeを使用している場合
if docker-compose ps db 2>/dev/null | grep -q "Up"; then
    echo "=== Docker Compose経由でPostgreSQLに接続 ==="
    echo ""
    echo "1. すべてのテーブル一覧を表示:"
    docker-compose exec db psql -U user -d mydatabase -c "\dt"
    
    echo ""
    echo "2. 各テーブルの詳細構造を表示:"
    docker-compose exec db psql -U user -d mydatabase -c "
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
    "
    
    echo ""
    echo "3. 外部キー制約を表示:"
    docker-compose exec db psql -U user -d mydatabase -c "
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
    "
    
    echo ""
    echo "4. インデックス情報を表示:"
    docker-compose exec db psql -U user -d mydatabase -c "
    SELECT
        tablename,
        indexname,
        indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname;
    "
else
    echo "Docker Composeのdbサービスが起動していません。"
    echo "起動するには: docker-compose up -d"
fi

