# Utility App

A collection of searchable developer utilities, packaged as a Windows desktop app with [Electron](https://www.electronjs.org/). The UI is Vite + React 19 + TanStack Router + Tailwind 4, built with [electron-vite](https://electron-vite.org/). Everything runs on your device.

## Running

```powershell
npm install
npm run dev      # Electron with HMR (renderer served from http://localhost:5173)
```

If the Electron binary fails to download behind a proxy, run `$env:NODE_USE_ENV_PROXY = '1'; node node_modules/electron/install.js`.

## Checks and packaging

```powershell
npm run lint; npm test; npm run build   # build = tsc -b && electron-vite build -> out/
npm run preview                         # run the built app
npm run pack                            # unpacked app in release/win-unpacked
npm run dist                            # NSIS installer + portable exe in release/
```

Installers are unsigned (Windows SmartScreen will warn) and there is no auto-update.

## Privacy model

**Your data is processed on the device and never leaves it.**

- There is no backend. Tool input/output is held in component state only.
- The renderer must not perform network requests. Enforced by:
  - oxlint: `fetch`/`XMLHttpRequest`/`WebSocket`/`EventSource` are banned under `src/renderer`;
  - `src/renderer/src/catalog/registry.test.ts`: scans every tool's sources for network access;
  - a Content-Security-Policy (`connect-src 'self'`, `script-src 'self'`) injected into `index.html` at build time and sent as a header by the `app://` protocol handler (`src/main/csp.ts`);
  - the main process (`src/main/security.ts`) cancels every request outside `app://` (plus `data:`/`blob:`; the dev server only in `npm run dev`), denies all permission requests, blocks `window.open`, and blocks navigation to other origins.
- The window uses `contextIsolation`, `sandbox`, no Node integration, and **no preload script**: the renderer has no bridge to Node. Packaged builds disable DevTools and the menu, and Electron fuses disable `RunAsNode`, Node CLI inspect args, `NODE_OPTIONS`, and loading code outside the asar.
- Only tool **ids** are persisted (favorites/recents in `localStorage`) or put in URLs (`/tools/<id>`).
- Files are read locally (`File.arrayBuffer()`); downloads use local blob URLs.

## Structure

```
src/main/             Electron main process
  index.ts            window, single-instance lock, lifecycle
  protocol.ts         app:// scheme serving out/renderer (SPA fallback to index.html)
  security.ts         request / permission / navigation lockdown
  urls.ts             pure helpers: path-traversal-safe file resolution, request allowlist (+ tests)
  csp.ts              the Content-Security-Policy shared with the renderer build
src/renderer/
  index.html
  public/             favicon, theme-init.js
  src/
    app/              router.tsx (routes: / and /tools/$toolId), AppShell, HomePage, ToolPage
    catalog/          types.ts (ToolDefinition), registry.ts (all tools), search.ts (fuzzy search),
                      preferences.ts (favorites/recents), lazy.ts
    components/
      shell/          Sidebar (search, favorites, recents, categories), CommandPalette (Ctrl+K), FavoriteButton
      io/             CodeTextarea, CopyButton, DownloadButton, FileInput
      ui/             shadcn components
    lib/              useHotkey, theme, utils
    tools/<id>/       meta.ts, logic.ts (pure, no React), logic.test.ts, Tool.tsx
build/icon.png        app icon (electron-builder converts it to .ico)
electron.vite.config.ts   electron-vite config (main + renderer)
electron-builder.yml      packaging (NSIS + portable, asar, fuses)
```

Keyboard: **Ctrl+K** opens the command palette, **/** focuses the sidebar search.

## Adding a tool

1. Create `src/renderer/src/tools/<id>/`:
   - `meta.ts` — `export const meta: ToolMeta = { id, name, description, category, keywords, icon }`
   - `logic.ts` — pure functions (easy to test, and to move into a Web Worker if heavy)
   - `logic.test.ts` — Vitest tests
   - `Tool.tsx` — default-exported UI using `logic.ts` and `components/io/*`
2. Register it in `src/renderer/src/catalog/registry.ts`:
   `{ ...meta, load: () => import('@/tools/<id>/Tool') }`

Each tool is code-split and loaded on first open. New categories go in `CATEGORIES` in `catalog/types.ts`.

Tools that need Node or OS access (filesystem, native modules, network) don't exist yet. When one is needed, add a `src/preload` script exposing a minimal typed API through `contextBridge`, handle it with `ipcMain` in `src/main`, and keep the privacy rules above intact.

## Current tools

| Tool | Notes |
| --- | --- |
| JSON Stringify | Validate pasted JSON and run it through `JSON.stringify`: pretty-print, minify, or escape as a string literal. |
| JSON to CSV | Paste or open a file; auto-finds nested arrays of objects (or use an explicit path); nested objects become dotted columns like `address.city`. |
| URL Encode / Decode | Component or full-URL encoding; strict UTF-8 decoding; optional `+` as space. |
