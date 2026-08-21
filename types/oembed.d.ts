import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
export declare function registerOembedRoutes(server: FastifyInstance): void;
/**
 * HTML с метатегами вынесен из registerOembedRoutes отдельным обработчиком,
 * потому что у него два входа. Явный путь `/s/:code/meta` нужен площадкам,
 * которые пришли по ссылке из oEmbed-discovery. Но мессенджер приходит по
 * обычной ссылке `/s/:code` и метатеги должен получить там же — в
 * docker-схеме этот случай закрывает Caddy внутренней перезаписью пути
 * (`rewrite * /s/{code}/meta`), а на PaaS фронтенд раздаёт сам Fastify, и
 * перезаписывать некому: `staticSite.ts` вызывает этот обработчик напрямую.
 *
 * Ответ собирается тут, а не редиректом на `/s/:code/meta`: часть ботов
 * редиректы не проходит, а те, что проходят, показали бы в превью служебный
 * адрес вместо ссылки, которой поделился человек.
 */
export declare const snippetMetaHandler: (request: FastifyRequest, reply: FastifyReply) => Promise<never>;
