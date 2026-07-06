import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Avatar,
  Box,
  Button,
  Card,
  Center,
  Container,
  Divider,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useTRPCClient } from '../../../utils/trpc';
import { useSession } from '../../session';
import { langMeta } from '../../theme';
import AppHeader, { initialsOf } from '../../components/AppHeader';
import AppFooter from '../../components/AppFooter';

type Snippet = {
  id: number;
  name: string;
  slug: string;
  code: string;
  language: string;
  userId: number;
  createdAt: string | Date;
  updatedAt: string | Date;
};

const MONTHS_GENITIVE = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];

// «В Runit с марта 2024»
function sinceLabel(date: Date): string {
  if (Number.isNaN(date.getTime()) || date.getTime() === 0) return 'недавнего времени';
  return `${MONTHS_GENITIVE[date.getMonth()]} ${date.getFullYear()}`;
}

// Простая относительная дата для карточек: «2 часа назад», «вчера», «12 мая 2026»
function relativeDate(value: string | Date): string {
  if (!value) return 'недавно';
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const hour = 3600_000;
  const day = 24 * hour;
  if (diffMs < hour) return 'только что';
  if (diffMs < day) {
    const h = Math.floor(diffMs / hour);
    const mod10 = h % 10;
    const mod100 = h % 100;
    let word = 'часов';
    if (mod10 === 1 && mod100 !== 11) word = 'час';
    else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) word = 'часа';
    return `${h} ${word} назад`;
  }
  if (diffMs < 2 * day) return 'вчера';
  if (diffMs < 7 * day) return `${Math.floor(diffMs / day)} дн. назад`;
  return `${date.getDate()} ${MONTHS_GENITIVE[date.getMonth()]} ${date.getFullYear()}`;
}

function SnippetCard({ snippet, username }: { snippet: Snippet; username: string }) {
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

function NotFoundState({ username }: { username: string }) {
  return (
    <Center py={80}>
      <Stack align="center" gap="sm">
        <Title order={2}>Пользователь не найден</Title>
        <Text c="dimmed" ta="center">
          Профиля @{username} не существует или он был удалён.
        </Text>
        <Button component={Link} to="/" mt="sm">
          На главную
        </Button>
      </Stack>
    </Center>
  );
}

export default function Profile() {
  const { username = '' } = useParams();
  const trpc = useTRPCClient();
  const { user: me } = useSession();

  const userQuery = useQuery({
    queryKey: ['v2', 'user', username],
    queryFn: () => trpc.users.getUserByUsername.query(username),
    retry: false,
  });

  const profileUser = userQuery.data ?? null;

  const snippetsQuery = useQuery({
    queryKey: ['v2', 'profileSnippets', profileUser?.id],
    queryFn: async () => {
      const all = (await trpc.snippets.getAllSnippets.query()) as Snippet[];
      return all.filter((s) => s.userId === profileUser!.id);
    },
    enabled: !!profileUser,
  });

  const snippets = snippetsQuery.data ?? [];
  const isOwn = !!me && !!profileUser && me.id === profileUser.id;

  let content: ReactNode;
  if (userQuery.isLoading) {
    content = (
      <Center py={80}>
        <Loader />
      </Center>
    );
  } else if (userQuery.isError || !profileUser) {
    content = <NotFoundState username={username} />;
  } else {
    content = (
      <>
        <Group align="flex-start" justify="space-between" wrap="nowrap" py="xl">
          <Group align="flex-start" gap="xl" wrap="nowrap">
            <Avatar color="blue" variant="filled" radius="50%" size={110}>
              <Text fz={36} fw={700} c="inherit">
                {initialsOf(profileUser.username)}
              </Text>
            </Avatar>
            <Stack gap={6}>
              <Title order={1}>{profileUser.username}</Title>
              <Text c="dimmed">@{profileUser.username}</Text>
              <Text c="dimmed" fz="sm">
                В Runit с {sinceLabel(new Date(profileUser.createdAt ?? NaN))}
              </Text>
            </Stack>
          </Group>
          {isOwn && (
            <Button variant="default" component={Link} to="/settings">
              Настроить профиль
            </Button>
          )}
        </Group>

        <Divider />

        {/* TODO(#828): реальные счётчики просмотров и форков */}
        <Group gap={48} py="lg">
          <Group gap={8} align="baseline">
            <Text fw={800} fz={26}>
              {snippets.length}
            </Text>
            <Text c="dimmed">сниппетов</Text>
          </Group>
          <Group gap={8} align="baseline">
            <Text fw={800} fz={26}>
              —
            </Text>
            <Text c="dimmed">просмотров</Text>
          </Group>
          <Group gap={8} align="baseline">
            <Text fw={800} fz={26}>
              —
            </Text>
            <Text c="dimmed">форков</Text>
          </Group>
        </Group>

        <Title order={3} mb="md">
          Публичные сниппеты
        </Title>
        {snippetsQuery.isLoading ? (
          <Center py={40}>
            <Loader size="sm" />
          </Center>
        ) : snippets.length === 0 ? (
          <Card withBorder radius="lg" p="xl">
            <Stack align="center" gap={4} py="lg">
              <Text fw={600}>Пока нет публичных сниппетов</Text>
              <Text c="dimmed" fz="sm" ta="center">
                Когда @{profileUser.username} опубликует сниппеты, они появятся здесь.
              </Text>
            </Stack>
          </Card>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
            {snippets.map((s) => (
              <SnippetCard key={s.id} snippet={s} username={profileUser.username} />
            ))}
          </SimpleGrid>
        )}
      </>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppHeader />
      <Container size="lg" py="xl" style={{ width: '100%', flex: 1 }}>
        {content}
      </Container>
      <AppFooter />
    </div>
  );
}
