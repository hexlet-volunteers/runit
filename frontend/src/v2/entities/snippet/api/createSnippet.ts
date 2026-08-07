import type { TrpcClient } from '../../../shared/api';
import type { SnippetLanguage } from '../types';

/**
 * Создание сниппета.
 *
 * Язык типизирован объединением из SNIPPET_LANGUAGES, а не приводится к списку
 * из шести значений, как было раньше: тот каст скрывал расхождение фронта
 * (6 языков) с бэкендом и раннером (12) и мешал бы заметить следующее такое
 * расхождение — компилятор молчал бы.
 *
 * Приведение результата остаётся: бэкенд объявляет id как необязательный,
 * а вызывающему коду нужен точный тип для редиректа в редактор.
 */
export const createSnippet = (
  trpc: TrpcClient,
  params: {
    name: string;
    code: string;
    language: SnippetLanguage;
    userId: number;
  },
) =>
  trpc.snippets.createSnippet.mutate({
    name: params.name,
    code: params.code,
    language: params.language,
    userId: params.userId,
  }) as Promise<{ id: number; slug: string }>;
