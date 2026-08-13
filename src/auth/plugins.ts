import fastifyCookie from '@fastify/cookie';
import fastifyCsrf from '@fastify/csrf-protection';
import fastifyJwt from '@fastify/jwt';
import type { FastifyInstance } from 'fastify';
import { env } from '../config/env';

export async function registerAuthPlugins(
  server: FastifyInstance,
): Promise<void> {
  await server.register(fastifyCookie);

  await server.register(fastifyJwt, {
    namespace: 'access',
    secret: env.JWT_ACCESS_SECRET,
    cookie: { cookieName: 'accessToken', signed: false },
  });

  await server.register(fastifyJwt, {
    namespace: 'refresh',
    secret: env.JWT_REFRESH_SECRET,
    cookie: { cookieName: 'refreshToken', signed: false },
  });

  // Double-submit cookie: генерируем токен в auth.login/auth.register (см.
  // authRouter.ts), клиент присылает его обратно в заголовке csrf-token или
  // x-csrf-token. Нужен, поскольку и access, и refresh JWT лежат в cookie —
  // браузер отправит их сам при кросс-сайтовом запросе, если не проверять токен.
  await server.register(fastifyCsrf, {
    cookieOpts: {
      // httpOnly не нужен: здесь лежит секрет для проверки токена, а сам токен
      // клиент получает из ответа auth.* и хранит в памяти вкладки.
      httpOnly: true,
      secure: env.COOKIE_SECURE,
      sameSite: 'lax',
      path: '/',
    },
  });
}
