#!/usr/bin/env python3
"""
PostgreSQLデータベース構造を表形式で表示するPythonスクリプト
"""
import os
import sys
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import URL

# tabulateが利用可能な場合は使用、なければシンプルな表形式で出力
try:
    from tabulate import tabulate
    HAS_TABULATE = True
except ImportError:
    HAS_TABULATE = False

# プロジェクトルートをパスに追加
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings


def get_connection_string():
    """データベース接続文字列を取得"""
    database_url = os.getenv("DATABASE_URL", settings.DATABASE_URL)
    
    # asyncpg形式をpsycopg2形式に変換
    if database_url.startswith("postgresql+asyncpg://"):
        database_url = database_url.replace("postgresql+asyncpg://", "postgresql+psycopg2://")
    elif database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+psycopg2://")
    
    return database_url


def show_tables(engine):
    """すべてのテーブル一覧を表示"""
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    print("\n" + "="*80)
    print("📋 テーブル一覧")
    print("="*80)
    
    if not tables:
        print("テーブルが見つかりませんでした。")
        return
    
    table_data = []
    for table in sorted(tables):
        columns = inspector.get_columns(table)
        table_data.append([
            table,
            len(columns),
            "✓" if inspector.get_primary_keys(table) else "✗"
        ])
    
    if HAS_TABULATE:
        print(tabulate(
            table_data,
            headers=["テーブル名", "カラム数", "主キー"],
            tablefmt="grid"
        ))
    else:
        # シンプルな表形式で出力
        print(f"{'テーブル名':<30} {'カラム数':<10} {'主キー':<10}")
        print("-" * 50)
        for row in table_data:
            print(f"{row[0]:<30} {row[1]:<10} {row[2]:<10}")


def show_table_structure(engine, table_name=None):
    """テーブルの詳細構造を表示"""
    inspector = inspect(engine)
    tables = [table_name] if table_name else inspector.get_table_names()
    
    for table in sorted(tables):
        print("\n" + "="*80)
        print(f"📊 テーブル: {table}")
        print("="*80)
        
        columns = inspector.get_columns(table)
        if not columns:
            print("カラムが見つかりませんでした。")
            continue
        
        column_data = []
        for col in columns:
            col_type = str(col['type'])
            nullable = "NULL可" if col['nullable'] else "NOT NULL"
            default = col.get('default', '')
            if default:
                default = str(default)
            
            column_data.append([
                col['name'],
                col_type,
                nullable,
                default if default else "-"
            ])
        
        if HAS_TABULATE:
            print(tabulate(
                column_data,
                headers=["カラム名", "データ型", "NULL制約", "デフォルト値"],
                tablefmt="grid"
            ))
        else:
            # シンプルな表形式で出力
            print(f"{'カラム名':<25} {'データ型':<30} {'NULL制約':<12} {'デフォルト値':<20}")
            print("-" * 87)
            for row in column_data:
                print(f"{row[0]:<25} {row[1]:<30} {row[2]:<12} {row[3]:<20}")
        
        # 主キー情報
        pk_constraint = inspector.get_pk_constraint(table)
        if pk_constraint['constrained_columns']:
            print(f"\n🔑 主キー: {', '.join(pk_constraint['constrained_columns'])}")
        
        # 外部キー情報
        fk_constraints = inspector.get_foreign_keys(table)
        if fk_constraints:
            print("\n🔗 外部キー:")
            for fk in fk_constraints:
                print(f"  - {fk['constrained_columns']} -> {fk['referred_table']}.{fk['referred_columns']}")
        
        # インデックス情報
        indexes = inspector.get_indexes(table)
        if indexes:
            print("\n📇 インデックス:")
            for idx in indexes:
                unique = "UNIQUE" if idx['unique'] else ""
                print(f"  - {idx['name']} ({', '.join(idx['column_names'])}) {unique}")


def show_foreign_keys(engine):
    """すべての外部キー制約を表示"""
    with engine.connect() as conn:
        result = conn.execute(text("""
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
        """))
        
        print("\n" + "="*80)
        print("🔗 外部キー制約一覧")
        print("="*80)
        
        fk_data = []
        for row in result:
            fk_data.append([
                row[0],  # table_name
                row[1],  # column_name
                row[2],  # foreign_table_name
                row[3]   # foreign_column_name
            ])
        
        if fk_data:
            if HAS_TABULATE:
                print(tabulate(
                    fk_data,
                    headers=["テーブル", "カラム", "参照テーブル", "参照カラム"],
                    tablefmt="grid"
                ))
            else:
                # シンプルな表形式で出力
                print(f"{'テーブル':<25} {'カラム':<25} {'参照テーブル':<25} {'参照カラム':<25}")
                print("-" * 100)
                for row in fk_data:
                    print(f"{row[0]:<25} {row[1]:<25} {row[2]:<25} {row[3]:<25}")
        else:
            print("外部キー制約が見つかりませんでした。")


def show_table_sizes(engine):
    """テーブルサイズ情報を表示"""
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT
                schemaname,
                tablename,
                pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
            FROM pg_tables
            WHERE schemaname = 'public'
            ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
        """))
        
        print("\n" + "="*80)
        print("💾 テーブルサイズ情報")
        print("="*80)
        
        size_data = []
        for row in result:
            size_data.append([row[1], row[2]])  # tablename, size
        
        if size_data:
            if HAS_TABULATE:
                print(tabulate(
                    size_data,
                    headers=["テーブル名", "サイズ"],
                    tablefmt="grid"
                ))
            else:
                # シンプルな表形式で出力
                print(f"{'テーブル名':<30} {'サイズ':<20}")
                print("-" * 50)
                for row in size_data:
                    print(f"{row[0]:<30} {row[1]:<20}")
        else:
            print("テーブルが見つかりませんでした。")


def main():
    """メイン処理"""
    import argparse
    
    parser = argparse.ArgumentParser(description="PostgreSQLデータベース構造を表示")
    parser.add_argument(
        "--table",
        type=str,
        help="特定のテーブルのみ表示"
    )
    parser.add_argument(
        "--foreign-keys",
        action="store_true",
        help="外部キー制約のみ表示"
    )
    parser.add_argument(
        "--sizes",
        action="store_true",
        help="テーブルサイズ情報のみ表示"
    )
    
    args = parser.parse_args()
    
    try:
        connection_string = get_connection_string()
        engine = create_engine(connection_string)
        
        if args.foreign_keys:
            show_foreign_keys(engine)
        elif args.sizes:
            show_table_sizes(engine)
        elif args.table:
            show_tables(engine)
            show_table_structure(engine, args.table)
        else:
            show_tables(engine)
            show_table_structure(engine)
            show_foreign_keys(engine)
            show_table_sizes(engine)
        
    except Exception as e:
        print(f"❌ エラーが発生しました: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

