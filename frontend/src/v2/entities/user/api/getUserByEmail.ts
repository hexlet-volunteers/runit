import type { TrpcClient } from '../../../shared/api';

/** Загружает пользователя по email. */
export const getUserByEmail = (trpc: TrpcClient, email: string) =>
  trpc.users.getUserByEmail.query(email);
