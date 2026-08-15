import { SHOW_SOURCE } from './showValue';
import type { ConsoleLine, RunResult } from './types';

/**
 * Исполнение JavaScript-сниппетов в браузере.
 *
 * Две границы, и обе обязательны:
 *
 *  1. **Отдельный origin.** Код выполняется внутри sandbox-iframe без
 *     `allow-same-origin`, то есть в непрозрачном (opaque) origin. Раньше он шёл
 *     в Web Worker, созданный на нашей же странице, — и это была дыра, а не
 *     песочница: воркер делит origin со страницей, поэтому запросы из него шли
 *     с cookie сессии. Проверено экспериментом: сниппет читал `auth.me`
 *     (почта владельца), получал `auth.csrfToken` и выполнял мутации от его
 *     имени — например, публиковал приватный сниппет. Достаточно было открыть
 *     чужой сниппет по ссылке и нажать «Выполнить», то есть ровно то, ради чего
 *     сервис существует.
 *
 *  2. **Отдельный поток.** Внутри песочницы код запускается в Web Worker, иначе
 *     бесконечный цикл в сниппете подвешивал бы вкладку целиком, а не только
 *     свою песочницу.
 *
 * Сеть из песочницы закрыта политикой CSP (`connect-src 'none'`) — так же, как у
 * серверных языков закрыта `--network=none`. Значит из кода нельзя ни утащить
 * данные наружу, ни ходить по внутренней сети.
 */

/** Код внутри воркера: перехват console и запуск сниппета. */
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

/**
 * Документ песочницы: создаёт воркер и служит мостом между ним и страницей.
 *
 * CSP здесь — не украшение, а вторая половина изоляции:
 *  * `default-src 'none'` и `connect-src 'none'` — из песочницы нельзя сделать
 *    ни одного сетевого запроса (fetch, XHR, WebSocket, sendBeacon);
 *  * `script-src 'unsafe-inline' 'unsafe-eval' blob:` — нужны для этого самого
 *    бутстрапа, для воркера из blob и для запуска кода сниппета (`new
 *    Function`). Послабление безопасно ровно здесь: выполнять произвольный код
 *    и есть назначение документа, а вредить ему нечем — ни origin, ни сети, ни
 *    доступа к DOM страницы у него нет. На страницах приложения такие
 *    послабления недопустимы.
 *
 * Воркер наследует CSP создавшего его документа, поэтому запрет сети действует
 * и внутри воркера.
 */
export const SANDBOX_SOURCE = `<!doctype html>
<meta http-equiv="Content-Security-Policy"
      content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' blob:; worker-src blob:; connect-src 'none'">
<script>
  var workerSource = ${JSON.stringify(WORKER_SOURCE)};
  var worker = null;
  addEventListener('message', function (event) {
    // Сообщения принимаем только от страницы, которая нас вставила.
    if (event.source !== parent) return;
    var data = event.data || {};
    if (data.type !== 'run') return;
    try {
      var url = URL.createObjectURL(
        new Blob([workerSource], { type: 'application/javascript' })
      );
      worker = new Worker(url);
      URL.revokeObjectURL(url);
      worker.onmessage = function (e) {
        parent.postMessage({ type: 'result', lines: e.data.lines, exitCode: e.data.exitCode }, '*');
      };
      worker.onerror = function (e) {
        parent.postMessage({ type: 'result', lines: [{ type: 'error', text: e.message }], exitCode: 1 }, '*');
      };
      worker.postMessage({ code: data.code, stdin: data.stdin });
    } catch (err) {
      parent.postMessage({
        type: 'result',
        lines: [{ type: 'error', text: String(err && err.message ? err.message : err) }],
        exitCode: 1,
      }, '*');
    }
  });
  parent.postMessage({ type: 'ready' }, '*');
</script>`;

/** Создаёт скрытый iframe-песочницу. Без allow-same-origin — это и даёт opaque origin. */
export const createSandbox = (): HTMLIFrameElement => {
  const frame = document.createElement('iframe');
  frame.setAttribute('sandbox', 'allow-scripts');
  frame.setAttribute('aria-hidden', 'true');
  frame.title = 'Песочница исполнения JavaScript';
  frame.style.display = 'none';
  frame.srcdoc = SANDBOX_SOURCE;
  document.body.appendChild(frame);
  return frame;
};

export async function runJavaScript(
  code: string,
  stdin = '',
  timeoutMs = 5000,
): Promise<RunResult> {
  const started = performance.now();
  const frame = createSandbox();

  return new Promise<RunResult>((resolve) => {
    let settled = false;

    const finish = (lines: ConsoleLine[], exitCode: number) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      window.removeEventListener('message', onMessage);
      // Удаление iframe убивает и его воркер: зациклившийся сниппет не
      // продолжает жечь процессор после того, как мы отдали ответ.
      frame.remove();
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

    const onMessage = (event: MessageEvent) => {
      /**
       * Источник проверяем по окну, а не по origin: у sandbox-документа origin
       * равен "null", и по нему нельзя отличить нашу песочницу от чужого
       *sandbox-фрейма на той же странице (например, превью вёрстки).
       */
      if (event.source !== frame.contentWindow) return;
      const data = event.data as
        | { type: 'ready' }
        | { type: 'result'; lines: ConsoleLine[]; exitCode: number };

      if (data?.type === 'ready') {
        frame.contentWindow?.postMessage({ type: 'run', code, stdin }, '*');
        return;
      }
      if (data?.type === 'result') {
        finish(data.lines ?? [], data.exitCode ?? 0);
      }
    };

    window.addEventListener('message', onMessage);
  });
}
