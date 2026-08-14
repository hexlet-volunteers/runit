import { useEffect, useState } from 'react';

/**
 * Настройки редактора: размер шрифта, расположение консоли, табуляция.
 *
 * Раньше вкладка «Редактор» в настройках писала эти значения в localStorage, а
 * редактор их не читал вовсе — у Monaco стояли жёстко fontSize: 14 и tabSize: 2,
 * консоль всегда была справа. При этом внизу страницы настроек было написано,
 * что всё «уже применено к редактору». То есть три работающих на вид переключателя
 * не делали ничего.
 *
 * Здесь одно место, которое знает ключи и значения по умолчанию, и одно событие,
 * по которому открытый редактор подхватывает изменение без перезагрузки.
 *
 * TODO(#832): перенести настройки на сервер, чтобы они переезжали между
 * устройствами. Пока хранение локальное — как и было.
 */

const LS_FONT_SIZE = 'runit.v2.editorFontSize';
const LS_CONSOLE_LAYOUT = 'runit.v2.consoleLayout';
const LS_TAB_SPACES = 'runit.v2.tabSpaces';

export const MIN_FONT_SIZE = 12;
export const MAX_FONT_SIZE = 20;

export type ConsoleLayout = 'right' | 'bottom';

export interface EditorPrefs {
  fontSize: number;
  consoleLayout: ConsoleLayout;
  /** Tab вставляет пробелы (иначе — символ табуляции). */
  tabSpaces: boolean;
}

export const DEFAULT_EDITOR_PREFS: EditorPrefs = {
  fontSize: 14,
  consoleLayout: 'right',
  tabSpaces: true,
};

/** Событие изменения настроек — им редактор узнаёт о правке в другой вкладке приложения. */
export const EDITOR_PREFS_EVENT = 'runit:editor-prefs';

/** Читает строку из localStorage. При ошибке (приватный режим) — запасное значение. */
const readRaw = (key: string, fallback: string): string => {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};

export function readEditorPrefs(): EditorPrefs {
  const fontSize = Number(
    readRaw(LS_FONT_SIZE, String(DEFAULT_EDITOR_PREFS.fontSize)),
  );
  const layout = readRaw(LS_CONSOLE_LAYOUT, DEFAULT_EDITOR_PREFS.consoleLayout);

  return {
    fontSize:
      Number.isFinite(fontSize) &&
      fontSize >= MIN_FONT_SIZE &&
      fontSize <= MAX_FONT_SIZE
        ? fontSize
        : DEFAULT_EDITOR_PREFS.fontSize,
    consoleLayout: layout === 'bottom' ? 'bottom' : 'right',
    tabSpaces:
      readRaw(LS_TAB_SPACES, String(DEFAULT_EDITOR_PREFS.tabSpaces)) === 'true',
  };
}

/** Сохраняет изменённые настройки и сообщает об этом открытым экранам. */
export function writeEditorPrefs(patch: Partial<EditorPrefs>): void {
  const next = { ...readEditorPrefs(), ...patch };
  try {
    localStorage.setItem(LS_FONT_SIZE, String(next.fontSize));
    localStorage.setItem(LS_CONSOLE_LAYOUT, next.consoleLayout);
    localStorage.setItem(LS_TAB_SPACES, String(next.tabSpaces));
  } catch {
    // Приватный режим: настройки не сохранятся, но применить их к текущей
    // сессии всё равно нужно — событие ниже отправляется в любом случае.
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(EDITOR_PREFS_EVENT));
  }
}

/** Текущие настройки редактора, обновляются при их изменении. */
export function useEditorPrefs(): EditorPrefs {
  const [prefs, setPrefs] = useState<EditorPrefs>(readEditorPrefs);

  useEffect(() => {
    const sync = () => setPrefs(readEditorPrefs());
    window.addEventListener(EDITOR_PREFS_EVENT, sync);
    // storage — правка в другой вкладке браузера.
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EDITOR_PREFS_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return prefs;
}
