import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Anchor, Box, Button, Center, Group, Loader, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useTRPCClient } from '../../../utils/trpc';
import { editorColors, langMeta } from '../../theme';
import { runJavaScript, unsupportedLanguage, type RunResult } from '../../runner';

// Компактный embed-виджет (без AppHeader/AppFooter — страница живёт внутри iframe).
// TODO(#841): варианты оформления card/minimal/tabs (query-параметр variant).

type Snippet = {
  id: number;
  name: string;
  slug: string;
  code: string;
  language: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
};

const EXT: Record<string, string> = {
  javascript: 'js',
  python: 'py',
  php: 'php',
  ruby: 'rb',
  java: 'java',
  html: 'html',
};

function lineColor(type: string): string {
  if (type === 'error') return editorColors.error;
  if (type === 'warn') return '#e5c07b';
  if (type === 'system') return editorColors.dim;
  return editorColors.text;
}

export default function Embed() {
  const { username = '', slug = '' } = useParams();
  const [searchParams] = useSearchParams();
  const trpc = useTRPCClient();

  const theme = searchParams.get('theme') === 'dark' ? 'dark' : 'light';
  const heightParam = Number(searchParams.get('height'));
  const widgetHeight = Number.isFinite(heightParam) && heightParam > 0 ? heightParam : null;

  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);

  const { data: snippet, isLoading, isError } = useQuery({
    queryKey: ['v2', 'embed-snippet', username, slug],
    queryFn: () => trpc.snippets.getSnippetByUsernameSlug.query({ username, slug }),
    retry: false,
  });

  // Палитра «рамки» виджета: тёмная или светлая по query-параметру theme.
  const frame =
    theme === 'dark'
      ? {
          bg: editorColors.panel,
          border: editorColors.border,
          text: editorColors.text,
          dim: editorColors.dim,
        }
      : {
          bg: '#ffffff',
          border: '#e9ecef',
          text: '#212529',
          dim: '#868e96',
        };

  const run = async (s: Snippet) => {
    const meta = langMeta[s.language];
    if (!meta?.runnable) {
      setResult(unsupportedLanguage(meta?.label ?? s.language));
      return;
    }
    setRunning(true);
    try {
      setResult(await runJavaScript(s.code));
    } finally {
      setRunning(false);
    }
  };

  if (isLoading) {
    return (
      <Center h="100vh">
        <Loader size="sm" />
      </Center>
    );
  }

  if (isError || !snippet) {
    return (
      <Center h="100vh">
        <Text c="dimmed" fz="sm">
          Сниппет не найден
        </Text>
      </Center>
    );
  }

  const s = snippet as Snippet;
  const meta = langMeta[s.language];
  const fileName = `${s.name}.${EXT[s.language] ?? 'txt'}`;
  const shareHref = `/s/${username}/${slug}`;

  return (
    <Box
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: widgetHeight ? widgetHeight : '100vh',
        maxHeight: '100vh',
        border: `1px solid ${frame.border}`,
        borderRadius: 12,
        overflow: 'hidden',
        background: frame.bg,
      }}
    >
      {/* Шапка виджета */}
      <Group justify="space-between" px="md" py={8} style={{ borderBottom: `1px solid ${frame.border}` }}>
        <Group gap={8} wrap="nowrap" style={{ minWidth: 0 }}>
          <Text ff="monospace" fz="sm" c={frame.text} truncate>
            {fileName}
          </Text>
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              flexShrink: 0,
              background: meta?.dot ?? '#adb5bd',
            }}
          />
          <Text fz="xs" c={frame.dim} visibleFrom="xs">
            {meta?.label ?? s.language}
          </Text>
        </Group>
        <Group gap="sm" wrap="nowrap">
          <Anchor href={shareHref} target="_blank" rel="noopener noreferrer" fz="sm" fw={600}>
            Открыть в Runit ↗
          </Anchor>
          <Button size="compact-sm" onClick={() => run(s)} loading={running} leftSection={<span aria-hidden>▶</span>}>
            Запустить
          </Button>
        </Group>
      </Group>

      {/* Код (read-only) */}
      <Box style={{ flex: 1, minHeight: 0, overflow: 'auto', background: editorColors.bg, padding: '12px 16px' }}>
        <pre style={{ margin: 0, fontFamily: 'var(--mantine-font-family-monospace)', fontSize: 13, lineHeight: 1.65 }}>
          {s.code.split('\n').map((line, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={i} style={{ color: editorColors.text, whiteSpace: 'pre' }}>
              {line || ' '}
            </div>
          ))}
        </pre>
      </Box>

      {/* РЕЗУЛЬТАТ */}
      {result && (
        <Box
          px="md"
          py={8}
          style={{
            borderTop: `1px solid ${editorColors.border}`,
            background: editorColors.panel,
            maxHeight: 160,
            overflow: 'auto',
            flexShrink: 0,
          }}
        >
          <Group justify="space-between" mb={4}>
            <Text fz={10} fw={700} c={editorColors.dim} style={{ letterSpacing: 1 }}>
              РЕЗУЛЬТАТ
            </Text>
            <Text fz={10} c={result.exitCode === 0 ? editorColors.ok : editorColors.error}>
              exit {result.exitCode} · {Math.round(result.durationMs)} мс
            </Text>
          </Group>
          <pre style={{ margin: 0, fontFamily: 'var(--mantine-font-family-monospace)', fontSize: 12, lineHeight: 1.6 }}>
            {result.lines.length === 0 ? (
              <span style={{ color: editorColors.dim }}>(нет вывода)</span>
            ) : (
              result.lines.map((l, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <div key={i} style={{ color: lineColor(l.type), whiteSpace: 'pre-wrap' }}>
                  {l.text}
                </div>
              ))
            )}
          </pre>
        </Box>
      )}

      {/* Подпись */}
      <Group gap={6} px="md" py={6} style={{ borderTop: `1px solid ${frame.border}`, flexShrink: 0 }}>
        <Text c="blue.6" fz="xs" aria-hidden>
          ⚡
        </Text>
        <Text fz="xs" c={frame.dim}>
          Работает на Runit
        </Text>
      </Group>
    </Box>
  );
}
