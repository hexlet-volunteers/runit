// Общие типы и утилиты личного кабинета «Мои сниппеты».

export type Snippet = {
  id: number;
  name: string;
  slug: string;
  code: string;
  language: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
};

export const SNIPPETS_QUERY_KEY = ['v2', 'snippets', 'all'] as const;

const plural = (n: number, forms: [string, string, string]): string => {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return forms[0];
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return forms[1];
  return forms[2];
};

// Относительная дата по-русски: «2 часа назад», «вчера», «месяц назад».
export function relativeDate(input: string | Date): string {
  if (!input) return 'недавно'; // бэкенд может отдавать null в createdAt (баг таймстампов схемы)
  const date = new Date(input);
  const diffMs = Date.now() - date.getTime();
  if (Number.isNaN(date.getTime())) return '';
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'только что';
  if (minutes < 60) {
    return `${minutes} ${plural(minutes, ['минуту', 'минуты', 'минут'])} назад`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${plural(hours, ['час', 'часа', 'часов'])} назад`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'вчера';
  if (days < 7) return `${days} ${plural(days, ['день', 'дня', 'дней'])} назад`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return weeks === 1
      ? 'неделю назад'
      : `${weeks} ${plural(weeks, ['неделю', 'недели', 'недель'])} назад`;
  }
  const months = Math.floor(days / 30);
  if (months < 12) {
    return months === 1
      ? 'месяц назад'
      : `${months} ${plural(months, ['месяц', 'месяца', 'месяцев'])} назад`;
  }
  const years = Math.floor(months / 12);
  return years === 1 ? 'год назад' : `${years} ${plural(years, ['год', 'года', 'лет'])} назад`;
}

// Стартовые примеры кода для «Начать с примера кода» и карточек пустого состояния.
export const sampleCode: Record<string, string> = {
  javascript: [
    '// Пример: сумма корзины со скидкой',
    'const cart = [120, 250, 80];',
    'const total = cart.reduce((acc, price) => acc + price, 0);',
    "console.log('Итого со скидкой 10%:', total * 0.9);",
  ].join('\n'),
  typescript: [
    '// Пример: сужение типов',
    'type Shape = { kind: "circle"; r: number } | { kind: "square"; size: number };',
    'const area = (s: Shape) =>',
    '  s.kind === "circle" ? Math.PI * s.r ** 2 : s.size ** 2;',
    'console.log(area({ kind: "circle", r: 2 }));',
  ].join('\n'),
  python: [
    '# Пример: числа Фибоначчи',
    'def fib(n):',
    '    a, b = 0, 1',
    '    for _ in range(n):',
    '        a, b = b, a + b',
    '    return a',
    '',
    'print([fib(i) for i in range(10)])',
  ].join('\n'),
  php: [
    '<?php',
    '// Пример: валидация email',
    "$email = 'user@example.com';",
    'var_dump(filter_var($email, FILTER_VALIDATE_EMAIL));',
  ].join('\n'),
  ruby: [
    '# Пример: обёртка с повторными запросами',
    '3.times do |attempt|',
    '  puts "Попытка #{attempt + 1}"',
    'end',
  ].join('\n'),
  java: [
    'public class Main {',
    '    public static void main(String[] args) {',
    '        System.out.println("Привет, Runit!");',
    '    }',
    '}',
  ].join('\n'),
  html: [
    '<!doctype html>',
    '<html lang="ru">',
    '  <body>',
    '    <h1>Привет, Runit!</h1>',
    '  </body>',
    '</html>',
  ].join('\n'),
};
