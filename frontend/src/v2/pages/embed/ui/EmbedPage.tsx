import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
import MonacoEditor from '@monaco-editor/react';
import { monacoLanguage } from '../../editor';
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
import { snippetFileName, snippetPath } from '../../../shared/lib';

// Компактный embed-виджет (без AppHeader/AppFooter — страница живёт внутри iframe).
// TODO(#841): варианты оформления card/minimal/tabs (query-параметр variant).

function lineColor(
  type: string,
  colors: typeof editorColors,
): string {
  if (type === 'error') return colors.error;
  if (type === 'warn') return '#e5c07b';
  if (type === 'system') return colors.dim;
  return colors.text;
}

export default function EmbedPage() {
  const { username = '', slug = '', shortCode } = useParams();
  const [searchParams] = useSearchParams();

  const theme = searchParams.get('theme') === 'dark' ? 'dark' : 'light';
  const isDark = theme === 'dark';

  const colors = isDark
    ? editorColors
    : {
        bg: '#ffffff',
        panel: '#f8f9fa',
        border: '#dee2e6',
        text: '#212529',
        dim: '#868e96',
        accent: '#228be6',
        error: '#e03131',
        ok: '#2f9e44',
      };

  const heightParam = Number(searchParams.get('height'));
  const widgetHeight =
    Number.isFinite(heightParam) && heightParam > 0 ? heightParam : null;

  // Настройки встроенного редактора.
  const showOutput = searchParams.get('output') !== '0';
  const readOnly = searchParams.get('readonly') === '1';
  const autorun = searchParams.get('autorun') === '1';

  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const [code, setCode] = useState('');

  // Защита от повторного автоматического запуска.
  const autoRunRef = useRef(false);

  const trpc = useTRPCClient();

  // Источник данных зависит от вида ссылки: короткая /s/:code или /s/:user/:slug.
  const byShortCode = useSnippetByShortCode(shortCode);
  const bySlug = useSnippetBySlug(
    shortCode ? '' : username,
    shortCode ? '' : slug,
  );

  const {
    data: snippet,
    isLoading,
    isError,
  } = shortCode ? byShortCode : bySlug;

  // Загружаем исходный код сниппета в редактор.
  useEffect(() => {
    if (snippet) {
      setCode(snippet.code);
    }
  }, [snippet]);

  // Палитра рамки виджета.
  const frame = {
    bg: colors.panel,
    border: colors.border,
    text: colors.text,
    dim: colors.dim,
  };

  // Запуск кода.
  const run = async (s: Snippet, codeToRun = code) => {
    // HTML/CSS показываем как страницу, а не как вывод в консоль (#853).
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
        await runCode({
          language: s.language,
          code: codeToRun,
          client: trpc,
        }),
      );
    } finally {
      setRunning(false);
    }
  };

  // Автоматический запуск после загрузки сниппета.
  useEffect(() => {
    if (autorun && snippet && !autoRunRef.current) {
      autoRunRef.current = true;
      void run(snippet as Snippet, snippet.code);
    }
  }, [autorun, snippet]);

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
  const fileName = snippetFileName(s.name, s.language);

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
          overflow: 'hidden',
          background: colors.bg,
        }}
      >
        <MonacoEditor
          height="100%"
          theme={isDark ? 'vs-dark' : 'vs'}
          language={monacoLanguage(s.language)}
          value={code}
          onChange={(value) => {
            setCode(value ?? '');
          }}
          loading={<Loader color={colors.accent} />}
          options={{
            readOnly,
            fontSize: 13,
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            minimap: { enabled: false },
            tabSize: 2,
            insertSpaces: true,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 12 },
            renderLineHighlight: 'line',
          }}
        />
      </Box>

      {/* РЕЗУЛЬТАТ — превью вёрстки */}
      {showOutput && isPreview && runKey > 0 && (
        <Box
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0,
            borderTop: `1px solid ${colors.border}`,
            background: '#ffffff',
          }}
        >
          <Box
            px="md"
            py={6}
            style={{
              background: colors.panel,
              borderBottom: `1px solid ${colors.border}`,
              flexShrink: 0,
            }}
          >
            <Text
              fz={10}
              fw={700}
              c={colors.dim}
              style={{ letterSpacing: 1 }}
            >
              РЕЗУЛЬТАТ
            </Text>
          </Box>

          <Box style={{ flex: 1, minHeight: 0 }}>
            <HtmlPreview
              language={s.language}
              code={code}
              runKey={runKey}
              height="100%"
            />
          </Box>
        </Box>
      )}

      {/* РЕЗУЛЬТАТ — консольный вывод */}
      {showOutput && !isPreview && result && (
        <Box
          px="md"
          py={8}
          style={{
            borderTop: `1px solid ${colors.border}`,
            background: colors.panel,
            maxHeight: 160,
            overflow: 'auto',
            flexShrink: 0,
          }}
        >
          <Group justify="space-between" mb={4}>
            <Text
              fz={10}
              fw={700}
              c={colors.dim}
              style={{ letterSpacing: 1 }}
            >
              РЕЗУЛЬТАТ
            </Text>

            <Text
              fz={10}
              c={result.exitCode === 0 ? colors.ok : colors.error}
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
              <span style={{ color: colors.dim }}>(нет вывода)</span>
            ) : (
              result.lines.map((l, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <div
                  key={i}
                  style={{
                    color: lineColor(l.type, colors),
                    whiteSpace: 'pre-wrap',
                  }}
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
