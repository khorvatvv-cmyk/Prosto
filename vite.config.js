import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { rmSync } from 'node:fs'

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    mode === 'android' && {
      name: 'exclude-downloadable-apk-from-android-bundle',
      closeBundle() {
        rmSync(new URL('./dist/downloads/', import.meta.url), { recursive: true, force: true })
      },
    },
  ].filter(Boolean),
  base: '/',
  server: {
    proxy: {
      '/api': {
        target: 'https://prosto-support.bit-support.workers.dev',
        changeOrigin: true,
        secure: true,
      },
    },
  },
}))
