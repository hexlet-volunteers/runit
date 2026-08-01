import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { AppHeader } from '../../../widgets/header';
import { AppFooter } from '../../../widgets/footer';
import { langMeta } from '../../../shared/theme';
import { useSession } from '../../../entities/user';
import { SnippetCard, EmptyState, BulkBar, useManageSnippets, useSnippetFilter } from '../../../features/manage-snippets';
import { NewSnippetModal } from '../../../features/create-snippet';
import { SearchIcon } from '../../../shared/ui';

type SortMode = 'new' | 'old' | 'name';

export default function DashboardPage() {
  const { user, isGuest } = useSession();
  const navigate = useNavigate();
  const [modalOpened, setModalOpened] = useState(false);

  // Гостям кабинет недоступен — уводим на лендинг.
  useEffect(() => {
    if (isGuest) navigate('/', { replace: true });
  }, [isGuest, navigate]);

  const {
    hasAny,
    visibleSnippets,
    search,
    langFilter,
    setSearch,
    setLangFilter,
    sort,
    setSort,
    isLoading,
    mySnippets,
  } = useSnippetFilter();

  const {
    deleteMutation,
    createExampleMutation,
    selectedIds,
    clearSelection,
    toggleSelect,
  } = useManageSnippets(user!.id)

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

      <BulkBar count={selectedIds.length} onClear={clearSelection} />
      <NewSnippetModal opened={modalOpened} onClose={() => setModalOpened(false)} />

      <AppFooter />
    </div>
  );
}
