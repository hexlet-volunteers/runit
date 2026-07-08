import { createTheme, rem } from '@mantine/core';
import { MantineColorsTuple } from '@mantine/core';

// Дизайн-токены Runit v2 (см. docs/design/*.png):
// светлый фон #f8f9fa, текст #212529, акцент #2563eb — синий, код — JetBrains Mono.

const customBlue: MantineColorsTuple = [
  '#eff6ff',
  '#dbeafe',
  '#bfdbfe',
  '#93c5fd',
  '#60a5fa',
  '#3b82f6',
  '#2563eb', // акцентный синий
  '#1d4ed8',
  '#1e40af',
  '#1e3a5f',
];

export const v2Theme = createTheme({
  fontFamily: "'Golos Text', system-ui, -apple-system, sans-serif",
  fontFamilyMonospace: "'JetBrains Mono', ui-monospace, monospace",
  colors: {
    blue: customBlue,
  },
  primaryColor: 'blue',
  defaultRadius: 'md',
  headings: {
    fontFamily: "'Golos Text', system-ui, sans-serif",
    fontWeight: '700',
  },
  components: {
    Button: {
      defaultProps: { radius: 'md' },
    },
  },
});

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

export const langMeta: Record<string, { label: string; dot: string; runnable: boolean }> = {
  javascript: { label: 'JavaScript', dot: '#f1e05a', runnable: true },
  typescript: { label: 'TypeScript', dot: '#3178c6', runnable: false },
  python: { label: 'Python', dot: '#3572A5', runnable: false },
  php: { label: 'PHP', dot: '#4F5D95', runnable: false },
  ruby: { label: 'Ruby', dot: '#701516', runnable: false },
  java: { label: 'Java', dot: '#b07219', runnable: false },
  html: { label: 'HTML', dot: '#e34c26', runnable: false },
};
