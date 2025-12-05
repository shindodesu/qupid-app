#!/usr/bin/env python3
"""
開発環境用: フィルターやいいね送信のテスト用に大量のアカウントを作成するスクリプト

使用方法（Docker経由）:
    docker compose exec api python dev_tools/create_test_users.py [count]
    
    count: 作成するユーザー数（デフォルト: 50）
    
例:
    docker compose exec api python dev_tools/create_test_users.py 100  # 100人のユーザーを作成
"""

import sys
import random
import asyncio
from pathlib import Path
from datetime import date, datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# プロジェクトルートをPythonパスに追加
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from app.core.config import settings
from app.core.security import hash_password
from app.models.user import User
from app.models.email_verification import EmailVerification  # リレーション解決のため
from app.models.tag import Tag, UserTag  # リレーション解決のため

# テスト用の選択肢
GENDERS = ['男性', '女性', 'インターセックス']
SEXUALITIES = ['ゲイ', 'レズビアン', 'バイセクシュアル', 'トランスジェンダー', 'パンセクシュアル', 'アセクシュアル', 'その他', '回答しない']
LOOKING_FOR_OPTIONS = ['恋愛関係', '友達', 'カジュアルな関係', '長期的な関係', 'その他']
FACULTIES = [
    '文学部', '教育学部', '法学部', '経済学部', '理学部', '医学部', 
    '歯学部', '薬学部', '工学部', '農学部', '芸術工学部', '共創学部'
]
GRADES = ['1年', '2年', '3年', '4年', '大学院1年', '大学院2年', '大学院3年以上']
CAMPUSES = ['伊都キャンパス', '箱崎キャンパス', '病院キャンパス', '大橋キャンパス']

# テスト用パスワード（全員同じ）
TEST_PASSWORD = "testpass123"

def generate_birthday(min_age=18, max_age=30):
    """18-30歳のランダムな生年月日を生成"""
    age = random.randint(min_age, max_age)
    today = date.today()
    birth_year = today.year - age
    birth_month = random.randint(1, 12)
    birth_day = random.randint(1, 28)  # 28日までにすることで月の違いを無視
    return date(birth_year, birth_month, birth_day)

def generate_bio():
    """ランダムなプロフィール文を生成"""
    bios = [
        "よろしくお願いします！",
        "趣味は読書と映画鑑賞です。",
        "音楽が好きです。ライブに行くのが趣味です。",
        "スポーツ観戦が好きです。特にサッカーと野球。",
        "カフェ巡りが好きです。おすすめのカフェがあれば教えてください！",
        "旅行が好きです。国内旅行をよくしています。",
        "ゲームが好きです。一緒にプレイできる人を探しています。",
        "料理が趣味です。新しいレシピに挑戦中です。",
        "写真を撮るのが好きです。",
        "映画とドラマを見るのが好きです。",
    ]
    return random.choice(bios)

async def create_test_users(count: int):
    """指定数のテストユーザーを作成"""
    # データベース接続
    engine = create_async_engine(settings.DATABASE_URL, pool_pre_ping=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    created_count = 0
    skipped_count = 0
    
    print(f"📝 {count}人のテストユーザーを作成します...")
    print(f"   メールドメイン: @{settings.ALLOWED_EMAIL_DOMAIN}")
    print(f"   パスワード: {TEST_PASSWORD}")
    print()
    
    async with async_session() as session:
        for i in range(1, count + 1):
            try:
                # メールアドレスを生成（既存ユーザーと重複しないように）
                email = f"testuser{i:04d}@{settings.ALLOWED_EMAIL_DOMAIN}"
                
                # 既存ユーザーチェック
                from sqlalchemy import select
                q = await session.execute(select(User).where(User.email == email))
                existing_user = q.scalar_one_or_none()
                if existing_user:
                    print(f"⏭️  スキップ: {email} (既に存在)")
                    skipped_count += 1
                    continue
                
                # ランダムな属性を生成
                gender = random.choice(GENDERS)
                sexuality = random.choice(SEXUALITIES)
                looking_for = random.choice(LOOKING_FOR_OPTIONS)
                faculty = random.choice(FACULTIES)
                grade = random.choice(GRADES)
                campus = random.choice(CAMPUSES)
                birthday = generate_birthday()
                bio = generate_bio()
                display_name = f"テストユーザー{i:04d}"
                
                # ユーザーを作成
                user = User(
                    email=email,
                    hashed_password=hash_password(TEST_PASSWORD),
                    display_name=display_name,
                    bio=bio,
                    campus=campus,
                    faculty=faculty,
                    grade=grade,
                    birthday=birthday,
                    gender=gender,
                    sexuality=sexuality,
                    looking_for=looking_for,
                    profile_completed=True,  # プロフィール完了済み
                    is_active=True,
                    is_admin=False,
                    is_online=random.choice([True, False]),  # ランダムにオンライン状態
                )
                
                session.add(user)
                await session.commit()
                await session.refresh(user)
                
                created_count += 1
                if created_count % 10 == 0:
                    print(f"✅ {created_count}人作成完了...")
                
            except Exception as e:
                print(f"❌ エラー ({email}): {e}")
                await session.rollback()
                skipped_count += 1
                continue
    
    await engine.dispose()
    
    print()
    print("=" * 60)
    print(f"✅ 作成完了: {created_count}人")
    if skipped_count > 0:
        print(f"⏭️  スキップ: {skipped_count}人")
    print("=" * 60)
    print()
    print(f"📧 メールアドレス形式: testuser0001@{settings.ALLOWED_EMAIL_DOMAIN} ～ testuser{count:04d}@{settings.ALLOWED_EMAIL_DOMAIN}")
    print(f"🔑 パスワード: {TEST_PASSWORD}")
    print()

if __name__ == "__main__":
    count = int(sys.argv[1]) if len(sys.argv) > 1 else 50
    
    print("=" * 60)
    print("テストユーザー作成スクリプト")
    print("=" * 60)
    print()
    
    asyncio.run(create_test_users(count))

