/**
 * Значения по умолчанию, выводимые из NODE_ENV (#894).
 *
 * Проверяется здесь потому, что от COOKIE_SECURE зависит, работает ли вход
 * вообще: браузер не отправляет Secure-cookie по http. Ошибка в этом месте
 * выглядит не как ошибка, а как «логин не запоминается».
 */

import { resolveCookieSecure, resolveLogLevel } from './env';

describe('resolveCookieSecure', () => {
  test('в production Secure включён по умолчанию', () => {
    expect(resolveCookieSecure('production')).toBe(true);
  });

  test('вне production выключен — локально ходим по http', () => {
    expect(resolveCookieSecure('development')).toBe(false);
    expect(resolveCookieSecure('test')).toBe(false);
  });

  test('явное значение переопределяет и прод', () => {
    // Нужно для прод-сборки без TLS: docker compose на localhost:8080.
    expect(resolveCookieSecure('production', false)).toBe(false);
    expect(resolveCookieSecure('development', true)).toBe(true);
  });
});

describe('resolveLogLevel', () => {
  test('уровень по окружению', () => {
    expect(resolveLogLevel('production')).toBe('info');
    expect(resolveLogLevel('development')).toBe('debug');
    // Иначе логи запросов заливают отчёт jest.
    expect(resolveLogLevel('test')).toBe('silent');
  });

  test('явный уровень сильнее', () => {
    expect(resolveLogLevel('test', 'debug')).toBe('debug');
  });
});
