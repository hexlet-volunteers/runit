import {
  type FastifyTRPCPluginOptions,
  fastifyTRPCPlugin,
} from '@trpc/server/adapters/fastify';
import { fastify } from 'fastify';

import { registerAuthPlugins } from './auth/plugins';
import { env } from './config/env';
import { createContext } from './context';
import { runMigrations } from './db/connection';
import { registerHealthRoute } from './health';
import { registerMonitoring, reportError } from './monitoring';
import { registerOembedRoutes } from './oembed';
import { type AppRouter, appRouter } from './router/index';
import { runnerConfig } from './runner/config';
import { sweepOrphans } from './runner/run';
import { registerSecurity } from './security';

const getApp = async () => {
  try {
    await runMigrations();
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }

  // to do: подключить полноценное логирование (pino-pretty)

  const server = fastify({
    logger: {
      level: env.LOG_LEVEL,
    },
    routerOptions: {
      maxParamLength: 1000,
      caseSensitive: false,
      ignoreTrailingSlash: true,
    },
  });

  server.get('/', async (_request, reply) => {
    reply.type('text/html').send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome</title>
      </head>
      <body>
        <h2>WELCOME</h2>
        <p>Available procedures: ${Object.keys(appRouter._def?.procedures || {}).join(', ')}</p>
      </body>
      </html>
    `);
  });

  // Обработчик ошибок — раньше роутов, чтобы ловить сбои во всех из них.
  registerMonitoring(server);

  // cookie/JWT — до tRPC-контекста, которому они нужны для чтения пользователя.
  await registerAuthPlugins(server);

  // Заголовки безопасности и лимиты — до объявления роутов.
  await registerSecurity(server);

  registerHealthRoute(server);
  registerOembedRoutes(server);

  // Уборка контейнеров, переживших аварийное завершение прошлого процесса
  // (деплой, OOM, kill -9). Без этого вызова убитый на середине запуск
  // оставляет контейнер жить и жечь CPU: сам docker его не остановит.
  // Работает в фоне и молча — если docker недоступен, ничего не происходит.
  if (runnerConfig.enabled) {
    sweepOrphans();
  }

  server.get('/hello', async (_request, reply) => {
    reply.type('text/plain').send('Hello world');
  });

  try {
    await server.register(fastifyTRPCPlugin, {
      prefix: '/trpc',
      trpcOptions: {
        router: appRouter,
        createContext,
        onError({ path, error, req }) {
          reportError(error, { where: `trpc:${path}`, requestId: req.id });
        },
      } satisfies FastifyTRPCPluginOptions<AppRouter>['trpcOptions'],
    });
  } catch (error) {
    console.error('❌ Failed to register tRPC plugin:', error);
    throw error;
  }
  return server;
};

export default getApp;
