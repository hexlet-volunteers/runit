import { renderHook } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { SAVE_STATUS_META } from '../lib/constants';
import useSaveHotkey from './useSaveHotkey';

/**
 * Сохранение по Ctrl/Cmd+S и подпись статуса.
 *
 * Проверяется то, о чём спросил пользователь: «создал сниппет — а как сохранить
 * содержимое?» Сохранение автоматическое, но кнопки «Сохранить» в редакторе нет,
 * а Ctrl+S открывал диалог браузера «сохранить страницу» — из чего следовал
 * вывод, что сохранения нет вовсе.
 */

/** Нажатие с модификатором; возвращает, было ли отменено действие браузера. */
const press = (key: string, modifier: 'ctrl' | 'meta' | 'none' = 'ctrl') => {
  const event = new KeyboardEvent('keydown', {
    key,
    ctrlKey: modifier === 'ctrl',
    metaKey: modifier === 'meta',
    bubbles: true,
    cancelable: true,
  });
  const notPrevented = window.dispatchEvent(event);
  return { предотвращено: !notPrevented };
};

describe('Ctrl+S', () => {
  test('сохраняет и не даёт браузеру открыть «сохранить страницу»', () => {
    const save = vi.fn();
    renderHook(() => useSaveHotkey(save));

    const { предотвращено } = press('s');

    expect(save).toHaveBeenCalledTimes(1);
    expect(предотвращено).toBe(true);
  });

  test('работает и с Cmd на макбуке', () => {
    const save = vi.fn();
    renderHook(() => useSaveHotkey(save));

    press('s', 'meta');

    expect(save).toHaveBeenCalledTimes(1);
  });

  test('регистр не важен: Ctrl+Shift+S тоже сохраняет', () => {
    const save = vi.fn();
    renderHook(() => useSaveHotkey(save));

    press('S');

    expect(save).toHaveBeenCalledTimes(1);
  });

  test('без модификатора буква s набирается как обычно', () => {
    const save = vi.fn();
    renderHook(() => useSaveHotkey(save));

    const { предотвращено } = press('s', 'none');

    expect(save).not.toHaveBeenCalled();
    expect(предотвращено).toBe(false);
  });

  test('другие сочетания не перехватываются', () => {
    const save = vi.fn();
    renderHook(() => useSaveHotkey(save));

    press('a');
    press('Enter');

    expect(save).not.toHaveBeenCalled();
  });

  test('после размонтирования редактора нажатие ничего не сохраняет', () => {
    const save = vi.fn();
    const { unmount } = renderHook(() => useSaveHotkey(save));

    unmount();
    press('s');

    expect(save).not.toHaveBeenCalled();
  });

  test('вызывается свежий обработчик, а не тот, что был при монтировании', () => {
    // Хук подписывается один раз, поэтому колбэк держится в ref: иначе
    // сохранялось бы устаревшее состояние редактора.
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(({ fn }) => useSaveHotkey(fn), {
      initialProps: { fn: first },
    });

    rerender({ fn: second });
    press('s');

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});

describe('подпись статуса', () => {
  test('несохранённое состояние подсказывает действие, а не констатирует', () => {
    // «Не сохранено» описывало состояние и оставляло вопрос «как сохранить?».
    expect(SAVE_STATUS_META.unsaved.label).toBe('Сохранить');
    expect(SAVE_STATUS_META.saved.label).toBe('Сохранено');
    expect(SAVE_STATUS_META.saving.label).toBe('Сохранение…');
  });
});
