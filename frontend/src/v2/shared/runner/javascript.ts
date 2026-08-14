import { SHOW_SOURCE } from './showValue';
import type { ConsoleLine, RunResult } from './types';

// JavaScript исполняется в браузере, в Web Worker: мгновенно, офлайн и без нагрузки
// на сервер. Изоляцию даёт сам браузер (отдельный поток, нет доступа к DOM страницы).

const WORKER_SOURCE = `
  const lines = [];
  ${SHOW_SOURCE}
  const push = (type, args) =>
    lines.push({ type, text: args.map((a) => show(a, 0)).join(' ') });
  ['log', 'error', 'warn', 'info'].forEach((m) => {
    console[m] = (...args) => push(m === 'info' ? 'info' : m, args);
  });
  self.onmessage = (e) => {
    const { code, stdin } = e.data;
    const stdinLines = (stdin || '').split('\\n');
    let cursor = 0;
    self.readline = () => (cursor < stdinLines.length ? stdinLines[cursor++] : null);
    self.prompt = self.readline;
    let exitCode = 0;
    try {
      new Function(code)();
    } catch (err) {
      exitCode = 1;
      push('error', [err && err.stack ? String(err.message) : String(err)]);
    }
    self.postMessage({ lines, exitCode });
  };
`;

export async function runJavaScript(
  code: string,
  stdin = '',
  timeoutMs = 5000,
): Promise<RunResult> {
  const started = performance.now();
  const blob = new Blob([WORKER_SOURCE], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  const worker = new Worker(url);

  return new Promise<RunResult>((resolve) => {
    const finish = (lines: ConsoleLine[], exitCode: number) => {
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve({ lines, exitCode, durationMs: performance.now() - started });
    };
    const timer = setTimeout(
      () =>
        finish(
          [
            {
              type: 'error',
              text: `Превышен лимит времени (${timeoutMs / 1000} c)`,
            },
          ],
          1,
        ),
      timeoutMs,
    );
    worker.onmessage = (e) => {
      clearTimeout(timer);
      finish(e.data.lines, e.data.exitCode);
    };
    worker.onerror = (e) => {
      clearTimeout(timer);
      finish([{ type: 'error', text: e.message }], 1);
    };
    worker.postMessage({ code, stdin });
  });
}
