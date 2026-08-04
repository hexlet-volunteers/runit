import { useMemo } from 'react';
import { buildPreviewDocument } from '../runner/preview';

export type HtmlPreviewProps = {
  language: string;
  code: string;
  /** Меняется при каждом «Выполнить» — форсирует перерисовку iframe. */
  runKey?: number;
  height?: number | string;
};

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
  const doc = useMemo(() => buildPreviewDocument(language, code), [language, code]);

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
