import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Box,
  Button,
  Center,
  Chip,
  Container,
  Group,
  Loader,
  Select,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import AppHeader from '../../components/AppHeader';
import AppFooter from '../../components/AppFooter';
import { langMeta } from '../../theme';
import { useSession } from '../../session';
import { useTRPCClient } from '../../../utils/trpc';
import SnippetCard from './SnippetCard';
import NewSnippetModal from './NewSnippetModal';
import EmptyState from './EmptyState';
import BulkBar from './BulkBar';
import { sampleCode, SNIPPETS_QUERY_KEY, type Snippet } from './lib';

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="21" y2="21" />
    </svg>
  );
}

type SortMode = 'new' | 'old' | 'name';

export default function Dashboard() {
  const { user, isGuest } = useSession();
  const navigate = useNavigate();
  const trpc = useTRPCClient();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [langFilter, setLangFilter] = useState<string>('all');
  const [sort, setSort] = useState<SortMode>('new');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [modalOpened, setModalOpened] = useState(false);

  // Гостям кабинет недоступен — уводим на лендинг.
  useEffect(() => {
    if (isGuest) navigate('/', { replace: true });
  }, [isGuest, navigate]);

  const { data: allSnippets, isLoading } = useQuery({
    queryKey: SNIPPETS_QUERY_KEY,
    queryFn: () => trpc.snippets.getAllSnippets.query() as Promise<Snippet[]>,
    enabled: !isGuest,
  });

  // TODO(#828): серверная выборка «мои сниппеты» вместо фильтрации всего списка на клиенте.
  const mySnippets = useMemo(
    () => (allSnippets ?? []).filter((s) => s.userId === user?.id),
    [allSnippets, user?.id],
  );

  const visibleSnippets = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = mySnippets.filter((s) => {
      if (langFilter !== 'all' && s.language !== langFilter) return false;
      if (query && !s.name.toLowerCase().includes(query)) return false;
      return true;
    });
    const sorted = [...filtered];
    if (sort === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    } else {
      sorted.sort((a, b) => {
        const da = new Date(a.createdAt).getTime();
        const db = new Date(b.createdAt).getTime();
        return sort === 'new' ? db - da : da - db;
      });
    }
    return sorted;
  }, [mySnippets, search, langFilter, sort]);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => trpc.snippets.deleteSnippet.mutate({ id }),
    onSuccess: (_data, id) => {
      setSelectedIds((prev) => prev.filter((x) => x !== id));
      queryClient.invalidateQueries({ queryKey: SNIPPETS_QUERY_KEY });
      notifications.show({ message: 'Сниппет удалён', color: 'blue' });
    },
    onError: () => {
      notifications.show({ message: 'Не удалось удалить сниппет', color: 'red' });
    },
  });

  const createExampleMutation = useMutation({
    mutationFn: (language: string) =>
      trpc.snippets.createSnippet.mutate({
        name: `example-${language}`,
        code: sampleCode[language] ?? '',
        language,
        userId: user!.id,
      }),
    onSuccess: (created: { id: number }) => {
      queryClient.invalidateQueries({ queryKey: SNIPPETS_QUERY_KEY });
      navigate(`/editor/${created.id}`);
    },
    onError: () => {
      notifications.show({ message: 'Не удалось создать сниппет', color: 'red' });
    },
  });

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  if (isGuest) return null;

  const hasAny = mySnippets.length > 0;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppHeader />

      <Box component="main" py={40} style={{ flex: 1, background: '#f8f9fa' }}>
        <Container size="lg">
          <Group justify="space-between" mb="lg" wrap="wrap">
            <Group gap="sm">
              <Title order={1} fz={32}>
                Мои сниппеты
              </Title>
              {hasAny && (
                <Badge size="lg" variant="light" radius="md">
                  {mySnippets.length}
                </Badge>
              )}
            </Group>
            <Button onClick={() => setModalOpened(true)}>+ Новый сниппет</Button>
          </Group>

          {isLoading && (
            <Center py={80}>
              <Loader />
            </Center>
          )}

          {!isLoading && !hasAny && (
            <EmptyState
              onCreateClick={() => setModalOpened(true)}
              onCreateExample={(lang) => createExampleMutation.mutate(lang)}
              creating={createExampleMutation.isPending}
            />
          )}

          {!isLoading && hasAny && (
            <>
              <Group gap="sm" mb="xl" wrap="wrap">
                <TextInput
                  value={search}
                  onChange={(e) => setSearch(e.currentTarget.value)}
                  placeholder="Поиск по названию…"
                  leftSection={<SearchIcon />}
                  radius="xl"
                  w={{ base: '100%', sm: 280 }}
                />
                <Chip
                  checked={langFilter === 'all'}
                  onChange={() => setLangFilter('all')}
                  variant="light"
                  radius="xl"
                >
                  Все
                </Chip>
                {Object.entries(langMeta).map(([key, meta]) => (
                  <Chip
                    key={key}
                    checked={langFilter === key}
                    onChange={() => setLangFilter(langFilter === key ? 'all' : key)}
                    variant="light"
                    radius="xl"
                  >
                    {meta.label}
                  </Chip>
                ))}
                <Select
                  value={sort}
                  onChange={(v) => setSort((v as SortMode) ?? 'new')}
                  data={[
                    { value: 'new', label: 'Сначала новые' },
                    { value: 'old', label: 'Сначала старые' },
                    { value: 'name', label: 'По имени' },
                  ]}
                  allowDeselect={false}
                  radius="xl"
                  w={180}
                  ml="auto"
                  aria-label="Сортировка"
                />
              </Group>

              {visibleSnippets.length === 0 ? (
                <Center py={64}>
                  <Text c="dimmed">Ничего не найдено — попробуйте изменить фильтры.</Text>
                </Center>
              ) : (
                <Box
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: 16,
                  }}
                >
                  {visibleSnippets.map((snippet) => (
                    <SnippetCard
                      key={snippet.id}
                      snippet={snippet}
                      username={user!.username}
                      selected={selectedIds.includes(snippet.id)}
                      onToggleSelect={() => toggleSelect(snippet.id)}
                      onDelete={() => deleteMutation.mutate(snippet.id)}
                    />
                  ))}
                </Box>
              )}
            </>
          )}
        </Container>
      </Box>

      <BulkBar count={selectedIds.length} onClear={() => setSelectedIds([])} />
      <NewSnippetModal opened={modalOpened} onClose={() => setModalOpened(false)} />

      <AppFooter />
    </div>
  );
}
