import { Link } from 'react-router-dom';
import {
  Box,
  Card,
  Group,
  Text,
} from '@mantine/core';
import { langMeta } from '../../../shared/theme';
import { relativeDate } from '../../../shared/lib';
import { type Snippet } from '../../../entities/snippet'

/**
 * Карточка сниппета в профиле пользователя.
 * Отображает название, язык, дату обновления.
 * Вся карточка — ссылка на `/s/:username/:slug`.
 */
export default function SnippetCard({ snippet, username }: { snippet: Snippet; username: string }) {
  const meta = langMeta[snippet.language] ?? {
    label: snippet.language,
    dot: '#adb5bd',
    runnable: false,
  };
  return (
    <Card
      withBorder
      radius="lg"
      p="lg"
      component={Link}
      to={`/s/${username}/${snippet.slug}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <Group justify="space-between" wrap="nowrap" mb="sm">
        <Group gap={8} wrap="nowrap" style={{ minWidth: 0 }}>
          <Box
            w={10}
            h={10}
            style={{ borderRadius: '50%', background: meta.dot, flexShrink: 0 }}
          />
          <Text ff="monospace" fw={600} truncate>
            {snippet.name}
          </Text>
        </Group>
        <Text c="dimmed" fz="sm" style={{ flexShrink: 0 }}>
          {meta.label}
        </Text>
      </Group>
      <Group justify="space-between" mt="md">
        <Text c="dimmed" fz="sm">
          {relativeDate(snippet.updatedAt ?? snippet.createdAt)}
        </Text>
        {/* TODO(#828): счётчики просмотров и форков сниппета */}
        <Text c="dimmed" fz="sm">
          — просмотров · — форков
        </Text>
      </Group>
    </Card>
  );
}
