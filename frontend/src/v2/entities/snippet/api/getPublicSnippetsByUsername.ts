import type { TrpcClient } from '../../../shared/api';
import type { Snippet } from '../types';

/**
 * Сниппеты пользователя для публичного профиля — без приватных.
 *
 * Профиль обязан ходить сюда, а не в getAllSnippets: тот отдаёт всю таблицу
 * сниппетов сайта, и фильтрация на клиенте показывала чужие приватные.
 */
export const getPublicSnippetsByUsername = (
  trpc: TrpcClient,
  username: string,
) =>
  trpc.snippets.getPublicSnippetsByUsername.query({ username }) as Promise<
    Snippet[]
  >;
