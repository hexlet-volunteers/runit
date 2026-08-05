import {
  type FastifyTRPCPluginOptions,
  fastifyTRPCPlugin,
} from '@trpc/server/adapters/fastify';
import { fastify } from 'fastify';

import { runMigrations } from './db/connection';
import { seedHomePageData } from './db/seedHomePageData';
import { registerHealthRoute } from './health';
import { registerOembedRoutes } from './oembed';
import { type AppRouter, appRouter } from './router/index';
import { runnerConfig } from './runner/config';
import { sweepOrphans } from './runner/run';
import { registerSecurity } from './security';

// import { createContext } from './context';

const getApp = async () => {
  try {
    await runMigrations();
    await seedHomePageData();
  } catch (error) {
    console.error('Migration/Seeding failed:', error);
    throw error;
  }

  // to do: подключить полноценное логирование (pino-pretty)

  const server = fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
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
        // createContext,
        onError({ path, error }) {
          console.error(`❌ tRPC Error on path '${path}':`, error.message);
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
