import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { runJavaScript, unsupportedLanguage, type ConsoleLine } from '../../../shared/runner';
import { type OutputTab } from '..';

/**
 * Хук управления запуском кода и состоянием консоли.
 *
 * Регистрирует глобальный хоткей Ctrl+Enter (дублируется Monaco-командой из EditorPage).
 *  
 * @param code — текущий код в редакторе
 * @param language — текущий язык
 *
 * @returns стейты консоли (`running`, `lines`, `tab`, `stdin`),
 * сеттеры, `handleRun`, `runRef` (для Monaco-команды), `clearLines`
 */
export default function useRunner(code: string, language: string) {
  const [stdin, setStdin] = useState('');
  const [lines, setLines] = useState<ConsoleLine[]>([]);
  const [running, setRunning] = useState(false);
  const [tab, setTab] = useState<OutputTab>('console');

  // Рефы для стабильных колбэков (хоткей, monaco-команда, debounce).

  const codeRef = useRef(code);
  const stdinRef = useRef(stdin);
  const languageRef = useRef(language);

  codeRef.current = code;
  stdinRef.current = stdin;
  languageRef.current = language;

  // --- Запуск -------------------------------------------------------------
  const runningRef = useRef(false);
  /** Запускает выполнение кода (JS — в Web Worker, остальное — заглушка). */
  const handleRun = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setRunning(true);
    setTab('console');
    const result =
      languageRef.current === 'javascript'
        ? await runJavaScript(codeRef.current, stdinRef.current)
        : unsupportedLanguage(languageRef.current);
    setLines([
      ...result.lines,
      {
        type: 'system',
        text: `Процесс завершён с кодом ${result.exitCode} за ${Math.max(1, Math.round(result.durationMs))} мс`,
      },
    ]);
    runningRef.current = false;
    setRunning(false);
  }, []);

  const runRef = useRef(handleRun);
  runRef.current = handleRun;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        void runRef.current();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return { running, lines, stdin, runRef, setStdin, tab, setTab, handleRun, clearLines: () => setLines([]) };
}