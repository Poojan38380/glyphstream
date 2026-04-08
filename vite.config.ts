import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: 'pages',
  publicDir: 'public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'pages/index.html'),
        'ascii-flow-field': resolve(__dirname, 'pages/demos/ascii-flow-field.html'),
        'ascii-typography': resolve(__dirname, 'pages/demos/ascii-typography.html'),
        'ascii-reactive': resolve(__dirname, 'pages/demos/ascii-reactive.html'),
        'ascii-ambient': resolve(__dirname, 'pages/demos/ascii-ambient.html'),
        'ascii-face-generator': resolve(__dirname, 'pages/demos/ascii-face-generator.html'),
        'smoke-test': resolve(__dirname, 'pages/demos/smoke-test.html'),
      },
    },
  },
  server: {
    port: 3001,
    open: '/',
  },
})
