#!/usr/bin/env python3
"""
データベースのセクシュアリティ、性別、探している関係の値を日本語から英語に変換するマイグレーションスクリプト

使用方法（Docker経由）:
    docker compose exec api python dev_tools/migrate_to_english_values.py
    
または直接実行:
    python dev_tools/migrate_to_english_values.py
"""

import sys
import asyncio
from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, update

# プロジェクトルートをPythonパスに追加
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from app.core.config import settings
from app.models.user import User
from app.models.email_verification import EmailVerification  # リレーション解決のため
from app.models.tag import Tag, UserTag  # リレーション解決のため

# 日本語から英語へのマッピング
SEXUALITY_MAPPING = {
    'ゲイ': 'gay',
    'レズビアン': 'lesbian',
    'バイセクシュアル': 'bisexual',
    'トランスジェンダー': 'transgender',
    'パンセクシュアル': 'pansexual',
    'アセクシュアル': 'asexual',
    'その他': 'other',
    '回答しない': 'prefer_not_to_say',
}

GENDER_MAPPING = {
    '男性': 'male',
    '女性': 'female',
    'インターセックス': 'inter_sex',
}

LOOKING_FOR_MAPPING = {
    '恋愛関係': 'dating',
    '友達': 'friends',
    'カジュアルな関係': 'casual',
    '長期的な関係': 'long_term',
    'その他': 'other',
}

async def migrate_to_english_values():
    """既存の日本語の値を英語に変換"""
    # データベース接続
    engine = create_async_engine(settings.DATABASE_URL, pool_pre_ping=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    updated_count = 0
    skipped_count = 0
    
    print("=" * 60)
    print("データベースの値を日本語から英語に変換するマイグレーション")
    print("=" * 60)
    print()
    
    async with async_session() as session:
        # すべてのユーザーを取得
        query = select(User)
        result = await session.execute(query)
        users = result.scalars().all()
        
        print(f"📋 {len(users)}人のユーザーが見つかりました")
        print()
        
        for user in users:
            try:
                updated = False
                
                # セクシュアリティの変換
                if user.sexuality and user.sexuality in SEXUALITY_MAPPING:
                    old_value = user.sexuality
                    user.sexuality = SEXUALITY_MAPPING[old_value]
                    updated = True
                    print(f"  ✅ セクシュアリティ: {old_value} → {user.sexuality}")
                
                # 性別の変換
                if user.gender:
                    if user.gender in GENDER_MAPPING:
                        old_value = user.gender
                        user.gender = GENDER_MAPPING[old_value]
                        updated = True
                        print(f"  ✅ 性別: {old_value} → {user.gender}")
                    elif user.gender == 'other':
                        # 既に英語の値だが、otherをinter_sexに変換
                        old_value = user.gender
                        user.gender = 'inter_sex'
                        updated = True
                        print(f"  ✅ 性別: {old_value} → {user.gender}")
                
                # 探している関係の変換
                if user.looking_for and user.looking_for in LOOKING_FOR_MAPPING:
                    old_value = user.looking_for
                    user.looking_for = LOOKING_FOR_MAPPING[old_value]
                    updated = True
                    print(f"  ✅ 探している関係: {old_value} → {user.looking_for}")
                
                if updated:
                    await session.commit()
                    await session.refresh(user)
                    updated_count += 1
                    print(f"✅ 更新: {user.email} ({user.display_name})")
                else:
                    skipped_count += 1
                    if user.sexuality or user.gender or user.looking_for:
                        print(f"⏭️  スキップ: {user.email} (既に英語または未設定)")
                
            except Exception as e:
                print(f"❌ エラー ({user.email}): {e}")
                await session.rollback()
                skipped_count += 1
                continue
    
    await engine.dispose()
    
    print()
    print("=" * 60)
    print(f"✅ 更新完了: {updated_count}人")
    if skipped_count > 0:
        print(f"⏭️  スキップ: {skipped_count}人")
    print("=" * 60)
    print()

if __name__ == "__main__":
    asyncio.run(migrate_to_english_values())

