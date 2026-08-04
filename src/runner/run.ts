import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { promises as fsp } from 'node:fs';
import path from 'node:path';
import { type Availability, checkDaemon, checkImage } from './availability';
import { dockerEnv, imageTagFor, runnerConfig } from './config';
import { buildDockerArgs } from './dockerArgs';
import { specFor } from './languages';
import { type ProcessResult, runProcess } from './process';
import { tryAcquire } from './slots';
import type { RunLimits, RunnerLanguage, RunOutput } from './types';

export interface RunParams {
  language: RunnerLanguage;
  code: string;
  stdin?: string;
}

/** Внедряемые зависимости — чтобы тестировать все ветки без docker. */
export interface RunDeps {
  runProcess: typeof runProcess;
  checkDaemon: () => Promise<Availability>;
  checkImage: (language: string) => Promise<Availability>;
}

const defaultDeps: RunDeps = { runProcess, checkDaemon, checkImage };

const unavailable = (
  language: string,
  message: string,
  startedAt: number,
): RunOutput => ({
  status: 'unavailable',
  language,
  stdout: '',
  stderr: '',
  exitCode: null,
  durationMs: Math.round(performance.now() - startedAt),
  truncated: false,
  message,
});

/**
 * Убитый `docker run` НЕ убивает контейнер: с --rm демон уберёт его только когда тот
 * завершится сам, а бесконечный цикл не завершится. Поэтому удаляем принудительно
 * по имени. detached + unref, чтобы не задерживать ответ пользователю.
 */
const forceRemoveContainer = (containerName: string) => {
  try {
    const child = spawn(
      runnerConfig.dockerBin,
      ['rm', '-f', '--volumes', containerName],
      {
        env: dockerEnv(),
        detached: true,
        stdio: 'ignore',
      },
    );
    child.unref();
  } catch {
    // best-effort: орфанов дочистит sweepOrphans при следующем старте
  }
};

/** Уборка контейнеров, оставшихся после аварийного завершения сервера. */
export function sweepOrphans(): void {
  try {
    const child = spawn(
      'sh',
      [
        '-c',
        `${runnerConfig.dockerBin} ps -aq --filter label=runit-runner | xargs -r ${runnerConfig.dockerBin} rm -f`,
      ],
      { env: dockerEnv(), detached: true, stdio: 'ignore' },
    );
    child.unref();
  } catch {
    // не критично
  }
}

const mapResult = (
  language: string,
  result: ProcessResult,
  limits: RunLimits,
  startedAt: number,
): RunOutput => {
  const durationMs = Math.round(performance.now() - startedAt);

  if (result.spawnErrorCode === 'ENOENT') {
    return unavailable(
      language,
      'Docker не установлен на сервере — серверное исполнение недоступно.',
      startedAt,
    );
  }

  if (result.timedOut) {
    return {
      status: 'timeout',
      language,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: null,
      durationMs,
      truncated: result.truncated,
      message: `Превышен лимит времени (${Math.round(limits.timeoutMs / 1000)} c)`,
    };
  }

  if (result.truncated) {
    return {
      status: 'output_limit',
      language,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      durationMs,
      truncated: true,
      message: `Вывод обрезан: превышен лимит ${Math.round(limits.maxOutputBytes / 1024)} КБ`,
    };
  }

  return {
    status: 'ok',
    language,
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.exitCode,
    durationMs,
    truncated: false,
    message: null,
  };
};

export async function runCode(
  params: RunParams,
  deps: RunDeps = defaultDeps,
): Promise<RunOutput> {
  const startedAt = performance.now();
  const { language, code } = params;
  const stdin = params.stdin ?? '';

  if (!runnerConfig.enabledLanguages.includes(language)) {
    return unavailable(
      language,
      `Язык ${language} отключён на этом сервере.`,
      startedAt,
    );
  }

  const daemon = await deps.checkDaemon();
  if (!daemon.ok) return unavailable(language, daemon.message, startedAt);

  const image = await deps.checkImage(language);
  if (!image.ok) return unavailable(language, image.message, startedAt);

  const release = tryAcquire();
  if (!release) {
    return {
      ...unavailable(
        language,
        'Сервер занят: слишком много одновременных запусков. Повторите через несколько секунд.',
        startedAt,
      ),
      status: 'busy',
    };
  }

  const spec = specFor(language);
  const limits: RunLimits = { ...runnerConfig.limits, ...spec.limits };
  const containerName = `runit-run-${randomUUID()}`;
  let tmpDir: string | null = null;

  try {
    tmpDir = await fsp.mkdtemp(path.join(runnerConfig.tmpDir, 'runit-runner-'));
    const fileName = spec.fileName(code);
    const source = spec.prepare ? spec.prepare(code) : code;
    await fsp.writeFile(path.join(tmpDir, fileName), source, { mode: 0o600 });
    // Каталог монтируется :ro, но сам он должен быть читаем пользователем контейнера.
    await fsp.chmod(tmpDir, 0o755);

    const args = buildDockerArgs({
      spec,
      limits,
      containerName,
      hostCodeDir: tmpDir,
      imageTag: imageTagFor(language),
      fileName,
    });

    const result = await deps.runProcess({
      bin: runnerConfig.dockerBin,
      args,
      input: stdin,
      timeoutMs: limits.timeoutMs,
      maxOutputBytes: limits.maxOutputBytes,
      env: dockerEnv(),
      onKill: () => forceRemoveContainer(containerName),
    });

    return mapResult(language, result, limits, startedAt);
  } catch (error) {
    console.error('[runner] internal error:', error);
    return {
      status: 'internal_error',
      language,
      stdout: '',
      stderr: '',
      exitCode: null,
      durationMs: Math.round(performance.now() - startedAt),
      truncated: false,
      message: 'Не удалось запустить код из-за внутренней ошибки сервера.',
    };
  } finally {
    release();
    if (tmpDir) {
      await fsp.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}
