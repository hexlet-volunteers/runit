import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { runCode, type ConsoleLine } from '../../../shared/runner';
import { isPreviewLanguage } from '../../../shared/runner/preview';
import { useTRPCClient } from '../../../shared/api';
import { type OutputTab } from '..';

/**
 * Хук управления запуском кода и состоянием консоли.
 *
 * Регистрирует глобальный хоткей Ctrl+Enter. Внутри редактора кода работает
 * команда Monaco (EditorPage), здесь такие события пропускаются — иначе одно
 * нажатие давало бы два запуска (#879).
 *  
 * @param code — текущий код в редакторе
 * @param language — текущий язык
 *
 * @returns стейты консоли (`running`, `lines`, `tab`, `stdin`),
 * сеттеры, `handleRun`, `runRef` (для Monaco-команды), `clearLines`
 */
export default function useRunner(code: string, language: string) {
  const trpc = useTRPCClient();
  const [stdin, setStdin] = useState('');
  const [lines, setLines] = useState<ConsoleLine[]>([]);
  const [running, setRunning] = useState(false);
  const [tab, setTab] = useState<OutputTab>('console');
  // Инкрементируется на каждом запуске: форсирует перерисовку превью вёрстки.
  const [runKey, setRunKey] = useState(0);

  // Рефы для стабильных колбэков (хоткей, monaco-команда, debounce).

  const codeRef = useRef(code);
  const stdinRef = useRef(stdin);
  const languageRef = useRef(language);
  const trpcRef = useRef(trpc);

  codeRef.current = code;
  stdinRef.current = stdin;
  languageRef.current = language;
  trpcRef.current = trpc;

  // --- Запуск -------------------------------------------------------------
  const runningRef = useRef(false);
  /** Запускает код: JS — в Web Worker, Python/PHP/Ruby/Java — на сервере (#821). */
  const handleRun = useCallback(async () => {
    if (runningRef.current) return;

    // Вёрстка (HTML/CSS): «запуск» — это перерисовка превью, сервер не нужен.
    if (isPreviewLanguage(languageRef.current)) {
      setTab('preview');
      setRunKey((n) => n + 1);
      return;
    }

    runningRef.current = true;
    setRunning(true);
    setTab('console');
    // try/finally — чтобы кнопка не залипала в «Выполняется…» при ошибке (#876).
    try {
      const result = await runCode({
        language: languageRef.current,
        code: codeRef.current,
        stdin: stdinRef.current,
        client: trpcRef.current,
      });
      setLines([
        ...result.lines,
        {
          type: 'system',
          text: `Процесс завершён с кодом ${result.exitCode} за ${Math.max(1, Math.round(result.durationMs))} мс`,
        },
      ]);
    } finally {
      runningRef.current = false;
      setRunning(false);
    }
  }, []);

  const runRef = useRef(handleRun);
  runRef.current = handleRun;

  /**
   * Глобальный Ctrl/Cmd+Enter (#879).
   *
   * Внутри редактора кода хоткей не обрабатывается: там своя команда Monaco
   * (см. EditorPage). Раньше срабатывали оба, и одно нажатие давало два запуска
   * — на сервере это два контейнера и два ответа в консоли, а для превью
   * вёрстки двойная перерисовка.
   *
   * В однострочных полях (название сниппета, поиск) хоткей тоже не работает:
   * там Enter принадлежит форме, и запуск кода по нему — неожиданность. В
   * многострочном поле ввода stdin, наоборот, оставлен: набрать данные и
   * запустить не отрывая рук — обычный сценарий.
   */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key !== 'Enter') return;

      const target = e.target as HTMLElement | null;
      if (target?.closest('.monaco-editor')) return;
      if (target instanceof HTMLInputElement) return;
      if (target?.isContentEditable) return;

      e.preventDefault();
      void runRef.current();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return { running, lines, stdin, runRef, setStdin, tab, setTab, runKey, handleRun, clearLines: () => setLines([]) };
}