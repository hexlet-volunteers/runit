import { router } from '../context';
import { userRouter } from './userRouter';
import { snippetRouter } from './snippetRouter';
import { testDataRouter } from '../../tmp/testDataRouter';

export const appRouter = router({
  users: userRouter,    // Роутер для пользователей
  snippets: snippetRouter, // роутер для сниппетов
  testData: testDataRouter // роутер для проверки работоспособности БД
});

export type AppRouter = typeof appRouter;
