import { Box, Group, Text } from '@mantine/core';
import type { Snippet } from '../../../entities/snippet';
import type { RunResult } from '../../../shared/runner';
import { editorColors } from '../../../shared/theme';
import { isPreviewLanguage } from '../../../shared/runner/preview';
import HtmlPreview from '../../../shared/ui/HtmlPreview';

type Colors = typeof editorColors;

type Props = {
  snippet: Snippet;
  code: string;
  showOutput: boolean;
  runKey: number;
  result: RunResult | null;
  colors: Colors;
};

function lineColor(type: string, colors: Colors): string {
  if (type === 'error') return colors.error;
  if (type === 'warn') return '#e5c07b';
  if (type === 'system') return colors.dim;
  return colors.text;
}

export default function EmbedOutput({
  snippet,
  code,
  showOutput,
  runKey,
  result,
  colors,
}: Props) {
  if (!showOutput) return null;

  const isPreview = isPreviewLanguage(snippet.language);

  if (isPreview && runKey > 0) {
    return (
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
            language={snippet.language}
            code={code}
            runKey={runKey}
            height="100%"
          />
        </Box>
      </Box>
    );
  }

  if (!isPreview && result) {
    return (
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
            result.lines.map((line, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <div
                key={index}
                style={{
                  color: lineColor(line.type, colors),
                  whiteSpace: 'pre-wrap',
                }}
              >
                {line.text}
              </div>
            ))
          )}
        </pre>
      </Box>
    );
  }

  return null;
}
