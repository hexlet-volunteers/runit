/**
 * Логи не должны содержать пользовательских данных.
 *
 * tRPC передаёт входные данные процедуры GET-параметром `input`, поэтому в лог
 * запросов уезжало содержимое вызова: адрес почты при поиске пользователя, код
 * сниппета, поисковые строки. Журналы живут дольше запросов и читаются шире,
 * поэтому значения из них убраны, а имя процедуры (оно в пути) осталось.
 */

import { sanitizeUrl } from './monitoring';

describe('sanitizeUrl', () => {
  test('убирает значения параметров, оставляя путь', () => {
    const cleaned = sanitizeUrl(
      '/trpc/users.getUserByEmail?input=%22somebody%40example.com%22',
    );

    expect(cleaned).not.toContain('somebody');
    expect(cleaned).not.toContain('example.com');
    // Имя процедуры нужно для разбора сбоя — оно сохраняется.
    expect(cleaned).toContain('/trpc/users.getUserByEmail');
    // Видно, что параметр был, но не его значение.
    expect(cleaned).toContain('input');
  });

  test('путь без параметров не меняется', () => {
    expect(sanitizeUrl('/trpc/auth.me')).toBe('/trpc/auth.me');
    expect(sanitizeUrl('/health')).toBe('/health');
  });

  test('несколько параметров перечисляются один раз', () => {
    const cleaned = sanitizeUrl(
      '/trpc/snippets.getSnippetById?batch=1&input=7',
    );

    expect(cleaned).toBe('/trpc/snippets.getSnippetById?batch,input=[скрыто]');
  });
});
