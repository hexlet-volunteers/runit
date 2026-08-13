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
 * userId не передаётся: владельца сервер берёт из сессии. Пока поле шло из
 * браузера, сниппет можно было создать от имени чужого аккаунта (#792).
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
  },
) =>
  trpc.snippets.createSnippet.mutate({
    name: params.name,
    code: params.code,
    language: params.language,
  }) as Promise<{ id: number; slug: string }>;
