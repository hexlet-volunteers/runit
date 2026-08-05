import { runnerConfig } from './config';

// Ограничение параллельности. Без него 50 одновременных запросов = 50 контейнеров:
// каждый в своих лимитах, а хост лежит.
// Очередь сознательно не делаем: она даёт неограниченный рост памяти и пользователя,
// который смотрит на спиннер. Нет слота — сразу отвечаем `busy`.

let active = 0;

export function tryAcquire(): (() => void) | null {
  if (active >= runnerConfig.maxConcurrent) return null;
  active += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    active -= 1;
  };
}

export const activeRuns = (): number => active;
