/**
 * Язык сниппета → идентификатор языка Monaco.
 *
 * Совпадают не все: у Monaco нет языка «bash», оболочечные скрипты там
 * называются `shell`. Из-за этого bash-сниппеты открывались вообще без
 * подсветки — как обычный текст, — и выглядело это как поломка редактора.
 * Остальные одиннадцать языков совпадают по имени и здесь не перечислены.
 */
const MONACO_LANGUAGE: Record<string, string> = {
  bash: 'shell',
};

/** Возвращает идентификатор языка для Monaco. */
export const monacoLanguage = (language: string): string =>
  MONACO_LANGUAGE[language] ?? language;
