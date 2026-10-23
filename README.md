# Utility App

FastAPI backend (managed with [uv](https://docs.astral.sh/uv/)) and a Vite + React frontend.

## Backend

Runs at http://localhost:8000.

```powershell
cd backend
uv sync
uv run uvicorn app.main:app --reload
```

Add a dependency:

```powershell
uv add <package>
```

## Frontend

Runs at http://localhost:5173.

```powershell
cd frontend
npm install
npm run dev
```

## Tools

Tools are plugins: the backend registers each in `backend/app/tools/` (module exposing a `tool`, added to the tuple in `__init__.py`; served under `/api/tools/<id>/`) and the frontend maps its id to a component in `frontend/src/tools/index.ts`. The sidebar is built from `GET /api/tools`.

Current tools: **JSON to CSV** (upload or paste JSON; auto-finds nested arrays of objects, optional array path override, nested objects flattened into dotted columns like `address.city`).
