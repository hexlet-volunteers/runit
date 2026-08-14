/**
 * Языки сниппета. Список обязан совпадать с zod-перечислением бэкенда
 * (src/db/snippets.ts): при расхождении вызов createSnippet не пройдёт проверку
 * типов — это и есть защита от повторения ситуации, когда фронт знал про шесть
 * языков, а поддерживалось двенадцать.
 */
export const SNIPPET_LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'php',
  'ruby',
  'java',
  'go',
  'cpp',
  'sql',
  'bash',
  'html',
  'css',
] as const;

export type SnippetLanguage = (typeof SNIPPET_LANGUAGES)[number];

export const isSnippetLanguage = (value: string): value is SnippetLanguage =>
  (SNIPPET_LANGUAGES as readonly string[]).includes(value);

/**
 * Приводит строку к языку сниппета.
 *
 * Нужен на границе с данными, которые приходят строкой: язык сниппета из API
 * объявлен как string и теоретически может оказаться чем угодно — например,
 * старой записью с языком, который мы больше не поддерживаем. Приведение
 * через `as` в таком месте было бы обманом: тип бы сошёлся, а на сервер уехало
 * значение, которое он отвергнет.
 *
 * Неизвестное значение заменяется на javascript — язык по умолчанию в редакторе.
 */
export const toSnippetLanguage = (value: string): SnippetLanguage =>
  isSnippetLanguage(value) ? value : 'javascript';

/**
 * Уровни доступа. Список обязан совпадать с VISIBILITIES бэкенда
 * (src/db/snippets.ts) — по той же причине, что и список языков.
 */
export const SNIPPET_VISIBILITIES = ['private', 'link', 'public'] as const;

export type SnippetVisibility = (typeof SNIPPET_VISIBILITIES)[number];

export const isSnippetVisibility = (
  value: string,
): value is SnippetVisibility =>
  (SNIPPET_VISIBILITIES as readonly string[]).includes(value);

/** Приводит строку из формы к уровню доступа; неизвестное — самый закрытый. */
export const toSnippetVisibility = (value: string): SnippetVisibility =>
  isSnippetVisibility(value) ? value : 'private';

export type Snippet = {
  id: number;
  name: string;
  slug: string;
  code: string;
  language: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
  /** Код короткой ссылки /s/aB3xK9. Есть у всех сниппетов, созданных после #918. */
  shortCode?: string | null;
  /** private | link | public. */
  visibility?: SnippetVisibility | string;
  /**
   * Логин автора. Приходит только от getSnippetByShortCode — там он нужен,
   * потому что в короткой ссылке имени пользователя нет.
   */
  authorUsername?: string | null;
};
