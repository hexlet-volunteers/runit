import { TRPCError } from '@trpc/server';
import { z } from 'zod/v4';
import { adminProcedure, publicProcedure, router } from '../context';
import {
  createSection,
  createSectionSchema,
  getHomePageData,
  getSectionById,
  updateSection,
  updateSectionSchema,
} from '../db/homePage';

/**
 * Секции главной страницы.
 *
 * Мутации назывались admin*, но были объявлены publicProcedure с TODO «добавить
 * проверку прав» — то есть содержимое лендинга мог менять любой посетитель.
 * Это остаток #792: тогда закрыли процедуры пользователей и сниппетов, а этот
 * роутер пропустили, потому что фронтенд его не вызывает.
 *
 * Чтение остаётся публичным: лендинг открыт всем.
 *
 * Замечание на будущее: интерфейс эти данные не использует — главная страница
 * собрана в React статически. Либо появится редактор секций, либо роутер вместе
 * с таблицей sections стоит удалить; решать это отдельно от закрытия дыры.
 */
export const homePageRouter = router({
  getHomePageData: publicProcedure.query(async () => {
    const components = await getHomePageData();
    return {
      components,
    };
  }),

  getComponentById: publicProcedure
    .input(z.number().positive())
    .query(async ({ input }) => {
      const component = await getSectionById(input);
      if (!component) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Component not found',
        });
      }
      return component;
    }),

  adminCreateComponent: adminProcedure
    .input(createSectionSchema)
    .mutation(async ({ input }) => {
      return await createSection(input);
    }),

  adminUpdateComponent: adminProcedure
    .input(updateSectionSchema)
    .mutation(async ({ input }) => {
      return await updateSection(input);
    }),
});
