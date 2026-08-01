import { Link } from 'react-router-dom';
import { ActionIcon, Anchor, Box, Checkbox, Group, Menu, Paper, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { langMeta } from '../../theme';
import { relativeDate, type Snippet } from './lib';

function DotsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  );
}

type Props = {
  snippet: Snippet;
  username: string;
  selected: boolean;
  onToggleSelect: () => void;
  onDelete: () => void;
};

export default function SnippetCard({
  snippet,
  username,
  selected,
  onToggleSelect,
  onDelete,
}: Props) {
  const meta = langMeta[snippet.language] ?? {
    label: snippet.language,
    dot: '#adb5bd',
    runnable: false,
  };

  const copyLink = async () => {
    const url = `${window.location.origin}/s/${username}/${snippet.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      notifications.show({ message: 'Ссылка скопирована', color: 'blue' });
    } catch {
      notifications.show({ message: `Не удалось скопировать: ${url}`, color: 'red' });
    }
  };

  const handleDelete = () => {
    // eslint-disable-next-line no-alert
    if (window.confirm(`Удалить сниппет «${snippet.name}»? Это действие необратимо.`)) {
      onDelete();
    }
  };

  return (
    <Paper
      withBorder
      radius="lg"
      p="md"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        borderColor: selected ? 'var(--mantine-color-blue-5)' : undefined,
      }}
    >
      <Group justify="space-between" wrap="nowrap" align="flex-start">
        <Group gap={8} wrap="nowrap" style={{ minWidth: 0 }}>
          <Box
            w={10}
            h={10}
            style={{ borderRadius: '50%', background: meta.dot, flexShrink: 0 }}
          />
          <Anchor
            component={Link}
            to={`/editor/${snippet.id}`}
            c="dark.9"
            fw={600}
            ff="monospace"
            fz="md"
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {snippet.name}
          </Anchor>
        </Group>
        <Group gap={10} wrap="nowrap">
          <Text c="dimmed" fz="sm">
            {meta.label}
          </Text>
          <Checkbox
            checked={selected}
            onChange={onToggleSelect}
            aria-label={`Выбрать сниппет ${snippet.name}`}
          />
        </Group>
      </Group>

      <Group justify="space-between" mt="auto" wrap="nowrap">
        <Text c="dimmed" fz="sm">
          {relativeDate(snippet.updatedAt ?? snippet.createdAt)}
        </Text>
        <Menu position="bottom-end" width={200} radius="md">
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray" aria-label="Действия со сниппетом">
              <DotsIcon />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item component={Link} to={`/editor/${snippet.id}`}>
              Открыть
            </Menu.Item>
            <Menu.Item onClick={copyLink}>Копировать ссылку</Menu.Item>
            <Menu.Divider />
            <Menu.Item color="red" onClick={handleDelete}>
              Удалить
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Paper>
  );
}
