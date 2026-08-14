import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { test } from 'node:test';
import { runnerConfig } from './config';
import type { ProcessResult } from './process';
import { type RunDeps, runCode } from './run';

const okDeps = (result: Partial<ProcessResult>): RunDeps => ({
  checkDaemon: async () => ({ ok: true }),
  checkImage: async () => ({ ok: true }),
  runProcess: async () =>
    ({
      stdout: '',
      stderr: '',
      exitCode: 0,
      signal: null,
      timedOut: false,
      truncated: false,
      ...result,
    }) as ProcessResult,
});

/** Что реально уехало в контейнер: argv и stdin единственного вызова docker. */
const captureCall = async (
  params: Parameters<typeof runCode>[0],
): Promise<{ args: string[]; input: string }> => {
  let call: { args: string[]; input: string } | null = null;
  await runCode(params, {
    checkDaemon: async () => ({ ok: true }),
    checkImage: async () => ({ ok: true }),
    runProcess: async (opts) => {
      call = { args: opts.args, input: opts.input };
      return {
        stdout: '',
        stderr: '',
        exitCode: 0,
        signal: null,
        timedOut: false,
        truncated: false,
      } as ProcessResult;
    },
  });
  assert.ok(call, 'docker не был вызван');
  return call as unknown as { args: string[]; input: string };
};

/** Код, который контейнер получит первой строкой stdin. */
const sourceFrom = (input: string): string =>
  Buffer.from(input.split('\n')[0], 'base64').toString('utf8');

test('успешный запуск: stdout и exitCode проходят наружу', async () => {
  const out = await runCode(
    { language: 'python', code: 'print(1)' },
    okDeps({ stdout: '1\n', exitCode: 0 }),
  );
  assert.equal(out.status, 'ok');
  assert.equal(out.stdout, '1\n');
  assert.equal(out.exitCode, 0);
  assert.equal(out.message, null);
});

test('ошибка в коде пользователя — это status ok с ненулевым кодом', async () => {
  const out = await runCode(
    { language: 'python', code: '1/0' },
    okDeps({ stderr: 'ZeroDivisionError\n', exitCode: 1 }),
  );
  assert.equal(out.status, 'ok');
  assert.equal(out.exitCode, 1);
  assert.match(out.stderr, /ZeroDivisionError/);
});

test('таймаут: статус timeout, exitCode null, сохранён частичный вывод', async () => {
  const out = await runCode(
    { language: 'python', code: 'while True: pass' },
    okDeps({ stdout: 'start\n', timedOut: true, exitCode: null }),
  );
  assert.equal(out.status, 'timeout');
  assert.equal(out.exitCode, null);
  assert.equal(out.stdout, 'start\n');
  assert.match(out.message ?? '', /лимит времени/);
});

test('превышение вывода: output_limit + truncated', async () => {
  const out = await runCode(
    { language: 'python', code: 'while True: print(1)' },
    okDeps({ stdout: 'x'.repeat(10), truncated: true, exitCode: null }),
  );
  assert.equal(out.status, 'output_limit');
  assert.equal(out.truncated, true);
  assert.match(out.message ?? '', /обрез/i);
});

test('нет docker CLI: unavailable с подсказкой, без сырого stderr', async () => {
  const out = await runCode(
    { language: 'python', code: 'print(1)' },
    {
      checkDaemon: async () => ({
        ok: false,
        reason: 'no_cli',
        message:
          'Docker не установлен на сервере — серверное исполнение недоступно.',
      }),
      checkImage: async () => ({ ok: true }),
      runProcess: async () => {
        throw new Error('не должен вызываться');
      },
    },
  );
  assert.equal(out.status, 'unavailable');
  assert.match(out.message ?? '', /Docker не установлен/);
  assert.equal(out.stderr, '');
});

test('нет образа: unavailable с инструкцией по сборке', async () => {
  const out = await runCode(
    { language: 'ruby', code: 'puts 1' },
    {
      checkDaemon: async () => ({ ok: true }),
      checkImage: async () => ({
        ok: false,
        reason: 'no_image',
        message:
          'Образ runit-runner-ruby:1 не собран. Выполните: npm run runner:build-images',
      }),
      runProcess: async () => {
        throw new Error('не должен вызываться');
      },
    },
  );
  assert.equal(out.status, 'unavailable');
  assert.match(out.message ?? '', /runner:build-images/);
});

test('spawn ENOENT внутри запуска тоже даёт unavailable, а не 500', async () => {
  const out = await runCode(
    { language: 'python', code: 'print(1)' },
    okDeps({ spawnErrorCode: 'ENOENT', exitCode: null }),
  );
  assert.equal(out.status, 'unavailable');
});

test('семафор: при исчерпании слотов возвращается busy', async () => {
  const slow: RunDeps = {
    checkDaemon: async () => ({ ok: true }),
    checkImage: async () => ({ ok: true }),
    runProcess: () =>
      new Promise((resolve) =>
        setTimeout(
          () =>
            resolve({
              stdout: '',
              stderr: '',
              exitCode: 0,
              signal: null,
              timedOut: false,
              truncated: false,
            } as ProcessResult),
          150,
        ),
      ),
  };
  const total = runnerConfig.maxConcurrent + 2;
  const results = await Promise.all(
    Array.from({ length: total }, () =>
      runCode({ language: 'python', code: 'print(1)' }, slow),
    ),
  );
  const busy = results.filter((r) => r.status === 'busy');
  assert.equal(busy.length, 2);
  assert.match(busy[0].message ?? '', /занят/i);
});

test('на диске приложения не остаётся ничего: файлов кода больше нет', async () => {
  // Раньше код писался во временный каталог и монтировался в контейнер, а сам
  // каталог приходилось убирать во всех ветках. Теперь код едет через stdin, и
  // на хосте приложения не появляется ни файла, ни каталога — убирать нечего.
  const before = readdirSync(tmpdir()).filter((n) =>
    n.startsWith('runit-runner-'),
  ).length;

  await runCode(
    { language: 'python', code: 'print(1)' },
    okDeps({ exitCode: 0 }),
  );
  await runCode(
    { language: 'python', code: 'x' },
    okDeps({ timedOut: true, exitCode: null }),
  );

  assert.equal(
    readdirSync(tmpdir()).filter((n) => n.startsWith('runit-runner-')).length,
    before,
  );
});

test('внутренний сбой не роняет процедуру', async () => {
  const out = await runCode(
    { language: 'python', code: 'print(1)' },
    {
      checkDaemon: async () => ({ ok: true }),
      checkImage: async () => ({ ok: true }),
      runProcess: async () => {
        throw new Error('boom');
      },
    },
  );
  assert.equal(out.status, 'internal_error');
  assert.equal(out.exitCode, null);
});

test('отключённый язык не доходит до docker', async () => {
  const original = [...runnerConfig.enabledLanguages];
  runnerConfig.enabledLanguages = ['python'];
  const out = await runCode(
    { language: 'java', code: 'class Main {}' },
    {
      checkDaemon: async () => ({ ok: true }),
      checkImage: async () => ({ ok: true }),
      runProcess: async () => {
        throw new Error('не должен вызываться');
      },
    },
  );
  runnerConfig.enabledLanguages = original;
  assert.equal(out.status, 'unavailable');
  assert.match(out.message ?? '', /отключён/);
});

test('имя файла в контейнере берётся из кода (java — по имени класса)', async () => {
  const { args } = await captureCall({
    language: 'java',
    code: 'public class Solution { }',
  });

  const bootstrap = args[args.length - 1];
  assert.match(
    bootstrap,
    /\/tmp\/Solution\.java/,
    `имя файла из имени класса, а не ${bootstrap}`,
  );
});

test('код едет первой строкой stdin, ввод пользователя — следом', async () => {
  /**
   * Ровно то, что было сломано в проде: код доставлялся монтированием каталога,
   * а путь монтирования разбирает демон. В контейнере и на отдельном
   * runner-хосте контейнер получал пустой /app.
   */
  const { args, input } = await captureCall({
    language: 'python',
    code: 'print(input())',
    stdin: 'привет\nвторая строка',
  });

  assert.equal(args[0], 'run', 'запуск — одна команда docker run');
  assert.equal(args.includes('-v'), false, 'bind-mount кода недопустим');
  assert.equal(sourceFrom(input), 'print(input())');
  // После первой строки в stdin остаётся ровно ввод пользователя.
  assert.equal(input.slice(input.indexOf('\n') + 1), 'привет\nвторая строка');
});

test('подготовка кода применяется до отправки (php получает тег)', async () => {
  const { input } = await captureCall({
    language: 'php',
    code: "echo 'привет';",
  });
  assert.equal(sourceFrom(input), "<?php echo 'привет';");
});

test('кавычки и переводы строк в коде не ломают команду', async () => {
  // base64 выбран именно за это: код попадает в контейнер как данные, а не как
  // часть shell-команды, поэтому кавычки, $ и переводы строк безопасны.
  const code = `print("a'b"c$d")\nprint('конец')`;
  const { input } = await captureCall({ language: 'python', code });
  assert.equal(sourceFrom(input), code);
});
