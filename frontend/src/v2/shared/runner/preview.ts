// Сборка документа для превью вёрстки.
// Рендер целиком клиентский: HTML/CSS не нужно исполнять на сервере,
// достаточно показать результат в изолированном iframe.

/** Языки, результат которых показывается как страница, а не как вывод в консоль. */
export const PREVIEW_LANGUAGES = new Set(['html', 'css']);

export const isPreviewLanguage = (language: string): boolean =>
  PREVIEW_LANGUAGES.has(language);

/**
 * Демо-разметка для CSS-сниппетов: студент пишет только стили и сразу видит,
 * как они применяются. TODO(#855): после мультифайловости (#818) вместо
 * фиксированной разметки будет пара index.html + style.css.
 */
const CSS_DEMO_MARKUP = `<div class="card">
  <h1 class="title">Заголовок</h1>
  <p class="text">Абзац текста — примените к нему свои стили.</p>
  <ul class="list">
    <li>Первый пункт</li>
    <li>Второй пункт</li>
    <li>Третий пункт</li>
  </ul>
  <button class="button" type="button">Кнопка</button>
</div>`;

/** Базовые стили, чтобы пустая страница не выглядела сломанной. */
const BASE_STYLE = `body{margin:0;padding:24px;font-family:system-ui,-apple-system,sans-serif;color:#212529;background:#fff}`;

export function buildPreviewDocument(language: string, code: string): string {
  if (language === 'css') {
    return [
      '<!doctype html><html lang="ru"><head><meta charset="utf-8">',
      `<style>${BASE_STYLE}</style>`,
      `<style>\n${code}\n</style>`,
      '</head><body>',
      CSS_DEMO_MARKUP,
      '</body></html>',
    ].join('');
  }

  // HTML-сниппет показываем как есть: пользователь сам решает, что внутри
  // (включая <style> и <script>).
  return code;
}
