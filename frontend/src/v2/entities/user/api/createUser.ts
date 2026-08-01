import type { TrpcClient } from '../../../shared/api';

/** Создаёт нового пользователя. */
export const createUser = (
  trpc: TrpcClient,
  params: { username: string; email: string; password: string },
) => trpc.users.createUser.mutate(params);
