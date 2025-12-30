#!/usr/bin/env python3
"""
開発環境用: データベース上に登録されているテストユーザーのプロフィールとプライバシー設定を埋めるスクリプト

使用方法（Docker経由）:
    docker compose exec api python dev_tools/fill_test_user_profiles.py
    
または直接実行:
    python dev_tools/fill_test_user_profiles.py
"""

import sys
import random
import asyncio
from pathlib import Path
from datetime import date
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

# プロジェクトルートをPythonパスに追加
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from app.core.config import settings
from app.models.user import User
from app.models.email_verification import EmailVerification  # リレーション解決のため
from app.models.tag import Tag, UserTag  # リレーション解決のため

# テスト用の選択肢（英語のコード値）
GENDERS = ['male', 'female', 'inter_sex']
SEXUALITIES = ['gay', 'lesbian', 'bisexual', 'transgender', 'pansexual', 'asexual', 'other', 'prefer_not_to_say']
LOOKING_FOR_OPTIONS = ['dating', 'friends', 'casual', 'long_term', 'other']
FACULTIES = [
    '文学部', '教育学部', '法学部', '経済学部', '理学部', '医学部', 
    '歯学部', '薬学部', '工学部', '農学部', '芸術工学部', '共創学部'
]
GRADES = ['1年', '2年', '3年', '4年', '大学院1年', '大学院2年', '大学院3年以上']
CAMPUSES = ['伊都キャンパス', '箱崎キャンパス', '病院キャンパス', '大橋キャンパス']

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

async def fill_test_user_profiles():
    """既存のテストユーザーのプロフィールとプライバシー設定を埋める"""
    # データベース接続
    engine = create_async_engine(settings.DATABASE_URL, pool_pre_ping=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    updated_count = 0
    skipped_count = 0
    
    print("=" * 60)
    print("テストユーザーのプロフィール・プライバシー設定更新スクリプト")
    print("=" * 60)
    print()
    
    async with async_session() as session:
        # テストユーザーを取得（testuserで始まるメールアドレス、またはis_admin=Falseのユーザー）
        query = select(User).where(
            (User.email.like(f"testuser%@{settings.ALLOWED_EMAIL_DOMAIN}")) |
            (User.is_admin == False)
        )
        result = await session.execute(query)
        users = result.scalars().all()
        
        print(f"📋 {len(users)}人のテストユーザーが見つかりました")
        print()
        
        for user in users:
            try:
                updated = False
                
                # プロフィール情報の更新
                if not user.display_name or user.display_name == "Anonymous":
                    # メールアドレスから番号を抽出して表示名を生成
                    if user.email.startswith("testuser"):
                        try:
                            num = int(user.email.split("@")[0].replace("testuser", ""))
                            user.display_name = f"テストユーザー{num:04d}"
                        except:
                            user.display_name = f"テストユーザー{user.id}"
                    else:
                        user.display_name = f"ユーザー{user.id}"
                    updated = True
                
                if not user.bio:
                    user.bio = generate_bio()
                    updated = True
                
                if not user.campus:
                    user.campus = random.choice(CAMPUSES)
                    updated = True
                
                if not user.faculty:
                    user.faculty = random.choice(FACULTIES)
                    updated = True
                
                if not user.grade:
                    user.grade = random.choice(GRADES)
                    updated = True
                
                if not user.birthday:
                    user.birthday = generate_birthday()
                    updated = True
                
                if not user.gender:
                    user.gender = random.choice(GENDERS)
                    updated = True
                
                if not user.sexuality:
                    user.sexuality = random.choice(SEXUALITIES)
                    updated = True
                
                if not user.looking_for:
                    user.looking_for = random.choice(LOOKING_FOR_OPTIONS)
                    updated = True
                
                # プロフィール完了フラグを設定
                if not user.profile_completed:
                    user.profile_completed = True
                    updated = True
                
                # プライバシー設定の更新（デフォルト値が設定されていない場合）
                # デフォルト値はモデルで定義されているが、念のため確認
                privacy_updated = False
                
                # プライバシー設定はデフォルト値が設定されているはずだが、
                # 明示的に設定することで確実にする
                if user.show_faculty is None:
                    user.show_faculty = True
                    privacy_updated = True
                
                if user.show_grade is None:
                    user.show_grade = True
                    privacy_updated = True
                
                if user.show_birthday is None:
                    user.show_birthday = False  # デフォルトは非公開
                    privacy_updated = True
                
                if user.show_age is None:
                    user.show_age = True
                    privacy_updated = True
                
                if user.show_gender is None:
                    user.show_gender = True
                    privacy_updated = True
                
                if user.show_sexuality is None:
                    user.show_sexuality = True
                    privacy_updated = True
                
                if user.show_looking_for is None:
                    user.show_looking_for = True
                    privacy_updated = True
                
                if user.show_bio is None:
                    user.show_bio = True
                    privacy_updated = True
                
                if user.show_tags is None:
                    user.show_tags = True
                    privacy_updated = True
                
                if updated or privacy_updated:
                    await session.commit()
                    await session.refresh(user)
                    updated_count += 1
                    print(f"✅ 更新: {user.email} ({user.display_name})")
                else:
                    skipped_count += 1
                    print(f"⏭️  スキップ: {user.email} (既に設定済み)")
                
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
    asyncio.run(fill_test_user_profiles())

