import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .security import BodySizeLimitMiddleware, SecurityHeadersMiddleware
from .tools import router as tools_router

app = FastAPI(title="Utility App API")
app.include_router(tools_router)

# The frontend reaches the API through the Vite proxy (same origin); CORS only
# covers direct calls from the dev server origin, with the narrowest surface.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[f"http://localhost:{os.environ.get('FRONTEND_PORT', '5173')}"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)
app.add_middleware(BodySizeLimitMiddleware)
app.add_middleware(SecurityHeadersMiddleware)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
