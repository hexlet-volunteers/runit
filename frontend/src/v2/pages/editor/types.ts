/** Статус сохранения сниппета. */
export type SaveStatus = 'saved' | 'saving' | 'unsaved';

/** Мета-информация о языке программирования. */
export type Meta = {
  label: string;
  dot: string;
  runnable: boolean;
}