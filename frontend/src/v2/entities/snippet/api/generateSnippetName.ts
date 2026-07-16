import type { TrpcClient } from '../../../shared/api/trpc'

export const generateSnippetName = (trpc: TrpcClient ) => trpc.snippets.generateSnippetName.query()