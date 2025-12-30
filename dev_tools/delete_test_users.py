#!/usr/bin/env python3
"""
テストユーザーを削除するスクリプト（test@s.kyushu-u.ac.jpは除外）

使用方法（Docker経由）:
    docker compose exec api python dev_tools/delete_test_users.py
    
または直接実行:
    python dev_tools/delete_test_users.py
"""

import sys
import asyncio
from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload

# プロジェクトルートをPythonパスに追加
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from app.core.config import settings
from app.models.user import User
from app.models.email_verification import EmailVerification
from app.models.tag import Tag, UserTag
from app.models.like import Like
from app.models.block import Block

async def delete_test_users():
    """テストユーザーを削除（test@s.kyushu-u.ac.jpは除外）"""
    # データベース接続
    engine = create_async_engine(settings.DATABASE_URL, pool_pre_ping=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    deleted_count = 0
    skipped_count = 0
    
    print("=" * 60)
    print("テストユーザー削除スクリプト")
    print("=" * 60)
    print()
    
    async with async_session() as session:
        # test@s.kyushu-u.ac.jp以外のテストユーザーを取得
        query = select(User).where(
            User.email != 'test@s.kyushu-u.ac.jp'
        )
        result = await session.execute(query)
        users = result.scalars().all()
        
        print(f"📋 {len(users)}人のユーザーが見つかりました（test@s.kyushu-u.ac.jpは除外）")
        print()
        
        for user in users:
            try:
                # 関連データを削除
                # タグ
                await session.execute(
                    delete(UserTag).where(UserTag.user_id == user.id)
                )
                
                # いいね（送信・受信）
                await session.execute(
                    delete(Like).where(
                        (Like.liker_id == user.id) | (Like.liked_id == user.id)
                    )
                )
                
                # ブロック（送信・受信）
                await session.execute(
                    delete(Block).where(
                        (Block.blocker_id == user.id) | (Block.blocked_id == user.id)
                    )
                )
                
                # メール認証
                await session.execute(
                    delete(EmailVerification).where(EmailVerification.user_id == user.id)
                )
                
                # ユーザーを削除
                await session.delete(user)
                await session.commit()
                
                deleted_count += 1
                print(f"✅ 削除: {user.email} ({user.display_name})")
                
            except Exception as e:
                print(f"❌ エラー ({user.email}): {e}")
                await session.rollback()
                skipped_count += 1
                continue
        
        # test@s.kyushu-u.ac.jpが存在するか確認
        test_user_query = select(User).where(User.email == 'test@s.kyushu-u.ac.jp')
        test_user_result = await session.execute(test_user_query)
        test_user = test_user_result.scalar_one_or_none()
        if test_user:
            print()
            print(f"✅ 保持: {test_user.email} ({test_user.display_name}) - このアカウントは保持されました")
    
    await engine.dispose()
    
    print()
    print("=" * 60)
    print(f"✅ 削除完了: {deleted_count}人")
    if skipped_count > 0:
        print(f"⏭️  スキップ: {skipped_count}人")
    print("=" * 60)
    print()

if __name__ == "__main__":
    asyncio.run(delete_test_users())

