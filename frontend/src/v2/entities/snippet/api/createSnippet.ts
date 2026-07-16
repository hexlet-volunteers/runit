import type { TrpcClient } from '../../../shared/api/trpc';

// TODO: бэкенд возвращает `id?` и `language: string`, а useMutation ожидает строгие типы.
// Временное решение: as Promise<{ id: number; slug: string }> и language as 'ruby' | 'java' | ...,
// когда бэкенд поправит — убрать.
export const createSnippet = (
  trpc: TrpcClient,
  params: {
    name: string;
    code: string;
    language: string;
    userId: number;
  },
) =>
  trpc.snippets.createSnippet.mutate({
    name: params.name,
    code: params.code,
    language: params.language as
      | 'ruby'
      | 'java'
      | 'php'
      | 'python'
      | 'javascript'
      | 'html',
    userId: params.userId,
  }) as Promise<{ id: number; slug: string }>;
