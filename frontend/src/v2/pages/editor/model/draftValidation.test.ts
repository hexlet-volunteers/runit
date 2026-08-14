import { describe, expect, test } from 'vitest';
import {
  MAX_CODE_LENGTH,
  MAX_NAME_LENGTH,
  validateSnippetDraft,
} from './draftValidation';

/**
 * Проверка сниппета перед сохранением.
 *
 * Без неё сервер отвечал BAD_REQUEST, а редактор показывал «Не удалось сохранить
 * сниппет. Проверьте соединение» и повторял тот же запрос по кругу: соединение
 * при этом было в порядке, а имя — длиннее тридцати символов. Пользователь видел
 * поток тостов и не знал, что исправить.
 */

describe('validateSnippetDraft', () => {
  test('нормальный сниппет проходит', () => {
    expect(validateSnippetDraft('моя-задача', 'print(1)')).toBeNull();
  });

  test('пустой код — нормальное состояние', () => {
    // Тумблер «Начать с примера кода» выключен или человек стёр всё в редакторе.
    // Раньше схема требовала min(1), и оба случая заканчивались ошибкой.
    expect(validateSnippetDraft('пустой', '')).toBeNull();
  });

  test('пустое имя объясняется, а не превращается в «проверьте соединение»', () => {
    const message = validateSnippetDraft('   ', 'print(1)');
    expect(message).toContain('имя');
    expect(message).not.toContain('соединение');
  });

  test('слишком длинное имя называет предел', () => {
    const message = validateSnippetDraft('я'.repeat(MAX_NAME_LENGTH + 1), 'x');
    expect(message).toContain(String(MAX_NAME_LENGTH));
  });

  test('имя ровно по границе допустимо', () => {
    expect(validateSnippetDraft('я'.repeat(MAX_NAME_LENGTH), 'x')).toBeNull();
  });

  test('пробелы по краям не считаются длиной', () => {
    const name = `  ${'я'.repeat(MAX_NAME_LENGTH)}  `;
    expect(validateSnippetDraft(name, 'x')).toBeNull();
  });

  test('слишком большой код отвергается до отправки', () => {
    const message = validateSnippetDraft('имя', 'x'.repeat(MAX_CODE_LENGTH + 1));
    expect(message).toContain('символов');
    expect(validateSnippetDraft('имя', 'x'.repeat(MAX_CODE_LENGTH))).toBeNull();
  });

  test('пределы совпадают со схемой бэкенда', () => {
    // src/db/snippets.ts: name max(30), code max(100_000). Расхождение вернуло бы
    // ту самую ситуацию, когда сервер отказывает, а клиент этого не ожидает.
    expect(MAX_NAME_LENGTH).toBe(30);
    expect(MAX_CODE_LENGTH).toBe(100_000);
  });
});
