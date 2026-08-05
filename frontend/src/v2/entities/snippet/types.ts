export type Snippet = {
  id: number;
  name: string;
  slug: string;
  code: string;
  language: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
  /** Код короткой ссылки /s/aB3xK9. Есть у всех сниппетов, созданных после #918. */
  shortCode?: string | null;
  /** private | link | public. */
  visibility?: string;
  /**
   * Логин автора. Приходит только от getSnippetByShortCode — там он нужен,
   * потому что в короткой ссылке имени пользователя нет.
   */
  authorUsername?: string | null;
};
