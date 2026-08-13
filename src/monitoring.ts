import type { FastifyError, FastifyInstance, FastifyRequest } from 'fastify';

/**
 * Единая точка сообщения об ошибках бэкенда (#896).
 *
 * Раньше ошибки уходили в `console.error` и терялись: без уровня, без пути
 * запроса, без идентификатора — по такому логу нельзя ни найти запрос
 * пользователя, ни понять, повторяется ли сбой. Плюс наружу мог утечь стек.
 *
 * Здесь три вещи:
 *  1. `reportError` — один вызов на все места, пишет структурно через pino;
 *  2. обработчик ошибок Fastify: клиенту — короткое сообщение, в лог — детали;
 *  3. перехват необработанных исключений, чтобы процесс не умирал молча.
 *
 * Внешний сервис (Sentry) подключается здесь же: см. TODO ниже — нужен
 * `@sentry/node`, добавление пакета отдельным шагом, чтобы не тащить его в
 * зависимости без готовности принимать DSN в проде.
 */

export interface ErrorContext {
  /** Где произошло: путь tRPC-процедуры или маршрут Fastify. */
  where?: string;
  /** Идентификатор запроса Fastify — по нему в логе находится вся история. */
  requestId?: string;
  [key: string]: unknown;
}

let logger: FastifyInstance['log'] | null = null;

export function reportError(error: unknown, context: ErrorContext = {}): void {
  const err = error instanceof Error ? error : new Error(String(error));

  // TODO(#896): при заданном SENTRY_DSN отправлять событие во внешний сервис.
  // Требует пакета @sentry/node; до его добавления ошибки видны только в логах,
  // то есть о сбое мы узнаём при просмотре логов, а не уведомлением.
  //
  // При подключении — только self-hosted экземпляр в РФ: отчёты содержат
  // IP-адреса и параметры запросов, а хранение персональных данных граждан РФ
  // в базах за пределами страны не допускается (152-ФЗ, ст. 18 ч. 5).

  if (logger) {
    logger.error({ err, ...context }, err.message);
    return;
  }
  // До создания сервера логгера ещё нет — но терять ошибку нельзя.
  console.error('[error]', err.message, context, err.stack);
}

export function registerMonitoring(server: FastifyInstance): void {
  logger = server.log;

  server.setErrorHandler(
    (error: FastifyError, request: FastifyRequest, reply) => {
      reportError(error, {
        where: request.url,
        requestId: request.id,
        method: request.method,
      });

      // Валидацию и прочие клиентские ошибки отдаём как есть: пользователю
      // важно знать, что не так с запросом.
      const status = error.statusCode ?? 500;
      if (status < 500) {
        return reply.code(status).send({
          statusCode: status,
          error: error.name,
          message: error.message,
        });
      }

      // Серверные детали наружу не отдаём: в стеке пути и внутренние имена.
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Внутренняя ошибка сервера. Попробуйте позже.',
        requestId: request.id,
      });
    },
  );

  // Без этих обработчиков падение в асинхронном коде убивает процесс без записи
  // в лог — в проде это выглядит как «сервис молча перезапустился».
  process.on('unhandledRejection', (reason) => {
    reportError(reason, { where: 'unhandledRejection' });
  });
  process.on('uncaughtException', (error) => {
    reportError(error, { where: 'uncaughtException' });
    // Состояние процесса после такого исключения не гарантировано: логируем и
    // выходим, дальше оркестратор поднимет свежий инстанс.
    process.exit(1);
  });
}
