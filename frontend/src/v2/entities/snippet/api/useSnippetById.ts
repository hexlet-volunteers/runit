import type { TrpcClient } from '../../../shared/api'

export const useSnippetById = (trpc: TrpcClient, snippetId: number ) => trpc.snippets.getSnippetById.query(snippetId as number)
