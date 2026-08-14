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
 *  * refresh не удался — отдаём исходный 401 и сообщаем приложению, что сессии
 *    больше нет (событие SESSION_EXPIRED_EVENT). Без этого сообщения интерфейс
 *    оставался «вошедшим»: в памяти лежал пользователь из auth.me, шапка
 *    показывала аватар и «Мои сниппеты», а каждый запрос отвечал 401 — человек
 *    видел набор ошибок вместо предложения войти заново;
 *  * параллельные запросы, упавшие одновременно, ждут один и тот же refresh:
 *    иначе десяток запросов на странице выпустил бы десяток ротаций
 *    refresh-токена, и все, кроме одной, оказались бы отозванными.
 */

/**
 * Событие «сессия окончательно недействительна»: 401 пришёл, продлить не
 * удалось. Слушает SessionProvider — он единственный владелец состояния входа.
 * Через событие, а не импортом: shared-слой не должен знать про app-слой.
 */
export const SESSION_EXPIRED_EVENT = 'runit:session-expired';

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

/**
 * Запросы, для которых продление не делается.
 *
 * `auth.refresh` — иначе петля. `auth.login` и `auth.register` — там сессии ещё
 * нет, продлевать нечего.
 *
 * `auth.me` в этом списке быть НЕ должен, хотя выглядит похоже. Именно им
 * приложение восстанавливает сессию при загрузке страницы: если access-токен
 * истёк (15 минут), а refresh жив (30 дней), то без продления `me` отвечает 401
 * и интерфейс показывает гостя — пользователь оказывался «разлогинен» после
 * любой паузы в работе, хотя его сессия действительна ещё месяц. Это и было
 * видно в проверке: сессия слетала сама.
 */
const isAuthCall = (url: string): boolean =>
  url.includes('/trpc/auth.refresh') ||
  url.includes('/trpc/auth.login') ||
  url.includes('/trpc/auth.register');

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
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    return response;
  }

  return request();
};
