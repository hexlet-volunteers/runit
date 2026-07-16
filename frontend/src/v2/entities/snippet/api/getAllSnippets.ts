import type { TrpcClient } from '../../../shared/api/trpc';
import type { Snippet } from '../types';

/** Загружает все сниппеты с бэкенда. */
export const getAllSnippets = (trpc: TrpcClient) =>
  trpc.snippets.getAllSnippets.query() as Promise<Snippet[]>;
