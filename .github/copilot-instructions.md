# Copilot Instructions

Utility App: searchable developer utilities. Vite + React 19 + TanStack Router + Tailwind 4 + shadcn (base-ui) frontend in `frontend/`; stateless FastAPI backend (Python >= 3.14, managed with `uv`) in `backend/`. See [README.md](../README.md) for full details.

## Core principle: privacy first

**If data can be processed in the browser, it is — and it never leaves the device.** Default every new tool to `execution: 'client'`. Use a server tool only for things the browser can't do (secrets, native libs, cross-origin network access).

- Client tools must never do network I/O (`fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`). This is enforced by oxlint (`frontend/.oxlintrc.json`), by `frontend/src/catalog/registry.test.ts` (scans client tool sources), and by a build-time CSP in `frontend/vite.config.ts`. Don't weaken or bypass any of them.
- `@/lib/api` may be imported only from `src/tools/<id>/api.ts` (plus `catalog/useServerCapabilities.ts`). `src/lib/api.ts` is the only backend client.
- Never persist or put tool input/output in URLs, `localStorage`, or logs. Only tool ids are persisted (favorites/recents). Keep input/output in component state.
- Read files locally (`File.arrayBuffer()`); download via local blob URLs.
- Backend handlers must be stateless, never log or store request bodies, and return only what the UI needs.

## Commands

Run from the repo root in PowerShell (Windows). Use `;` to chain, not `&&`.

```powershell
.\start-utilityapp.ps1                      # backend :47831 + frontend :47832
cd backend;  uv sync; uv run uvicorn app.main:app --reload --no-server-header
cd frontend; npm install; npm run dev       # :5173, proxies /api to backend

# Checks (run the relevant ones before finishing)
cd frontend; npm run lint; npm test; npm run build   # build = tsc -b && vite build
cd backend;  uv run pytest
```

## Adding a client tool

1. Create `frontend/src/tools/<id>/` (kebab-case id, matches URL `/tools/<id>`):
   - `meta.ts` — `export const meta: ToolMeta = { id, name, description, category, keywords, icon, execution: 'client' }`
   - `logic.ts` — pure functions, no React, no DOM side effects
   - `logic.test.ts` — Vitest tests for the logic
   - `Tool.tsx` — **default-exported** UI built on `logic.ts` and `components/io/*` (`CodeTextarea`, `CopyButton`, `DownloadButton`, `FileInput`)
2. Register in `frontend/src/catalog/registry.ts`: `{ ...meta, load: () => import('@/tools/<id>/Tool') }` (tools are code-split).
3. New categories go in `CATEGORIES` in `catalog/types.ts`.
4. Update the "Current tools" table in `README.md`.

## Adding a server tool

1. Backend: `backend/app/tools/<module>.py` exposing `tool = Tool(id=..., name=..., description=..., router=router)`; add the module to `SERVER_TOOLS` in `backend/app/tools/__init__.py`. Routes are served at `/api/tools/<id>/`. Tool ids must match `^[a-z0-9-]{1,64}$` and be unique.
2. Frontend: same folder layout with `execution: 'server'`, plus `api.ts` (the only file in the tool allowed to import `@/lib/api`). The id must equal the backend id.
3. Add pytest tests in `backend/tests/`.

## Frontend conventions

- TypeScript: `verbatimModuleSyntax` (use `import type`), `erasableSyntaxOnly` (no enums/namespaces/parameter properties), `noUnusedLocals/Parameters`.
- Use the `@/` alias for `src/` imports.
- Styling with Tailwind utility classes; reuse `components/ui/*` (shadcn) and `cn()` from `@/lib/utils`. Don't add UI libraries without need.
- Lint is oxlint (`react/rules-of-hooks` is an error). Keep component files exporting components only.
- Tests: Vitest (`*.test.ts` next to the source). Put logic in `logic.ts` so it's testable without rendering.
- `fsModuleCache: false` in `vite.config.ts` is intentional (so `registry.test.ts` sees newly added tool files); don't remove it.

## Backend conventions

- Python 3.14, FastAPI, type-annotated functions, `uv` for dependencies (`uv add <pkg>`, commit `uv.lock`).
- All responses go through `SecurityHeadersMiddleware` and `BodySizeLimitMiddleware` (`app/security.py`; `MAX_BODY_BYTES` default 1 MB). Don't remove or bypass them.
- `GET /api/tools` must expose only tool ids.
- Tests use `TestClient` in `backend/tests/test_api.py`; run with `uv run pytest`.

## General

- Make focused changes; don't commit `.venv`, `node_modules`, or build output.
- Keep `README.md` in sync when changing structure, commands, or the tool list.
