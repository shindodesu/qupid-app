from pydantic import BaseModel

class UserCreate(BaseModel):
    nickname: str
    email: str
    gender_identity: str
    sexuality: str

class UserResponse(UserCreate):
    id: int
    class Config:
        orm_mode = True