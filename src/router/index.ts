import { router } from '../context';
import { userRouter } from './userRouter';
import { snippetRouter } from './snippetRouter';

export const appRouter = router({
  users: userRouter,    // Роутер для пользователей
  snippets: snippetRouter, // роутер для сниппетов
});

export type AppRouter = typeof appRouter;
