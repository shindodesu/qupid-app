# app/schemas/user.py
# User schema definition: minimal example

from pydantic import BaseModel, EmailStr


class userBase(BaseModel):
    email: EmailStr
    displayname: str

class UserCreate(BaseModel):
    pass

class UserRead(BaseModel):
    id : int

    class Config:
        from_attributes = True