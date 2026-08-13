import { setCsrfToken } from './csrf';

/**
 * Продление сессии при истёкшем access-токене (#628).
 *
 * Access-токен живёт 15 минут, refresh — 30 дней. Процедура `auth.refresh`
 * на бэкенде есть, но её никто не вызывал: через 15 минут работы запросы
 * начинали отвечать 401, интерфейс показывал ошибки, а пользователь выглядел
 * разлогиненным, хотя его сессия действительна ещё месяц. Именно поэтому
 * refresh-токен и живёт долго — чтобы короткий access молча продлевался.
 *
 * Обёртка над fetch, а не отдельный tRPC-link: она работает и для батч-запросов,
 * и для одиночных, и не зависит от версии @trpc/client.
 *
 * Устройство:
 *  * получили 401 — один раз пробуем `auth.refresh` и повторяем исходный запрос;
 *  * refresh не удался — отдаём исходный 401, вызывающий покажет «нужно войти»;
 *  * параллельные запросы, упавшие одновременно, ждут один и тот же refresh:
 *    иначе десяток запросов на странице выпустил бы десяток ротаций
 *    refresh-токена, и все, кроме одной, оказались бы отозванными.
 */

/** Незавершённый refresh — чтобы одновременные 401 не плодили ротации. */
let inFlight: Promise<boolean> | null = null;

const requestRefresh = async (): Promise<boolean> => {
  try {
    const response = await fetch('/trpc/auth.refresh', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });

    if (!response.ok) return false;

    const payload = (await response.json()) as {
      result?: { data?: { csrfToken?: string } };
    };
    const csrfToken = payload.result?.data?.csrfToken;
    // Вместе с сессией сервер выдаёт новый CSRF-токен — без него следующая
        // мутация получит 403.
    if (csrfToken) setCsrfToken(csrfToken);

    return true;
  } catch {
    return false;
  }
};

const refreshOnce = (): Promise<boolean> => {
  if (!inFlight) {
    inFlight = requestRefresh().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
};

/** Не пытаемся продлевать сессию на самих auth-запросах — получилась бы петля. */
const isAuthCall = (url: string): boolean =>
  url.includes('/trpc/auth.refresh') ||
  url.includes('/trpc/auth.login') ||
  url.includes('/trpc/auth.register') ||
  url.includes('/trpc/auth.me');

export const fetchWithRefresh: typeof fetch = async (input, init) => {
  const request = () =>
    fetch(input, { ...init, credentials: 'include' as RequestCredentials });

  const response = await request();

  const url = typeof input === 'string' ? input : String((input as Request).url ?? input);
  if (response.status !== 401 || isAuthCall(url)) {
    return response;
  }

  const refreshed = await refreshOnce();
  if (!refreshed) {
    return response;
  }

  return request();
};
