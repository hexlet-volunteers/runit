import { router } from '../context';
import { homePageRouter } from './homePageRouter';
import { snippetRouter } from './snippetRouter';
import { userRouter } from './userRouter';

export const appRouter = router({
  users: userRouter, // Роутер для пользователей
  snippets: snippetRouter, // Роутер для сниппетов
  homePage: homePageRouter, // Роутер для главной страницы
});

export type AppRouter = typeof appRouter;
