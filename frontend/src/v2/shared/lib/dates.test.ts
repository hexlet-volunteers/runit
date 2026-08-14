import { afterEach, describe, expect, test, vi } from 'vitest';
import { parseTimestamp, plural, relativeDate } from './dates';

/**
 * Даты в списке сниппетов.
 *
 * `parseTimestamp` покрыт из-за #881: он возвращал 0 вместо null, то есть
 * «даты нет» превращалось в 1 января 1970 года. При сортировке «сначала старые»
 * записи без даты всплывали на самый верх — выглядело как случайный порядок
 * списка, а причина была в одном значении по умолчанию.
 */

afterEach(() => {
  vi.useRealTimers();
});

describe('parseTimestamp', () => {
  test('отсутствие даты — это null, а не начало эпохи', () => {
    expect(parseTimestamp(null)).toBeNull();
    expect(parseTimestamp(undefined)).toBeNull();
    expect(parseTimestamp('')).toBeNull();
    // `new Date(null)` даёт 0, а не NaN — прежняя проверка на NaN это пропускала.
    expect(parseTimestamp(null)).not.toBe(0);
  });

  test('нечитаемая дата — тоже null', () => {
    expect(parseTimestamp('вчера примерно')).toBeNull();
  });

  test('корректная дата разбирается', () => {
    expect(parseTimestamp('2026-08-14T10:00:00.000Z')).toBe(
      Date.parse('2026-08-14T10:00:00.000Z'),
    );
    const date = new Date('2026-01-01T00:00:00.000Z');
    expect(parseTimestamp(date)).toBe(date.getTime());
  });
});

describe('plural', () => {
  test('склоняет по правилам русского языка', () => {
    const forms: [string, string, string] = ['минуту', 'минуты', 'минут'];
    expect(plural(1, forms)).toBe('минуту');
    expect(plural(2, forms)).toBe('минуты');
    expect(plural(5, forms)).toBe('минут');
    // Исключения второго десятка: «11 минут», а не «11 минуту».
    expect(plural(11, forms)).toBe('минут');
    expect(plural(12, forms)).toBe('минут');
    expect(plural(21, forms)).toBe('минуту');
    expect(plural(112, forms)).toBe('минут');
  });
});

describe('relativeDate', () => {
  test('считает от текущего момента', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-14T12:00:00.000Z'));

    expect(relativeDate('2026-08-14T11:59:30.000Z')).toBe('только что');
    expect(relativeDate('2026-08-14T11:58:00.000Z')).toBe('2 минуты назад');
    expect(relativeDate('2026-08-14T09:00:00.000Z')).toBe('3 часа назад');
    expect(relativeDate('2026-08-13T10:00:00.000Z')).toBe('вчера');
    expect(relativeDate('2026-08-10T12:00:00.000Z')).toBe('4 дня назад');
    expect(relativeDate('2026-07-14T12:00:00.000Z')).toBe('месяц назад');
    expect(relativeDate('2025-08-14T12:00:00.000Z')).toBe('год назад');
  });

  test('пустая и нечитаемая дата не превращаются в «56 лет назад»', () => {
    expect(relativeDate(null)).toBe('');
    expect(relativeDate(undefined)).toBe('');
    expect(relativeDate('')).toBe('');
    expect(relativeDate('не дата')).toBe('');
  });
});
