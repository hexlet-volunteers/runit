// MVP-раннер: исполняет JavaScript в Web Worker с перехватом console.* и stdin.
// TODO(#821, #609): заменить на серверный сервис исполнения (все языки, докер).

export type ConsoleLine = {
  type: 'log' | 'error' | 'warn' | 'info' | 'system';
  text: string;
};

export type RunResult = {
  lines: ConsoleLine[];
  exitCode: number;
  durationMs: number;
};

const WORKER_SOURCE = `
  const lines = [];
  const push = (type, args) =>
    lines.push({ type, text: args.map((a) => {
      if (typeof a === 'string') return a;
      try { return JSON.stringify(a); } catch { return String(a); }
    }).join(' ') });
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
          [{ type: 'error', text: `Превышен лимит времени (${timeoutMs / 1000} c)` }],
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

export function unsupportedLanguage(language: string): RunResult {
  // TODO(#821, #616, #538): серверное исполнение остальных языков.
  return {
    lines: [
      {
        type: 'system',
        text: `Среда исполнения для «${language}» появится позже — в MVP выполняется только JavaScript (#821).`,
      },
    ],
    exitCode: 0,
    durationMs: 0,
  };
}
