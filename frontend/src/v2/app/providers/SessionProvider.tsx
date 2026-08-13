import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { setCsrfToken, useTRPCClient } from '../../shared/api';
import {
  SessionContext,
  fetchCsrfToken,
  login as loginRequest,
  logout as logoutRequest,
  me as meRequest,
  register as registerRequest,
} from '../../entities/user';
import type { SessionUser } from '../../entities/user';

/**
 * Сессия на основе httpOnly-cookie (#639, #898).
 *
 * Раньше здесь была мок-сессия: login не проверял пароль вообще (искал
 * пользователя по email), а «сессия» лежала в localStorage — то есть любой мог
 * войти под любым аккаунтом, зная только адрес почты, и подделать её правкой
 * localStorage.
 *
 * Теперь состояние входа целиком на сервере: cookie с JWT недоступны из JS, а
 * восстановление сессии — это запрос auth.me при старте приложения. В памяти
 * держим только отображаемые поля пользователя.
 */

export function SessionProvider({ children }: { children: ReactNode }) {
  const trpc = useTRPCClient();
  const [user, setUser] = useState<SessionUser | null>(null);
  /**
   * До ответа auth.me неизвестно, вошёл ли пользователь. Страницы, закрытые от
   * гостей, обязаны дождаться этого флага: иначе перезагрузка /dashboard
   * выбрасывала бы вошедшего на лендинг, потому что в первом кадре user ещё null.
   */
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    meRequest(trpc)
      .then((result) => {
        if (cancelled) return;
        setUser(result.user);

        /**
         * Токен, выданный при входе, не переживает перезагрузку страницы —
         * берём новый для восстановленной сессии, иначе первая же мутация
         * упрётся в проверку CSRF.
         *
         * Отдельная цепочка, а не await внутри этого then: иначе сбой запроса
         * токена попадал бы в общий catch и сбрасывал пользователя в гостя —
         * то есть временная ошибка сети выглядела бы как разлогин.
         */
        fetchCsrfToken(trpc)
          .then((token) => {
            if (!cancelled) setCsrfToken(token);
          })
          .catch(() => {
            // Мутации ответят 403, пользователь увидит ошибку и повторит —
            // это лучше, чем выкинуть его из аккаунта.
          });
      })
      .catch(() => {
        // UNAUTHORIZED — обычное состояние гостя, не ошибка.
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [trpc]);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await loginRequest(trpc, email, password);
      setCsrfToken(result.csrfToken);
      setUser(result.user);
      return result.user;
    },
    [trpc],
  );

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      const result = await registerRequest(trpc, {
        username,
        email,
        password,
      });
      setCsrfToken(result.csrfToken);
      setUser(result.user);
      return result.user;
    },
    [trpc],
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest(trpc);
    } finally {
      // Локальное состояние чистим даже если запрос не дошёл: иначе интерфейс
      // остаётся «вошедшим», хотя пользователь нажал «Выйти».
      setCsrfToken(null);
      setUser(null);
    }
  }, [trpc]);

  const value = useMemo(
    () => ({ user, isGuest: !user, isLoading, login, register, logout }),
    [user, isLoading, login, register, logout],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}
