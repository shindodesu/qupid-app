#!/usr/bin/env python3
"""
開発環境用: 最新の認証コードを取得するスクリプト

使用方法:
    python3 dev_tools/get_latest_verification_code.py [email]
    
    email: 認証コードを確認したいメールアドレス（省略可）
"""

import sqlite3
import sys
from datetime import datetime, timezone, timedelta

def get_latest_code(email=None):
    conn = sqlite3.connect('qupid.db')
    cursor = conn.cursor()
    
    if email:
        cursor.execute("""
            SELECT id, email, verification_code, is_verified, expires_at, created_at 
            FROM email_verifications 
            WHERE email = ?
            ORDER BY id DESC 
            LIMIT 1
        """, (email,))
    else:
        cursor.execute("""
            SELECT id, email, verification_code, is_verified, expires_at, created_at 
            FROM email_verifications 
            ORDER BY id DESC 
            LIMIT 5
        """)
    
    results = cursor.fetchall()
    conn.close()
    
    if not results:
        print("認証コードが見つかりませんでした。")
        return
    
    print("=" * 60)
    print("最新の認証コード")
    print("=" * 60)
    
    # 日本時間 (JST = UTC+9)
    JST = timezone(timedelta(hours=9))
    now_utc = datetime.now(timezone.utc)
    now_jst = now_utc.astimezone(JST)
    
    for row in results:
        id, email, code, is_verified, expires_at, created_at = row
        
        # 有効期限と作成日時をJSTに変換
        try:
            # SQLiteのdatetimeをUTCとして解析
            expires_dt = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
            if expires_dt.tzinfo is None:
                expires_dt = expires_dt.replace(tzinfo=timezone.utc)
            expires_jst = expires_dt.astimezone(JST)
            
            created_dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            if created_dt.tzinfo is None:
                created_dt = created_dt.replace(tzinfo=timezone.utc)
            created_jst = created_dt.astimezone(JST)
            
            # 有効期限チェック
            is_expired = now_utc > expires_dt
            if is_verified:
                status = "✓ 使用済み"
            elif is_expired:
                status = "✗ 期限切れ"
            else:
                status = "○ 未使用"
        except Exception as e:
            expires_jst = expires_at
            created_jst = created_at
            status = "✓ 使用済み" if is_verified else "○ 未使用"
        
        print(f"\nID: {id}")
        print(f"メールアドレス: {email}")
        print(f"認証コード: {code}")
        print(f"ステータス: {status}")
        print(f"有効期限: {expires_jst.strftime('%Y-%m-%d %H:%M:%S') if isinstance(expires_jst, datetime) else expires_jst} JST")
        print(f"作成日時: {created_jst.strftime('%Y-%m-%d %H:%M:%S') if isinstance(created_jst, datetime) else created_jst} JST")
        print("-" * 60)
    
    print()

if __name__ == "__main__":
    email = sys.argv[1] if len(sys.argv) > 1 else None
    get_latest_code(email)

