import { z } from 'zod/v4';
import { publicProcedure, router } from '../context';
import {
  createSection,
  createSectionSchema,
  getHomePageData,
  getSectionById,
  updateSection,
  updateSectionSchema,
} from '../db/homePage';

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
        throw new Error('Component not found');
      }
      return component;
    }),

  adminCreateComponent: publicProcedure
    .input(createSectionSchema)
    .mutation(async ({ input }) => {
      // TODO: Добавить проверку аутентификации для проверки прав админа
      const component = await createSection(input);
      return component;
    }),

  adminUpdateComponent: publicProcedure
    .input(updateSectionSchema)
    .mutation(async ({ input }) => {
      // TODO: Добавить проверку аутентификации для проверки прав админа
      const component = await updateSection(input);
      return component;
    }),
});
