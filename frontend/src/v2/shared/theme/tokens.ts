
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
export const langMeta: Record<string, { label: string; dot: string; runnable: boolean }> = {
  javascript: { label: 'JavaScript', dot: '#f1e05a', runnable: true },
  typescript: { label: 'TypeScript', dot: '#3178c6', runnable: false },
  python: { label: 'Python', dot: '#3572A5', runnable: false },
  php: { label: 'PHP', dot: '#4F5D95', runnable: false },
  ruby: { label: 'Ruby', dot: '#701516', runnable: false },
  java: { label: 'Java', dot: '#b07219', runnable: false },
  html: { label: 'HTML', dot: '#e34c26', runnable: false },
};