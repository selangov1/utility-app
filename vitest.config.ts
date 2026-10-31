import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src/renderer/src') },
  },
  test: {
    include: ['src/**/*.test.ts'],
    // registry.test.ts scans tool sources via import.meta.glob; a persisted
    // transform cache would hide newly added files from that boundary check.
    fsModuleCache: false,
  },
})
