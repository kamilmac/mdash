import { defineConfig } from 'vite'

export default defineConfig({
  root: 'src',
  base: '/mdash/',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
})
