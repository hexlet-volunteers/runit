/**
 * Анти-брутфорс на вход по HTTP (#858).
 *
 * Счётчик неудач по email, отдельный от IP-лимита в security.ts: тот не
 * останавливает перебор пароля одного аккаунта с разных адресов, этот —
 * останавливает. Вынесено из authFlow.test.ts в отдельный файл: своя
 * тестовая база избавляет от общей истории неудачных попыток с остальными
 * сценариями входа и от зависимости тестов друг от друга по порядку запуска.
 */

import { createTestDatabase, dropTestDatabase } from '../db/testDatabase';

const TEST_DATABASE = 'runit_test_bruteforce';
process.env.DATABASE_URL = await createTestDatabase(TEST_DATABASE);
// Проверяется счётчик по email, а не лимитер по IP — его порог не должен
// мешать тесту делать несколько запросов подряд с одного адреса.
process.env.RATE_LIMIT_AUTH = '500';
process.env.RUNNER_ENABLED = 'false';

const { default: getApp } = await import('../index');
const { closeDbConnection } = await import('../db/connection');
const { CURRENT_CONSENT_VERSION } = await import('../auth/consent');
const { LOCKOUT_THRESHOLD } = await import('../auth/bruteforce');

let app: Awaited<ReturnType<typeof getApp>>;

beforeAll(async () => {
  app = await getApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
  await closeDbConnection();
  await dropTestDatabase(TEST_DATABASE);
});

const login = (email: string, password: string) =>
  app.inject({
    method: 'POST',
    url: '/trpc/auth.login',
    payload: { email, password },
  });

describe('анти-брутфорс на вход', () => {
  test('блокирует после LOCKOUT_THRESHOLD неудачных попыток подряд', async () => {
    const email = 'bruteforce@example.com';

    let lastResponse: Awaited<ReturnType<typeof login>> | undefined;
    for (let i = 0; i < LOCKOUT_THRESHOLD; i += 1) {
      lastResponse = await login(email, 'definitely-wrong');
    }

    expect(lastResponse?.json().error.data.code).toBe('UNAUTHORIZED');

    const blocked = await login(email, 'definitely-wrong');
    expect(blocked.json().error.data.code).toBe('TOO_MANY_REQUESTS');
    expect(blocked.statusCode).toBe(429);
  });

  test('успешный вход сбрасывает счётчик неудач', async () => {
    const email = 'bruteforce-reset@example.com';
    const password = 'Str0ng-reset!';

    await app.inject({
      method: 'POST',
      url: '/trpc/auth.register',
      payload: {
        username: 'bruteforcereset',
        email,
        password,
        consentVersion: CURRENT_CONSENT_VERSION,
      },
    });

    // Одна неудача — до порога блокировки.
    const wrongPassword = await login(email, 'definitely-wrong');
    expect(wrongPassword.json().error.data.code).toBe('UNAUTHORIZED');

    const success = await login(email, password);
    expect(success.statusCode).toBe(200);

    // Счётчик сброшен — та же неудачная попытка, что и раньше, не блокирует.
    const afterReset = await login(email, 'definitely-wrong');
    expect(afterReset.json().error.data.code).toBe('UNAUTHORIZED');
  });
});
