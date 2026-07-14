import { useState } from 'react';
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
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTRPCClient } from '../../../utils/trpc';
import { editorColors, langMeta } from '../../theme';
import { runJavaScript, unsupportedLanguage, type RunResult } from '../../runner';
import { useSession } from '../../session';
import { useAuthModal } from '../../components/AuthModal/context';
import AppHeader, { initialsOf } from '../../components/AppHeader';
import AppFooter from '../../components/AppFooter';

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

export function fileNameOf(snippet: Pick<Snippet, 'name' | 'language'>): string {
  return `${snippet.name}.${EXT[snippet.language] ?? 'txt'}`;
}

// Относительная дата по-русски (упрощённо, без библиотек).
export function relativeDate(iso: string): string {
  if (!iso) return 'недавно'; // бэкенд может отдавать null в createdAt (баг таймстампов схемы)
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 'недавно';
  const days = Math.floor((Date.now() - then) / (24 * 60 * 60 * 1000));
  if (days <= 0) return 'сегодня';
  if (days === 1) return 'вчера';
  if (days < 7) return `${days} дн. назад`;
  return new Date(iso).toLocaleDateString('ru-RU');
}

function lineColor(type: string): string {
  if (type === 'error') return editorColors.error;
  if (type === 'warn') return '#e5c07b';
  if (type === 'system') return editorColors.dim;
  return editorColors.text;
}

// Тёмная карточка кода: заголовок файла, read-only листинг, «Запустить», РЕЗУЛЬТАТ.
function CodeCard({
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

function NotFoundState() {
  return (
    <Center py={120}>
      <Stack align="center" gap="md">
        <Title order={2}>Сниппет не найден</Title>
        <Text c="dimmed">Возможно, ссылка устарела или сниппет был удалён.</Text>
        <Button component={Link} to="/">
          На главную
        </Button>
      </Stack>
    </Center>
  );
}

export default function Share() {
  const { username = '', slug = '' } = useParams();
  const navigate = useNavigate();
  const trpc = useTRPCClient();
  const { user, isGuest } = useSession();
  const auth = useAuthModal();

  const { data: snippet, isLoading, isError } = useQuery({
    queryKey: ['v2', 'snippet-by-slug', username, slug],
    queryFn: () => trpc.snippets.getSnippetByUsernameSlug.query({ username, slug }),
    retry: false,
  });

  const forkMutation = useMutation({
    mutationFn: async (s: Snippet) =>
      trpc.snippets.createSnippet.mutate({
        name: `${s.name}-fork`,
        code: s.code,
        language: s.language,
        userId: user!.id,
      }),
    onSuccess: (created: { id: number }) => navigate(`/editor/${created.id}`),
  });

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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8f9fa' }}>
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
                <Badge variant="light" color="green" size="sm" radius="sm" leftSection="•">
                  публичный
                </Badge>
              </Group>

              {/* Заголовок + действия. На мобильной ширине Group переносит блоки на новую строку. */}
              <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
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
                  <Button onClick={() => navigate(`/editor/${(snippet as Snippet).id}`)}>
                    Открыть в редакторе
                  </Button>
                </Group>
              </Group>

              {/* Автор и метрики */}
              <Group gap="xs">
                <Avatar color="blue" radius="xl" size="sm">
                  {initialsOf(username)}
                </Avatar>
                <Anchor component={Link} to={`/u/${username}`} fw={600} fz="sm" c="dark.9">
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
              onOpenEditor={() => navigate(`/editor/${(snippet as Snippet).id}`)}
            />

            {/* Встраивание */}
            <Stack gap="xs">
              <Title order={3}>Встроить этот сниппет</Title>
              <Text c="dimmed" fz="sm">
                Вставьте код на любую страницу — виджет всегда показывает актуальную версию.
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
                    style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
                  >
                    {embedCode}
                  </Text>
                </Box>
                <CopyButton value={embedCode}>
                  {({ copied, copy }) => (
                    <Button variant="light" onClick={copy} style={{ alignSelf: 'flex-start' }}>
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
              <Card withBorder radius="lg" padding="xl" style={{ opacity: 0.6 }}>
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
