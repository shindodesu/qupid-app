# app/db/base,py
# define of Base

from sqlalchemy.orm import DeclarativeBase
# declarative_baseとは、PythonのORMライブラリSQLAlchemyで、クラス定義とデータベーステーブル定義を自動的に関連付けるための基底クラス（メタクラス）を作成する関数

class Base(DeclarativeBase):
    pass