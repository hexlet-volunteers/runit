/** Свойства модального окна «Поделиться сниппетом». */
export type Props = {
  opened: boolean;
  onClose: () => void;
  username: string;
  slug: string;
  saved: boolean;
};
