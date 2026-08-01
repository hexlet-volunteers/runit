/** Стартовые примеры кода для «Начать с примера» и карточек пустого состояния. */
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
