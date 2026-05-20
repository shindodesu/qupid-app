#!/usr/bin/env python3
"""
メール送信サービステストツール

このスクリプトは、本番環境でメール送信が正しく動作するかをテストします。

使用方法:
    python dev_tools/test_email_service.py --email your-email@example.com
    
環境変数:
    .envファイルに以下の変数を設定してください:
    - ENABLE_EMAIL=true
    - SMTP_SERVER=smtp.gmail.com
    - SMTP_PORT=587
    - SMTP_USERNAME=your-email@gmail.com
    - SMTP_PASSWORD=your-app-password
    - FROM_EMAIL=noreply@qupid.com
"""

import asyncio
import argparse
import sys
import os
from pathlib import Path

# プロジェクトルートをPythonパスに追加
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from app.services.email_service import email_service
from app.core.config import settings


async def test_verification_email(email: str) -> bool:
    """認証メールのテスト"""
    print("\n=== 認証メールテスト ===")
    print(f"送信先: {email}")
    
    code = email_service.generate_verification_code()
    print(f"認証コード: {code}")
    
    success = await email_service.send_verification_email(email, code)
    
    if success:
        print("✅ 認証メール送信成功")
        return True
    else:
        print("❌ 認証メール送信失敗")
        return False


async def test_welcome_email(email: str, display_name: str = "テストユーザー") -> bool:
    """ウェルカムメールのテスト"""
    print("\n=== ウェルカムメールテスト ===")
    print(f"送信先: {email}")
    print(f"表示名: {display_name}")
    
    success = await email_service.send_welcome_email(email, display_name)
    
    if success:
        print("✅ ウェルカムメール送信成功")
        return True
    else:
        print("❌ ウェルカムメール送信失敗")
        return False


async def test_password_reset_email(email: str) -> bool:
    """パスワードリセットメールのテスト"""
    print("\n=== パスワードリセットメールテスト ===")
    print(f"送信先: {email}")
    
    code = email_service.generate_verification_code()
    print(f"認証コード: {code}")
    
    success = await email_service.send_password_reset_email(email, code)
    
    if success:
        print("✅ パスワードリセットメール送信成功")
        return True
    else:
        print("❌ パスワードリセットメール送信失敗")
        return False


def print_settings():
    """現在の設定を表示"""
    print("\n=== 現在の設定 ===")
    print(f"APP_ENV: {settings.APP_ENV}")
    print(f"ENABLE_EMAIL: {settings.ENABLE_EMAIL}")
    print(f"SMTP_SERVER: {settings.SMTP_SERVER}")
    print(f"SMTP_PORT: {settings.SMTP_PORT}")
    print(f"SMTP_USERNAME: {settings.SMTP_USERNAME}")
    print(f"SMTP_PASSWORD: {'*' * len(settings.SMTP_PASSWORD) if settings.SMTP_PASSWORD else '(未設定)'}")
    print(f"FROM_EMAIL: {settings.FROM_EMAIL}")
    print(f"EMAIL_MAX_RETRIES: {settings.EMAIL_MAX_RETRIES}")
    print(f"EMAIL_RETRY_DELAY: {settings.EMAIL_RETRY_DELAY}秒")
    print("=" * 40)


async def main():
    parser = argparse.ArgumentParser(
        description='メール送信サービステストツール',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
例:
  # すべてのメールタイプをテスト
  python dev_tools/test_email_service.py --email test@example.com
  
  # 認証メールのみテスト
  python dev_tools/test_email_service.py --email test@example.com --type verification
  
  # 設定を表示
  python dev_tools/test_email_service.py --show-settings
        """
    )
    
    parser.add_argument(
        '--email',
        type=str,
        help='テスト送信先のメールアドレス'
    )
    
    parser.add_argument(
        '--type',
        type=str,
        choices=['verification', 'welcome', 'password-reset', 'all'],
        default='all',
        help='テストするメールの種類（デフォルト: all）'
    )
    
    parser.add_argument(
        '--display-name',
        type=str,
        default='テストユーザー',
        help='ウェルカムメールで使用する表示名（デフォルト: テストユーザー）'
    )
    
    parser.add_argument(
        '--show-settings',
        action='store_true',
        help='現在の設定を表示'
    )
    
    args = parser.parse_args()
    
    # 設定を表示
    if args.show_settings:
        print_settings()
        return
    
    # メールアドレスが必須
    if not args.email:
        print("❌ エラー: --email オプションが必要です")
        parser.print_help()
        sys.exit(1)
    
    # 設定を表示
    print_settings()
    
    # ENABLE_EMAILが無効の場合の警告
    if not settings.ENABLE_EMAIL:
        print("\n⚠️  警告: ENABLE_EMAIL=false です")
        print("   メールは実際には送信されず、コンソールに出力されます。")
        print("   本番環境でテストする場合は、.envファイルで ENABLE_EMAIL=true に設定してください。\n")
    
    # テスト実行
    results = []
    
    if args.type in ['verification', 'all']:
        result = await test_verification_email(args.email)
        results.append(('認証メール', result))
    
    if args.type in ['welcome', 'all']:
        result = await test_welcome_email(args.email, args.display_name)
        results.append(('ウェルカムメール', result))
    
    if args.type in ['password-reset', 'all']:
        result = await test_password_reset_email(args.email)
        results.append(('パスワードリセットメール', result))
    
    # 結果サマリー
    print("\n" + "=" * 40)
    print("=== テスト結果サマリー ===")
    for mail_type, success in results:
        status = "✅ 成功" if success else "❌ 失敗"
        print(f"{mail_type}: {status}")
    
    total = len(results)
    passed = sum(1 for _, success in results if success)
    print(f"\n合計: {passed}/{total} 成功")
    print("=" * 40)
    
    # 失敗がある場合は終了コード1
    if passed < total:
        sys.exit(1)


if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n中断されました")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ エラー: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

