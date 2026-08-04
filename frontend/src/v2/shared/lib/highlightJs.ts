import type { CSSProperties } from 'react';

// Лёгкая подсветка JavaScript для демо-виджетов (лендинг, страница встраивания).
// В полноценном редакторе подсветку делает Monaco — здесь она не нужна и слишком
// тяжела, поэтому обходимся регулярным выражением.

/** Палитра подсветки (tokyo-night, как в макетах). */
const HL = {
  comment: '#565f89',
  keyword: '#bb9af7',
  string: '#9ece6a',
  number: '#ff9e64',
  method: '#4dabf7',
};

/** Экранирует HTML-спецсимволы: подсветка вставляется через innerHTML. */
const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const TOKENS =
  /(\/\/[^\n]*)|('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`)|\b(const|let|var|function|return|if|else|for|while|of|in|new|class|true|false|null|undefined)\b|\b(\d+(?:\.\d+)?)\b|\b(forEach|log|map|filter|reduce|push|pop|shift|unshift)\b/g;

/**
 * Возвращает HTML с раскрашенными токенами.
 * Весь пользовательский текст экранируется, поэтому результат безопасен
 * для вставки через dangerouslySetInnerHTML.
 */
export function highlightJs(src: string): string {
  let out = '';
  let last = 0;
  for (let match = TOKENS.exec(src); match; match = TOKENS.exec(src)) {
    out += escapeHtml(src.slice(last, match.index));
    const [full, comment, str, keyword, num, method] = match;
    const color = comment
      ? HL.comment
      : str
        ? HL.string
        : keyword
          ? HL.keyword
          : num
            ? HL.number
            : method
              ? HL.method
              : HL.number;
    out += `<span style="color:${color}">${escapeHtml(full)}</span>`;
    last = match.index + full.length;
  }
  return out + escapeHtml(src.slice(last));
}

/** Моноширинные стили для блоков кода в демо-виджетах. */
export const CODE_FONT: CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  fontSize: 14,
  lineHeight: 1.7,
  padding: '4px 8px',
  margin: 0,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
};
