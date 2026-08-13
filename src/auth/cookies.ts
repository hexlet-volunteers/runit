import type { CookieSerializeOptions } from '@fastify/cookie';
import type { FastifyReply } from 'fastify';
import { env } from '../config/env';
import { REFRESH_TOKEN_TTL_MS } from './jwt';

const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;

const baseCookieOptions: CookieSerializeOptions = {
  httpOnly: true,
  // См. COOKIE_SECURE в config/env.ts: по умолчанию включено в production,
  // отключается только для запуска без TLS.
  secure: env.COOKIE_SECURE,
  sameSite: 'lax',
  path: '/',
};

export function setAuthCookies(
  reply: FastifyReply,
  accessToken: string,
  refreshToken: string,
): void {
  reply.setCookie('accessToken', accessToken, {
    ...baseCookieOptions,
    maxAge: ACCESS_TOKEN_TTL_MS / 1000,
  });

  reply.setCookie('refreshToken', refreshToken, {
    ...baseCookieOptions,
    maxAge: REFRESH_TOKEN_TTL_MS / 1000,
  });
}

export function clearAuthCookies(reply: FastifyReply): void {
  reply.clearCookie('accessToken', baseCookieOptions);
  reply.clearCookie('refreshToken', baseCookieOptions);
}
