import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: 'pages',
  resolve: {
    alias: {
      '@chenglou/pretext': resolve(__dirname, '../pretext/src/layout.ts'),
    },
  },
  server: {
    port: 3001,
    open: '/demos/smoke-test.html',
  },
})
