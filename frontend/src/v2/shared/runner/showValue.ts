/**
 * Печать значений в консоль так, как это делает Node (#880).
 *
 * Хранится строкой, потому что исполняется внутри Web Worker: воркер собирается
 * из исходного текста, отдельный модуль туда не импортируется. Строка — не
 * прихоть, а единственный способ иметь один источник правды: тест
 * (showValue.test.ts) собирает функцию ровно из этого текста, поэтому проверяется
 * тот же код, который работает у пользователя, а не его копия.
 *
 * Почему не JSON.stringify, ради чего всё это: для undefined он возвращает
 * undefined (не строку), и console.log(undefined) печатал пустую строку — человек
 * видел пустоту и не понимал, сработал ли код. По той же причине терялись
 * функции, символы и NaN, а Infinity превращался в null.
 */
export const SHOW_SOURCE = `
/**
 * Печать значения так, как это делает консоль Node (#880).
 *
 * JSON.stringify здесь недостаточно: для undefined он возвращает undefined
 * (не строку), и console.log(undefined) печатал пустую строку — человек видел
 * пустую строку вместо значения и не понимал, сработал ли код. По той же
 * причине терялись функции, символы и NaN, а Infinity превращался в null.
 *
 * Циклические ссылки JSON.stringify роняет исключением — на них
 * возвращается [Circular].
 */
const show = (value, depth) => {
  if (typeof value === 'string') return depth > 0 ? JSON.stringify(value) : value;
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'number') return Object.is(value, -0) ? '-0' : String(value);
  if (typeof value === 'bigint') return String(value) + 'n';
  if (typeof value === 'boolean') return String(value);
  if (typeof value === 'symbol') return value.toString();
  if (typeof value === 'function')
    return '[Function: ' + (value.name || 'anonymous') + ']';
  if (value instanceof Error) return value.stack || String(value);
  if (depth > 4) return Array.isArray(value) ? '[Array]' : '[Object]';
  if (Array.isArray(value))
    return '[ ' + value.map((item) => show(item, depth + 1)).join(', ') + ' ]';
  if (value instanceof Map)
    return 'Map(' + value.size + ') { ' + [...value].map(([k, v]) =>
      show(k, depth + 1) + ' => ' + show(v, depth + 1)).join(', ') + ' }';
  if (value instanceof Set)
    return 'Set(' + value.size + ') { ' + [...value].map((item) =>
      show(item, depth + 1)).join(', ') + ' }';
  if (value instanceof Date) return value.toISOString();
  try {
    const entries = Object.entries(value).map(
      ([key, item]) => key + ': ' + show(item, depth + 1),
    );
    return entries.length === 0 ? '{}' : '{ ' + entries.join(', ') + ' }';
  } catch {
    return '[Circular]';
  }
};
`;
