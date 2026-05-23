import sys
import os
sys.path.append(os.path.dirname(__file__))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import entries, prakash, summary

app = FastAPI(title="Neera Shop API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(entries.router)
app.include_router(prakash.router)
app.include_router(summary.router)

@app.get("/")
def root():
    return {"status": "Neera Shop API is running"}