import type { TrpcClient } from '../../../shared/api';
import type { Snippet } from '..';

/**
 * Свои сниппеты, включая приватные. Требует авторизации: владелец берётся из
 * сессии на сервере, а не передаётся параметром.
 */
export const getMySnippets = (trpc: TrpcClient) =>
  trpc.snippets.getMySnippets.query() as Promise<Snippet[]>;
