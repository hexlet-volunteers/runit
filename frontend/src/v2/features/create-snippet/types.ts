import type { SnippetLanguage } from '../../entities/snippet';

/** Свойства модального окна создания сниппета. */
export type Props = {
  opened: boolean;
  onClose: () => void;
};

/** Данные формы создания сниппета для отправки на бэкенд. */
export type FormData = {
  name: string;
  code: string;
  // Все поддерживаемые языки, а не шесть из них: модалка предлагает выбор
  // по langMeta, где их двенадцать.
  language: SnippetLanguage;
  userId: number;
};
