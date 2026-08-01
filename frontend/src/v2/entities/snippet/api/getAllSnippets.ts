import type { TrpcClient } from '../../../shared/api';
import type { Snippet } from '..';

/** Загружает все сниппеты с бэкенда. */
export const getAllSnippets = (trpc: TrpcClient) =>
  trpc.snippets.getAllSnippets.query() as Promise<Snippet[]>;
