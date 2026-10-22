/**
 * Лимит на вход за доверенным прокси (#985).
 *
 * Режим с доверием прокси долго не был покрыт вовсе, и поэтому обновление
 * fastify до 5.12.1 проехало бы зелёным: там число хопов в trustProxy молча
 * стало значить «не доверять никому», и за прокси все посетители попадали в
 * одну корзину. Тест живёт отдельным файлом, потому что окружение читается
 * один раз при импорте приложения, а здесь нужно другое значение TRUST_PROXY,
 * чем в rateLimit.test.ts.
 *
 * Адрес сокета задаётся явно: по умолчанию inject подставляет 127.0.0.1, а
 * loopback в uniquelocal не входит — заголовок игнорировался бы, и тест
 * проверял бы не тот режим.
 */

import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { createTestDatabase, dropTestDatabase } from '../src/db/testDatabase';

const TEST_DATABASE = 'runit_test_ratelimit_trust_proxy';
process.env.DATABASE_URL = await createTestDatabase(TEST_DATABASE);
// Низкий порог, чтобы тест не делал сотни запросов.
process.env.RATE_LIMIT_AUTH = '2';
process.env.RUNNER_ENABLED = 'false';
process.env.TRUST_PROXY = 'uniquelocal';

const { default: getApp } = await import('../src/index');
const { closeDbConnection } = await import('../src/db/connection');

let app: Awaited<ReturnType<typeof getApp>>;

const login = (remoteAddress: string, forwardedFor: string, email: string) =>
  app.inject({
    method: 'POST',
    url: '/trpc/auth.login',
    remoteAddress,
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': forwardedFor,
    },
    payload: { email, password: 'whatever-42' },
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

describe('лимит на вход за доверенным прокси', () => {
  test('клиенты за прокси считаются по отдельности', async () => {
    // Порог 2, а запросов три — будь у них общая корзина, третий получил бы 429.
    const responses = await Promise.all(
      ['203.0.113.1', '203.0.113.2', '203.0.113.3'].map((client) =>
        login('10.0.0.5', client, 'proxied@example.com'),
      ),
    );

    expect(responses.map((response) => response.statusCode)).toEqual([
      401, 401, 401,
    ]);
  });

  test('заголовок от адреса вне доверенных игнорируется', async () => {
    // Запрос в обход прокси: сокет — публичный адрес. Подставленные адреса в
    // заголовке не должны давать новых корзин.
    const first = await login(
      '198.51.100.9',
      '203.0.113.11',
      'direct@example.com',
    );
    const second = await login(
      '198.51.100.9',
      '203.0.113.12',
      'direct@example.com',
    );
    const third = await login(
      '198.51.100.9',
      '203.0.113.13',
      'direct@example.com',
    );

    expect(first.statusCode).toBe(401);
    expect(second.statusCode).toBe(401);
    expect(third.statusCode).toBe(429);
  });
});
