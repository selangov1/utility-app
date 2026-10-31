# Utility App

A collection of searchable developer utilities. FastAPI backend (managed with [uv](https://docs.astral.sh/uv/)) and a Vite + React + TanStack Router frontend.

## Running

Both at once (backend on 47831, frontend on 47832):

```powershell
.\start-utilityapp.ps1
```

Or separately:

```powershell
# Backend — http://localhost:8000
cd backend
uv sync
uv run uvicorn app.main:app --reload --no-server-header

# Frontend — http://localhost:5173 (proxies /api to the backend)
cd frontend
npm install
npm run dev
```

## Checks

```powershell
cd frontend; npm run lint; npm test; npm run build
cd backend; uv run pytest
```

## Privacy model

**If data can be processed in the browser, it is — and it never leaves the device.**

- Every tool declares `execution: 'client' | 'server'` and shows a **Runs locally** / **Sends data to server** badge.
- Client tools must not perform network requests. Enforced by:
  - oxlint: `fetch`/`XMLHttpRequest`/`WebSocket`/`EventSource` are banned outside `src/lib/api.ts`, and `@/lib/api` may only be imported from `src/tools/<id>/api.ts` (plus the capability hook);
  - `src/catalog/registry.test.ts`: scans each client tool's sources for network access;
  - a production Content-Security-Policy (`connect-src 'self'`, `script-src 'self'`) injected at build time.
- Only tool **ids** are ever persisted (favorites/recents in `localStorage`) or put in URLs (`/tools/<id>`). Tool input/output is held in component state only.
- Files are read locally (`File.arrayBuffer()`), never uploaded, by client tools. Downloads use local blob URLs.
- The backend is stateless and only hosts tools that truly need a server (secrets, native libraries, network access the browser can't do). Every response gets `Cache-Control: no-store`, `nosniff`, `no-referrer`, `X-Frame-Options: DENY`; `/api/*` also gets `Content-Security-Policy: default-src 'none'`. Request bodies are capped (`MAX_BODY_BYTES`, default 1 MB) and never logged. `GET /api/tools` returns only server-tool ids.

## Structure

```
frontend/src/
  app/            router.tsx (routes: / and /tools/$toolId), AppShell, HomePage, ToolPage
  catalog/        types.ts (ToolDefinition), registry.ts (all tools), search.ts (fuzzy search),
                  preferences.ts (favorites/recents), lazy.ts, useServerCapabilities.ts
  components/
    shell/        Sidebar (search, favorites, recents, categories), CommandPalette (Ctrl/Cmd+K),
                  ExecutionBadge, FavoriteButton
    io/           CodeTextarea, CopyButton, DownloadButton, FileInput
    ui/           shadcn components
  lib/            api.ts (the only backend client), useHotkey, theme, utils
  tools/<id>/     meta.ts, logic.ts (pure, no React), logic.test.ts, Tool.tsx, [api.ts for server tools]
backend/app/
  main.py         app + middleware
  security.py     security headers, body size limit
  tools/          server-only tool plugins (registry + capability list)
backend/tests/
```

Keyboard: **Ctrl/Cmd+K** opens the command palette, **/** focuses the sidebar search.

## Adding a tool

Decide first: **can it run in the browser?** If yes, it's a client tool. Use a server tool only when it can't.

### Client tool

1. Create `frontend/src/tools/<id>/`:
   - `meta.ts` — `export const meta: ToolMeta = { id, name, description, category, keywords, icon, execution: 'client' }`
   - `logic.ts` — pure functions (easy to test, and to move into a Web Worker if heavy)
   - `logic.test.ts` — Vitest tests
   - `Tool.tsx` — default-exported UI using `logic.ts` and `components/io/*`
2. Register it in `frontend/src/catalog/registry.ts`:
   `{ ...meta, load: () => import('@/tools/<id>/Tool') }`

Each tool is code-split and loaded on first open. New categories go in `CATEGORIES` in `catalog/types.ts`.

### Server tool

1. Backend: create `backend/app/tools/<module>.py` exposing `tool = Tool(id="<id>", ..., router=router)`, and add the module to `SERVER_TOOLS` in `backend/app/tools/__init__.py`. Routes are served under `/api/tools/<id>/`. Keep handlers stateless; don't log or store input; return only what the UI needs.
2. Frontend: same folder layout as a client tool with `execution: 'server'`, plus `api.ts`, the only file in the tool that may import `@/lib/api`. The page only renders the tool after `GET /api/tools` confirms the backend provides it.

## Current tools

| Tool | Runs | Notes |
| --- | --- | --- |
| JSON to CSV | locally | Paste or open a file; auto-finds nested arrays of objects (or use an explicit path); nested objects become dotted columns like `address.city`. |
| URL Encode / Decode | locally | Component or full-URL encoding; strict UTF-8 decoding; optional `+` as space. |
