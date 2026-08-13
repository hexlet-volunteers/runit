import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useSession } from '../../../entities/user';
import { useTRPCClient } from '../../../shared/api';
import { SNIPPETS_QUERY_KEY, getMySnippets } from '../../../entities/snippet';
import { parseTimestamp } from '../../../shared/lib/dates';

type SortMode = 'new' | 'old' | 'name';

/**
 * Хук загрузки, фильтрации и сортировки сниппетов текущего пользователя.
 *
 * @returns стейты поиска/фильтра/сортировки, отфильтрованный список и флаг загрузки
 */
export default function useSnippetFilter() {
  const { isGuest } = useSession();
  const trpc = useTRPCClient();

  const [search, setSearch] = useState('');
  const [langFilter, setLangFilter] = useState<string>('all');
  const [sort, setSort] = useState<SortMode>('new');

  /**
   * Выборка приходит с сервера уже суженной до своих сниппетов. Раньше здесь
   * запрашивался весь список и фильтровался по userId на клиенте — то есть
   * каждый пользователь получал в браузер чужие сниппеты, включая приватные.
   */
  const { data: mySnippets = [], isLoading } = useQuery({
    queryKey: SNIPPETS_QUERY_KEY,
    queryFn: () => getMySnippets(trpc),
    enabled: !isGuest,
  });

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
        const da = parseTimestamp(a.createdAt);
        const db = parseTimestamp(b.createdAt);
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