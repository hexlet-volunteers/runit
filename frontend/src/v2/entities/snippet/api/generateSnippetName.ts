import type { TrpcClient } from '../../../shared/api'

export const generateSnippetName = (trpc: TrpcClient ) => trpc.snippets.generateSnippetName.query()