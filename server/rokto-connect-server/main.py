import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware import cors
from app.core.db import init_db, close_db
from app.core.ws import capture_loop
from app.api.v1.router import api_router

CORS_ORIGINS = [
    origin.strip().rstrip("/")
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,https://rokto-connect.pages.dev",
    ).split(",")
    if origin.strip()
]

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    capture_loop()
    yield
    close_db()

app = FastAPI(title="Rokto Connect API", lifespan=lifespan)

app.add_middleware(
    cors.CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
