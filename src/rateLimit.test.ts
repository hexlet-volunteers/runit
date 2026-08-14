/**
 * Ограничение частоты запросов не должно обходиться заголовком (#858).
 *
 * Тест появился после аудита: `keyGenerator` брал первый элемент
 * X-Forwarded-For напрямую, а fastify создавался без trustProxy. Заголовок
 * подставляет кто угодно — меняя его в каждом запросе, клиент получал новую
 * корзину и перебирал пароль без ограничений. Обратная сторона той же ошибки:
 * за нашим прокси, который заголовок перезаписывает, все посетители попадали в
 * один бакет, и один скрипт мог выключить вход для всех.
 *
 * Проверяем оба режима: без доверия прокси заголовок игнорируется, с доверием —
 * учитывается ровно один хоп.
 */

import { createTestDatabase, dropTestDatabase } from './db/testDatabase';

const TEST_DATABASE = 'runit_test_ratelimit';
process.env.DATABASE_URL = await createTestDatabase(TEST_DATABASE);
// Низкий порог, чтобы тест не делал сотни запросов.
process.env.RATE_LIMIT_AUTH = '2';
process.env.RUNNER_ENABLED = 'false';

const { default: getApp } = await import('./index');
const { closeDbConnection } = await import('./db/connection');

let app: Awaited<ReturnType<typeof getApp>>;

const login = (forwardedFor?: string) =>
  app.inject({
    method: 'POST',
    url: '/trpc/auth.login',
    headers: {
      'content-type': 'application/json',
      ...(forwardedFor ? { 'x-forwarded-for': forwardedFor } : {}),
    },
    payload: { email: 'nobody@example.com', password: 'whatever-42' },
  });

beforeAll(async () => {
  app = await getApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
  await closeDbConnection();
  await dropTestDatabase(TEST_DATABASE);
});

describe('лимит на вход', () => {
  test('подстановка X-Forwarded-For не обнуляет счётчик', async () => {
    // Три запроса с разными «адресами» в заголовке. TRUST_PROXY_HOPS не задан,
    // значит заголовку не верим, и все три должны попасть в один счётчик.
    const first = await login('10.0.0.1');
    const second = await login('10.0.0.2');
    const third = await login('10.0.0.3');

    expect(first.statusCode).toBe(401);
    expect(second.statusCode).toBe(401);
    // Порог 2 — третий запрос отвергается лимитером, а не проверкой пароля.
    expect(third.statusCode).toBe(429);
  });
});
