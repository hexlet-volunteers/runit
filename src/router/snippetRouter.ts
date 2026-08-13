import { TRPCError } from '@trpc/server';
import {
  type AuthenticatedUser,
  adminProcedure,
  protectedProcedure,
  publicProcedure,
  router,
} from '../context';
import {
  createSnippet,
  createSnippetSchema,
  deleteSnippet,
  deleteSnippetSchema,
  generateName,
  getAllSnippets,
  getPublicSnippetsByUsername,
  getPublicSnippetsByUsernameSchema,
  getSnippetById,
  getSnippetByIdSchema,
  getSnippetByShortCode,
  getSnippetByShortCodeSchema,
  getSnippetByUsernameSlug,
  getSnippetByUsernameSlugSchema,
  getSnippetOwnerId,
  getSnippetsByUserId,
  setSnippetVisibility,
  setVisibilitySchema,
  updateSnippet,
  updateSnippetSchema,
} from '../db/snippets';

/**
 * Проверка владения перед изменением сниппета (#792, #346).
 *
 * Возвращаем NOT_FOUND, а не FORBIDDEN: FORBIDDEN подтверждает, что сниппет с
 * таким id существует, и перебором чисел собирается карта чужих сниппетов.
 * Владельцу разница не видна — он всегда попадает в ветку успеха.
 *
 * Сниппет без владельца (userId = null — гостевые записи, см. схему) не
 * редактирует никто, кроме админа: присвоить его себе первым пришедшим нельзя.
 */
async function assertCanEditSnippet(
  viewer: AuthenticatedUser,
  snippetId: number,
): Promise<void> {
  const ownerId = await getSnippetOwnerId(snippetId);

  if (ownerId === undefined) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Snippet not found' });
  }

  if (viewer.isAdmin || (ownerId !== null && ownerId === viewer.id)) {
    return;
  }

  throw new TRPCError({ code: 'NOT_FOUND', message: 'Snippet not found' });
}

export const snippetRouter = router({
  /**
   * Сниппет по id — путь редактора. Приватный отдаём только владельцу: до
   * появления авторизации приватный сниппет читался перебором id (#792).
   * Публичный и доступный по ссылке открыт всем, в том числе гостю.
   */
  getSnippetById: publicProcedure
    .input(getSnippetByIdSchema)
    .query(async ({ input, ctx }) => {
      const snippet = await getSnippetById(input);
      const notFound = new TRPCError({
        code: 'NOT_FOUND',
        message: 'Snippet not found',
      });

      if (!snippet) {
        throw notFound;
      }

      if (snippet.visibility === 'private') {
        const isOwner =
          ctx.user != null &&
          (ctx.user.isAdmin ||
            (snippet.userId !== null && snippet.userId === ctx.user.id));

        if (!isOwner) {
          throw notFound;
        }
      }

      return snippet;
    }),

  /**
   * Просмотр по паре username+slug. Приватные отсекает БД-слой, но владелец
   * должен открывать свой черновик по этому пути — иначе редактор ломается на
   * собственном приватном сниппете.
   */
  //пример запроса: input={"username":"testuser3","slug":"l8740h"}
  getSnippetByUsernameSlug: publicProcedure
    .input(getSnippetByUsernameSlugSchema)
    .query(async ({ input, ctx }) => {
      const snippet = await getSnippetByUsernameSlug(
        input.username,
        input.slug,
        ctx.user?.id,
      );
      if (!snippet) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Snippet not found',
        });
      }
      return snippet;
    }),

  /** Служебная выборка всех сниппетов, включая чужие приватные — только админам. */
  getAllSnippets: adminProcedure.query(async () => {
    return await getAllSnippets();
  }),

  /** Свои сниппеты для дашборда — включая приватные. */
  getMySnippets: protectedProcedure.query(async ({ ctx }) => {
    return await getSnippetsByUserId(ctx.user.id);
  }),

  /**
   * Сниппеты пользователя для публичного профиля — без приватных.
   * Профиль обязан ходить сюда, а не в getAllSnippets: иначе посетитель
   * выкачивает все сниппеты сайта и видит чужие приватные.
   */
  getPublicSnippetsByUsername: publicProcedure
    .input(getPublicSnippetsByUsernameSchema)
    .query(async ({ input }) => {
      return await getPublicSnippetsByUsername(input.username);
    }),

  /** Владелец берётся из сессии: создать сниппет от чужого имени нельзя. */
  createSnippet: protectedProcedure
    .input(createSnippetSchema)
    .mutation(async ({ input, ctx }) => {
      return await createSnippet({ ...input, userId: ctx.user.id });
    }),

  updateSnippet: protectedProcedure
    .input(updateSnippetSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, ...updates } = input;
      await assertCanEditSnippet(ctx.user, id);

      return await updateSnippet(id, updates);
    }),

  deleteSnippet: protectedProcedure
    .input(deleteSnippetSchema)
    .mutation(async ({ input, ctx }) => {
      await assertCanEditSnippet(ctx.user, input.id);

      const success = await deleteSnippet(input.id);
      if (!success) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Snippet not found',
        });
      }

      return { success: true, id: input.id };
    }),

  /** Сниппет по короткой ссылке /s/:code. Приватные не отдаются. */
  getSnippetByShortCode: publicProcedure
    .input(getSnippetByShortCodeSchema)
    .query(async ({ input }) => {
      const snippet = await getSnippetByShortCode(input);
      if (!snippet) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Snippet not found',
        });
      }
      return snippet;
    }),

  /** Публикация и снятие публикации — только своего сниппета. */
  setVisibility: protectedProcedure
    .input(setVisibilitySchema)
    .mutation(async ({ input, ctx }) => {
      await assertCanEditSnippet(ctx.user, input.id);

      return await setSnippetVisibility(input.id, input.visibility);
    }),

  generateSnippetName: publicProcedure.query(() => {
    return { name: generateName() };
  }),
});
