import { randomUUID } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import type { FastifyReply } from 'fastify';
import { z } from 'zod/v4';
import { isLockedOut, secondsUntilUnlock } from '../auth/bruteforce';
import { isAcceptedConsentVersion } from '../auth/consent';
import { clearAuthCookies, setAuthCookies } from '../auth/cookies';
import { emailSchema } from '../auth/email';
import {
  REFRESH_TOKEN_TTL_MS,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../auth/jwt';
import {
  hashPassword,
  isPasswordReused,
  PASSWORD_HISTORY_LIMIT,
  validatePasswordPolicy,
  verifyPassword,
} from '../auth/password';
import { toPublicUser } from '../auth/publicUser';
import { protectedProcedure, publicProcedure, router } from '../context';
import {
  addPasswordHistoryEntry,
  findActiveRefreshToken,
  getLoginAttempt,
  getRecentPasswordHashes,
  getUserByEmailWithCredentials,
  getUserByIdWithCredentials,
  recordFailedLoginAttempt,
  resetLoginAttempts,
  revokeAllRefreshTokensForUser,
  revokeRefreshToken,
  storeRefreshToken,
} from '../db/auth';
import { createUser, updateUserPasswordHash } from '../db/users';

const registerInputSchema = z.object({
  username: z.string().min(3).max(20),
  email: emailSchema,
  password: z.string(),
  /**
   * Версия согласия на обработку персональных данных, которую видел
   * пользователь (#866). Обязательна: регистрация без согласия означала бы
   * обработку данных без правового основания.
   */
  consentVersion: z.string().min(1).max(20),
});

const loginInputSchema = z.object({
  email: emailSchema,
  password: z.string(),
});

const changePasswordInputSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string(),
});

async function issueSession(
  reply: FastifyReply,
  user: { id: number; isAdmin: boolean },
): Promise<string> {
  const accessToken = signAccessToken(reply.server, {
    sub: user.id,
    isAdmin: user.isAdmin,
  });

  const refreshToken = signRefreshToken(reply.server, {
    sub: user.id,
    jti: randomUUID(),
  });

  await storeRefreshToken(
    user.id,
    refreshToken,
    new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  );

  setAuthCookies(reply, accessToken, refreshToken);

  // Double-submit CSRF-токен (см. security.ts) — фронт кладёт его в заголовок
  // csrf-token на всех mutation-запросах, кроме этого набора auth-эндпоинтов.
  return reply.generateCsrf();
}

export const authRouter = router({
  register: publicProcedure
    .input(registerInputSchema)
    .mutation(async ({ input, ctx }) => {
      /**
       * Версия согласия проверяется по списку известных серверу: иначе в записи
       * о согласии попадёт произвольная строка от клиента, и она перестанет
       * что-либо подтверждать. Несовпадение означает открытую вкладку со старой
       * версией документа — пользователю нужно перечитать актуальную редакцию.
       */
      if (!isAcceptedConsentVersion(input.consentVersion)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'Текст согласия на обработку персональных данных обновился — обновите страницу и ознакомьтесь с новой редакцией',
        });
      }

      const passwordCheck = validatePasswordPolicy(input.password);
      if (!passwordCheck.ok) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: passwordCheck.errors.join(', '),
        });
      }

      const existingByEmail = await getUserByEmailWithCredentials(input.email);
      if (existingByEmail) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Этот email уже занят',
        });
      }

      const passwordHash = await hashPassword(input.password);

      let user: Awaited<ReturnType<typeof createUser>>;
      try {
        user = await createUser({
          username: input.username,
          email: input.email,
          password: passwordHash,
          consentVersion: input.consentVersion,
        });
      } catch (error) {
        /**
         * Занятое имя ловится здесь, а не отдельным запросом «есть ли такой
         * username»: между проверкой и вставкой успевает вклиниться другая
         * регистрация, а UNIQUE в схеме — единственная надёжная защита.
         * Без этой ветки конфликт уезжал наружу как 500, и форма показывала
         * пользователю «внутренняя ошибка» вместо «имя занято».
         */
        const message = error instanceof Error ? error.message : '';
        if (message.includes('already exists')) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: message.includes('Username')
              ? 'Это имя уже занято'
              : 'Этот email уже занят',
          });
        }
        throw error;
      }

      await addPasswordHistoryEntry(user.id, passwordHash);
      const csrfToken = await issueSession(ctx.res, user);

      return { user: toPublicUser(user), csrfToken };
    }),

  /**
   * Анти-брутфорс на вход (#858) — счётчик неудач по email (см.
   * src/auth/bruteforce.ts). Лимит по IP из security.ts не останавливает
   * перебор пароля одного аккаунта с разных адресов; этот счётчик — нет.
   *
   * Блокировка проверяется до обращения к паролю: заблокированный email не
   * должен получать никакой информации о том, существует ли пользователь и
   * верен ли пароль — реагирует только на превышение попыток.
   */
  login: publicProcedure
    .input(loginInputSchema)
    .mutation(async ({ input, ctx }) => {
      const genericError = new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Неверный email или пароль',
      });

      const attempt = await getLoginAttempt(input.email);
      if (isLockedOut(attempt)) {
        ctx.req.log.warn(
          { email: input.email, ip: ctx.req.ip },
          'login lockout: слишком много неудачных попыток',
        );
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: `Слишком много попыток входа. Попробуйте через ${secondsUntilUnlock(attempt)} с.`,
        });
      }

      const user = await getUserByEmailWithCredentials(input.email);
      if (!user) {
        await recordFailedLoginAttempt(input.email);
        throw genericError;
      }

      const passwordMatches = await verifyPassword(
        input.password,
        user.password,
      );
      if (!passwordMatches) {
        await recordFailedLoginAttempt(input.email);
        throw genericError;
      }

      await resetLoginAttempts(input.email);
      const csrfToken = await issueSession(ctx.res, user);

      return { user: toPublicUser(user), csrfToken };
    }),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    const refreshToken = ctx.req.cookies?.refreshToken;
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    clearAuthCookies(ctx.res);

    return { success: true };
  }),

  refresh: publicProcedure.mutation(async ({ ctx }) => {
    const refreshToken = ctx.req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    let payload: ReturnType<typeof verifyRefreshToken>;
    try {
      payload = verifyRefreshToken(ctx.req.server, refreshToken);
    } catch {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    const activeRecord = await findActiveRefreshToken(refreshToken);
    if (!activeRecord) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    const user = await getUserByIdWithCredentials(payload.sub);
    if (!user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    await revokeRefreshToken(refreshToken);
    const csrfToken = await issueSession(ctx.res, user);

    return { success: true, csrfToken };
  }),

  /**
   * Смена пароля из настроек (#770).
   *
   * Текущий пароль спрашиваем даже при живой сессии: иначе угнанная вкладка
   * или XSS дают злоумышленнику сменить пароль и отобрать аккаунт целиком.
   * После смены все сессии, кроме текущей, гасим — старый пароль перестаёт
   * давать доступ, в том числе тому, кто уже вошёл с ним раньше.
   */
  changePassword: protectedProcedure
    .input(changePasswordInputSchema)
    .mutation(async ({ input, ctx }) => {
      const user = await getUserByIdWithCredentials(ctx.user.id);
      if (!user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      const currentMatches = await verifyPassword(
        input.currentPassword,
        user.password,
      );
      if (!currentMatches) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Текущий пароль неверен',
        });
      }

      const passwordCheck = validatePasswordPolicy(input.newPassword);
      if (!passwordCheck.ok) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: passwordCheck.errors.join(', '),
        });
      }

      const previousHashes = await getRecentPasswordHashes(
        ctx.user.id,
        PASSWORD_HISTORY_LIMIT,
      );
      if (await isPasswordReused(input.newPassword, previousHashes)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Этот пароль уже использовался — выберите другой',
        });
      }

      const passwordHash = await hashPassword(input.newPassword);
      await updateUserPasswordHash(ctx.user.id, passwordHash);
      await addPasswordHistoryEntry(ctx.user.id, passwordHash);

      // Сначала гасим всё, затем выдаём новую сессию — иначе свежий токен
      // текущего клиента попал бы под тот же сброс.
      await revokeAllRefreshTokensForUser(ctx.user.id);
      const csrfToken = await issueSession(ctx.res, user);

      return { success: true, csrfToken };
    }),

  /**
   * Свежий CSRF-токен для уже существующей сессии.
   *
   * Нужен из-за перезагрузки страницы: сессия живёт в cookie и переживает
   * перезагрузку, а токен — нет. Он намеренно хранится в памяти вкладки (а не в
   * localStorage, иначе его прочитал бы любой скрипт), и после F5 у клиента
   * оказывалась рабочая сессия без токена — первая же мутация получала 403.
   *
   * Вывести токен из cookie на клиенте нельзя: в cookie лежит секрет, а токен
   * — производная от него, и считает её только сервер.
   *
   * Это query (GET), поэтому сама она под проверку CSRF не попадает; выдавать
   * токен безопасно — прочитать ответ с чужого origin мешает CORS, а без
   * cookie сессии токен ничего не открывает.
   */
  csrfToken: protectedProcedure.query(async ({ ctx }) => {
    return { csrfToken: await ctx.res.generateCsrf() };
  }),

  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await getUserByIdWithCredentials(ctx.user.id);
    if (!user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    return { user: toPublicUser(user) };
  }),
});
