
// Цвета редактора (тёмная область кода на светлой странице)
export const editorColors = {
  bg: '#1a1b26',
  panel: '#16161e',
  border: '#2a2b3a',
  text: '#c0caf5',
  dim: '#565f89',
  accent: '#4dabf7',
  error: '#ff6b6b',
  ok: '#51cf66',
};

// TODO: typescript есть в langMeta, но не в createSnippetSchema на бэкенде
export const langMeta: Record<
  string,
  { label: string; dot: string; runnable: boolean }
> = {
  javascript: { label: 'JavaScript', dot: '#f1e05a', runnable: true },
  typescript: { label: 'TypeScript', dot: '#3178c6', runnable: true },
  python: { label: 'Python', dot: '#3572A5', runnable: true },
  php: { label: 'PHP', dot: '#4F5D95', runnable: true },
  ruby: { label: 'Ruby', dot: '#701516', runnable: true },
  java: { label: 'Java', dot: '#b07219', runnable: true },
  go: { label: 'Go', dot: '#00ADD8', runnable: true },
  cpp: { label: 'C++', dot: '#f34b7d', runnable: true },
  sql: { label: 'SQL', dot: '#e38c00', runnable: true },
  bash: { label: 'Bash', dot: '#89e051', runnable: true },
  // Вёрстка: «запуск» = рендер превью в sandbox-iframe, а не вывод в консоль.
  html: { label: 'HTML', dot: '#e34c26', runnable: true },
  css: { label: 'CSS', dot: '#563d7c', runnable: true },
};
/**
 * Среда исполнения по языку — показывается в редакторе (сайдбар, статус-бар, консоль).
 * TODO(#641): вынести в справочник языков на бэкенде вместе с выбором версии.
 */
export const runtimeLabel = (language: string): string =>
  ({
    // JavaScript исполняется в браузере, в Web Worker, а не на сервере.
    // Подпись «Node.js 20 LTS» обещала серверную среду: сниппет с require или
    // process.argv не работал, и причина по этой подписи не угадывалась.
    javascript: 'Браузер (Web Worker)',
    typescript: 'Node.js 24 (TS)',
    python: 'Python 3.13',
    php: 'PHP 8.3',
    ruby: 'Ruby 3.4',
    java: 'Java 21 (Temurin)',
    go: 'Go 1.23',
    cpp: 'GCC / C++20',
    sql: 'SQLite 3',
    bash: 'Bash 5.2',
    html: 'Браузер',
    css: 'Браузер',
  })[language] ?? 'Стандартная среда';
