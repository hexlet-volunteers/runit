/**
 * Ссылки на сниппет: просмотр, встраивание и готовый embed-код.
 *
 * Вынесено в одно место, потому что раньше шаблон ссылки был скопирован в
 * четыре файла — и на роуте короткой ссылки все копии ломались одинаково:
 * страница брала username и slug из URL, где их нет, подставляла пустые строки
 * и выдавала «/s//». Внешне это выглядело как рабочая кнопка «Копировать».
 *
 * Правило простое: если у сниппета есть короткий код — ссылки строятся по нему,
 * иначе по старой паре username+slug.
 */

export interface SnippetLinkSource {
  shortCode?: string | null;
  authorUsername?: string | null;
  username?: string | null;
  slug?: string | null;
}

/**
 * Публичный адрес сервиса. На стейджинге и в разработке он не совпадает с
 * продовым, поэтому домен нельзя прибивать в код: скопированная ссылка вела бы
 * на прод из любого окружения.
 */
export function publicBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_PUBLIC_BASE_URL as string | undefined;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (typeof window !== 'undefined') return window.location.origin;
  return 'https://runit.hexlet.io';
}

/** Путь просмотра: /s/aB3xK9 или /s/user/slug. Пустая строка, если данных нет. */
export function snippetPath(source: SnippetLinkSource): string {
  if (source.shortCode) return `/s/${source.shortCode}`;
  const user = source.authorUsername ?? source.username;
  if (user && source.slug) return `/s/${user}/${source.slug}`;
  return '';
}

/** Путь виджета для встраивания. */
export function embedPath(source: SnippetLinkSource): string {
  if (source.shortCode) return `/embed/s/${source.shortCode}`;
  const user = source.authorUsername ?? source.username;
  if (user && source.slug) return `/embed/${user}/${source.slug}`;
  return '';
}

/** Абсолютная ссылка для кнопки «Копировать ссылку». */
export function snippetUrl(source: SnippetLinkSource): string {
  const path = snippetPath(source);
  return path ? `${publicBaseUrl()}${path}` : '';
}

/** Абсолютная ссылка на виджет. */
export function embedUrl(
  source: SnippetLinkSource,
  params?: { theme?: string; height?: number },
): string {
  const path = embedPath(source);
  if (!path) return '';
  const query = new URLSearchParams();
  if (params?.theme) query.set('theme', params.theme);
  if (params?.height) query.set('height', String(params.height));
  const suffix = query.toString();
  return `${publicBaseUrl()}${path}${suffix ? `?${suffix}` : ''}`;
}

/** Готовый iframe для вставки на чужую страницу. */
export function embedCodeFor(
  source: SnippetLinkSource,
  options: { name: string; height?: number; theme?: string },
): string {
  const height = options.height ?? 380;
  const url = embedUrl(source, { theme: options.theme ?? 'dark', height });
  if (!url) return '';
  const title = options.name.replace(/"/g, '&quot;');
  return `<iframe src="${url}" width="100%" height="${height}" style="border:0;border-radius:12px" title="Runit — ${title}"></iframe>`;
}
