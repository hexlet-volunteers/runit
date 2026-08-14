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
    // react и react-dom должны резолвиться в единственную копию, иначе Vite
    // пребандлит их отдельно и контекст React не виден хукам.
    //
    // react-router здесь больше не нужен: пакет остался один. Раньше в проекте
    // жили react-router и react-router-dom, dedupe склеивал их в одну копию и
    // так лечил белый экран из #811 — но склеить разные мажоры он не мог, и
    // проблема ждала повода вернуться.
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 3000,
    open: "/",
    /**
     * Что уходит на бэкенд в разработке.
     *
     * Кроме /trpc здесь ещё три пути, и они не для удобства: их обслуживает
     * Caddy в проде (frontend/Caddyfile.docker), а в разработке Vite отдавал на
     * них SPA-оболочку. То есть встраивание сниппетов — oEmbed и HTML с
     * метатегами, за которыми приходят площадки и мессенджеры, — локально
     * нельзя было ни увидеть, ни проверить: вместо JSON возвращался index.html,
     * и поломка обнаружилась бы только на боевом стенде.
     */
    proxy: {
      '/trpc': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/oembed': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      // Только /s/:code/meta, а не весь /s/* — страницу просмотра рисует SPA.
      '^/s/[^/]+/meta$': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  }
})