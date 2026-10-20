import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',

    /**
     * Только тесты бэкенда.
     *
     * По умолчанию vitest забирает **\/*.test.ts от корня репозитория — то есть
     * и frontend/src, у которого свой конфиг (jsdom, setupFiles, svgr).
     */
    include: ['__tests__/**/*.test.ts'],
    exclude: ['**/node_modules/**'],
  },
});
