import type { TrpcClient } from '../../../shared/api/trpc';
import { sampleCode, createSnippet } from '../../../entities/snippet';

/** Создаёт сниппет-пример с указанным языком. */
// TODO: бэкенд возвращает `id?` и `language: string`, а useMutation ожидает строгие типы.
// Временное решение: as Promise<{ id: number }> и language as 'ruby' | 'java' | ...,
// когда бэкенд поправит — убрать.
export const createExampleSnippet = (
  trpc: TrpcClient,
  language: string,
  userId: number,
) =>
  createSnippet(trpc, {
    name: `example-${language}`,
    code: sampleCode[language] ?? '',
    language,
    userId,
  }) as Promise<{ id: number }>;
