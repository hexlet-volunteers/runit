import type { TrpcClient } from '../../../shared/api'

/** Удаляет сниппет по id. */
export const deleteSnippet = (trpc: TrpcClient, id: number) =>
  trpc.snippets.deleteSnippet.mutate({ id })