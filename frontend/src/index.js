import ReactDOM from 'react-dom/client';

import app from './application.tsx';

/**
 * Сбой загрузки части приложения.
 *
 * После выката имена файлов сборки меняются. Открытая вкладка со старой
 * страницей просит файл, которого больше нет: Vite сообщает об этом событием
 * vite:preloadError, а человек до сих пор видел пустой экран и ничего не мог
 * сделать. Перезагружаем один раз — этого достаточно, чтобы получить свежий
 * index.html. Признак храним в sessionStorage, иначе при недоступности файла по
 * другой причине получился бы цикл перезагрузок.
 */
const RELOAD_MARK = 'runit.reloadedAfterChunkError';

window.addEventListener('vite:preloadError', () => {
  if (sessionStorage.getItem(RELOAD_MARK)) return;
  sessionStorage.setItem(RELOAD_MARK, '1');
  window.location.reload();
});

/** Показывает причину вместо пустого экрана, если приложение не поднялось. */
const showStartupError = () => {
  const root = document.getElementById('main');
  if (!root) return;
  root.innerHTML = `
    <div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:#f8f9fa;color:#495057;font:500 15px/1.5 system-ui,-apple-system,sans-serif;padding:20px;text-align:center">
      <div style="font-size:17px;font-weight:700;color:#212529">Не удалось загрузить Runit</div>
      <div>Проверьте соединение и обновите страницу.</div>
      <button type="button" onclick="location.reload()" style="margin-top:6px;padding:8px 18px;border:0;border-radius:8px;background:#4dabf7;color:#fff;font:600 15px system-ui;cursor:pointer">
        Обновить
      </button>
    </div>`;
};

const run = async () => {
  try {
    const root = ReactDOM.createRoot(document.getElementById('main'));
    const dom = await app();
    root.render(dom);
    sessionStorage.removeItem(RELOAD_MARK);
  } catch (error) {
    console.error('Runit не запустился:', error);
    showStartupError();
  }
};

run();
