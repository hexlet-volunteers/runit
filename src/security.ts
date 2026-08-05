import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance, FastifyRequest } from 'fastify';

/**
 * Заголовки безопасности (#856) и ограничение частоты запросов (#858).
 *
 * Контекст, который определяет настройки: сниппеты Runit встраиваются в чужие
 * страницы (уроки, статьи), а каждый клик «Выполнить» у читателя — это
 * исполнение кода на нашем сервере. Значит нельзя ни запрещать фрейминг всему
 * подряд, ни оставлять запуск кода без лимита.
 */

/** Лимиты подобраны так, чтобы не мешать человеку, но гасить автоматический абьюз. */
const LIMITS = {
  /** Запуск кода: дороже всего, поэтому строже всего. */
  runnerPerMinute: num(process.env.RATE_LIMIT_RUNNER, 12),
  /** Остальные процедуры: обычная работа в редакторе создаёт десятки запросов. */
  apiPerMinute: num(process.env.RATE_LIMIT_API, 300),
  /** oEmbed запрашивают площадки, ответ кэшируется на 5 минут. */
  oembedPerMinute: num(process.env.RATE_LIMIT_OEMBED, 60),
};

function num(raw: string | undefined, fallback: number): number {
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const isRunnerRun = (url: string): boolean =>
  url.startsWith('/trpc/runner.run');
const isOembed = (url: string): boolean => url.startsWith('/oembed');

export async function registerSecurity(server: FastifyInstance): Promise<void> {
  await server.register(helmet, {
    // Fastify отдаёт API и служебный HTML (/s/:code/meta). Страницы приложения и
    // embed-виджет раздаёт Caddy — их заголовки заданы в frontend/Caddyfile.docker,
    // иначе встраивание сломалось бы политикой фрейминга.
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        // В /s/:code/meta нет скриптов и стилей — только текст и ссылка.
        baseUri: ["'self'"],
        formAction: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    // Клиенту незачем знать, чем мы отвечаем.
    hidePoweredBy: true,
    // HSTS включаем только в проде: в разработке ходим по http.
    strictTransportSecurity:
      process.env.NODE_ENV === 'production'
        ? { maxAge: 15_552_000, includeSubDomains: true }
        : false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    // Ответы API — не документы, поэтому фрейминг API запрещаем целиком.
    xFrameOptions: { action: 'deny' },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    // Виджет живёт в iframe на чужом домене, а COEP ломает такие вложения.
    crossOriginEmbedderPolicy: false,
  });

  await server.register(rateLimit, {
    global: true,
    // Разные лимиты по маршрутам: tRPC ходит одним путём /trpc/<процедура>,
    // поэтому имя процедуры видно в URL и отдельный контекст не нужен.
    max: (request: FastifyRequest) => {
      const url = request.url;
      if (isRunnerRun(url)) return LIMITS.runnerPerMinute;
      if (isOembed(url)) return LIMITS.oembedPerMinute;
      return LIMITS.apiPerMinute;
    },
    timeWindow: '1 minute',
    // Health-check не должен получать 429: иначе оркестратор решит, что
    // приложение умерло, и начнёт перезапускать живой инстанс.
    allowList: (request: FastifyRequest) => request.url.startsWith('/health'),
    // За прокси реальный адрес приходит в заголовке.
    keyGenerator: (request: FastifyRequest) => {
      const forwarded = String(request.headers['x-forwarded-for'] ?? '');
      return forwarded.split(',')[0].trim() || request.ip;
    },
    errorResponseBuilder: (_request, context) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Слишком много запросов. Попробуйте через ${Math.ceil(context.ttl / 1000)} с.`,
    }),
  });
}
