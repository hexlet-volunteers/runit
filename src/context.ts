import { initTRPC, TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { ZodError } from 'zod/v4';
import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import { verifyAccessToken } from './auth/jwt';
import { db } from './db/connection';
import { users } from './db/schema/schema';

export interface AuthenticatedUser {
  id: number;
  isAdmin: boolean;
}

export interface Context {
  req: CreateFastifyContextOptions['req'];
  res: CreateFastifyContextOptions['res'];
  user: AuthenticatedUser | null;
}

export const createContext = ({
  req,
  res,
}: CreateFastifyContextOptions): Context => {
  const token = req.cookies?.accessToken;

  if (!token) {
    return { req, res, user: null };
  }

  try {
    const payload = verifyAccessToken(req.server, token);
    return { req, res, user: { id: payload.sub, isAdmin: payload.isAdmin } };
  } catch {
    return { req, res, user: null };
  }
};

/**
 * Понятное сообщение вместо служебного текста ошибки.
 *
 * Два случая, которые видел пользователь:
 *
 *  1. Проверка входных данных. tRPC кладёт в message сериализованный ZodError —
 *     клиенту прилетала строка вида
 *     `[{"code":"too_big","maximum":30,"path":["name"],...}]`, и интерфейс
 *     показывал этот JSON как есть.
 *  2. Внутренняя ошибка. Функции БД-слоя бросают свои тексты («Failed to get
 *     snippet by ID»), и они уходили в браузер. Это и невнятно, и лишнее:
 *     наружу не должно попадать ничего о внутреннем устройстве. В логах текст
 *     остаётся — pino пишет исходную ошибку целиком.
 */
const FIELD_LABELS: Record<string, string> = {
  name: 'имя',
  code: 'код',
  slug: 'адрес',
  email: 'почта',
  username: 'логин',
  password: 'пароль',
  newPassword: 'новый пароль',
  currentPassword: 'текущий пароль',
  language: 'язык',
  visibility: 'видимость',
  avatarBase64: 'аватар',
};

const formatZodIssues = (error: ZodError): string =>
  error.issues
    .map((issue) => {
      const path = issue.path.filter(
        (part): part is string => typeof part === 'string',
      );
      const field = path.length > 0 ? path[path.length - 1] : undefined;
      const label = field ? (FIELD_LABELS[field] ?? field) : undefined;
      return label ? `${label}: ${issue.message}` : issue.message;
    })
    .join('; ');

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    if (error.cause instanceof ZodError) {
      return {
        ...shape,
        message: `Некорректные данные — ${formatZodIssues(error.cause)}`,
      };
    }

    if (error.code === 'INTERNAL_SERVER_ERROR') {
      return {
        ...shape,
        message: 'Внутренняя ошибка сервера. Попробуйте позже.',
      };
    }

    return shape;
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

const isAuthenticated = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  return next({ ctx: { ...ctx, user: ctx.user } });
});

/**
 * Права админа проверяются по базе, а не по токену.
 *
 * Признак isAdmin лежит в access-токене, а токен живёт 15 минут и не
 * отзывается. Значит, после снятия роли человек ещё четверть часа проходил бы
 * все админские проверки — включая выборку всех сниппетов и поиск по почте.
 * Разжалование должно действовать сразу, поэтому здесь один дополнительный
 * запрос: админских вызовов мало, а цена ошибки высока.
 *
 * Токен по-прежнему проверяется первым (createContext): без валидной подписи
 * до базы дело не доходит.
 */
const isAdmin = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  const [row] = await db
    .select({ isAdmin: users.isAdmin })
    .from(users)
    .where(eq(users.id, ctx.user.id))
    .limit(1);

  if (!row?.isAdmin) {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }

  return next({ ctx: { ...ctx, user: { ...ctx.user, isAdmin: true } } });
});

export const protectedProcedure = t.procedure.use(isAuthenticated);
export const adminProcedure = t.procedure.use(isAdmin);
