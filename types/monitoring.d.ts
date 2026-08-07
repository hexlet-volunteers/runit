import type { FastifyInstance } from 'fastify';
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
export declare function reportError(error: unknown, context?: ErrorContext): void;
export declare function registerMonitoring(server: FastifyInstance): void;
