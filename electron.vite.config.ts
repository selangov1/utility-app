import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'electron-vite'
import { type Plugin } from 'vite'
import { CONTENT_SECURITY_POLICY } from './src/main/csp'

// Build-only because the dev server relies on inline scripts for HMR.
function contentSecurityPolicy(): Plugin {
  return {
    name: 'content-security-policy',
    apply: 'build',
    transformIndexHtml: () => [
      {
        tag: 'meta',
        attrs: { 'http-equiv': 'Content-Security-Policy', content: CONTENT_SECURITY_POLICY },
        injectTo: 'head-prepend',
      },
    ],
  }
}

// electron-vite forces a relative base in production builds, which breaks asset URLs on
// nested client routes (e.g. /tools/<id>). The app:// origin serves from "/", so restore it.
function absoluteBase(): Plugin {
  return {
    name: 'absolute-base',
    enforce: 'post',
    config: () => ({ base: '/' }),
  }
}

export default defineConfig({
  main: {},
  renderer: {
    plugins: [react(), tailwindcss(), absoluteBase(), contentSecurityPolicy()],
    resolve: {
      alias: { '@': path.resolve(import.meta.dirname, 'src/renderer/src') },
    },
  },
})
