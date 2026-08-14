import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ProcessResult, RunProcessOptions } from './process';
import { ensureImages, type ImageDeps, isRemoteImage } from './images';

/**
 * Доставка образов раннера на хост.
 *
 * Проверяется поведение, из-за отсутствия которого на боевом стенде не работали
 * девять языков из двенадцати: образы приложения публиковались, а образы
 * раннера никто не собирал и не доставлял, при полностью зелёном деплое.
 */

const result = (over: Partial<ProcessResult> = {}): ProcessResult =>
  ({
    stdout: '',
    stderr: '',
    exitCode: 0,
    signal: null,
    timedOut: false,
    truncated: false,
    ...over,
  }) as ProcessResult;

/** Записывает вызовы docker и отвечает по сценарию: команда → результат. */
const depsFor = (
  answer: (args: string[]) => ProcessResult,
): { deps: ImageDeps; calls: string[][] } => {
  const calls: string[][] = [];
  const deps: ImageDeps = {
    runProcess: async (opts: RunProcessOptions) => {
      calls.push(opts.args);
      return answer(opts.args);
    },
  };
  return { deps, calls };
};

test('ссылка на реестр отличается от локального имени', () => {
  assert.equal(isRemoteImage('ghcr.io/hexlet-volunteers/runit-runner-go:1'), true);
  assert.equal(isRemoteImage('registry:5000/runit-runner-go:1'), true);
  assert.equal(isRemoteImage('localhost/runit-runner-go:1'), true);
  // Локальные имена не тянем: docker пошёл бы за ними в Docker Hub и ответил
  // «pull access denied» — сообщение, из которого настоящая причина не следует.
  assert.equal(isRemoteImage('runit-runner-go:1'), false);
  assert.equal(isRemoteImage('library/python:3'), false);
});

test('существующий образ не скачивается заново', async () => {
  const { deps, calls } = depsFor(() => result({ exitCode: 0 }));

  const reports = await ensureImages(['python'], deps);

  assert.equal(reports[0].state, 'present');
  assert.deepEqual(
    calls.map((c) => c[0]),
    ['image'],
    'после успешного inspect docker pull вызываться не должен',
  );
});

test('отсутствующий образ из реестра скачивается', async () => {
  process.env.RUNNER_IMAGE_PREFIX = 'ghcr.io/hexlet-volunteers/runit-runner';
  const { runnerConfig } = await import('./config');
  // config читается один раз при импорте, поэтому правим уже собранное значение.
  runnerConfig.imagePrefix = 'ghcr.io/hexlet-volunteers/runit-runner';

  const { deps, calls } = depsFor((args) =>
    args[0] === 'image' ? result({ exitCode: 1 }) : result({ exitCode: 0 }),
  );

  const reports = await ensureImages(['go'], deps);

  assert.equal(reports[0].state, 'pulled');
  assert.deepEqual(calls[1], [
    'pull',
    'ghcr.io/hexlet-volunteers/runit-runner-go:1',
  ]);
});

test('неудачное скачивание не бросает исключение, а объясняет причину', async () => {
  const { runnerConfig } = await import('./config');
  runnerConfig.imagePrefix = 'ghcr.io/hexlet-volunteers/runit-runner';

  const { deps } = depsFor((args) =>
    args[0] === 'image'
      ? result({ exitCode: 1 })
      : result({ exitCode: 1, stderr: 'manifest unknown' }),
  );

  const reports = await ensureImages(['java'], deps);

  assert.equal(reports[0].state, 'failed');
  assert.match(reports[0].detail ?? '', /manifest unknown/);
});

test('локальный образ не пытаются тянуть из сети', async () => {
  const { runnerConfig } = await import('./config');
  runnerConfig.imagePrefix = 'runit-runner';

  const { deps, calls } = depsFor(() => result({ exitCode: 1 }));

  const reports = await ensureImages(['ruby'], deps);

  assert.equal(reports[0].state, 'local_missing');
  assert.match(reports[0].detail ?? '', /runner:build-images/);
  assert.equal(
    calls.some((c) => c[0] === 'pull'),
    false,
    'docker pull для локального имени вызываться не должен',
  );
});
