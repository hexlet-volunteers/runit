import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
import {
  Anchor,
  Box,
  Button,
  Center,
  Group,
  Loader,
  Text,
} from '@mantine/core';
import { editorColors, langMeta } from '../../../shared/theme';
import {
  runCode,
  unsupportedLanguage,
  type RunResult,
} from '../../../shared/runner';
import { isPreviewLanguage } from '../../../shared/runner/preview';
import HtmlPreview from '../../../shared/ui/HtmlPreview';
import {
  type Snippet,
  useSnippetBySlug,
  useSnippetByShortCode,
} from '../../../entities/snippet';
import { useTRPCClient } from '../../../shared/api';
import { snippetPath } from '../../../shared/lib';

// Компактный embed-виджет (без AppHeader/AppFooter — страница живёт внутри iframe).
// TODO(#841): варианты оформления card/minimal/tabs (query-параметр variant).

const EXT: Record<string, string> = {
  javascript: 'js',
  python: 'py',
  php: 'php',
  ruby: 'rb',
  java: 'java',
  html: 'html',
  css: 'css',
};

function lineColor(type: string): string {
  if (type === 'error') return editorColors.error;
  if (type === 'warn') return '#e5c07b';
  if (type === 'system') return editorColors.dim;
  return editorColors.text;
}

export default function EmbedPage() {
  const { username = '', slug = '', shortCode } = useParams();
  const [searchParams] = useSearchParams();

  const theme = searchParams.get('theme') === 'dark' ? 'dark' : 'light';
  const heightParam = Number(searchParams.get('height'));
  const widgetHeight =
    Number.isFinite(heightParam) && heightParam > 0 ? heightParam : null;

  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  // Счётчик запусков превью вёрстки: инкремент форсирует перерисовку iframe.
  const [runKey, setRunKey] = useState(0);
  const trpc = useTRPCClient();

  // Источник данных зависит от вида ссылки: короткая /s/:code или /s/:user/:slug.
  const byShortCode = useSnippetByShortCode(shortCode);
  const bySlug = useSnippetBySlug(shortCode ? '' : username, shortCode ? '' : slug);
  const {
    data: snippet,
    isLoading,
    isError,
  } = shortCode ? byShortCode : bySlug;

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
    // html/css показываем как страницу, а не как вывод в консоль (#853).
    if (isPreviewLanguage(s.language)) {
      setRunKey((key) => key + 1);
      return;
    }
    const meta = langMeta[s.language];
    if (!meta?.runnable) {
      setResult(unsupportedLanguage(meta?.label ?? s.language));
      return;
    }
    setRunning(true);
    try {
      setResult(
        await runCode({ language: s.language, code: s.code, client: trpc }),
      );
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
  const isPreview = isPreviewLanguage(s.language);
  const fileName = `${s.name}.${EXT[s.language] ?? 'txt'}`;
  // Как и на странице шаринга: на роуте короткой ссылки username и slug пусты,
  // поэтому путь строится из данных сниппета.
  const shareHref = snippetPath({
    shortCode: shortCode ?? s.shortCode,
    authorUsername: s.authorUsername ?? username,
    slug: s.slug ?? slug,
  });

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
      <Group
        justify="space-between"
        px="md"
        py={8}
        style={{ borderBottom: `1px solid ${frame.border}` }}
      >
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
          <Anchor
            href={shareHref}
            target="_blank"
            rel="noopener noreferrer"
            fz="sm"
            fw={600}
          >
            Открыть в Runit ↗
          </Anchor>
          <Button
            size="compact-sm"
            onClick={() => run(s)}
            loading={running}
            leftSection={<span aria-hidden>▶</span>}
          >
            Запустить
          </Button>
        </Group>
      </Group>

      {/* Код (read-only) */}
      <Box
        style={{
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
          background: editorColors.bg,
          padding: '12px 16px',
        }}
      >
        <pre
          style={{
            margin: 0,
            fontFamily: 'var(--mantine-font-family-monospace)',
            fontSize: 13,
            lineHeight: 1.65,
          }}
        >
          {s.code.split('\n').map((line, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <div
              key={i}
              style={{ color: editorColors.text, whiteSpace: 'pre' }}
            >
              {line || ' '}
            </div>
          ))}
        </pre>
      </Box>

      {/* РЕЗУЛЬТАТ — превью вёрстки, заполняет доступную высоту виджета */}
      {isPreview && runKey > 0 && (
        <Box
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0,
            borderTop: `1px solid ${editorColors.border}`,
            background: '#ffffff',
          }}
        >
          <Box
            px="md"
            py={6}
            style={{
              background: editorColors.panel,
              borderBottom: `1px solid ${editorColors.border}`,
              flexShrink: 0,
            }}
          >
            <Text
              fz={10}
              fw={700}
              c={editorColors.dim}
              style={{ letterSpacing: 1 }}
            >
              РЕЗУЛЬТАТ
            </Text>
          </Box>
          <Box style={{ flex: 1, minHeight: 0 }}>
            <HtmlPreview
              language={s.language}
              code={s.code}
              runKey={runKey}
              height="100%"
            />
          </Box>
        </Box>
      )}

      {/* РЕЗУЛЬТАТ — консольный вывод */}
      {!isPreview && result && (
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
            <Text
              fz={10}
              fw={700}
              c={editorColors.dim}
              style={{ letterSpacing: 1 }}
            >
              РЕЗУЛЬТАТ
            </Text>
            <Text
              fz={10}
              c={result.exitCode === 0 ? editorColors.ok : editorColors.error}
            >
              exit {result.exitCode} · {Math.round(result.durationMs)} мс
            </Text>
          </Group>
          <pre
            style={{
              margin: 0,
              fontFamily: 'var(--mantine-font-family-monospace)',
              fontSize: 12,
              lineHeight: 1.6,
            }}
          >
            {result.lines.length === 0 ? (
              <span style={{ color: editorColors.dim }}>(нет вывода)</span>
            ) : (
              result.lines.map((l, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <div
                  key={i}
                  style={{ color: lineColor(l.type), whiteSpace: 'pre-wrap' }}
                >
                  {l.text}
                </div>
              ))
            )}
          </pre>
        </Box>
      )}

      {/* Подпись */}
      <Group
        gap={6}
        px="md"
        py={6}
        style={{ borderTop: `1px solid ${frame.border}`, flexShrink: 0 }}
      >
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
