import { router } from '../context';
import { userRouter } from './userRouter';
import { snippetRouter } from './snippetRouter';
import { homePageRouter } from './homePageRouter';

export const appRouter = router({
  users: userRouter,    // Роутер для пользователей
  snippets: snippetRouter, // Роутер для сниппетов
  homePage: homePageRouter, // Роутер для главной страницы
});

export type AppRouter = typeof appRouter;
