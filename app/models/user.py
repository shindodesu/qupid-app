from sqlalchemy import Column, Integer, String
from app.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    nickname = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    gender_identity = Column(String)
    sexuality = Column(String)
