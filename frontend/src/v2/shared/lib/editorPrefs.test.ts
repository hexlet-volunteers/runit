import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  DEFAULT_EDITOR_PREFS,
  EDITOR_PREFS_EVENT,
  MAX_FONT_SIZE,
  readEditorPrefs,
  writeEditorPrefs,
} from './editorPrefs';

/**
 * Настройки редактора.
 *
 * Проверяется класс поломки, который здесь уже случался: страница настроек
 * писала значения в localStorage, редактор их не читал, а внизу страницы было
 * написано «уже применено к редактору». Три переключателя двигались и не делали
 * ничего — и это невозможно заметить, если не открыть редактор и не сравнить
 * глазами.
 */

beforeEach(() => {
  localStorage.clear();
});

describe('чтение', () => {
  test('без сохранённых значений — значения по умолчанию', () => {
    expect(readEditorPrefs()).toEqual(DEFAULT_EDITOR_PREFS);
  });

  test('мусор в хранилище не ломает редактор', () => {
    // Значение могло остаться от прошлых версий или быть поправлено руками.
    localStorage.setItem('runit.v2.editorFontSize', 'абракадабра');
    localStorage.setItem('runit.v2.consoleLayout', 'слева');
    localStorage.setItem('runit.v2.tabSpaces', 'наверное');

    const prefs = readEditorPrefs();
    expect(prefs.fontSize).toBe(DEFAULT_EDITOR_PREFS.fontSize);
    expect(prefs.consoleLayout).toBe('right');
    expect(prefs.tabSpaces).toBe(false);
  });

  test('размер шрифта вне допустимого диапазона отбрасывается', () => {
    localStorage.setItem('runit.v2.editorFontSize', '400');
    expect(readEditorPrefs().fontSize).toBe(DEFAULT_EDITOR_PREFS.fontSize);

    localStorage.setItem('runit.v2.editorFontSize', '2');
    expect(readEditorPrefs().fontSize).toBe(DEFAULT_EDITOR_PREFS.fontSize);

    localStorage.setItem('runit.v2.editorFontSize', String(MAX_FONT_SIZE));
    expect(readEditorPrefs().fontSize).toBe(MAX_FONT_SIZE);
  });
});

describe('запись', () => {
  test('сохраняет только переданное, остальное не сбрасывает', () => {
    writeEditorPrefs({ fontSize: 18 });
    writeEditorPrefs({ consoleLayout: 'bottom' });

    const prefs = readEditorPrefs();
    expect(prefs.fontSize).toBe(18);
    expect(prefs.consoleLayout).toBe('bottom');
    expect(prefs.tabSpaces).toBe(DEFAULT_EDITOR_PREFS.tabSpaces);
  });

  test('сообщает открытому редактору событием', () => {
    // Без события открытый в другой вкладке приложения редактор узнал бы о
    // новой настройке только после перезагрузки страницы.
    const listener = vi.fn();
    window.addEventListener(EDITOR_PREFS_EVENT, listener);

    writeEditorPrefs({ tabSpaces: false });

    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(EDITOR_PREFS_EVENT, listener);
  });

  test('недоступное хранилище не мешает применить настройку', () => {
    // Приватный режим браузера: setItem бросает исключение. Настройка не
    // переживёт перезагрузку, но текущий сеанс сломаться не должен.
    const setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('приватный режим');
      });
    const listener = vi.fn();
    window.addEventListener(EDITOR_PREFS_EVENT, listener);

    expect(() => writeEditorPrefs({ fontSize: 16 })).not.toThrow();
    expect(listener).toHaveBeenCalledTimes(1);

    window.removeEventListener(EDITOR_PREFS_EVENT, listener);
    setItem.mockRestore();
  });
});
