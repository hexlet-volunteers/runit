import { publicProcedure, router } from '../context';
import { runCode, runInputSchema, runnerStatus } from '../runner';

// TODO(#858): добавить rate-limit на runner.run после мержа PR #907
// (требует правки src/index.ts, который сейчас занят auth-контуром).
// Пока частота ограничена только семафором RUNNER_MAX_CONCURRENT.

export const runnerRouter = router({
  /**
   * mutation, а не query: у запуска есть побочные эффекты, его нельзя кэшировать
   * и повторять; query в tRPC ушла бы GET-ом с кодом в URL (в src/index.ts
   * стоит maxParamLength: 1000, плюс код попал бы в логи прокси).
   *
   * Процедура не бросает на инфраструктурных сбоях (нет docker, занято) —
   * возвращает status, иначе клиент получил бы 500 и вечный спиннер.
   */
  run: publicProcedure
    .input(runInputSchema)
    .mutation(({ input }) => runCode(input)),

  status: publicProcedure.query(() => runnerStatus()),
});
