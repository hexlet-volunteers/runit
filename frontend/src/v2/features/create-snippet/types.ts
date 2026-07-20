/** Свойства модального окна создания сниппета. */
export type Props = {
  opened: boolean;
  onClose: () => void;
};

/** Данные формы создания сниппета для отправки на бэкенд. */
export type FormData = {
  name: string;
  code: string;
  language: 'ruby' | 'java' | 'php' | 'python' | 'javascript' | 'html';
  userId: number;
}