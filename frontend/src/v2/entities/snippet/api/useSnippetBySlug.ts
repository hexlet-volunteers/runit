import { useQuery } from '@tanstack/react-query';
import { useTRPCClient } from '../../../shared/api';

/** Хук для загрузки сниппета по username и slug (публичная страница / embed). */
export function useSnippetBySlug(username: string, slug: string) {
  const trpc = useTRPCClient();

  return useQuery({
    queryKey: ['v2', 'snippet-by-slug', username, slug],
    queryFn: () =>
      trpc.snippets.getSnippetByUsernameSlug.query({ username, slug }),
    retry: false,
  });
}
