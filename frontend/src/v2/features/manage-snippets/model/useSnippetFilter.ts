import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useSession } from '../../../entities/user';
import { useTRPCClient } from '../../../shared/api';
import {
  SNIPPETS_QUERY_KEY,
  getMySnippets,
  type Snippet,
} from '../../../entities/snippet';
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
    /**
     * Порядок при равных ключах задаётся явно — по имени, затем по id (#881).
     * Без этого сниппеты с одинаковой датой (а секунда вмещает несколько
     * созданий) выстраивались как придётся, и список подрагивал при каждом
     * перезапросе.
     */
    const byNameThenId = (a: Snippet, b: Snippet) =>
      a.name.localeCompare(b.name, 'ru') || a.id - b.id;

    const sorted = [...filtered];
    if (sort === 'name') {
      sorted.sort(byNameThenId);
    } else {
      sorted.sort((a, b) => {
        const da = parseTimestamp(a.createdAt);
        const db = parseTimestamp(b.createdAt);

        /**
         * Записи без читаемой даты всегда в конце — в обоих направлениях.
         * Прежде отсутствующая дата превращалась в 1970 год, и при сортировке
         * «сначала старые» битые записи всплывали на самый верх, будто они
         * самые ранние. Неизвестная дата — это отсутствие сведений, а не
         * древность.
         */
        if (da === null && db === null) return byNameThenId(a, b);
        if (da === null) return 1;
        if (db === null) return -1;

        return (sort === 'new' ? db - da : da - db) || byNameThenId(a, b);
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