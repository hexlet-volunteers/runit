import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import compress from '@fastify/compress';
import fastifyStatic from '@fastify/static';
import type { FastifyInstance } from 'fastify';
import { snippetMetaHandler } from './oembed';

/**
 * Раздача собранного интерфейса самим Fastify — для PaaS (Heroku и совместимые).
 *
 * Зачем это вообще понадобилось. В docker-схеме интерфейс отдаёт Caddy
 * (frontend/Caddyfile.docker), он же проксирует API — фронтенд и бэкенд видны
 * снаружи как один сайт. На PaaS второго процесса перед приложением нет, а
 * развести фронтенд и API по двум приложениям нельзя: клиент tRPC зовёт API
 * относительным путём `/trpc` (frontend/src/application.tsx), и cookie сессии
 * выставлены с `sameSite: 'lax'` (auth/cookies.ts) — в кросс-сайтовом fetch
 * браузер их не отправит, то есть вход просто не работал бы. Значит интерфейс
 * и API обязаны жить на одном origin, и на PaaS отдавать статику больше некому.
 *
 * Это не замена Caddy, а второй способ развёртывания: docker-схема остаётся
 * основной. Поэтому модуль подключается условно — если каталога сборки нет,
 * приложение поднимается как раньше, чистым API. Так же ведёт себя и образ
 * бэкенда: в нём frontend/dist отсутствует, и поведение не меняется.
 *
 * Правила ниже — перенос уже принятых решений из Caddyfile, а не новая
 * политика. Расхождение между двумя схемами развёртывания опаснее самих правил:
 * ошибку, которая видна только на одном из стендов, ищут в последнюю очередь.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Каталог сборки фронтенда относительно скомпилированного кода: файл живёт в
 * `dist/staticSite.js`, сборка Vite — в `frontend/dist` рядом с ним. Тот же
 * приём, что у миграций в db/connection.ts.
 */
const distPath = path.join(__dirname, '../frontend/dist');
const indexPath = path.join(distPath, 'index.html');

/**
 * Боты, которым вместо SPA нужен HTML с метатегами. Список скопирован из
 * Caddyfile.docker — он там подобран по тем площадкам, где сниппетами делятся.
 */
const BOT_USER_AGENT =
  /(bot|crawler|spider|facebookexternalhit|twitterbot|slackbot|telegrambot|discordbot|whatsapp|vkshare|embedly|quora link preview|redditbot|linkedinbot)/i;

/** Короткий код сниппета — тот же формат, что в oembed.ts. */
const SHORT_CODE = /^[A-Za-z0-9]{4,16}$/;

/**
 * Пути бэкенда. Нужны, чтобы SPA-заглушка их не перехватывала: на неизвестную
 * процедуру tRPC или на опечатку в `/oembed` клиент должен получить 404, а не
 * страницу приложения с кодом 200. Молчаливый HTML вместо ошибки API — это
 * сломанный клиент и зелёный мониторинг одновременно.
 */
const API_PREFIXES = ['/trpc', '/oembed', '/health'];

const isApiPath = (url: string): boolean => {
  const pathname = url.split('?')[0];
  return API_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
};

/** Хеш в имени файла есть только у ассетов Vite — их и кэшируем навсегда. */
const isImmutableAsset = (filePath: string): boolean =>
  filePath.includes(`${path.sep}assets${path.sep}`);

export async function registerStaticSite(
  server: FastifyInstance,
): Promise<boolean> {
  if (!fs.existsSync(indexPath)) {
    server.log.info(
      '[static] frontend/dist не найден — приложение работает как API, интерфейс раздаётся отдельно',
    );
    return false;
  }

  /**
   * Отметка «это страница интерфейса» и снятие с неё API-заголовков — на
   * корневом экземпляре, а не внутри области видимости ниже.
   *
   * Так пришлось сделать, разобравшись с обработчиком «не найдено»: он живёт в
   * корневом контексте даже когда объявлен внутри плагина, поэтому хуки этого
   * плагина к его ответам не применяются. Пока хук стоял в области видимости,
   * заголовки правились только у существующих файлов: `/` работал, а `/embed/*`
   * и любой клиентский маршрут вроде `/editor/123` уезжали с `X-Frame-Options:
   * DENY` — то есть встраивание сниппетов было сломано, и увидеть это можно
   * было только запросом к стенду.
   */
  server.decorateRequest('isAppPage', false);

  server.addHook('onSend', async (request, reply, payload) => {
    if (!request.isAppPage) return payload;

    /**
     * Заголовки снимаются именно с raw-ответа. helmet — middleware, он пишет
     * их напрямую в http.ServerResponse, и хранилище заголовков Fastify их не
     * видит: `reply.removeHeader('content-security-policy')` возвращал успех и
     * не удалял ничего, а страница всё равно приезжала с `default-src 'none'`.
     */
    reply.raw.removeHeader('Content-Security-Policy');

    if (request.url.startsWith('/embed/')) {
      // Виджет обязан открываться в чужих страницах — в этом его назначение.
      reply.raw.removeHeader('X-Frame-Options');
    } else {
      // Наш интерфейс в чужую страницу подставлять незачем (clickjacking).
      reply.raw.setHeader('X-Frame-Options', 'SAMEORIGIN');
    }

    return payload;
  });

  /**
   * Сжатие и сама раздача — в отдельной области видимости: хуки Fastify
   * действуют вниз по дереву, но не вверх, поэтому ответы API остаются в
   * точности такими, какими были до появления этого модуля.
   */
  await server.register(async (scope) => {
    /**
     * Сжатие. В docker-схеме его делает Caddy (`encode zstd gzip`), здесь перед
     * приложением только маршрутизатор PaaS, а он ничего не сжимает. Без этого
     * шага редактор Monaco уезжает клиенту сырыми мегабайтами.
     */
    await scope.register(compress, {
      encodings: ['br', 'gzip', 'deflate'],
      // Мелочь вроде манифеста от сжатия только теряет: пакет всё равно один.
      threshold: 1024,
    });

    await scope.register(fastifyStatic, {
      root: distPath,
      setHeaders: (reply, filePath) => {
        reply.request.isAppPage = true;

        if (isImmutableAsset(filePath)) {
          reply.header('cache-control', 'public, max-age=31536000, immutable');
          return;
        }
        /**
         * index.html кэшировать нельзя: он ссылается на файлы с хешами, и
         * закэшированная копия после деплоя тянула бы уже удалённые ассеты —
         * приложение показывало бы белый экран до сброса кэша вручную.
         */
        reply.header('cache-control', 'no-cache');
      },
    });

    /**
     * Ссылка на сниппет: боту — метатеги, человеку — приложение.
     *
     * Маршрут объявлен явно, потому что SPA-заглушка ниже про ботов ничего не
     * знает: она отдаёт index.html, а мессенджер получил бы оболочку без
     * Open Graph и показал бы ссылку без превью.
     *
     * Здесь же видно, зачем признак «страница интерфейса» вообще нужен: у одного
     * и того же пути два вида ответа с противоположными требованиями к
     * заголовкам, и по URL их не различить.
     */
    scope.get('/s/:shortCode', async (request, reply) => {
      const { shortCode } = request.params as { shortCode: string };
      const userAgent = String(request.headers['user-agent'] ?? '');

      if (SHORT_CODE.test(shortCode) && BOT_USER_AGENT.test(userAgent)) {
        // Служебный HTML без скриптов — ему API-политика helmet как раз подходит.
        return snippetMetaHandler(request, reply);
      }

      request.isAppPage = true;
      return reply.type('text/html; charset=utf-8').sendFile('index.html');
    });

    /**
     * SPA: неизвестный путь отдаёт index.html, иначе прямой заход на
     * `/editor/123` или `/s/aB3xK9` вернул бы 404 вместо приложения —
     * маршрутизация у SPA клиентская.
     */
    scope.setNotFoundHandler((request, reply) => {
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        return reply.code(404).send({ error: 'Not Found' });
      }

      if (isApiPath(request.url)) {
        return reply.code(404).send({ error: 'Not Found' });
      }

      request.isAppPage = true;
      return reply.type('text/html; charset=utf-8').sendFile('index.html');
    });
  });

  server.log.info(`[static] интерфейс раздаётся из ${distPath}`);
  return true;
}
