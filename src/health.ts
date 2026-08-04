import { sql } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { db } from './db/connection';

/**
 * Health-check для оркестратора и аптайм-мониторинга (#896).
 *
 * Проверяет не только «процесс жив», но и доступность БД: приложение без базы
 * бесполезно, и балансировщик должен убрать такой инстанс из ротации.
 *
 * 200 — всё в порядке, 503 — БД недоступна.
 */
export function registerHealthRoute(server: FastifyInstance): void {
  server.get('/health', async (_request, reply) => {
    const startedAt = performance.now();
    try {
      db.get(sql`select 1`);
      return reply.send({
        status: 'ok',
        db: 'ok',
        uptimeSec: Math.round(process.uptime()),
        checkMs: Math.round(performance.now() - startedAt),
      });
    } catch (error) {
      server.log.error({ err: error }, 'health check: база недоступна');
      // Наружу не отдаём детали ошибки БД (в них бывают пути и параметры).
      return reply.code(503).send({ status: 'error', db: 'unavailable' });
    }
  });
}
