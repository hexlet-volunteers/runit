import { type SaveStatus } from "..";

/**
 * Язык сниппета → идентификатор языка Monaco.
 *
 * Совпадают не все: у Monaco нет языка «bash», оболочечные скрипты там
 * называются `shell`. Из-за этого bash-сниппеты открывались вообще без
 * подсветки — как обычный текст, — и выглядело это как поломка редактора.
 * Остальные одиннадцать языков совпадают по имени и здесь не перечислены.
 */
export const MONACO_LANGUAGE: Record<string, string> = {
  bash: 'shell',
};

/** Идентификатор языка для Monaco: своё имя, если оно отличается от нашего. */
export const monacoLanguage = (language: string): string =>
  MONACO_LANGUAGE[language] ?? language;

/** Маппинг языка на имя файла по умолчанию. */
export const FILE_NAME_BY_LANGUAGE: Record<string, string> = {
  javascript: 'index.js',
  typescript: 'main.ts',
  python: 'main.py',
  php: 'index.php',
  ruby: 'main.rb',
  java: 'Main.java',
  go: 'main.go',
  cpp: 'main.cpp',
  sql: 'main.sql',
  bash: 'main.sh',
  html: 'index.html',
  css: 'style.css',
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

/**
 * Подписи статуса сохранения.
 *
 * «Не сохранено» заменено на «Сохранить»: прежний текст описывал состояние, но
 * не подсказывал действия, и человек искал глазами кнопку «Сохранить», которой
 * в редакторе нет — сохранение автоматическое. Глагол на том же месте отвечает
 * на вопрос «а как сохранить?» без изменения раскладки.
 */
export const SAVE_STATUS_META: Record<
  SaveStatus,
  { color: string; label: string }
> = {
  saved: { color: '#51cf66', label: 'Сохранено' },
  saving: { color: '#4dabf7', label: 'Сохранение…' },
  unsaved: { color: '#fab005', label: 'Сохранить' },
};