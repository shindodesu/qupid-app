from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.schemas.user import UserCreate, UserResponse
from app.crud.user import create_user
from app.database import SessionLocal

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    return create_user(db, user)
