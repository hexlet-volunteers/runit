import { publicProcedure, router } from '../context';
import {
  createSnippet,
  createSnippetSchema,
  deleteSnippet,
  deleteSnippetSchema,
  generateName,
  getAllSnippets,
  getSnippetById,
  getSnippetByIdSchema,
  getSnippetByShortCode,
  getSnippetByShortCodeSchema,
  getSnippetByUsernameSlug,
  getSnippetByUsernameSlugSchema,
  setSnippetVisibility,
  setVisibilitySchema,
  updateSnippet,
  updateSnippetSchema,
} from '../db/snippets';

export const snippetRouter = router({
  getSnippetById: publicProcedure
    .input(getSnippetByIdSchema)
    .query(async ({ input }) => {
      const snippet = await getSnippetById(input);
      if (!snippet) {
        throw new Error('Snippet not found');
      }
      return snippet;
    }),

  //пример запроса: input={"username":"testuser3","slug":"l8740h"}
  getSnippetByUsernameSlug: publicProcedure
    .input(getSnippetByUsernameSlugSchema)
    .query(async ({ input }) => {
      const snippet = await getSnippetByUsernameSlug(
        input.username,
        input.slug,
      );
      if (!snippet) {
        throw new Error('Snippet not found');
      }
      return snippet;
    }),

  getAllSnippets: publicProcedure.query(async () => {
    return await getAllSnippets();
  }),

  createSnippet: publicProcedure
    .input(createSnippetSchema)
    .mutation(async ({ input }) => {
      return await createSnippet(input);
    }),

  updateSnippet: publicProcedure
    .input(updateSnippetSchema)
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      const updatedSnippet = await updateSnippet(id, updates);

      if (!updatedSnippet) {
        throw new Error('Snippet not found');
      }

      return updatedSnippet;
    }),

  deleteSnippet: publicProcedure
    .input(deleteSnippetSchema)
    .mutation(async ({ input }) => {
      const success = await deleteSnippet(input.id);

      if (!success) {
        throw new Error('Snippet not found');
      }

      return { success: true, id: input.id };
    }),

  /** Сниппет по короткой ссылке /s/:code. Приватные не отдаются. */
  getSnippetByShortCode: publicProcedure
    .input(getSnippetByShortCodeSchema)
    .query(async ({ input }) => {
      const snippet = await getSnippetByShortCode(input);
      if (!snippet) {
        throw new Error('Snippet not found');
      }
      return snippet;
    }),

  /**
   * Публикация и снятие публикации.
   * TODO(#792): проверять, что текущий пользователь — владелец, как только
   * появится авторизация.
   */
  setVisibility: publicProcedure
    .input(setVisibilitySchema)
    .mutation(async ({ input }) =>
      setSnippetVisibility(input.id, input.visibility),
    ),

  generateSnippetName: publicProcedure.query(() => {
    return { name: generateName() };
  }),
});
