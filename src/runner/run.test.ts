import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
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

const tmpDirsBefore = () =>
  readdirSync(runnerConfig.tmpDir).filter((n) => n.startsWith('runit-runner-'))
    .length;

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

test('временный каталог удаляется во всех ветках', async () => {
  const before = tmpDirsBefore();
  await runCode(
    { language: 'python', code: 'print(1)' },
    okDeps({ exitCode: 0 }),
  );
  await runCode(
    { language: 'python', code: 'x' },
    okDeps({ timedOut: true, exitCode: null }),
  );
  await runCode(
    { language: 'python', code: 'x' },
    {
      checkDaemon: async () => ({ ok: true }),
      checkImage: async () => ({ ok: true }),
      runProcess: async () => {
        throw new Error('внутренний сбой');
      },
    },
  );
  assert.equal(
    tmpDirsBefore(),
    before,
    'остались неудалённые каталоги runit-runner-*',
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

test('stdin передаётся в процесс', async () => {
  let captured: string | null = null;
  const out = await runCode(
    { language: 'python', code: 'print(input())', stdin: 'hi' },
    {
      checkDaemon: async () => ({ ok: true }),
      checkImage: async () => ({ ok: true }),
      runProcess: async (opts) => {
        captured = opts.input;
        return {
          stdout: 'hi\n',
          stderr: '',
          exitCode: 0,
          signal: null,
          timedOut: false,
          truncated: false,
        } as ProcessResult;
      },
    },
  );
  assert.equal(captured, 'hi');
  assert.equal(out.stdout, 'hi\n');
});

test('файл кода пишется с ожидаемым именем (java — по имени класса)', async () => {
  let mounted: string | null = null;
  await runCode(
    { language: 'java', code: 'public class Solution { }' },
    {
      checkDaemon: async () => ({ ok: true }),
      checkImage: async () => ({ ok: true }),
      runProcess: async (opts) => {
        const vIdx = opts.args.indexOf('-v');
        mounted = opts.args[vIdx + 1].split(':')[0];
        assert.ok(
          existsSync(`${mounted}/Solution.java`),
          'файл Solution.java не создан',
        );
        return {
          stdout: '',
          stderr: '',
          exitCode: 0,
          signal: null,
          timedOut: false,
          truncated: false,
        } as ProcessResult;
      },
    },
  );
  assert.ok(mounted);
  assert.ok(
    !existsSync(mounted as unknown as string),
    'каталог не убран после запуска',
  );
});
