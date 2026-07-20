import { Box, Text } from '@mantine/core';
import { editorColors } from '../../../shared/theme';

/** Стилизованная карточка терминала с сообщением об ошибке 404. */
export default function TerminalCard() {
  return (
    <Box
      p="xl"
      maw={720}
      w="100%"
      style={{
        background: editorColors.bg,
        border: `1px solid ${editorColors.border}`,
        borderRadius: 16,
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: 15,
        lineHeight: 2,
        textAlign: 'left',
      }}
    >
      <Text ff="inherit" fz="inherit">
        <Text component="span" c={editorColors.accent}>$</Text>
        <Text component="span" c={editorColors.text}> runit open s/xK91q</Text>
      </Text>
      <Text ff="inherit" fz="inherit" style={{ color: editorColors.error }}>
        Ошибка 404: сниппет не найден
      </Text>
      <Text ff="inherit" fz="inherit" style={{ color: editorColors.dim }}>
        Процесс завершился с кодом 1
      </Text>
    </Box>
  );
}