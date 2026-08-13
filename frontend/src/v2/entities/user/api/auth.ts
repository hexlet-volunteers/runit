import type { TrpcClient } from '../../../shared/api';
import type { SessionUser } from '../types';

/**
 * Обёртки над auth.* (#639, #898).
 *
 * Пароль уходит на сервер и там сверяется с bcrypt-хешем; на клиенте его не
 * остаётся. Сессия — в httpOnly-cookie, поэтому здесь нет ни токенов, ни
 * записи в localStorage: единственный источник правды о входе — auth.me.
 */

/**
 * Приводит ответ сервера к SessionUser.
 *
 * После сериализации tRPC объявляет поля пользователя необязательными (Date
 * становится строкой, объект — «мягким»), поэтому сужение нужно ровно один раз
 * и здесь, а не кастом в каждом вызывающем месте. Отсутствие обязательного поля
 * — это сломанный контракт, и падать лучше на входе, чем позже с невнятным
 * `undefined` в интерфейсе.
 */
const toSessionUser = (user: {
  id?: number;
  username?: string;
  email?: string;
}): SessionUser => {
  if (user.id == null || !user.username || !user.email) {
    throw new Error('Сервер вернул сессию без обязательных полей пользователя');
  }

  return { id: user.id, username: user.username, email: user.email };
};

export const login = async (
  trpc: TrpcClient,
  email: string,
  password: string,
) => {
  const result = await trpc.auth.login.mutate({ email, password });
  return { user: toSessionUser(result.user), csrfToken: result.csrfToken };
};

export const register = async (
  trpc: TrpcClient,
  params: { username: string; email: string; password: string },
) => {
  const result = await trpc.auth.register.mutate(params);
  return { user: toSessionUser(result.user), csrfToken: result.csrfToken };
};

export const logout = (trpc: TrpcClient) => trpc.auth.logout.mutate();

export const me = async (trpc: TrpcClient) => {
  const result = await trpc.auth.me.query();
  return { user: toSessionUser(result.user) };
};

/**
 * Токен для сессии, восстановленной из cookie. Запрашивается при старте
 * приложения: после перезагрузки страницы токен, выданный при входе, потерян
 * вместе с памятью вкладки, а мутации без него отвечают 403.
 */
export const fetchCsrfToken = async (trpc: TrpcClient) => {
  const result = await trpc.auth.csrfToken.query();
  return result.csrfToken;
};

export const changePassword = (
  trpc: TrpcClient,
  params: { currentPassword: string; newPassword: string },
) => trpc.auth.changePassword.mutate(params);
