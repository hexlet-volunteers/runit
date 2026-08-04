import { useState } from 'react';
import { Anchor, Box, Button, Group, Paper, Text } from '@mantine/core';
import { CODE_FONT, highlightJs } from '../../../shared/lib';
import { runCode, type RunResult } from '../../../shared/runner';
import { editorColors, langMeta } from '../../../shared/theme';
import { DEMO_CODE, DEMO_FILE_NAME, type EmbedVariant } from '../lib/demoSnippet';

const lineColor = (type: string): string => {
  if (type === 'error') return editorColors.error;
  if (type === 'warn') return '#e5c07b';
  if (type === 'system') return editorColors.dim;
  return editorColors.text;
};

/** Иконка «молния» из футера виджета в макете. */
const BoltIcon = () => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="var(--mantine-color-blue-6)">
    <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
  </svg>
);

const PlayIcon = () => (
  <svg width={10} height={10} viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

/** Редактируемый код с подсветкой: прозрачная textarea поверх <pre>. */
function CodeArea({
  code,
  onChange,
  minHeight = '9.5em',
}: {
  code: string;
  onChange: (value: string) => void;
  minHeight?: string;
}) {
  return (
    <Box style={{ background: editorColors.bg, position: 'relative' }} p="sm">
      <pre
        aria-hidden
        style={{ ...CODE_FONT, color: editorColors.text, minHeight }}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: `${highlightJs(code)}\n` }}
      />
      <textarea
        value={code}
        onChange={(event) => onChange(event.currentTarget.value)}
        aria-label={`Код ${DEMO_FILE_NAME}`}
        spellCheck={false}
        style={{
          ...CODE_FONT,
          position: 'absolute',
          inset: 12,
          width: 'calc(100% - 24px)',
          height: 'calc(100% - 24px)',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          resize: 'none',
          color: 'transparent',
          caretColor: editorColors.text,
          overflow: 'hidden',
        }}
      />
    </Box>
  );
}

function ResultBlock({ result, compact = false }: { result: RunResult; compact?: boolean }) {
  return (
    <Box
      px="md"
      py={compact ? 8 : 'sm'}
      style={{
        background: editorColors.panel,
        borderTop: `1px solid ${editorColors.border}`,
      }}
    >
      <Group justify="space-between" mb={4}>
        <Text
          fz={11}
          fw={700}
          c={editorColors.dim}
          style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}
        >
          Результат
        </Text>
        <Text fz={11} c={editorColors.dim}>
          runit · {Math.max(1, Math.round(result.durationMs))} мс
        </Text>
      </Group>
      {result.lines.length === 0 ? (
        <Text ff="monospace" fz={13} c={editorColors.dim}>
          (нет вывода)
        </Text>
      ) : (
        result.lines.map((line, index) => (
          <Text
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            ff="monospace"
            fz={13}
            style={{
              color: lineColor(line.type),
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {line.text}
          </Text>
        ))
      )}
    </Box>
  );
}

/**
 * Виджет Runit, встроенный в чужую страницу — три варианта из макета
 * (docs/design/embed.png): «Карточка», «Минимальный», «Вкладки».
 *
 * Код исполняется по-настоящему: JavaScript выполняется в Web Worker, поэтому
 * демо работает без сервера. TODO(#841): собрать это в отдельный embed-бандл,
 * который подключается на сторонние сайты.
 */
export default function EmbeddedWidget({ variant }: { variant: EmbedVariant }) {
  const [code, setCode] = useState(DEMO_CODE);
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [tab, setTab] = useState<'code' | 'result'>('code');

  const meta = langMeta.javascript;

  const handleRun = async () => {
    setRunning(true);
    try {
      const next = await runCode({ language: 'javascript', code });
      setResult(next);
      setTab('result');
    } finally {
      setRunning(false);
    }
  };

  const runButton = (size: 'xs' | 'sm' = 'xs') => (
    <Button size={size} radius="md" loading={running} onClick={handleRun} leftSection={<PlayIcon />}>
      Запустить
    </Button>
  );

  const openInRunit = (
    <Anchor href="/editor" target="_blank" fz="sm" fw={600}>
      Открыть в Runit ↗
    </Anchor>
  );

  // --- Минимальный: только код и запуск, без шапки и футера ---------------
  if (variant === 'minimal') {
    return (
      <Paper radius="md" withBorder style={{ overflow: 'hidden' }}>
        <Box style={{ position: 'relative' }}>
          <CodeArea code={code} onChange={setCode} minHeight="9.5em" />
          <Box style={{ position: 'absolute', top: 8, right: 8 }}>{runButton()}</Box>
        </Box>
        {result && <ResultBlock result={result} compact />}
      </Paper>
    );
  }

  // --- Вкладки: «Код» / «Результат» ---------------------------------------
  if (variant === 'tabs') {
    return (
      <Paper radius="md" withBorder style={{ overflow: 'hidden' }}>
        <Group
          justify="space-between"
          px="md"
          py={8}
          style={{ background: '#fff', borderBottom: '1px solid #e9ecef' }}
        >
          <Group gap={4}>
            {(
              [
                ['code', 'Код'],
                ['result', 'Результат'],
              ] as const
            ).map(([value, label]) => (
              <Button
                key={value}
                size="compact-sm"
                variant={tab === value ? 'light' : 'subtle'}
                color={tab === value ? 'blue' : 'gray'}
                radius="md"
                onClick={() => setTab(value)}
              >
                {label}
              </Button>
            ))}
          </Group>
          {runButton()}
        </Group>

        {tab === 'code' ? (
          <CodeArea code={code} onChange={setCode} minHeight="9.5em" />
        ) : result ? (
          <ResultBlock result={result} />
        ) : (
          <Box px="md" py="lg" style={{ background: editorColors.panel }}>
            <Text ff="monospace" fz={13} c={editorColors.dim}>
              Запустите код, чтобы увидеть результат
            </Text>
          </Box>
        )}
      </Paper>
    );
  }

  // --- Карточка (по умолчанию) --------------------------------------------
  return (
    <Paper radius="md" withBorder style={{ overflow: 'hidden' }}>
      <Group
        justify="space-between"
        px="md"
        py={10}
        style={{ background: '#fff', borderBottom: '1px solid #e9ecef' }}
        wrap="nowrap"
      >
        <Group gap={8} wrap="nowrap">
          <Text ff="monospace" fz="sm" fw={600} c="dark.9">
            {DEMO_FILE_NAME}
          </Text>
          <Box w={8} h={8} style={{ borderRadius: '50%', background: meta.dot }} />
          <Text fz="sm" c="dimmed">
            {meta.label}
          </Text>
        </Group>
        <Group gap="md" wrap="nowrap">
          {openInRunit}
          {runButton()}
        </Group>
      </Group>

      <CodeArea code={code} onChange={setCode} />

      {result && <ResultBlock result={result} />}

      <Group gap={6} px="md" py={8} style={{ background: '#fff', borderTop: '1px solid #e9ecef' }}>
        <BoltIcon />
        <Text fz="xs" c="dimmed">
          Работает на Runit
        </Text>
      </Group>
    </Paper>
  );
}
