/**
 * Расширения файлов по языку — одно место на весь фронтенд.
 *
 * Таблица была скопирована в двух страницах (шаринг и embed), и в обеих копиях
 * не хватало пяти языков из двенадцати: typescript, go, cpp, sql, bash. Сниппет
 * на Go предлагался к скачиванию как `name.txt`, и добавление языка требовало
 * править обе копии — а забыть одну из них было ровно так же незаметно.
 */
export const FILE_EXTENSIONS: Record<string, string> = {
  javascript: 'js',
  typescript: 'ts',
  python: 'py',
  php: 'php',
  ruby: 'rb',
  java: 'java',
  go: 'go',
  cpp: 'cpp',
  sql: 'sql',
  bash: 'sh',
  html: 'html',
  css: 'css',
};

/** Расширение для языка; для незнакомого — txt. */
export const fileExtension = (language: string): string =>
  FILE_EXTENSIONS[language] ?? 'txt';

/** Имя файла сниппета: «моё-имя.py». */
export const snippetFileName = (name: string, language: string): string =>
  `${name}.${fileExtension(language)}`;
