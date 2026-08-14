/// <reference types="vitest/config" />
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
  /**
   * Тесты фронтенда (#177). Раньше их не было ни одного: всё, что видно в
   * браузере, проверялось руками, и регрессию замечал только человек — а
   * замечал он её, как правило, уже в проде.
   *
   * jsdom, а не браузер: цель — быстрые проверки логики и разметки на каждый
   * PR. Сквозные сценарии в настоящем браузере — отдельная задача (#177).
   */
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
    server: {
      deps: {
        /**
         * react-router обрабатывается Vite, как в самом приложении.
         *
         * Иначе Node грузит его как чистый ESM и падает на
         * `import { useOptimistic } from 'react'`: react-router 8 объявляет
         * peer-зависимость React >= 19.2.7, а в проекте React 18. В браузере
         * это не проявляется — приложение не использует те возможности
         * роутера, которым нужен React 19, — но несовпадение версий реальное и
         * заслуживает отдельной задачи, а не обхода тестами.
         */
        inline: ['react-router'],
      },
    },
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