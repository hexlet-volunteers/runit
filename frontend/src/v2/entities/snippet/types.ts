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
  visibility?: string;
  /**
   * Логин автора. Приходит только от getSnippetByShortCode — там он нужен,
   * потому что в короткой ссылке имени пользователя нет.
   */
  authorUsername?: string | null;
};
