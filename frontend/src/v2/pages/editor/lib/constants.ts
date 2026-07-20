import { type SaveStatus } from "..";

/** Маппинг языка на имя файла по умолчанию. */
export const FILE_NAME_BY_LANGUAGE: Record<string, string> = {
  javascript: 'index.js',
  typescript: 'index.ts',
  python: 'main.py',
  php: 'index.php',
  ruby: 'main.rb',
  java: 'Main.java',
  html: 'index.html',
};

export const STARTER_CODE = `// Корзина курса: считаем итоговую стоимость
const items = [
  { title: 'JS: Массивы', price: 3900 },
  { title: 'JS: Функции', price: 4900 },
  { title: 'JS: Объекты', price: 4400 },
];

const sum = (nums) => nums.reduce((acc, n) => acc + n, 0);
const total = sum(items.map((item) => item.price));

console.log('Позиций в корзине:', items.length);
console.log('Сумма без скидки:', total, '₽');
`;

/** Мета-информация для каждого статуса сохранения. */
export const SAVE_STATUS_META: Record<SaveStatus, { color: string; label: string }> = {
  saved: { color: '#51cf66', label: 'Сохранено' },
  saving: { color: '#4dabf7', label: 'Сохранение…' },
  unsaved: { color: '#adb5bd', label: 'Не сохранено' },
};