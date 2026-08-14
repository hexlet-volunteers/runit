import { describe, expect, test } from 'vitest';
import { SHOW_SOURCE } from './showValue';

/**
 * Печать значений в консоли редактора (#880).
 *
 * Функция собирается из того же текста, который уезжает в Web Worker, поэтому
 * проверяется ровно исполняемый код, а не его копия.
 *
 * Что здесь ломалось: вывод строился через JSON.stringify, и console.log(undefined)
 * печатал пустую строку. Человек видел пустоту в консоли и не мог понять, не
 * сработал ли его код вообще. Тем же путём терялись функции и символы, NaN
 * превращался в null, а -0 в 0.
 */
const show = new Function(`${SHOW_SOURCE}; return show;`)() as (
  value: unknown,
  depth: number,
) => string;

const print = (value: unknown) => show(value, 0);

describe('примитивы', () => {
  test('пустые значения печатаются словами, а не пустотой', () => {
    expect(print(undefined)).toBe('undefined');
    expect(print(null)).toBe('null');
  });

  test('особые числа сохраняются', () => {
    expect(print(NaN)).toBe('NaN');
    expect(print(Infinity)).toBe('Infinity');
    expect(print(-Infinity)).toBe('-Infinity');
    // -0 и 0 — разные значения, и в консоли Node это видно.
    expect(print(-0)).toBe('-0');
    expect(print(0)).toBe('0');
    expect(print(42.5)).toBe('42.5');
  });

  test('строка верхнего уровня без кавычек, внутри структуры — в кавычках', () => {
    // Так делает Node: console.log('привет') печатает привет, а внутри массива
    // строка берётся в кавычки, иначе не видно границ значений.
    expect(print('привет')).toBe('привет');
    expect(print(['привет'])).toBe('[ "привет" ]');
  });

  test('bigint, boolean, symbol', () => {
    expect(print(10n)).toBe('10n');
    expect(print(true)).toBe('true');
    expect(print(Symbol('метка'))).toBe('Symbol(метка)');
  });

  test('функция печатается с именем', () => {
    function считать() {}
    expect(print(считать)).toBe('[Function: считать]');
    expect(print(() => {})).toBe('[Function: anonymous]');
  });
});

describe('структуры', () => {
  test('массивы и объекты', () => {
    expect(print([1, 2, 3])).toBe('[ 1, 2, 3 ]');
    expect(print({})).toBe('{}');
    expect(print({ имя: 'Аня', лет: 30 })).toBe('{ имя: "Аня", лет: 30 }');
    expect(print([{ a: 1 }])).toBe('[ { a: 1 } ]');
  });

  test('Map и Set видно, а не как «{}»', () => {
    expect(print(new Map([['ключ', 1]]))).toBe('Map(1) { "ключ" => 1 }');
    expect(print(new Set([1, 2]))).toBe('Set(2) { 1, 2 }');
  });

  test('дата — в ISO', () => {
    expect(print(new Date('2026-08-14T10:00:00.000Z'))).toBe(
      '2026-08-14T10:00:00.000Z',
    );
  });

  test('ошибка печатается со стеком или текстом', () => {
    const printed = print(new Error('всё сломалось'));
    expect(printed).toContain('всё сломалось');
  });

  test('глубокая вложенность обрезается, а не уходит в бесконечность', () => {
    const deep = { a: { b: { c: { d: { e: { f: 1 } } } } } };
    expect(print(deep)).toContain('[Object]');
  });

  test('циклическая ссылка не роняет исполнение', () => {
    // JSON.stringify на таком объекте бросает исключение, и вместо вывода
    // пользователь получил бы ошибку своего же кода.
    const cyclic: Record<string, unknown> = { name: 'цикл' };
    cyclic.self = cyclic;
    expect(() => print(cyclic)).not.toThrow();
    expect(print(cyclic)).toContain('цикл');
  });
});
