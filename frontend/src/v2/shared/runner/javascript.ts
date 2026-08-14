import type { ConsoleLine, RunResult } from './types';

// JavaScript исполняется в браузере, в Web Worker: мгновенно, офлайн и без нагрузки
// на сервер. Изоляцию даёт сам браузер (отдельный поток, нет доступа к DOM страницы).

const WORKER_SOURCE = `
  const lines = [];
  /**
   * Печать значения так, как это делает консоль Node (#880).
   *
   * JSON.stringify здесь недостаточно: для undefined он возвращает undefined
   * (не строку), и console.log(undefined) печатал пустую строку — человек видел
   * пустую строку вместо значения и не понимал, сработал ли код. По той же
   * причине терялись функции, символы и NaN, а Infinity превращался в null.
   *
   * Циклические ссылки JSON.stringify роняет исключением — на них
   * возвращается [Circular].
   */
  const show = (value, depth) => {
    if (typeof value === 'string') return depth > 0 ? JSON.stringify(value) : value;
    if (value === undefined) return 'undefined';
    if (value === null) return 'null';
    if (typeof value === 'number') return Object.is(value, -0) ? '-0' : String(value);
    if (typeof value === 'bigint') return String(value) + 'n';
    if (typeof value === 'boolean') return String(value);
    if (typeof value === 'symbol') return value.toString();
    if (typeof value === 'function')
      return '[Function: ' + (value.name || 'anonymous') + ']';
    if (value instanceof Error) return value.stack || String(value);
    if (depth > 4) return Array.isArray(value) ? '[Array]' : '[Object]';
    if (Array.isArray(value))
      return '[ ' + value.map((item) => show(item, depth + 1)).join(', ') + ' ]';
    if (value instanceof Map)
      return 'Map(' + value.size + ') { ' + [...value].map(([k, v]) =>
        show(k, depth + 1) + ' => ' + show(v, depth + 1)).join(', ') + ' }';
    if (value instanceof Set)
      return 'Set(' + value.size + ') { ' + [...value].map((item) =>
        show(item, depth + 1)).join(', ') + ' }';
    if (value instanceof Date) return value.toISOString();
    try {
      const entries = Object.entries(value).map(
        ([key, item]) => key + ': ' + show(item, depth + 1),
      );
      return entries.length === 0 ? '{}' : '{ ' + entries.join(', ') + ' }';
    } catch {
      return '[Circular]';
    }
  };
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
