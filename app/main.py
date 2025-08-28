from fastapi import FastAPI
from app.api import user
from app.database import engine
from app.models import user as user_models

user_models.Base.metadata.create_all(bind=engine)

app = FastAPI()
app.include_router(user.router, prefix="/users", tags=["users"])
