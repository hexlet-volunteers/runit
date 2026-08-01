import type { TrpcClient } from '../../../shared/api';

// TODO: бэкенд возвращает `language: string`, а useMutation ожидает строгие типы.
// Временное решение: language as 'ruby' | 'java' | ...,
// когда бэкенд поправит — убрать.
export const updateSnippet = (
  trpc: TrpcClient,
  params: {
    id: number;
    name: string;
    code: string;
    language: string;
  },
) =>
  trpc.snippets.updateSnippet.mutate({
    id: params.id,
    name: params.name,
    code: params.code,
    language: params.language as
      | 'ruby'
      | 'java'
      | 'php'
      | 'python'
      | 'javascript'
      | 'html',
  });
