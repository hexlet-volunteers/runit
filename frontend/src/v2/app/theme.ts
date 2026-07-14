import { createTheme } from '@mantine/core';

// Дизайн-токены Runit v2 (см. docs/design/*.png):
// светлый фон #f8f9fa, текст #212529, акцент — синий, код — JetBrains Mono.

export const v2Theme = createTheme({
  fontFamily: "'Golos Text', system-ui, -apple-system, sans-serif",
  fontFamilyMonospace: "'JetBrains Mono', ui-monospace, monospace",
  primaryColor: 'blue',
  defaultRadius: 'md',
  headings: {
    fontFamily: "'Golos Text', system-ui, sans-serif",
    fontWeight: '700',
  },
  components: {
    Button: {
      defaultProps: { radius: 'xl' },
    },
  },
});
