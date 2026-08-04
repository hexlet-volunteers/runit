import type { FastifyInstance } from 'fastify';
/**
 * Health-check для оркестратора и аптайм-мониторинга (#896).
 *
 * Проверяет не только «процесс жив», но и доступность БД: приложение без базы
 * бесполезно, и балансировщик должен убрать такой инстанс из ротации.
 *
 * 200 — всё в порядке, 503 — БД недоступна.
 */
export declare function registerHealthRoute(server: FastifyInstance): void;
