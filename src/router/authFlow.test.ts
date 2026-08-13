/**
 * Полный цикл авторизации по HTTP (#639).
 *
 * В отличие от authorization.test.ts, где контекст подставляется напрямую,
 * здесь поднимается настоящее приложение и запросы идут через inject(): только
 * так проверяются cookie, CSRF-хук и миграции.
 *
 * Тест появился после конкретной осечки: регистрация падала с «no such table:
 * password_history», потому что миграции в drizzle/ отставали от схемы. Ни один
 * тест не проходил регистрацию целиком, и в проверках по правам доступа это
 * никак не проявлялось — они не доходили до записи в новые таблицы.
 */

import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

process.env.DB_PATH = join(
  mkdtempSync(join(tmpdir(), 'runit-authflow-')),
  'test.sqlite',
);
// Лимит на auth рассчитан на человека (10/мин), а тест делает больше запросов
// подряд с одного адреса. Проверяется цикл авторизации, а не лимитер — его
// покрывают отдельные проверки.
process.env.RATE_LIMIT_AUTH = '500';
// Раннеру в этом тесте делать нечего, а уборка осиротевших контейнеров зовёт
// docker в фоне.
process.env.RUNNER_ENABLED = 'false';

const { default: getApp } = await import('../index');

const CREDENTIALS = {
  username: 'flowuser',
  email: 'flow@example.com',
  password: 'Str0ng-flow!',
};

const NEW_PASSWORD = 'Even-str0nger!';

let app: Awaited<ReturnType<typeof getApp>>;

/** Собирает cookie из Set-Cookie в вид, пригодный для заголовка запроса. */
const jar = new Map<string, string>();

const rememberCookies = (response: {
  cookies: Array<Record<string, unknown>>;
}) => {
  for (const cookie of response.cookies) {
    const name = String(cookie.name);
    const value = String(cookie.value);
    if (value === '') {
      jar.delete(name);
    } else {
      jar.set(name, value);
    }
  }
};

const cookieHeader = (): string =>
  [...jar.entries()].map(([name, value]) => `${name}=${value}`).join('; ');

beforeAll(async () => {
  app = await getApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe('регистрация, вход и сессия', () => {
  let csrfToken = '';

  test('регистрация создаёт пользователя и выдаёт cookie сессии', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/trpc/auth.register',
      payload: CREDENTIALS,
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();
    expect(body.result.data.user.username).toBe(CREDENTIALS.username);
    // Ни пароля, ни хеша, ни recoverHash в ответе быть не должно (#793).
    expect(body.result.data.user).not.toHaveProperty('password');
    expect(body.result.data.user).not.toHaveProperty('recoverHash');

    const names = response.cookies.map((cookie) => String(cookie.name));
    expect(names).toContain('accessToken');
    expect(names).toContain('refreshToken');

    // Сессионные cookie обязаны быть httpOnly, иначе их читает любой скрипт.
    for (const cookie of response.cookies) {
      if (cookie.name === 'accessToken' || cookie.name === 'refreshToken') {
        expect(cookie.httpOnly).toBe(true);
      }
    }

    rememberCookies(response);
    csrfToken = body.result.data.csrfToken;
    expect(typeof csrfToken).toBe('string');
  });

  test('auth.me восстанавливает пользователя по cookie', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/trpc/auth.me',
      headers: { cookie: cookieHeader() },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().result.data.user.email).toBe(CREDENTIALS.email);
  });

  test('мутация без CSRF-токена отклоняется', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/trpc/snippets.createSnippet',
      headers: { cookie: cookieHeader() },
      payload: { name: 'no-csrf', code: 'x', language: 'javascript' },
    });

    expect(response.statusCode).toBe(403);
  });

  test('мутация с CSRF-токеном проходит и присваивает владельца по сессии', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/trpc/snippets.createSnippet',
      headers: { cookie: cookieHeader(), 'csrf-token': csrfToken },
      payload: { name: 'with-csrf', code: 'x', language: 'javascript' },
    });

    expect(response.statusCode).toBe(200);
    const snippet = response.json().result.data;
    expect(snippet.userId).toBe(1);
    // По умолчанию приватный: публикация — осознанное действие автора.
    expect(snippet.visibility).toBe('private');
  });

  test('гость получает UNAUTHORIZED, а не ошибку CSRF', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/trpc/snippets.createSnippet',
      payload: { name: 'guest', code: 'x', language: 'javascript' },
    });

    expect(response.json().error.data.code).toBe('UNAUTHORIZED');
  });

  test('неверный пароль не отличается по ответу от неизвестного email', async () => {
    const wrongPassword = await app.inject({
      method: 'POST',
      url: '/trpc/auth.login',
      payload: { email: CREDENTIALS.email, password: 'definitely-wrong' },
    });

    const unknownEmail = await app.inject({
      method: 'POST',
      url: '/trpc/auth.login',
      payload: { email: 'nobody@example.com', password: 'definitely-wrong' },
    });

    expect(wrongPassword.json().error.message).toBe(
      unknownEmail.json().error.message,
    );
    expect(wrongPassword.statusCode).toBe(unknownEmail.statusCode);
  });

  test('повторная регистрация на тот же email — конфликт, а не 500', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/trpc/auth.register',
      payload: { ...CREDENTIALS, username: 'othername' },
    });

    expect(response.json().error.data.code).toBe('CONFLICT');
  });

  test('регистрация на занятое имя — тоже конфликт', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/trpc/auth.register',
      payload: { ...CREDENTIALS, email: 'other@example.com' },
    });

    expect(response.json().error.data.code).toBe('CONFLICT');
  });

  test('смена пароля обесценивает старый', async () => {
    const changed = await app.inject({
      method: 'POST',
      url: '/trpc/auth.changePassword',
      headers: { cookie: cookieHeader(), 'csrf-token': csrfToken },
      payload: {
        currentPassword: CREDENTIALS.password,
        newPassword: NEW_PASSWORD,
      },
    });

    expect(changed.statusCode).toBe(200);
    rememberCookies(changed);
    csrfToken = changed.json().result.data.csrfToken;

    const withOld = await app.inject({
      method: 'POST',
      url: '/trpc/auth.login',
      payload: { email: CREDENTIALS.email, password: CREDENTIALS.password },
    });
    expect(withOld.json().error.data.code).toBe('UNAUTHORIZED');

    const withNew = await app.inject({
      method: 'POST',
      url: '/trpc/auth.login',
      payload: { email: CREDENTIALS.email, password: NEW_PASSWORD },
    });
    expect(withNew.statusCode).toBe(200);
    rememberCookies(withNew);
    csrfToken = withNew.json().result.data.csrfToken;
  });

  test('logout гасит сессию: auth.me перестаёт отвечать', async () => {
    const loggedOut = await app.inject({
      method: 'POST',
      url: '/trpc/auth.logout',
      headers: {
        cookie: cookieHeader(),
        'csrf-token': csrfToken,
        // У процедуры нет входных данных, но tRPC требует content-type на POST.
        'content-type': 'application/json',
      },
      payload: {},
    });
    expect(loggedOut.statusCode).toBe(200);
    rememberCookies(loggedOut);

    const after = await app.inject({
      method: 'GET',
      url: '/trpc/auth.me',
      headers: { cookie: cookieHeader() },
    });
    expect(after.json().error.data.code).toBe('UNAUTHORIZED');
  });
});
