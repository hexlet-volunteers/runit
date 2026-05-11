import { router, publicProcedure } from '../context';
import { z } from 'zod/v4';
import {
  getHomePageData,
  getSectionById,
  createSection,
  updateSection,
  createSectionSchema,
  updateSectionSchema,
} from '../db/homePage';

/**
 * Получение данных главной страницы и редактирование компонентов
*/
export const homePageRouter = router({
  /**
   * @route homePage.getHomePageData
   * @returns {HomePageData} Данные главной страницы в структуре для фронтенда
  */
  getHomePageData: publicProcedure
    .query(async () => {
      const components = await getHomePageData();
      return {
        components,
      };
    }),

  /**
   * Получение одного компонента по ID
  */
  getComponentById: publicProcedure
    .input(z.number().positive())
    .query(async ({ input }) => {
      const component = await getSectionById(input);
      if (!component) {
        throw new Error('Component not found');
      }
      return component;
    }),

  /**
   * Создание нового компонента
  */
  adminCreateComponent: publicProcedure
    .input(createSectionSchema)
    .mutation(async ({ input }) => {
      // TODO: Добавить проверку аутентификации для проверки прав админа
      const component = await createSection(input);
      return component;
    }),

  /**
   * Редактирование компонента
  */
  adminUpdateComponent: publicProcedure
    .input(updateSectionSchema)
    .mutation(async ({ input }) => {
      // TODO: Добавить проверку аутентификации для проверки прав админа
      const component = await updateSection(input);
      return component;
    }),
});
