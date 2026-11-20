import { Anchor, Button, Group, Text } from '@mantine/core';
import type { Snippet } from '../../../entities/snippet';
import { langMeta } from '../../../shared/theme';

type Props = {
  snippet: Snippet;
  fileName: string;
  shareHref: string;
  running: boolean;
  onRun: () => void;
};

export default function EmbedHeader({
  snippet,
  fileName,
  shareHref,
  running,
  onRun,
}: Props) {
  const meta = langMeta[snippet.language];

  return (
    <Group
      justify="space-between"
      px="md"
      py={8}
      style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
    >
      <Group gap={8} wrap="nowrap" style={{ minWidth: 0 }}>
        <Text ff="monospace" fz="sm" truncate>
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

        <Text fz="xs" c="dimmed" visibleFrom="xs">
          {meta?.label ?? snippet.language}
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
          onClick={onRun}
          loading={running}
          leftSection={<span aria-hidden>▶</span>}
        >
          Запустить
        </Button>
      </Group>
    </Group>
  );
}