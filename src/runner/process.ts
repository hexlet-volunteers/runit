import { spawn } from 'node:child_process';

export interface ProcessResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  timedOut: boolean;
  truncated: boolean;
  /** 'ENOENT' — исполняемый файл (docker CLI) не найден. */
  spawnErrorCode?: string;
}

export interface RunProcessOptions {
  bin: string;
  args: string[];
  input: string;
  timeoutMs: number;
  maxOutputBytes: number;
  env: NodeJS.ProcessEnv;
  /** Вызывается перед убийством процесса — здесь удаляем контейнер. */
  onKill?: (reason: 'timeout' | 'output_limit') => void;
}

/**
 * Асинхронный запуск процесса с stdin, wall-clock таймаутом и лимитом вывода.
 *
 * Намеренно НЕ spawnSync/execSync (как было в архивном раннере): синхронный вызов
 * блокирует event loop Fastify на всё время исполнения (до 20 с), то есть один
 * бесконечный цикл в сниппете кладёт весь сервер.
 */
export function runProcess(opts: RunProcessOptions): Promise<ProcessResult> {
  return new Promise((resolve) => {
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    let bytes = 0;
    let truncated = false;
    let timedOut = false;
    let settled = false;

    const child = spawn(opts.bin, opts.args, {
      env: opts.env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const settle = (
      result: Omit<ProcessResult, 'stdout' | 'stderr' | 'truncated'>,
    ) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      // Декодируем один раз в конце: иначе многобайтовый символ на границе чанка
      // разъезжается в «мохнатый вопрос».
      resolve({
        ...result,
        truncated,
        stdout: Buffer.concat(stdoutChunks).toString('utf8'),
        stderr: Buffer.concat(stderrChunks).toString('utf8'),
      });
    };

    const kill = (reason: 'timeout' | 'output_limit') => {
      if (reason === 'timeout') timedOut = true;
      opts.onKill?.(reason);
      // SIGTERM проксируется docker CLI в PID 1 контейнера; SIGKILL — страховка
      // для самого CLI, если он не завершился.
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), 1000).unref();
    };

    const timer = setTimeout(() => kill('timeout'), opts.timeoutMs);

    const collect = (chunks: Buffer[]) => (chunk: Buffer) => {
      if (truncated) return;
      bytes += chunk.length;
      if (bytes > opts.maxOutputBytes) {
        const keep = Math.max(0, chunk.length - (bytes - opts.maxOutputBytes));
        if (keep > 0) chunks.push(chunk.subarray(0, keep));
        truncated = true;
        kill('output_limit');
        return;
      }
      chunks.push(chunk);
    };

    child.stdout?.on('data', collect(stdoutChunks));
    child.stderr?.on('data', collect(stderrChunks));

    // Обязательно: если программа не читает stdin и завершилась, запись в закрытый
    // pipe даёт EPIPE, а необработанная ошибка на стриме уронила бы процесс сервера.
    child.stdin?.on('error', () => {});
    child.stdin?.end(opts.input);

    child.on('error', (err: NodeJS.ErrnoException) => {
      settle({
        exitCode: null,
        signal: null,
        timedOut,
        spawnErrorCode: err.code,
      });
    });

    child.on('close', (code, signal) => {
      settle({ exitCode: code, signal, timedOut });
    });
  });
}
