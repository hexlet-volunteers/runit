import { useState } from 'react';
import {
  Anchor,
  Box,
  Button,
  Group,
  Text,
} from '@mantine/core';
import { runJavaScript, unsupportedLanguage, type RunResult } from '../../../shared/runner';
import { editorColors, langMeta } from '../../../shared/theme';
import { type Snippet } from '../../../entities/snippet'

const EXT: Record<string, string> = {
  javascript: 'js',
  python: 'py',
  php: 'php',
  ruby: 'rb',
  java: 'java',
  html: 'html',
};

/** Генерирует имя файла из названия сниппета и расширения языка. */
export function fileNameOf(snippet: Pick<Snippet, 'name' | 'language'>): string {
  return `${snippet.name}.${EXT[snippet.language] ?? 'txt'}`;
}

/** Цвет строки вывода в зависимости от типа (error/warn/system/stdout). */
function lineColor(type: string): string {
  if (type === 'error') return editorColors.error;
  if (type === 'warn') return '#e5c07b';
  if (type === 'system') return editorColors.dim;
  return editorColors.text;
}

/** Тёмная карточка кода: заголовок файла, read-only листинг, кнопка «Запустить» и панель результата. */
export default function CodeCard({
  snippet,
  onOpenEditor,
}: {
  snippet: Snippet;
  onOpenEditor: () => void;
}) {
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const meta = langMeta[snippet.language];

  const run = async () => {
    if (!meta?.runnable) {
      setResult(unsupportedLanguage(meta?.label ?? snippet.language));
      return;
    }
    setRunning(true);
    try {
      setResult(await runJavaScript(snippet.code));
    } finally {
      setRunning(false);
    }
  };

  return (
    <Box
      style={{
        borderRadius: 16,
        overflow: 'hidden',
        border: `1px solid ${editorColors.border}`,
        background: editorColors.bg,
      }}
    >
      <Group
        justify="space-between"
        px="lg"
        py="sm"
        style={{ background: editorColors.panel, borderBottom: `1px solid ${editorColors.border}` }}
      >
        <Text ff="monospace" fz="sm" c={editorColors.text}>
          {fileNameOf(snippet)}
        </Text>
        <Button size="xs" onClick={run} loading={running} leftSection={<span aria-hidden>▶</span>}>
          Запустить
        </Button>
      </Group>

      <Box px="lg" py="md" style={{ overflowX: 'auto' }}>
        <pre style={{ margin: 0, fontFamily: 'var(--mantine-font-family-monospace)', fontSize: 14, lineHeight: 1.7 }}>
          {snippet.code.split('\n').map((line, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={i} style={{ display: 'flex', gap: 20 }}>
              <span style={{ color: editorColors.dim, minWidth: 24, textAlign: 'right', userSelect: 'none' }}>
                {i + 1}
              </span>
              <span style={{ color: editorColors.text, whiteSpace: 'pre' }}>{line || ' '}</span>
            </div>
          ))}
        </pre>
      </Box>

      {result && (
        <Box px="lg" py="md" style={{ borderTop: `1px solid ${editorColors.border}`, background: editorColors.panel }}>
          <Group justify="space-between" mb={6}>
            <Text fz="xs" fw={700} c={editorColors.dim} style={{ letterSpacing: 1 }}>
              РЕЗУЛЬТАТ
            </Text>
            <Text fz="xs" c={result.exitCode === 0 ? editorColors.ok : editorColors.error}>
              exit {result.exitCode} · {Math.round(result.durationMs)} мс
            </Text>
          </Group>
          <pre style={{ margin: 0, fontFamily: 'var(--mantine-font-family-monospace)', fontSize: 13, lineHeight: 1.6 }}>
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

      <Group
        justify="space-between"
        px="lg"
        py="sm"
        style={{ background: '#fff', borderTop: `1px solid ${editorColors.border}` }}
      >
        <Group gap={6}>
          <Text c="blue.6" fz="sm" aria-hidden>
            ⚡
          </Text>
          <Text fz="sm" c="dimmed">
            Работает на Runit
          </Text>
        </Group>
        <Anchor component="button" type="button" fz="sm" fw={600} onClick={onOpenEditor}>
          Открыть в редакторе →
        </Anchor>
      </Group>
    </Box>
  );
}
