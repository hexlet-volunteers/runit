// Пример из макета (docs/design/embed.png): урок про стрелочные функции.
export const DEMO_FILE_NAME = 'greet.js';

export const DEMO_CODE = [
  '// Стрелочная функция: параметры ⇒ результат',
  'const greet = (name) => `Привет, ${name}!`;',
  '',
  "const names = ['Хекслет', 'мир', 'Runit'];",
  '',
  'names.forEach((name) => {',
  '  console.log(greet(name));',
  '});',
].join('\n');

/** Варианты встраивания из макета: переключатель «вариант». */
export const EMBED_VARIANTS = [
  { value: 'card', label: 'Карточка' },
  { value: 'minimal', label: 'Минимальный' },
  { value: 'tabs', label: 'Вкладки' },
] as const;

export type EmbedVariant = (typeof EMBED_VARIANTS)[number]['value'];
