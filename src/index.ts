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
import { registerMonitoring, reportError, sanitizeUrl } from './monitoring';
import { registerOembedRoutes } from './oembed';
import { type AppRouter, appRouter } from './router/index';
import { runnerConfig } from './runner/config';
import { prefetchImages } from './runner/images';
import { sweepOrphans } from './runner/run';
import { registerSecurity } from './security';

const getApp = async () => {
  try {
    await runMigrations();
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }

  const server = fastify({
    logger: {
      level: env.LOG_LEVEL,
      /**
       * Из лога запросов убрана строка запроса: tRPC кладёт в неё входные
       * данные процедуры, то есть в журнал попадали адреса почты, код сниппетов
       * и поисковые строки. Имя процедуры остаётся в пути — для разбора сбоя
       * этого достаточно.
       */
      serializers: {
        req(request) {
          return {
            method: request.method,
            url: sanitizeUrl(request.url),
            remoteAddress: request.ip,
          };
        },
      },
    },
    /**
     * Сколько прокси перед приложением считать доверенными (#858).
     *
     * Без этого fastify не разбирает X-Forwarded-For, а лимитер брал заголовок
     * напрямую — и обходился подстановкой любого значения. Теперь адрес
     * клиента определяет fastify по числу доверенных хопов: 0 (по умолчанию) —
     * только адрес сокета, подделать нельзя.
     */
    trustProxy: env.TRUST_PROXY_HOPS > 0 ? env.TRUST_PROXY_HOPS : false,
    routerOptions: {
      maxParamLength: 1000,
      caseSensitive: false,
      ignoreTrailingSlash: true,
    },
  });

  /*
   * Отладочных роутов здесь нет намеренно.
   *
   * Были два: `/` печатал страницу «WELCOME» со списком ВСЕХ процедур tRPC —
   * готовую карту API для того, кто ищет, что можно позвать, — и `/hello`,
   * отвечавший «Hello world». Ни один из них ничего не проверял: живость
   * приложения показывает /health (он же в HEALTHCHECK образа), а страницы
   * отдаёт фронтенд.
   */

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
    /**
     * Образы раннера должны быть на хосте до первого запуска: в обработчике
     * запроса мы их не тянем никогда (иначе первый же сниппет ждал бы
     * многоминутного скачивания). Локально их собирают, в проде — скачивают из
     * реестра, и делать это некому: раньше на новом стенде девять языков из
     * двенадцати отвечали «недоступно» при зелёном деплое.
     *
     * В фоне и без await: старт сервера ждать сети не должен, а итог попадает
     * в лог.
     */
    prefetchImages((message) => server.log.info(message));
  }

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
