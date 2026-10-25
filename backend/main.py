import sys
import os
sys.path.append(os.path.dirname(__file__))

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from routers import entries, prakash, summary
from auth import require_admin

app = FastAPI(title="Neera Shop API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "https://neera-shop-frontend.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(
    entries.router,
    dependencies=[Depends(require_admin)]
)

app.include_router(
    prakash.router,
    dependencies=[Depends(require_admin)]
)

app.include_router(
    summary.router,
    dependencies=[Depends(require_admin)]
)

@app.get("/")
def root():
    return {"status": "Neera Shop API is running"}