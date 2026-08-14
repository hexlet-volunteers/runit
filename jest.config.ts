import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts$': [
      '@swc/jest',
      {
        jsc: {
          parser: { syntax: 'typescript' },
          target: 'es2022',
        },
        module: { type: 'es6' },
      },
    ],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  /**
   * Только тесты бэкенда.
   *
   * `rootDir: 'src'` — не косметика: с корнем репозитория jest подхватывал и
   * тесты фронтенда (frontend/src/**), написанные под vitest и jsdom, и падал на
   * них с ошибками разбора. Выглядело это как «7 наборов упали», хотя ни один
   * тест бэкенда не сломался.
   *
   * src/runner/*.test.ts исключены отдельно: у них свой раннер на node:test
   * (см. npm run test:runner), потому что они проверяют argv для docker без
   * jest-окружения.
   *
   * Исключение записано через <rootDir>, а не как '/runner/': шаблоны
   * сопоставляются с абсолютным путём файла, и в CI он выглядит как
   * /home/runner/work/runit/runit/src/... — то есть голое '/runner/' совпадало с
   * домашним каталогом пользователя раннера GitHub Actions и отсекало ВСЕ тесты.
   * Локально этого не видно (в пути разработчика нет «runner»), а в CI job падал
   * с «No tests found». Тот же класс ошибки, что и с монтированием: путь
   * означает разное в разных местах.
   */
  rootDir: 'src',
  testMatch: ['**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/runner/'],
};

export default config;
