import { Box, Group, Loader, Text, Tooltip, UnstyledButton } from '@mantine/core';
import { editorColors } from '../../../shared/theme';
import type { ConsoleLine } from '../../../shared/runner';
import { IconTrash } from '../../../shared/ui';
import HtmlPreview from '../../../shared/ui/HtmlPreview';
import { isPreviewLanguage } from '../../../shared/runner/preview';
import TabButton from './TabButton';
import { type ConsolePanelProps } from '..'

const lineColor: Record<ConsoleLine['type'], string> = {
  log: editorColors.text,
  error: editorColors.error,
  warn: '#e5c07b',
  info: editorColors.accent,
  system: editorColors.dim,
};

export default function ConsolePanel({
  tab,
  onTabChange,
  lines,
  running,
  stdin,
  onStdinChange,
  onClear,
  language,
  code,
  runKey,
  runtime,
}: ConsolePanelProps ) {
  // Для вёрстки (HTML/CSS) результат — отрендеренная страница, а не вывод в консоль.
  const previewMode = isPreviewLanguage(language);
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
          {previewMode ? (
            <TabButton active label="ПРЕВЬЮ" onClick={() => onTabChange('preview')} />
          ) : (
            <>
              <TabButton
                active={tab === 'console'}
                label="КОНСОЛЬ"
                onClick={() => onTabChange('console')}
              />
              <TabButton
                active={tab === 'input'}
                label="ВВОД"
            title="Данные, которые программа прочитает при запуске"
                onClick={() => onTabChange('input')}
              />
            </>
          )}
        </Group>
        {previewMode ? null : (
        <Tooltip label="Очистить консоль" withArrow>
          <UnstyledButton
            onClick={onClear}
            aria-label="Очистить консоль"
            style={{ color: editorColors.dim, display: 'flex' }}
          >
            <IconTrash />
          </UnstyledButton>
        </Tooltip>
        )}
      </Group>

      {previewMode ? (
        <Box style={{ flex: 1, minHeight: 0, background: '#fff' }}>
          <HtmlPreview language={language} code={code} runKey={runKey} />
        </Box>
      ) : tab === 'console' ? (
        <Box
          p="md"
          ff="monospace"
          fz={13}
          style={{ flex: 1, overflow: 'auto', minHeight: 0 }}
        >
          <Text ff="monospace" fz={13} c={editorColors.dim} mb={8}>
            Runit · {runtime}{' '}
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
          {/* Формулировка нарочно бытовая: «stdin» ничего не объясняет тому,
              кто не работал с терминалом. */}
          <Text fz={12} c={editorColors.dim} mb={8}>
            Что программа «прочитает с клавиатуры» при запуске: одна строка —
            один ответ. Нужно для задач с <Text span ff="monospace" fz={12} c={editorColors.text}>input()</Text>,{' '}
            <Text span ff="monospace" fz={12} c={editorColors.text}>gets</Text> или{' '}
            <Text span ff="monospace" fz={12} c={editorColors.text}>readline()</Text>.
          </Text>
          <textarea
            value={stdin}
            onChange={(e) => onStdinChange(e.currentTarget.value)}
            placeholder={'Например:\nМария\n25'}
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
