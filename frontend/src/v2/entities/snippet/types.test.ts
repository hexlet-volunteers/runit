import { describe, expect, test } from 'vitest';
import { FILE_EXTENSIONS, fileExtension, snippetFileName } from '../../shared/lib';
import {
  SNIPPET_LANGUAGES,
  SNIPPET_VISIBILITIES,
  isSnippetLanguage,
  isSnippetVisibility,
  toSnippetLanguage,
  toSnippetVisibility,
} from './types';

/**
 * Списки языков и уровней доступа — граница с бэкендом.
 *
 * Проверяется то, из-за чего расхождения уже случались: фронт знал про шесть
 * языков, а поддерживалось двенадцать; таблица расширений файлов была
 * скопирована в двух страницах, и в обеих не хватало пяти языков — сниппет на Go
 * предлагался к скачиванию как «name.txt».
 *
 * Списки на бэкенде живут в src/db/snippets.ts. Здесь фиксируется их состав:
 * если там добавят язык и забудут здесь, тест назовёт, чего не хватает.
 */

const BACKEND_LANGUAGES = [
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

describe('языки', () => {
  test('список совпадает с перечислением бэкенда', () => {
    expect([...SNIPPET_LANGUAGES].sort()).toEqual([...BACKEND_LANGUAGES].sort());
  });

  test('распознаёт известные и отвергает выдуманные', () => {
    expect(isSnippetLanguage('python')).toBe(true);
    expect(isSnippetLanguage('rust')).toBe(false);
    expect(isSnippetLanguage('')).toBe(false);
  });

  test('неизвестный язык приводится к javascript, а не уезжает на сервер', () => {
    // Язык сниппета приходит из API строкой: там может оказаться значение,
    // которое мы больше не поддерживаем. Приведение через `as` соврало бы
    // компилятору, а сервер такое значение отверг бы.
    expect(toSnippetLanguage('python')).toBe('python');
    expect(toSnippetLanguage('rust')).toBe('javascript');
  });
});

describe('видимость', () => {
  test('три уровня, как в БД', () => {
    expect([...SNIPPET_VISIBILITIES]).toEqual(['private', 'link', 'public']);
  });

  test('неизвестное значение приводится к самому закрытому', () => {
    // Ошибиться в сторону «видно всем» здесь нельзя: это чужие данные.
    expect(toSnippetVisibility('public')).toBe('public');
    expect(toSnippetVisibility('всем')).toBe('private');
    expect(isSnippetVisibility('link')).toBe(true);
    expect(isSnippetVisibility('всем')).toBe(false);
  });
});

describe('расширения файлов', () => {
  test('есть у каждого поддерживаемого языка', () => {
    const missing = SNIPPET_LANGUAGES.filter((lang) => !FILE_EXTENSIONS[lang]);
    expect(missing).toEqual([]);
  });

  test('незнакомый язык — txt, а не пустое имя', () => {
    expect(fileExtension('rust')).toBe('txt');
  });

  test('имя файла собирается из имени сниппета', () => {
    expect(snippetFileName('моя-задача', 'go')).toBe('моя-задача.go');
    expect(snippetFileName('скрипт', 'bash')).toBe('скрипт.sh');
  });
});
