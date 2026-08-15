import { describe, expect, test } from 'vitest';
import { type RunnerClient, runOnServer } from './server';

/**
 * Клиент серверного исполнения.
 *
 * Главное, что здесь проверяется, — различение двух разных бед, которые раньше
 * сливались в одну строку «Сервер исполнения недоступен, попробуйте позже»:
 *
 *  * приложение вообще не отвечает (упало, нет сети) — тогда дело не в раннере,
 *    и искать причину в нём бесполезно. Ровно на это и наткнулись: бэкенд был
 *    остановлен, а сообщение указывало на исполнение кода;
 *  * сервер ответил, но исполнение недоступно — тогда у ответа есть свой
 *    понятный текст, и подменять его нельзя.
 */

const clientThatThrows = (error: unknown): RunnerClient => ({
  runner: {
    run: {
      mutate: async () => {
        throw error;
      },
    },
  },
});

const params = { language: 'python' as const, code: 'print(1)' };

describe('сбой связи', () => {
  test('сервер не отвечает — говорим про связь, а не про раннер', async () => {
    const out = await runOnServer(clientThatThrows(new TypeError('fetch failed')), params);

    const text = out.lines[0].text;
    expect(text).toContain('связаться с сервером');
    expect(text).not.toContain('исполнения недоступен');
    expect(out.exitCode).toBe(1);
  });

  test('истёкшее ожидание названо своим именем и с числом секунд', async () => {
    const timeout = new DOMException('The operation timed out', 'TimeoutError');

    const out = await runOnServer(clientThatThrows(timeout), params, 30_000);

    expect(out.lines[0].text).toContain('30');
    expect(out.lines[0].text).toMatch(/не пришёл|перегружен/i);
  });

  test('таймаут узнаётся и когда клиент завернул его в свою ошибку', async () => {
    // tRPC оборачивает исходную ошибку, поэтому смотрим и на cause.
    const wrapped = Object.assign(new Error('failed'), {
      cause: new DOMException('aborted', 'AbortError'),
    });

    const out = await runOnServer(clientThatThrows(wrapped), params, 20_000);

    expect(out.lines[0].text).toContain('20');
  });
});

describe('ответ сервера', () => {
  test('недоступное исполнение показывается сообщением сервера', async () => {
    const client: RunnerClient = {
      runner: {
        run: {
          mutate: async () => ({
            status: 'unavailable' as const,
            message: 'Серверное исполнение сейчас недоступно. Попробуйте позже.',
            exitCode: null,
          }),
        },
      },
    };

    const out = await runOnServer(client, params);

    expect(out.lines.some((l) => l.text.includes('Серверное исполнение'))).toBe(
      true,
    );
  });

  test('успешный запуск отдаёт вывод и код возврата', async () => {
    const client: RunnerClient = {
      runner: {
        run: {
          mutate: async () => ({
            status: 'ok' as const,
            stdout: 'привет\n',
            exitCode: 0,
            durationMs: 42,
          }),
        },
      },
    };

    const out = await runOnServer(client, params);

    expect(out.exitCode).toBe(0);
    expect(out.lines.some((l) => l.text === 'привет')).toBe(true);
  });
});
