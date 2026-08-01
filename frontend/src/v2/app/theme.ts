import { createTheme } from '@mantine/core';
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
