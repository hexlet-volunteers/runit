import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from "vite-plugin-svgr";
// https://vite.dev/config/

export default defineConfig({
  plugins: [react(), 
  svgr({
    svgrOptions: {
      icon: true
    }
  })],
  resolve: {
    // react-router и react-router-dom должны резолвиться в единственную копию,
    // иначе Vite пребандлит их отдельно и контекст <Router> не виден хукам,
    // импортированным из 'react-router' (белый экран на старте). См. #811.
    dedupe: ['react', 'react-dom', 'react-router', 'react-router-dom'],
  },
  server: {
    port: 3000,
    open: "/",
    proxy: {
      '/trpc': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  }
})