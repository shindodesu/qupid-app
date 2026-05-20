#!/usr/bin/env python3
"""
開発環境用: データベースに登録されているユーザー情報を確認するスクリプト

使用方法:
    python3 dev_tools/list_users.py [email]
    
    email: 特定のメールアドレスのユーザー情報を確認（省略可）
          省略した場合は全ユーザーを表示
"""

import sqlite3
import sys
from datetime import datetime, timezone, timedelta

def format_datetime(dt_str):
    """日時文字列をJST形式で整形"""
    if not dt_str:
        return "未設定"
    
    try:
        # SQLiteのdatetimeをUTCとして解析
        dt = datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        
        # 日本時間 (JST = UTC+9)
        JST = timezone(timedelta(hours=9))
        dt_jst = dt.astimezone(JST)
        return dt_jst.strftime('%Y-%m-%d %H:%M:%S JST')
    except Exception:
        return dt_str

def format_date(date_str):
    """日付文字列を整形"""
    if not date_str:
        return "未設定"
    return date_str

def list_users(email=None):
    conn = sqlite3.connect('qupid.db')
    cursor = conn.cursor()
    
    if email:
        cursor.execute("""
            SELECT 
                id, email, display_name, bio, avatar_url,
                is_active, is_admin, faculty, grade,
                birthday, gender, sexuality, looking_for,
                is_online, last_seen_at, profile_completed,
                created_at, updated_at
            FROM users 
            WHERE email = ?
            ORDER BY id
        """, (email,))
    else:
        cursor.execute("""
            SELECT 
                id, email, display_name, bio, avatar_url,
                is_active, is_admin, faculty, grade,
                birthday, gender, sexuality, looking_for,
                is_online, last_seen_at, profile_completed,
                created_at, updated_at
            FROM users 
            ORDER BY id
        """)
    
    results = cursor.fetchall()
    conn.close()
    
    if not results:
        print("ユーザーが見つかりませんでした。")
        return
    
    print("=" * 80)
    print("登録ユーザー一覧")
    print("=" * 80)
    
    for row in results:
        (id, email, display_name, bio, avatar_url,
         is_active, is_admin, faculty, grade,
         birthday, gender, sexuality, looking_for,
         is_online, last_seen_at, profile_completed,
         created_at, updated_at) = row
        
        print(f"\n【ユーザーID: {id}】")
        print(f"メールアドレス: {email}")
        print(f"表示名: {display_name}")
        print(f"プロフィール: {bio if bio else '未設定'}")
        print(f"アバターURL: {avatar_url if avatar_url else '未設定'}")
        print(f"アクティブ: {'✓' if is_active else '✗'}")
        print(f"管理者: {'✓' if is_admin else '✗'}")
        print(f"プロフィール完了: {'✓' if profile_completed else '✗'}")
        print(f"オンライン状態: {'オンライン' if is_online else 'オフライン'}")
        print(f"最終ログイン: {format_datetime(last_seen_at)}")
        print(f"学部: {faculty if faculty else '未設定'}")
        print(f"学年: {grade if grade else '未設定'}")
        print(f"生年月日: {format_date(birthday)}")
        print(f"性別: {gender if gender else '未設定'}")
        print(f"性的指向: {sexuality if sexuality else '未設定'}")
        print(f"探している相手: {looking_for if looking_for else '未設定'}")
        print(f"作成日時: {format_datetime(created_at)}")
        print(f"更新日時: {format_datetime(updated_at)}")
        print("-" * 80)
    
    print(f"\n合計: {len(results)}件のユーザーが見つかりました。\n")

if __name__ == "__main__":
    email = sys.argv[1] if len(sys.argv) > 1 else None
    list_users(email)

