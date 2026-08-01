import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Anchor,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Center,
  Container,
  CopyButton,
  Group,
  Loader,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { useMutation } from '@tanstack/react-query';
import { useTRPCClient } from '../../../shared/api';
import { editorColors, langMeta } from '../../../shared/theme';
import { useSession } from '../../../entities/user';
import { useAuthModal } from '../../../features/auth';
import { AppHeader } from '../../../widgets/header';
import { initialsOf } from '../../../shared/lib';
import { AppFooter } from '../../../widgets/footer';
import CodeCard from './CodeCard';
import NotFoundState from './NotFoundState';
import {
  type Snippet,
  createSnippet,
  useSnippetBySlug,
} from '../../../entities/snippet';

/** Относительная дата по-русски: «сегодня», «вчера», «N дн. назад» либо locale-дата. */
export function relativeDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const days = Math.floor((Date.now() - then) / (24 * 60 * 60 * 1000));
  if (days <= 0) return 'сегодня';
  if (days === 1) return 'вчера';
  if (days < 7) return `${days} дн. назад`;
  return new Date(iso).toLocaleDateString('ru-RU');
}

/** Публичная страница сниппета /s/:username/:slug. Показывает код, форк, встраивание, статистику. */
export default function SharePage() {
  const { username = '', slug = '' } = useParams();
  const navigate = useNavigate();
  const trpc = useTRPCClient();
  const { user, isGuest } = useSession();
  const auth = useAuthModal();

  const {
    data: snippet,
    isLoading,
    isError,
  } = useSnippetBySlug(username, slug);

  const forkMutation = useMutation({
    mutationFn: async (s: Snippet) =>
      createSnippet(trpc, {
        name: `${s.name}-fork`,
        code: s.code,
        language: s.language,
        userId: user!.id,
      }),
    onSuccess: (created: { id: number }) => navigate(`/editor/${created.id}`),
  });

  /** Форк сниппета: для гостей — окно регистрации, для авторизованных — мутация и редирект. */
  const handleFork = () => {
    if (isGuest) {
      auth.open('register');
      return;
    }
    if (snippet) forkMutation.mutate(snippet as Snippet);
  };

  const meta = snippet ? langMeta[(snippet as Snippet).language] : null;
  const shareUrl = `runit.hexlet.io/s/${username}/${slug}`;

  const embedCode = snippet
    ? `<iframe src="${window.location.origin}/embed/${username}/${slug}?theme=dark&height=380" width="100%" height="380" style="border:0;border-radius:12px" title="Runit — ${(snippet as Snippet).name}"></iframe>`
    : '';

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#f8f9fa',
      }}
    >
      <AppHeader />

      <Container size="lg" py="xl" style={{ width: '100%' }}>
        {isLoading && (
          <Center py={120}>
            <Loader />
          </Center>
        )}

        {!isLoading && (isError || !snippet) && <NotFoundState />}

        {!isLoading && snippet && (
          <Stack gap="xl">
            <Stack gap="sm">
              {/* Хлебная строка со ссылкой и статусом видимости */}
              <Group gap="xs">
                <Text c="dimmed" aria-hidden>
                  🔗
                </Text>
                <Text ff="monospace" fz="sm" c="dimmed">
                  {shareUrl}
                </Text>
                <Badge
                  variant="light"
                  color="green"
                  size="sm"
                  radius="sm"
                  leftSection="•"
                >
                  публичный
                </Badge>
              </Group>

              {/* Заголовок + действия. На мобильной ширине Group переносит блоки на новую строку. */}
              <Group
                justify="space-between"
                align="flex-start"
                gap="md"
                wrap="wrap"
              >
                <Group gap="md" wrap="wrap">
                  <Title order={2} ff="monospace">
                    {(snippet as Snippet).name}
                  </Title>
                  <Badge
                    variant="light"
                    color="gray"
                    size="lg"
                    radius="sm"
                    leftSection={
                      <span
                        style={{
                          display: 'inline-block',
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: meta?.dot ?? '#adb5bd',
                        }}
                      />
                    }
                  >
                    {meta?.label ?? (snippet as Snippet).language}
                  </Badge>
                </Group>

                <Group gap="sm" wrap="wrap">
                  <Button
                    variant="light"
                    onClick={handleFork}
                    loading={forkMutation.isPending}
                    leftSection={<span aria-hidden>⑂</span>}
                  >
                    Форкнуть
                  </Button>
                  <CopyButton value={(snippet as Snippet).code}>
                    {({ copied, copy }) => (
                      <Button variant="default" onClick={copy}>
                        {copied ? 'Скопировано' : 'Копировать код'}
                      </Button>
                    )}
                  </CopyButton>
                  <Button
                    onClick={() =>
                      navigate(`/editor/${(snippet as Snippet).id}`)
                    }
                  >
                    Открыть в редакторе
                  </Button>
                </Group>
              </Group>

              {/* Автор и метрики */}
              <Group gap="xs">
                <Avatar color="blue" radius="xl" size="sm">
                  {initialsOf(username)}
                </Avatar>
                <Anchor
                  component={Link}
                  to={`/u/${username}`}
                  fw={600}
                  fz="sm"
                  c="dark.9"
                >
                  {username}
                </Anchor>
                <Text fz="sm" c="dimmed">
                  · {relativeDate((snippet as Snippet).updatedAt)}
                </Text>
                {/* TODO(#828, #840): реальные счётчики просмотров и форков с бэкенда. */}
                <Tooltip label="В разработке (#828, #840)">
                  <Text fz="sm" c="dimmed" style={{ cursor: 'help' }}>
                    · — просмотров · — форков
                  </Text>
                </Tooltip>
              </Group>
            </Stack>

            <CodeCard
              snippet={snippet as Snippet}
              onOpenEditor={() =>
                navigate(`/editor/${(snippet as Snippet).id}`)
              }
            />

            {/* Встраивание */}
            <Stack gap="xs">
              <Title order={3}>Встроить этот сниппет</Title>
              <Text c="dimmed" fz="sm">
                Вставьте код на любую страницу — виджет всегда показывает
                актуальную версию.
              </Text>
              <Group align="stretch" gap="md" wrap="wrap">
                <Box
                  style={{
                    flex: '1 1 320px',
                    minWidth: 0,
                    background: editorColors.bg,
                    border: `1px solid ${editorColors.border}`,
                    borderRadius: 12,
                    padding: '14px 18px',
                    overflowX: 'auto',
                  }}
                >
                  <Text
                    component="pre"
                    ff="monospace"
                    fz={13}
                    c={editorColors.text}
                    style={{
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                    }}
                  >
                    {embedCode}
                  </Text>
                </Box>
                <CopyButton value={embedCode}>
                  {({ copied, copy }) => (
                    <Button
                      variant="light"
                      onClick={copy}
                      style={{ alignSelf: 'flex-start' }}
                    >
                      {copied ? 'Скопировано' : 'Копировать код'}
                    </Button>
                  )}
                </CopyButton>
              </Group>
            </Stack>

            {/* Статистика — заглушка до появления аналитики на бэкенде */}
            <Stack gap="xs">
              <Title order={3}>Статистика</Title>
              {/* TODO(#840): графики запусков и список страниц встраивания. */}
              <Card
                withBorder
                radius="lg"
                padding="xl"
                style={{ opacity: 0.6 }}
              >
                <Center py="lg">
                  <Stack align="center" gap={4}>
                    <Text fw={600} c="dimmed">
                      Статистика появится позже (#840)
                    </Text>
                    <Text fz="sm" c="dimmed">
                      Запуски за неделю и страницы встраивания — в разработке.
                    </Text>
                  </Stack>
                </Center>
              </Card>
            </Stack>
          </Stack>
        )}
      </Container>

      <AppFooter />
    </div>
  );
}
