import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { env } from './config/env';

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
  /**
   * Вход, регистрация и смена пароля: перебор пароля общим лимитом 300/мин не
   * остановить. Порог накрывает весь префикс auth.* — в том числе
   * auth.changePassword, где угадывают текущий пароль.
   *
   * Этого недостаточно против ботнета: лимит по IP обходится распределением
   * запросов. Нужен ещё счётчик неудач на конкретный логин — он опирается на
   * таблицу refresh_tokens и остаётся в #858.
   */
  authPerMinute: num(process.env.RATE_LIMIT_AUTH, 10),
};

function num(raw: string | undefined, fallback: number): number {
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const isRunnerRun = (url: string): boolean =>
  url.startsWith('/trpc/runner.run');
const isOembed = (url: string): boolean => url.startsWith('/oembed');
/**
 * Процедуры, где угадывают пароль: вход, регистрация, смена пароля.
 * users.createUser и users.getUserByEmail оставлены в списке: они стали
 * admin-only, но остаются точками, где перебор имел бы смысл.
 *
 * Список именно перечислен, а не задан префиксом `/trpc/auth.`: под префикс
 * попадали auth.me и auth.csrfToken, которые фронтенд вызывает при каждой
 * загрузке страницы. С лимитом 10/мин пятая перезагрузка (или несколько
 * открытых вкладок) отвечала 429 на восстановление сессии, и приложение
 * показывало вошедшего пользователя гостем. Эти процедуры требуют живой
 * сессии, подбирать в них нечего — им хватает общего лимита.
 */
const isAuth = (url: string): boolean =>
  url.startsWith('/trpc/auth.login') ||
  url.startsWith('/trpc/auth.register') ||
  url.startsWith('/trpc/auth.changePassword') ||
  url.startsWith('/trpc/users.createUser') ||
  url.startsWith('/trpc/users.getUserByEmail');

/**
 * Что не проверяется на CSRF и почему.
 *
 * login/register/refresh — на этот момент у клиента ещё нет сессии, которую
 * можно было бы угнать этой атакой (см. CORS_ORIGIN и access/refresh cookie в
 * auth/plugins.ts). Токен, который они выдают, защищает все последующие мутации.
 *
 * runner.run — единственная мутация, доступная без сессии: гость запускает код
 * в редакторе и во встроенном виджете, и CSRF-токена у него нет вовсе. Требовать
 * его здесь означало бы сломать основную функцию сайта для неавторизованных.
 * Защищать тут нечего: запуск не меняет данные пользователя, а от абьюза стоит
 * отдельный лимит (LIMITS.runnerPerMinute) — злоумышленнику незачем ходить
 * через браузер жертвы, тот же запрос он сделает со своего сервера.
 *
 * Все остальные мутации меняют данные аккаунта, требуют сессии — а значит, у
 * клиента уже есть выданный вместе с ней токен.
 */
const isCsrfExempt = (url: string): boolean =>
  url.startsWith('/trpc/auth.login') ||
  url.startsWith('/trpc/auth.register') ||
  url.startsWith('/trpc/auth.refresh') ||
  isRunnerRun(url);

export async function registerSecurity(server: FastifyInstance): Promise<void> {
  await server.register(cors, {
    // Cookie с JWT (см. auth/plugins.ts) должны доходить до бэкенда, а браузер
    // отправляет их в кросс-сайтовых запросах только при credentials: true —
    // и только если Access-Control-Allow-Origin — конкретный origin, не '*'.
    origin: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
    credentials: true,
  });

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

  /**
   * Проверяем CSRF-токен только на мутациях (tRPC различает их HTTP-методом:
   * query — GET, mutation — POST) и только у запросов с сессией.
   *
   * Условие «есть cookie сессии» важно не для безопасности, а для внятности
   * ошибок. Атака подделки запроса имеет смысл лишь тогда, когда браузер жертвы
   * приложит её cookie: без них подделывать нечего — все мутации, меняющие
   * данные, требуют авторизации и ответят UNAUTHORIZED. Пока проверка стояла
   * раньше, гость получал на «Сохранить» сырой 403 CSRF вместо понятного
   * «нужно войти», и то же видел монитор ошибок.
   *
   * Любой запрос, принёсший cookie сессии, проверяется — то есть защита
   * остаётся ровно там, где от неё есть польза.
   */
  server.addHook('preHandler', (request, reply, done) => {
    const hasSession =
      request.cookies?.accessToken != null ||
      request.cookies?.refreshToken != null;

    if (request.method !== 'POST' || !hasSession || isCsrfExempt(request.url)) {
      done();
      return;
    }

    server.csrfProtection(request, reply, done);
  });

  await server.register(rateLimit, {
    global: true,
    // Разные лимиты по маршрутам: tRPC ходит одним путём /trpc/<процедура>,
    // поэтому имя процедуры видно в URL и отдельный контекст не нужен.
    max: (request: FastifyRequest) => {
      const url = request.url;
      if (isRunnerRun(url)) return LIMITS.runnerPerMinute;
      if (isAuth(url)) return LIMITS.authPerMinute;
      if (isOembed(url)) return LIMITS.oembedPerMinute;
      return LIMITS.apiPerMinute;
    },
    timeWindow: '1 minute',
    // Health-check не должен получать 429: иначе оркестратор решит, что
    // приложение умерло, и начнёт перезапускать живой инстанс.
    allowList: (request: FastifyRequest) => request.url.startsWith('/health'),
    /**
     * Ключ — адрес клиента по версии fastify (см. trustProxy в index.ts).
     *
     * Раньше здесь брался первый элемент X-Forwarded-For напрямую. Этот
     * заголовок подставляет кто угодно: меняя его в каждом запросе, клиент
     * получал новую корзину и обходил все лимиты — перебор пароля шёл без
     * ограничений. Обратная сторона той же ошибки: за нашим прокси, который
     * заголовок перезаписывает, все посетители попадали в один бакет, и один
     * скрипт мог выключить вход для всех.
     *
     * request.ip учитывает заголовок ровно настолько, насколько разрешено
     * переменной TRUST_PROXY_HOPS.
     */
    keyGenerator: (request: FastifyRequest) => request.ip,
    errorResponseBuilder: (_request, context) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Слишком много запросов. Попробуйте через ${Math.ceil(context.ttl / 1000)} с.`,
    }),
  });
}
