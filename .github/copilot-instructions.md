# Copilot Instructions

Utility App: searchable developer utilities, shipped as a Windows Electron desktop app. Electron main process in `src/main/`; Vite + React 19 + TanStack Router + Tailwind 4 + shadcn (base-ui) renderer in `src/renderer/`, built with electron-vite. There is no backend. See [README.md](../README.md) for full details.

## Core principle: privacy first

**Your data is processed on the device and never leaves it.**

- The renderer (including every tool) must never do network I/O (`fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`). This is enforced by oxlint (`.oxlintrc.json`), by `src/renderer/src/catalog/registry.test.ts` (scans tool sources), by the CSP (`src/main/csp.ts`, injected by `electron.vite.config.ts` and sent by the `app://` handler), and by the main-process request lockdown (`src/main/security.ts`). Don't weaken or bypass any of them.
- Keep the window hardened: `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`, no preload script unless a tool truly needs native access. Don't expose Node/Electron APIs to the renderer broadly; if one is needed, add a minimal typed `contextBridge` API plus `ipcMain` handler and validate all inputs in main.
- Never persist or put tool input/output in URLs, `localStorage`, or logs. Only tool ids are persisted (favorites/recents). Keep input/output in component state.
- Read files locally (`File.arrayBuffer()`); download via local blob URLs.

## Commands

Run from the repo root in PowerShell (Windows). Use `;` to chain, not `&&`.

```powershell
npm install
npm run dev                                  # Electron + HMR (renderer on :5173)

# Checks (run the relevant ones before finishing)
npm run lint; npm test; npm run build        # build = tsc -b && electron-vite build

npm run preview                              # run the built app
npm run pack                                 # unpacked app -> release/win-unpacked
npm run dist                                 # NSIS installer + portable exe -> release/
```

If the Electron binary download fails behind a proxy: `$env:NODE_USE_ENV_PROXY = '1'; node node_modules/electron/install.js`.

## Adding a tool

1. Create `src/renderer/src/tools/<id>/` (kebab-case id, matches URL `/tools/<id>`):
   - `meta.ts` — `export const meta: ToolMeta = { id, name, description, category, keywords, icon }`
   - `logic.ts` — pure functions, no React, no DOM side effects
   - `logic.test.ts` — Vitest tests for the logic
   - `Tool.tsx` — **default-exported** UI built on `logic.ts` and `components/io/*` (`CodeTextarea`, `CopyButton`, `DownloadButton`, `FileInput`)
2. Register in `src/renderer/src/catalog/registry.ts`: `{ ...meta, load: () => import('@/tools/<id>/Tool') }` (tools are code-split).
3. New categories go in `CATEGORIES` in `catalog/types.ts`.
4. Update the "Current tools" table in `README.md`.

## Renderer conventions

- TypeScript: `verbatimModuleSyntax` (use `import type`), `erasableSyntaxOnly` (no enums/namespaces/parameter properties), `noUnusedLocals/Parameters`.
- Use the `@/` alias for `src/renderer/src/` imports.
- Routes use browser history on the `app://app` origin; the main process falls back to `index.html` for extension-less paths. Asset URLs must stay absolute (`base: '/'` is forced by the `absolute-base` plugin in `electron.vite.config.ts`).
- Styling with Tailwind utility classes; reuse `components/ui/*` (shadcn) and `cn()` from `@/lib/utils`. Don't add UI libraries without need.
- Lint is oxlint (`react/rules-of-hooks` is an error). Keep component files exporting components only.
- Tests: Vitest (`*.test.ts` next to the source; config in `vitest.config.ts`). Put logic in `logic.ts` so it's testable without rendering.
- `fsModuleCache: false` in `vitest.config.ts` is intentional (so `registry.test.ts` sees newly added tool files); don't remove it.
- All dependencies live in `devDependencies` on purpose: the renderer is bundled by Vite and the main process only uses Electron/Node built-ins, so nothing needs to be shipped in `node_modules`.

## Main process conventions

- `src/main/urls.ts` holds the pure, tested helpers (path-traversal-safe file resolution, request allowlist). Keep security-relevant logic there with tests in `urls.test.ts`.
- The `app://` handler reads files with `fs` (not `net.fetch(file://)`) so the `file:` scheme stays blocked by the session lockdown.
- Packaging is `electron-builder.yml` (NSIS + portable, asar, fuses). Builds are unsigned and there is no auto-update; don't add a publish feed without being asked.

## General

- Make focused changes; don't commit `node_modules`, `out/`, or `release/`.
- Keep `README.md` in sync when changing structure, commands, or the tool list.
