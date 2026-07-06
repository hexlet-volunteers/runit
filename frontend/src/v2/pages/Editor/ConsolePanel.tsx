import { Box, Group, Loader, Text, Tooltip, UnstyledButton } from '@mantine/core';
import { editorColors } from '../../theme';
import type { ConsoleLine } from '../../runner';
import { IconTrash } from './icons';

export type OutputTab = 'console' | 'input';

const lineColor: Record<ConsoleLine['type'], string> = {
  log: editorColors.text,
  error: editorColors.error,
  warn: '#e5c07b',
  info: editorColors.accent,
  system: editorColors.dim,
};

type Props = {
  tab: OutputTab;
  onTabChange: (tab: OutputTab) => void;
  lines: ConsoleLine[];
  running: boolean;
  stdin: string;
  onStdinChange: (value: string) => void;
  onClear: () => void;
};

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <UnstyledButton
      onClick={onClick}
      px={4}
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.08em',
        color: active ? editorColors.text : editorColors.dim,
        borderBottom: `2px solid ${active ? editorColors.accent : 'transparent'}`,
      }}
    >
      {label}
    </UnstyledButton>
  );
}

export default function ConsolePanel({
  tab,
  onTabChange,
  lines,
  running,
  stdin,
  onStdinChange,
  onClear,
}: Props) {
  return (
    <Box
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: editorColors.panel,
        borderLeft: `1px solid ${editorColors.border}`,
        minWidth: 0,
      }}
    >
      <Group
        justify="space-between"
        px="md"
        gap="lg"
        style={{
          height: 40,
          flexShrink: 0,
          borderBottom: `1px solid ${editorColors.border}`,
        }}
      >
        <Group gap="lg" style={{ height: '100%' }}>
          <TabButton
            active={tab === 'console'}
            label="КОНСОЛЬ"
            onClick={() => onTabChange('console')}
          />
          <TabButton
            active={tab === 'input'}
            label="ВВОД"
            onClick={() => onTabChange('input')}
          />
        </Group>
        <Tooltip label="Очистить консоль" withArrow>
          <UnstyledButton
            onClick={onClear}
            aria-label="Очистить консоль"
            style={{ color: editorColors.dim, display: 'flex' }}
          >
            <IconTrash />
          </UnstyledButton>
        </Tooltip>
      </Group>

      {tab === 'console' ? (
        <Box
          p="md"
          ff="monospace"
          fz={13}
          style={{ flex: 1, overflow: 'auto', minHeight: 0 }}
        >
          <Text ff="monospace" fz={13} c={editorColors.dim} mb={8}>
            Runit · Node.js 20 LTS{' '}
            {lines.length === 0 && !running ? '· консоль готова' : ''}
          </Text>
          {running ? (
            <Group gap={8}>
              <Loader size={12} color={editorColors.accent} />
              <Text ff="monospace" fz={13} c={editorColors.dim}>
                Выполняется…
              </Text>
            </Group>
          ) : lines.length === 0 ? (
            <Text ff="monospace" fz={13} c={editorColors.dim}>
              Консоль пуста. Нажмите «Выполнить» или Ctrl + Enter.
            </Text>
          ) : (
            lines.map((line, i) => (
              <Text
                // eslint-disable-next-line react/no-array-index-key
                key={i}
                ff="monospace"
                fz={13}
                style={{
                  color: lineColor[line.type],
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {line.text}
              </Text>
            ))
          )}
        </Box>
      ) : (
        <Box p="md" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Text fz={12} c={editorColors.dim} mb={8}>
            Передаётся в stdin при каждом запуске
          </Text>
          <textarea
            value={stdin}
            onChange={(e) => onStdinChange(e.currentTarget.value)}
            placeholder="Каждая строка — отдельный вызов readline()"
            spellCheck={false}
            style={{
              flex: 1,
              resize: 'none',
              background: editorColors.bg,
              color: editorColors.text,
              border: `1px solid ${editorColors.border}`,
              borderRadius: 8,
              padding: 12,
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: 13,
              outline: 'none',
            }}
          />
        </Box>
      )}
    </Box>
  );
}
