from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .tools import router as tools_router

app = FastAPI(title="Utility App API")
app.include_router(tools_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Source-Path"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
