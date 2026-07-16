import type { TrpcClient } from '../../../shared/api/trpc'

export const useUserById = (trpc: TrpcClient, userId: number) => trpc.users.getUserById.query(userId)
