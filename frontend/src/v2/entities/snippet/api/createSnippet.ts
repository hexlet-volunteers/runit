import type { TrpcClient } from '../../../shared/api';
import type { SnippetLanguage, SnippetVisibility } from '../types';

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
 *
 * visibility передаётся обязательным полем: пока его не отправляли, сервер
 * ставил значение по умолчанию 'private', и выбранная в модалке видимость
 * молча терялась — «Публичный» сниппет не появлялся в профиле, а автор об этом
 * не узнавал.
 */
export const createSnippet = (
  trpc: TrpcClient,
  params: {
    name: string;
    code: string;
    language: SnippetLanguage;
    visibility: SnippetVisibility;
  },
) =>
  trpc.snippets.createSnippet.mutate({
    name: params.name,
    code: params.code,
    language: params.language,
    visibility: params.visibility,
  }) as Promise<{ id: number; slug: string }>;
