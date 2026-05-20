import asyncio
import os
import sys

# パスを追加して、appモジュールを読み込めるようにする
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.db.session import Sessionlocal
from app.models.user import User

async def set_admin_status(email: str, is_admin: bool):
    async with Sessionlocal() as db:
        result = await db.execute(select(User).filter(User.email == email))
        user = result.scalars().first()
        
        if not user:
            print(f"❌ エラー: メールアドレス '{email}' のユーザーが見つかりません。")
            return
        
        user.is_admin = is_admin
        await db.commit()
        
        status_text = "管理者" if is_admin else "一般ユーザー"
        print(f"✅ 成功: '{email}' の権限を「{status_text}」に変更しました！")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("使い方:")
        print("  python set_admin.py <メールアドレス> <1または0>")
        print("  (1: 管理者にする, 0: 一般ユーザーに戻す)")
        print("\n例:")
        print("  python set_admin.py admin@example.com 1")
        sys.exit(1)
        
    email = sys.argv[1]
    is_admin = sys.argv[2] in ["1", "true", "True"]
    
    asyncio.run(set_admin_status(email, is_admin))
