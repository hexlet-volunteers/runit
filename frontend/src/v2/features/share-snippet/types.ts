/** Свойства модального окна «Поделиться сниппетом». */
export type Props = {
  opened: boolean;
  onClose: () => void;
  username: string;
  slug: string;
  saved: boolean;
  /** id сниппета — нужен для смены уровня доступа. */
  snippetId?: number | null;
  /** Короткий код публичной ссылки (/s/aB3xK9). */
  shortCode?: string | null;
  /** Текущий уровень доступа: private | link | public. */
  visibility?: string | null;
};
