import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useSession } from '../../../entities/user';
import { useTRPCClient } from '../../../shared/api';
import { SNIPPETS_QUERY_KEY, getAllSnippets } from '../../../entities/snippet';

type SortMode = 'new' | 'old' | 'name';

/**
 * Хук загрузки, фильтрации и сортировки сниппетов текущего пользователя.
 *
 * @returns стейты поиска/фильтра/сортировки, отфильтрованный список и флаг загрузки
 */
export default function useSnippetFilter() {
  const { user, isGuest } = useSession();
  const trpc = useTRPCClient();

  const [search, setSearch] = useState('');
  const [langFilter, setLangFilter] = useState<string>('all');
  const [sort, setSort] = useState<SortMode>('new');

  const { data: allSnippets, isLoading } = useQuery({
    queryKey: SNIPPETS_QUERY_KEY,
    queryFn: () => getAllSnippets(trpc),
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

  const hasAny = mySnippets.length > 0;

  return { 
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
  };
}