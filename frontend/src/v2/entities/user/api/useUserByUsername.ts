import type { TrpcClient } from '../../../shared/api/trpc';

/** Загружает пользователя по username. */
export const useUserByUsername = (trpc: TrpcClient, username: string) =>
  trpc.users.getUserByUsername.query(username);
