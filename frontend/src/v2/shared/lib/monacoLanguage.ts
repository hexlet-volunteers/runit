/**
 * Язык сниппета → идентификатор языка Monaco.
 *
 * У Monaco язык bash называется shell.
 */
const MONACO_LANGUAGE: Record<string, string> = {
  bash: 'shell',
};

/** Возвращает идентификатор языка для Monaco. */
export const monacoLanguage = (language: string): string =>
  MONACO_LANGUAGE[language] ?? language;