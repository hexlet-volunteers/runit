import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { getSnippetByShortCode } from './db/snippets';

/**
 * Встраивание «просто по ссылке» — как у YouTube.
 *
 * Работает это так: площадка (WordPress, Notion, Discourse, Slack и др.) получает
 * ссылку на сниппет и запрашивает у нас oEmbed-описание, а мы возвращаем готовый
 * HTML виджета. Пользователю достаточно вставить ссылку — iframe он не пишет.
 *
 * Здесь три части:
 *  1. GET /oembed — сам oEmbed-эндпоинт (спецификация oembed.com);
 *  2. GET /s/:shortCode/meta — HTML с Open Graph и ссылкой на oEmbed (discovery):
 *     по нему площадки и мессенджеры разворачивают превью. Отдаём его ботам —
 *     людям уходит SPA (Caddy в docker-схеме, staticSite.ts на PaaS);
 *  3. общие размеры виджета по умолчанию.
 */

const DEFAULT_WIDTH = 640;
const DEFAULT_HEIGHT = 380;
const MIN_HEIGHT = 200;
const MAX_HEIGHT = 900;

/** Экранирование для вставки в HTML-атрибуты и текст метатегов. */
const esc = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/** Публичный адрес сервиса: за прокси берём заголовки, иначе — из запроса. */
const baseUrlFrom = (
  headers: Record<string, unknown>,
  fallback: string,
): string => {
  const envBase = process.env.PUBLIC_BASE_URL;
  if (envBase) return envBase.replace(/\/$/, '');
  const host = String(headers['x-forwarded-host'] ?? headers.host ?? '');
  const forwarded = String(headers['x-forwarded-proto'] ?? '').split(',')[0];
  // За прокси доверяем заголовку; локальная разработка идёт по http, прод — https.
  const proto =
    forwarded ||
    (/^(localhost|127\.0\.0\.1)(:|$)/.test(host) ? 'http' : 'https');
  return host ? `${proto}://${host}` : fallback;
};

/** Достаёт короткий код из ссылки вида https://host/s/aB3xK9. */
const shortCodeFromUrl = (raw: string): string | null => {
  try {
    const url = new URL(raw);
    const match = url.pathname.match(/\/s\/([A-Za-z0-9]{4,16})\/?$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
};

export function registerOembedRoutes(server: FastifyInstance): void {
  // ---------- 1. oEmbed ----------
  server.get('/oembed', async (request, reply) => {
    const query = request.query as Record<string, string | undefined>;
    const { url, format, maxwidth, maxheight } = query;

    if (format && format !== 'json') {
      // XML-формат по спецификации допустим, но нам не нужен: все актуальные
      // площадки умеют json.
      return reply
        .code(501)
        .send({ error: 'Поддерживается только format=json' });
    }
    if (!url) return reply.code(400).send({ error: 'Не передан параметр url' });

    const shortCode = shortCodeFromUrl(url);
    if (!shortCode)
      return reply
        .code(404)
        .send({ error: 'Ссылка не похожа на сниппет Runit' });

    const snippet = await getSnippetByShortCode(shortCode);
    // 404 и для приватных: существование приватного сниппета — тоже информация.
    if (!snippet) return reply.code(404).send({ error: 'Сниппет не найден' });

    const base = baseUrlFrom(
      request.headers as Record<string, unknown>,
      'https://runit.hexlet.io',
    );
    const width = clamp(Number(maxwidth) || DEFAULT_WIDTH, 240, 1600);
    const height = clamp(
      Number(maxheight) || DEFAULT_HEIGHT,
      MIN_HEIGHT,
      MAX_HEIGHT,
    );
    const embedUrl = `${base}/embed/s/${shortCode}`;

    return reply.header('cache-control', 'public, max-age=300').send({
      version: '1.0',
      type: 'rich',
      provider_name: 'Runit',
      provider_url: base,
      title: snippet.name,
      author_name: snippet.authorUsername ?? 'Runit',
      author_url: snippet.authorUsername
        ? `${base}/u/${snippet.authorUsername}`
        : base,
      width,
      height,
      html:
        `<iframe src="${esc(embedUrl)}" width="${width}" height="${height}" ` +
        `style="border:0;border-radius:12px" loading="lazy" ` +
        `title="${esc(snippet.name)} — Runit" allow="clipboard-write"></iframe>`,
    });
  });

  // ---------- 2. HTML с метатегами (для ботов и мессенджеров) ----------
  server.get('/s/:shortCode/meta', snippetMetaHandler);
}

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
export const snippetMetaHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { shortCode } = request.params as { shortCode: string };
  const snippet = await getSnippetByShortCode(shortCode);
  if (!snippet)
    return reply
      .code(404)
      .type('text/html')
      .send('<!doctype html><title>Не найдено</title>');

  const base = baseUrlFrom(
    request.headers as Record<string, unknown>,
    'https://runit.hexlet.io',
  );
  const pageUrl = `${base}/s/${shortCode}`;
  const embedUrl = `${base}/embed/s/${shortCode}`;
  const author = snippet.authorUsername ?? 'Runit';
  const title = `${snippet.name} — Runit`;
  const description = `Сниппет на ${snippet.language ?? 'коде'} от @${author}: смотрите и запускайте прямо в браузере.`;

  return reply.type('text/html; charset=utf-8').send(`<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(pageUrl)}">

<!-- Встраивание по ссылке: площадка находит oEmbed через этот link -->
<link rel="alternate" type="application/json+oembed"
      href="${esc(`${base}/oembed?url=${encodeURIComponent(pageUrl)}&format=json`)}"
      title="${esc(snippet.name)}">

<meta property="og:type" content="website">
<meta property="og:site_name" content="Runit">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(pageUrl)}">

<!-- Плеер: мессенджеры и соцсети показывают рабочий виджет, а не просто ссылку -->
<meta name="twitter:card" content="player">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:player" content="${esc(embedUrl)}">
<meta name="twitter:player:width" content="${DEFAULT_WIDTH}">
<meta name="twitter:player:height" content="${DEFAULT_HEIGHT}">
</head>
<body>
<h1>${esc(snippet.name)}</h1>
<p>${esc(description)}</p>
<p><a href="${esc(pageUrl)}">Открыть сниппет в Runit</a></p>
</body>
</html>`);
};
