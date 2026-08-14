import { useEffect, useRef, useState } from 'react';
import { buildPreviewDocument } from '../runner/preview';

export type HtmlPreviewProps = {
  language: string;
  code: string;
  /** Меняется при каждом «Выполнить» — форсирует перерисовку iframe. */
  runKey?: number;
  height?: number | string;
};

/**
 * Пауза перед обновлением превью при наборе кода.
 *
 * Без неё srcDoc пересобирался на каждое нажатие клавиши, и браузер каждый раз
 * заново загружал документ в iframe: превью мигало, скрипты сниппета
 * перезапускались посимвольно, прокрутка сбрасывалась. 400 мс — набор
 * воспринимается как живой, а перезагрузка происходит один раз на паузу.
 */
const PREVIEW_DEBOUNCE_MS = 400;

/**
 * Превью вёрстки (#852, #853).
 *
 * Пользовательская разметка рендерится ТОЛЬКО в sandbox-iframe:
 * `allow-scripts` без `allow-same-origin` — скрипты сниппета работают, но для них
 * это чужой origin, поэтому доступа к нашим кукам, localStorage и DOM страницы нет.
 * Никогда не вставляйте пользовательский HTML в DOM приложения напрямую.
 */
export default function HtmlPreview(props: HtmlPreviewProps) {
  const { language, code, runKey = 0, height = '100%' } = props;
  const [doc, setDoc] = useState(() => buildPreviewDocument(language, code));
  const runKeyRef = useRef(runKey);

  useEffect(() => {
    // Нажатие «Выполнить» — явное действие, его ждать не заставляем.
    if (runKeyRef.current !== runKey) {
      runKeyRef.current = runKey;
      setDoc(buildPreviewDocument(language, code));
      return;
    }

    const timer = setTimeout(() => {
      setDoc(buildPreviewDocument(language, code));
    }, PREVIEW_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [code, language, runKey]);

  return (
    <iframe
      key={runKey}
      title="Превью вёрстки"
      srcDoc={doc}
      sandbox="allow-scripts"
      referrerPolicy="no-referrer"
      style={{
        width: '100%',
        height,
        border: 'none',
        background: '#fff',
        display: 'block',
      }}
    />
  );
}
