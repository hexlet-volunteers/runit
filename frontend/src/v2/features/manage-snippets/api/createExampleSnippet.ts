import type { TrpcClient } from '../../../shared/api';
import { sampleCode, createSnippet,
    toSnippetLanguage,
} from '../../../entities/snippet';

/** Создаёт сниппет-пример с указанным языком. Владельца сервер берёт из сессии. */
// TODO: бэкенд возвращает `id?`, а useMutation ожидает строгий тип.
// Временное решение: as Promise<{ id: number }>, когда бэкенд поправит — убрать.
export const createExampleSnippet = (trpc: TrpcClient, language: string) =>
  createSnippet(trpc, {
    name: `example-${language}`,
    code: sampleCode[language] ?? '',
    language: toSnippetLanguage(language),
  }) as Promise<{ id: number }>;
