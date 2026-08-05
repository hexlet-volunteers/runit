import { useQuery } from '@tanstack/react-query';
import { useTRPCClient } from '../../../shared/api';

/**
 * Сниппет по короткой ссылке (/s/aB3xK9).
 * Приватные сниппеты сервер по коду не отдаёт — запрос вернёт ошибку.
 */
export function useSnippetByShortCode(shortCode: string | undefined) {
  const trpc = useTRPCClient();
  return useQuery({
    queryKey: ['snippet-by-short-code', shortCode],
    queryFn: () => trpc.snippets.getSnippetByShortCode.query(shortCode as string),
    enabled: Boolean(shortCode),
    retry: false,
  });
}
