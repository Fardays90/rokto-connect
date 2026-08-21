import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware import cors
from app.core.db import init_db, close_db
from app.api.v1.router import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield
    close_db()

app = FastAPI(title="Rokto Connect API", lifespan=lifespan)

app.add_middleware(
    cors.CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)